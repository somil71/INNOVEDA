from sqlalchemy.orm import Session

from models import Doctor, Patient, User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(
        self,
        *,
        name: str,
        email: str,
        password_hash: str,
        role: str,
        village: str | None,
        phone: str | None,
    ) -> User:
        user = User(name=name, email=email, password_hash=password_hash, role=role, village=village, phone=phone)
        self.db.add(user)
        self.db.flush()
        return user

    def create_patient_profile(self, user_id: int, age: int | None, medical_history: str | None) -> None:
        self.db.add(Patient(user_id=user_id, age=age, medical_history=medical_history, auto_pay_enabled=False))

    def create_doctor_profile(self, user_id: int, specialization: str | None, consultation_fee: float) -> None:
        self.db.add(
            Doctor(
                user_id=user_id,
                specialization=specialization or "General",
                consultation_fee=consultation_fee,
                rating=4.5,
            )
        )
