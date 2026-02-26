from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # patient | doctor | admin
    village = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)


class Patient(Base):
    __tablename__ = "patients"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    age = Column(Integer, nullable=True)
    medical_history = Column(Text, nullable=True)
    auto_pay_enabled = Column(Boolean, default=False)

    user = relationship("User", back_populates="patient_profile")


class Doctor(Base):
    __tablename__ = "doctors"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    specialization = Column(String, nullable=True)
    consultation_fee = Column(Float, default=0)
    rating = Column(Float, default=0)

    user = relationship("User", back_populates="doctor_profile")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)
    status = Column(String, default="pending")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utcnow)


class AIChatHistory(Base):
    __tablename__ = "ai_chat_history"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    input_text = Column(Text, nullable=False)
    response_text = Column(Text, nullable=False)
    severity = Column(String, nullable=False)
    confidence = Column(Float, nullable=True)
    requires_emergency = Column(Boolean, default=False)
    extracted_symptoms = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow)

    medicines = relationship("Medicine", back_populates="prescription", cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False)
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    duration = Column(String, nullable=False)
    price = Column(Float, default=0)

    prescription = relationship("Prescription", back_populates="medicines")


class PatientCartItem(Base):
    __tablename__ = "patient_cart_items"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medicine_name = Column(String, nullable=False)
    dosage = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    price = Column(Float, default=0)
    added_at = Column(DateTime, default=utcnow)


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=utcnow)


class DiseaseReport(Base):
    __tablename__ = "disease_reports"

    id = Column(Integer, primary_key=True, index=True)
    village = Column(String, nullable=False)
    disease_type = Column(String, nullable=False)
    severity = Column(String, nullable=False)
    created_at = Column(DateTime, default=utcnow)


class OutbreakEvent(Base):
    __tablename__ = "outbreak_events"

    id = Column(Integer, primary_key=True, index=True)
    village = Column(String, nullable=False, index=True)
    disease_type = Column(String, nullable=False, index=True)
    detection_method = Column(String, nullable=False)  # zscore | poisson
    confidence = Column(Float, nullable=False)
    metric_value = Column(Float, nullable=False)
    baseline = Column(Float, nullable=False)
    current_count = Column(Integer, nullable=False)
    week_start = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow)


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
