from sqlalchemy.orm import Session

from repositories.clinical_repository import ClinicalRepository
from services.notifications import manager
from services.outbreak_service import area_net_summary


class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ClinicalRepository(db)

    def dashboard(self):
        disease = area_net_summary(self.db)
        return {
            "total_patients": self.repo.count_users_by_role("patient"),
            "total_doctors": self.repo.count_users_by_role("doctor"),
            "active_cases": self.repo.count_active_cases(),
            "disease_trends": disease["trend_rows"],
            "outbreak_alerts": disease["outbreak_alerts"],
            "village_counts": disease["village_counts"],
        }

    async def add_disease_report(self, village: str, disease_type: str, severity: str):
        self.repo.add_disease_report(village=village, disease_type=disease_type, severity=severity)
        self.db.commit()
        summary = area_net_summary(self.db)
        if summary["outbreak_alerts"]:
            for admin in self.repo.list_users_by_role("admin"):
                await manager.send_to_user(admin.id, {"type": "outbreak_alert", "alerts": summary["outbreak_alerts"]})
        return {"message": "Disease report saved", "outbreak_alerts": summary["outbreak_alerts"]}

    def emergencies(self, limit: int = 20, offset: int = 0):
        rows = self.repo.list_emergencies(limit, offset)
        return [{"id": r.id, "patient_id": r.patient_id, "status": r.status, "created_at": r.created_at} for r in rows]

    async def dispatch_mock_ambulance(self, request_id: int):
        req = self.repo.get_emergency(request_id)
        if not req:
            return {"message": "Request not found"}
        req.status = "ambulance_dispatched"
        self.repo.add_notification(req.patient_id, "Ambulance Dispatched", f"Ambulance dispatched for request #{req.id}.")
        self.db.commit()
        await manager.send_to_user(req.patient_id, {"type": "ambulance_dispatched", "request_id": req.id})
        return {"message": "Mock ambulance dispatched"}
