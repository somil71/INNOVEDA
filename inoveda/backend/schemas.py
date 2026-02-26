from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: str
    village: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    medical_history: Optional[str] = None
    specialization: Optional[str] = None
    consultation_fee: Optional[float] = 0


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int


class AppointmentCreate(BaseModel):
    doctor_id: int
    date: str


class PrescriptionMedicineCreate(BaseModel):
    name: str
    dosage: str
    duration: str
    price: float


class PrescriptionCreate(BaseModel):
    patient_id: int
    medicines: List[PrescriptionMedicineCreate]


class AIChatRequest(BaseModel):
    symptom_input: str = Field(min_length=3, max_length=4000)
    budget: Optional[float] = None
    language: Literal["en", "hi"] = "en"


class AIChatResponse(BaseModel):
    follow_up_questions: List[str] = Field(default_factory=list)
    severity: Literal["mild", "moderate", "critical"]
    confidence: float = Field(ge=0, le=1)
    requires_emergency: bool
    recommended_specialization: str
    calming_steps: List[str]
    doctor_suggestions: List[dict]
    emergency_advice: str
    ai_response: str
    extracted_symptoms: List[str] = Field(default_factory=list)


class DiseaseReportCreate(BaseModel):
    village: str
    disease_type: str
    severity: str


class EmergencyCreate(BaseModel):
    status: str = "pending"


class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(min_length=1, max_length=3000)


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SymptomExtractionOutput(BaseModel):
    symptoms: List[str] = Field(default_factory=list)
    duration_days: Optional[int] = None
    red_flags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

    @field_validator("symptoms", "red_flags")
    @classmethod
    def clean_list(cls, values: List[str]) -> List[str]:
        return [v.strip().lower() for v in values if isinstance(v, str) and v.strip()]


class OutbreakAlertOut(BaseModel):
    village: str
    disease_type: str
    method: Literal["zscore", "poisson"]
    confidence: float
    current_count: int
    baseline: float
    metric_value: float
    week_start: str


class OutbreakSummaryOut(BaseModel):
    village_counts: dict[str, int]
    trend_rows: List[dict[str, Any]]
    outbreak_alerts: List[OutbreakAlertOut]
