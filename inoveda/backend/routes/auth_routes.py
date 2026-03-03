from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from core.config import settings
from database import get_db
from schemas import TokenResponse, UserLogin, UserRegister
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        max_age=settings.jwt_expire_minutes * 60,
        expires=settings.jwt_expire_minutes * 60,
        samesite="lax",  # Use 'strict' for prod but 'lax' helps with some dev setups
        secure=settings.environment.lower() != "development",
    )


@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister, response: Response, db: Session = Depends(get_db)):
    res = AuthService(db).register(payload)
    _set_auth_cookie(response, res.access_token)
    return res


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    res = AuthService(db).login(payload)
    _set_auth_cookie(response, res.access_token)
    return res


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logged out"}
