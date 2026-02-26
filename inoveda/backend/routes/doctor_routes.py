from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import User
from schemas import PrescriptionCreate
from services.doctor_service import DoctorService

router = APIRouter(prefix="/doctor", tags=["doctor"])


@router.get("/dashboard")
def dashboard(current_user: User = Depends(require_role(["doctor"])), db: Session = Depends(get_db)):
    return DoctorService(db).dashboard(current_user)


@router.get("/patients")
def assigned_patients(current_user: User = Depends(require_role(["doctor"])), db: Session = Depends(get_db)):
    return DoctorService(db).assigned_patients(current_user)


@router.get("/patient-documents/{patient_id}")
def patient_documents(patient_id: int, current_user: User = Depends(require_role(["doctor"])), db: Session = Depends(get_db)):
    return DoctorService(db).patient_documents(patient_id)


@router.post("/prescriptions")
async def create_prescription(
    payload: PrescriptionCreate,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db),
):
    return await DoctorService(db).create_prescription(current_user, payload.patient_id, payload.medicines)


@router.post("/messages")
async def send_message(
    receiver_id: int,
    content: str,
    current_user: User = Depends(require_role(["doctor"])),
    db: Session = Depends(get_db),
):
    return await DoctorService(db).send_message(current_user, receiver_id, content)
