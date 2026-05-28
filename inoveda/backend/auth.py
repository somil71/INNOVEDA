from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from repositories.user_repository import UserRepository
from services.auth_service import AuthService


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token:
        # Fallback for dev/testing if needed, but primary is cookie now
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

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


