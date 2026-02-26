from sqlalchemy.orm import Session

from models import Doctor, User


class DoctorRepository:
    def __init__(self, db: Session):
        self.db = db

    def doctor_by_user_id(self, user_id: int) -> Doctor | None:
        return self.db.query(Doctor).filter(Doctor.user_id == user_id).first()

    def suggest_doctors(self, budget: float | None = None, limit: int = 5) -> list[Doctor]:
        query = self.db.query(Doctor)
        if budget is not None:
            query = query.filter(Doctor.consultation_fee <= budget)
        return query.order_by(Doctor.rating.desc()).limit(limit).all()

    def user_is_doctor(self, user_id: int) -> bool:
        return self.db.query(User).filter(User.id == user_id, User.role == "doctor").first() is not None
