from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import User
from schemas import DiseaseReportCreate
from services.admin_service import AdminService

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
def dashboard(current_user: User = Depends(require_role(["admin"])), db: Session = Depends(get_db)):
    return AdminService(db).dashboard()


@router.post("/disease-report")
async def add_disease_report(
    payload: DiseaseReportCreate,
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db),
):
    return await AdminService(db).add_disease_report(payload.village, payload.disease_type, payload.severity)


@router.get("/emergencies")
def emergencies(current_user: User = Depends(require_role(["admin"])), db: Session = Depends(get_db)):
    return AdminService(db).emergencies()


@router.post("/emergencies/{request_id}/dispatch")
async def dispatch_mock_ambulance(request_id: int, current_user: User = Depends(require_role(["admin"])), db: Session = Depends(get_db)):
    return await AdminService(db).dispatch_mock_ambulance(request_id)
