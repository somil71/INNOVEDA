from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas import TokenResponse, UserLogin, UserRegister
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    return AuthService(db).register(payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    return AuthService(db).login(payload)
