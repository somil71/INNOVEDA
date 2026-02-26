from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from auth import require_role
from database import SessionLocal, get_db
from models import User
from schemas import AIChatRequest, AppointmentCreate
from services.patient_service import PatientService

router = APIRouter(prefix="/patient", tags=["patient"])


@router.get("/dashboard")
def dashboard(current_user: User = Depends(require_role(["patient"])), db: Session = Depends(get_db)):
    return PatientService(db).dashboard(current_user)


@router.post("/ai-chat")
async def ai_chat(payload: AIChatRequest, current_user: User = Depends(require_role(["patient"])), db: Session = Depends(get_db)):
    return await PatientService(db).ai_chat(current_user, payload.symptom_input, payload.budget, payload.language)


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    return await PatientService(db).upload_document(current_user, file)


@router.get("/documents")
def list_documents(current_user: User = Depends(require_role(["patient"])), db: Session = Depends(get_db)):
    return PatientService(db).list_documents(current_user)


@router.post("/appointments")
def book_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    return PatientService(db).book_appointment(current_user, payload.doctor_id, payload.date)


@router.get("/prescriptions")
def list_prescriptions(current_user: User = Depends(require_role(["patient"])), db: Session = Depends(get_db)):
    return PatientService(db).list_prescriptions(current_user)


@router.get("/cart")
def cart(current_user: User = Depends(require_role(["patient"])), db: Session = Depends(get_db)):
    return PatientService(db).cart(current_user)


@router.post("/auto-pay/{enabled}")
def set_auto_pay(enabled: bool, current_user: User = Depends(require_role(["patient"])), db: Session = Depends(get_db)):
    return PatientService(db).set_auto_pay(current_user, enabled)


@router.post("/emergency")
async def emergency(current_user: User = Depends(require_role(["patient"])), db: Session = Depends(get_db)):
    return await PatientService(db).trigger_emergency(current_user)


@router.post("/dosage-complete/{medicine_name}")
async def dosage_complete(
    medicine_name: str,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    return await PatientService(db).dosage_complete(current_user, medicine_name)


@router.post("/messages")
async def send_message(
    receiver_id: int,
    content: str,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    return await PatientService(db).send_message(current_user, receiver_id, content)


@router.post("/mock-schedule/{medicine_name}")
def trigger_mock_schedule(
    medicine_name: str,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    # Endpoint retained for compatibility with prototype flow.
    return PatientService(db).trigger_mock_schedule(SessionLocal, current_user, medicine_name)
