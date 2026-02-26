import asyncio

from fastapi import HTTPException
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User
from repositories.clinical_repository import ClinicalRepository
from repositories.user_repository import UserRepository
from services.mock_scheduler import schedule_dosage_notification
from services.notifications import manager


class DoctorService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ClinicalRepository(db)
        self.users = UserRepository(db)

    def dashboard(self, current_user: User):
        appointments = self.repo.list_appointments_by_doctor(current_user.id)
        patient_ids = sorted({a.patient_id for a in appointments})
        return {"doctor_id": current_user.id, "appointments": len(appointments), "assigned_patients": patient_ids}

    def assigned_patients(self, current_user: User):
        appointments = self.repo.list_appointments_by_doctor(current_user.id)
        patient_ids = list({a.patient_id for a in appointments})
        users = [self.users.by_id(pid) for pid in patient_ids]
        return [{"id": u.id, "name": u.name, "village": u.village, "phone": u.phone} for u in users if u]

    def patient_documents(self, patient_id: int):
        rows = self.repo.list_documents(patient_id)
        return [{"id": d.id, "file_path": d.file_path, "uploaded_at": d.uploaded_at} for d in rows]

    async def create_prescription(self, current_user: User, patient_id: int, medicines: list):
        patient = self.users.by_id(patient_id)
        if not patient or patient.role != "patient":
            raise HTTPException(status_code=404, detail="Patient not found")
        prescription = self.repo.create_prescription(current_user.id, patient_id)
        for med in medicines:
            self.repo.add_medicine(prescription.id, med.name, med.dosage, med.duration, med.price)
            self.repo.add_to_cart(patient_id, med.name, med.dosage, med.duration, med.price)
            asyncio.create_task(schedule_dosage_notification(SessionLocal, patient_id, med.name))

        self.repo.add_notification(patient_id, "Prescription Ready", f"Doctor {current_user.name} uploaded a prescription.")
        self.db.commit()
        await manager.send_to_user(patient_id, {"type": "prescription_ready", "prescription_id": prescription.id})
        return {"message": "Prescription uploaded and medicines added to cart", "prescription_id": prescription.id}

    async def send_message(self, current_user: User, receiver_id: int, content: str):
        self.repo.create_message(current_user.id, receiver_id, content)
        self.db.commit()
        await manager.send_to_user(
            receiver_id,
            {"type": "chat_message", "sender_id": current_user.id, "receiver_id": receiver_id, "content": content},
        )
        return {"message": "sent"}
