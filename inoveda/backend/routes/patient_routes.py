import logging

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from auth import require_role
from database import SessionLocal, get_db
from models import User
from repositories.clinical_repository import ClinicalRepository
from schemas import AIChatRequest, AppointmentCreate, S3ConfirmRequest, S3PresignedUploadResponse
from services.ai_service import run_triage_pipeline
from services.patient_service import PatientService
from services.safety_service import SafetyService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/patient", tags=["patient"])


@router.get("/dashboard")
def dashboard(current_user: User = Depends(require_role(["patient"])), db: Session = Depends(get_db)):
    return PatientService(db).dashboard(current_user)


@router.post("/ai-chat")
async def ai_chat(
    payload: AIChatRequest,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    result = await run_triage_pipeline(db, payload.symptom_input, payload.budget, payload.language)

    is_safe, safety_msg = SafetyService.validate_triage(
        result.get("extracted_symptoms", []),
        result.get("severity", "mild"),
    )
    SafetyService.log_drift(current_user.id, "v1", result.get("confidence", 0.0))

    repo = ClinicalRepository(db)
    repo.save_ai_chat_history(
        patient_id=current_user.id,
        input_text=payload.symptom_input,
        response_text=result["ai_response"],
        severity=result["severity"],
        confidence=result["confidence"],
        requires_emergency=result["requires_emergency"],
        extracted_symptoms=",".join(result.get("extracted_symptoms", [])),
        is_flagged=not is_safe,
        safety_notes=safety_msg,
    )
    db.commit()

    try:
        from services.notifications import manager
        await manager.send_to_user(current_user.id, {"type": "ai_triage_complete", "payload": result})
    except Exception:
        logger.debug("ws_notify_skipped")

    return result


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    return await PatientService(db).upload_document(current_user, file)


@router.get("/documents/presigned-upload-url", response_model=S3PresignedUploadResponse)
async def get_presigned_upload_url(
    filename: str,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    return await PatientService(db).get_presigned_upload_url(filename)


@router.post("/documents/confirm-upload")
async def confirm_document_upload(
    payload: S3ConfirmRequest,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db)
):
    return PatientService(db).confirm_document_upload(current_user, payload.s3_key)


@router.get("/documents")
def list_documents(
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    return PatientService(db).list_documents(current_user, limit, offset)


@router.post("/appointments")
def book_appointment(
    payload: AppointmentCreate,
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    return PatientService(db).book_appointment(current_user, payload.doctor_id, payload.date)


@router.get("/prescriptions")
def list_prescriptions(
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(require_role(["patient"])),
    db: Session = Depends(get_db),
):
    return PatientService(db).list_prescriptions(current_user, limit, offset)


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
