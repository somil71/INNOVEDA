from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from core.config import settings
from models import User
from repositories.user_repository import UserRepository
from schemas import TokenResponse, UserLogin, UserRegister

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.users = UserRepository(db)

    def hash_password(self, password: str) -> str:
        return pwd_context.hash(password)

    def verify_password(self, password: str, password_hash: str) -> bool:
        return pwd_context.verify(password, password_hash)

    def create_access_token(self, user: User) -> str:
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
        payload = {"sub": str(user.id), "role": user.role, "exp": expires_at}
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    def decode_token(self, token: str) -> dict:
        try:
            return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        except JWTError as exc:
            raise HTTPException(status_code=401, detail="Could not validate credentials") from exc

    def register(self, payload: UserRegister) -> TokenResponse:
        role = payload.role.lower().strip()
        if role not in {"patient", "doctor", "admin"}:
            raise HTTPException(status_code=400, detail="Role must be patient, doctor, or admin")
        if self.users.by_email(payload.email):
            raise HTTPException(status_code=400, detail="Email already registered")

        user = self.users.create_user(
            name=payload.name.strip(),
            email=payload.email.lower(),
            password_hash=self.hash_password(payload.password),
            role=role,
            village=payload.village,
            phone=payload.phone,
        )
        if role == "patient":
            self.users.create_patient_profile(user.id, payload.age, payload.medical_history)
        elif role == "doctor":
            self.users.create_doctor_profile(user.id, payload.specialization, payload.consultation_fee or 0)

        self.db.commit()
        token = self.create_access_token(user)
        return TokenResponse(access_token=token, token_type="bearer", role=user.role, user_id=user.id)

    def login(self, payload: UserLogin) -> TokenResponse:
        user = self.users.by_email(payload.email.lower())
        if not user or not self.verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = self.create_access_token(user)
        return TokenResponse(access_token=token, token_type="bearer", role=user.role, user_id=user.id)
