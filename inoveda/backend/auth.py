from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from core.config import settings
from database import get_db
from models import User
from repositories.user_repository import UserRepository
from services.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = AuthService(db).decode_token(token)
    user_id = payload.get("sub")
    token_role = payload.get("role")
    if user_id is None or token_role not in {"patient", "doctor", "admin"}:
        raise credentials_exception

    user = UserRepository(db).by_id(int(user_id))
    if not user:
        raise credentials_exception
    if user.role != token_role:
        raise credentials_exception
    return user


def require_role(allowed_roles: list[str]):
    def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user

    return role_checker


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(data: dict) -> str:
    payload = dict(data)
    payload.setdefault("exp", datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes))
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
