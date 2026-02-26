from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import Session

from models import (
    AIChatHistory,
    Appointment,
    DiseaseReport,
    Document,
    EmergencyRequest,
    Medicine,
    Message,
    Notification,
    OutbreakEvent,
    Patient,
    PatientCartItem,
    Prescription,
    User,
)


class ClinicalRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_appointment(self, patient_id: int, doctor_id: int, date: str) -> Appointment:
        row = Appointment(patient_id=patient_id, doctor_id=doctor_id, date=date, status="booked")
        self.db.add(row)
        self.db.flush()
        return row

    def list_appointments_by_patient(self, patient_id: int) -> list[Appointment]:
        return self.db.query(Appointment).filter(Appointment.patient_id == patient_id).all()

    def list_appointments_by_doctor(self, doctor_id: int) -> list[Appointment]:
        return self.db.query(Appointment).filter(Appointment.doctor_id == doctor_id).all()

    def patient_profile(self, patient_id: int) -> Patient | None:
        return self.db.query(Patient).filter(Patient.user_id == patient_id).first()

    def set_auto_pay(self, patient_id: int, enabled: bool) -> None:
        row = self.patient_profile(patient_id)
        if row:
            row.auto_pay_enabled = enabled

    def create_document(self, patient_id: int, file_path: str) -> Document:
        row = Document(patient_id=patient_id, file_path=file_path)
        self.db.add(row)
        self.db.flush()
        return row

    def list_documents(self, patient_id: int) -> list[Document]:
        return self.db.query(Document).filter(Document.patient_id == patient_id).all()

    def create_message(self, sender_id: int, receiver_id: int, content: str) -> Message:
        row = Message(sender_id=sender_id, receiver_id=receiver_id, content=content)
        self.db.add(row)
        self.db.flush()
        return row

    def message_history(self, user_id: int, other_user_id: int) -> list[Message]:
        return (
            self.db.query(Message)
            .filter(
                or_(
                    (Message.sender_id == user_id) & (Message.receiver_id == other_user_id),
                    (Message.sender_id == other_user_id) & (Message.receiver_id == user_id),
                )
            )
            .order_by(Message.timestamp.asc())
            .all()
        )

    def add_notification(self, user_id: int, title: str, message: str) -> Notification:
        row = Notification(user_id=user_id, title=title, message=message)
        self.db.add(row)
        self.db.flush()
        return row

    def get_notifications(self, user_id: int) -> list[Notification]:
        return self.db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()

    def create_prescription(self, doctor_id: int, patient_id: int) -> Prescription:
        row = Prescription(doctor_id=doctor_id, patient_id=patient_id)
        self.db.add(row)
        self.db.flush()
        return row

    def add_medicine(self, prescription_id: int, name: str, dosage: str, duration: str, price: float) -> Medicine:
        row = Medicine(
            prescription_id=prescription_id,
            name=name,
            dosage=dosage,
            duration=duration,
            price=price,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def add_to_cart(self, patient_id: int, medicine_name: str, dosage: str, duration: str, price: float) -> PatientCartItem:
        row = PatientCartItem(
            patient_id=patient_id,
            medicine_name=medicine_name,
            dosage=dosage,
            duration=duration,
            price=price,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def list_cart(self, patient_id: int) -> list[PatientCartItem]:
        return self.db.query(PatientCartItem).filter(PatientCartItem.patient_id == patient_id).all()

    def list_prescriptions(self, patient_id: int) -> list[Prescription]:
        return self.db.query(Prescription).filter(Prescription.patient_id == patient_id).all()

    def create_emergency(self, patient_id: int, status: str = "pending") -> EmergencyRequest:
        row = EmergencyRequest(patient_id=patient_id, status=status)
        self.db.add(row)
        self.db.flush()
        return row

    def list_emergencies(self) -> list[EmergencyRequest]:
        return self.db.query(EmergencyRequest).order_by(EmergencyRequest.created_at.desc()).all()

    def get_emergency(self, request_id: int) -> EmergencyRequest | None:
        return self.db.query(EmergencyRequest).filter(EmergencyRequest.id == request_id).first()

    def save_ai_chat_history(
        self,
        patient_id: int,
        input_text: str,
        response_text: str,
        severity: str,
        confidence: float,
        requires_emergency: bool,
        extracted_symptoms: str,
    ) -> AIChatHistory:
        row = AIChatHistory(
            patient_id=patient_id,
            input_text=input_text,
            response_text=response_text,
            severity=severity,
            confidence=confidence,
            requires_emergency=requires_emergency,
            extracted_symptoms=extracted_symptoms,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def add_disease_report(self, village: str, disease_type: str, severity: str, created_at: datetime | None = None) -> DiseaseReport:
        row = DiseaseReport(village=village, disease_type=disease_type, severity=severity)
        if created_at:
            row.created_at = created_at
        self.db.add(row)
        self.db.flush()
        return row

    def list_disease_reports(self) -> list[DiseaseReport]:
        return self.db.query(DiseaseReport).all()

    def add_outbreak_event(
        self,
        *,
        village: str,
        disease_type: str,
        detection_method: str,
        confidence: float,
        metric_value: float,
        baseline: float,
        current_count: int,
        week_start: str,
    ) -> OutbreakEvent:
        row = OutbreakEvent(
            village=village,
            disease_type=disease_type,
            detection_method=detection_method,
            confidence=confidence,
            metric_value=metric_value,
            baseline=baseline,
            current_count=current_count,
            week_start=week_start,
        )
        self.db.add(row)
        self.db.flush()
        return row

    def list_users_by_role(self, role: str) -> list[User]:
        return self.db.query(User).filter(User.role == role).all()

    def count_users_by_role(self, role: str) -> int:
        return self.db.query(User).filter(User.role == role).count()

    def count_active_cases(self) -> int:
        return self.db.query(Appointment).filter(Appointment.status.in_(["pending", "booked"])).count()
