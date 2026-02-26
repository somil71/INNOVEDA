import asyncio
import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from core.config import settings
from models import User
from repositories.clinical_repository import ClinicalRepository
from repositories.doctor_repository import DoctorRepository
from services.ai_service import run_triage_pipeline
from services.mock_scheduler import schedule_dosage_notification
from services.notifications import manager


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
        payload = await run_triage_pipeline(self.db, symptom_input, budget, language)
        self.repo.save_ai_chat_history(
            patient_id=current_user.id,
            input_text=symptom_input,
            response_text=payload["ai_response"],
            severity=payload["severity"],
            confidence=payload["confidence"],
            requires_emergency=payload["requires_emergency"],
            extracted_symptoms=",".join(payload.get("extracted_symptoms", [])),
        )
        self.db.commit()
        return payload

    def _safe_upload_path(self, filename: str) -> Path:
        ext = Path(filename).suffix.lower()
        if ext not in settings.allowed_upload_extensions:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        upload_dir = Path(settings.upload_dir)
        upload_dir.mkdir(parents=True, exist_ok=True)
        return upload_dir / f"{uuid.uuid4()}{ext}"

    async def upload_document(self, current_user: User, file: UploadFile):
        target = self._safe_upload_path(file.filename or "")
        data = await file.read()
        if len(data) > settings.max_upload_mb * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File exceeds upload limit")
        with open(target, "wb") as out:
            out.write(data)
        doc = self.repo.create_document(current_user.id, str(target).replace("\\", "/"))
        self.db.commit()
        return {"id": doc.id, "file_path": doc.file_path}

    def list_documents(self, current_user: User):
        docs = self.repo.list_documents(current_user.id)
        return [{"id": d.id, "file_path": d.file_path, "uploaded_at": d.uploaded_at} for d in docs]

    def book_appointment(self, current_user: User, doctor_id: int, date: str):
        if not self.doctors.user_is_doctor(doctor_id):
            raise HTTPException(status_code=404, detail="Doctor not found")
        row = self.repo.create_appointment(current_user.id, doctor_id, date)
        self.db.commit()
        return {"message": "Appointment booked", "appointment_id": row.id}

    def list_prescriptions(self, current_user: User):
        rows = self.repo.list_prescriptions(current_user.id)
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
