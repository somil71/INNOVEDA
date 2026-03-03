import asyncio
import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from core.config import settings
from core.s3_utils import s3_service
from models import User
from repositories.clinical_repository import ClinicalRepository
from repositories.doctor_repository import DoctorRepository


class PatientService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ClinicalRepository(db)
        self.doctors = DoctorRepository(db)

    def dashboard(self, current_user: User) -> dict:
        appointments = self.repo.list_appointments_by_patient(current_user.id)
        prescriptions = self.repo.list_prescriptions(current_user.id)
        return {
            "user": {"id": current_user.id, "name": current_user.name, "village": current_user.village},
            "appointments": len(appointments),
            "prescriptions": len(prescriptions),
        }

    async def ai_chat(self, current_user: User, symptom_input: str, budget: float | None, language: str) -> dict:
        from tasks import ai_triage_task
        task = ai_triage_task.delay(current_user.id, symptom_input, budget, language)
        return {"task_id": task.id, "status": "processing", "message": "AI triage processing in background"}

    def _safe_upload_path(self, filename: str) -> Path:
        ext = Path(filename).suffix.lower()
        if ext not in settings.allowed_upload_extensions:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        if not settings.use_s3:
            upload_dir = Path(settings.upload_dir)
            upload_dir.mkdir(parents=True, exist_ok=True)
            return upload_dir / f"{uuid.uuid4()}{ext}"
        return Path(f"documents/{uuid.uuid4()}{ext}")

    async def upload_document(self, current_user: User, file: UploadFile):
        target = self._safe_upload_path(file.filename or "")
        data = await file.read()
        if len(data) > settings.max_upload_mb * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds upload limit")

        target_str = str(target).replace("\\", "/")
        if settings.use_s3:
            import io
            if not s3_service.upload_fileobj(io.BytesIO(data), target_str):
                raise HTTPException(status_code=500, detail="S3 upload failed")
        else:
            with open(target, "wb") as out:
                out.write(data)

        doc = self.repo.create_document(current_user.id, target_str)
        self.db.commit()
        return {"id": doc.id, "file_path": target_str}

    def list_documents(self, current_user: User, limit: int = 10, offset: int = 0):
        docs = self.repo.list_documents(current_user.id, limit, offset)
        return [
            {
                "id": d.id, 
                "file_path": s3_service.generate_download_url(d.file_path) if settings.use_s3 else d.file_path,
                "uploaded_at": d.uploaded_at
            } 
            for d in docs
        ]

    async def get_presigned_upload_url(self, filename: str):
        if not settings.use_s3:
            raise HTTPException(status_code=400, detail="S3 storage is not enabled")
        
        ext = Path(filename).suffix.lower()
        if ext not in settings.allowed_upload_extensions:
            raise HTTPException(status_code=400, detail="Unsupported file type")
            
        object_name = f"documents/{uuid.uuid4()}{ext}"
        presigned_post = s3_service.generate_upload_url(object_name)
        if not presigned_post:
             raise HTTPException(status_code=500, detail="Failed to generate upload URL")
        return {"presigned_post": presigned_post, "s3_key": object_name}

    def confirm_document_upload(self, current_user: User, s3_key: str):
        doc = self.repo.create_document(current_user.id, s3_key)
        self.db.commit()
        return {"id": doc.id, "file_path": s3_key}

    def book_appointment(self, current_user: User, doctor_id: int, date: str):
        if not self.doctors.user_is_doctor(doctor_id):
            raise HTTPException(status_code=404, detail="Doctor not found")
        row = self.repo.create_appointment(current_user.id, doctor_id, date)
        self.db.commit()
        return {"message": "Appointment booked", "appointment_id": row.id}

    def list_prescriptions(self, current_user: User, limit: int = 10, offset: int = 0):
        rows = self.repo.list_prescriptions(current_user.id, limit, offset)
        return [{"id": p.id, "doctor_id": p.doctor_id, "created_at": p.created_at} for p in rows]

    def cart(self, current_user: User):
        rows = self.repo.list_cart(current_user.id)
        total = sum(r.price for r in rows)
        return {
            "items": [
                {
                    "id": r.id,
                    "medicine_name": r.medicine_name,
                    "dosage": r.dosage,
                    "duration": r.duration,
                    "price": r.price,
                }
                for r in rows
            ],
            "total": total,
        }

    def set_auto_pay(self, current_user: User, enabled: bool):
        profile = self.repo.patient_profile(current_user.id)
        if not profile:
            raise HTTPException(status_code=404, detail="Patient profile missing")
        self.repo.set_auto_pay(current_user.id, enabled)
        self.db.commit()
        return {"auto_pay_enabled": enabled}

    async def trigger_emergency(self, current_user: User):
        req = self.repo.create_emergency(current_user.id, status="pending")
        doctors = self.repo.list_users_by_role("doctor")
        admins = self.repo.list_users_by_role("admin")
        for user in doctors + admins:
            self.repo.add_notification(
                user.id,
                "Emergency Alert",
                f"Emergency triggered by patient {current_user.name}. Ambulance dispatch requested.",
            )
            await manager.send_to_user(user.id, {"type": "emergency", "patient_id": current_user.id, "request_id": req.id})
        self.db.commit()
        return {"message": "Emergency triggered, doctor and admin notified, ambulance dispatch mocked."}

    async def dosage_complete(self, current_user: User, medicine_name: str):
        self.repo.add_notification(current_user.id, "Dosage Completed", f"You marked dosage completed for {medicine_name}.")
        self.db.commit()
        await manager.send_to_user(current_user.id, {"type": "dosage_completed", "medicine_name": medicine_name})
        return {"message": "Dosage completion notification sent"}

    async def send_message(self, current_user: User, receiver_id: int, content: str):
        self.repo.create_message(current_user.id, receiver_id, content)
        self.db.commit()
        await manager.send_to_user(
            receiver_id,
            {"type": "chat_message", "sender_id": current_user.id, "receiver_id": receiver_id, "content": content},
        )
        return {"message": "sent"}

    def trigger_mock_schedule(self, session_factory, current_user: User, medicine_name: str):
        asyncio.create_task(schedule_dosage_notification(session_factory, current_user.id, medicine_name))
        return {"message": "Mock dosage reminder scheduled in 30 seconds"}
