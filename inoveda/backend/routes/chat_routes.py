from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User
from schemas import MessageCreate
from services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/history/{other_user_id}")
def history(other_user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return ChatService(db).history(current_user.id, other_user_id)


@router.post("/messages")
def send_message(payload: MessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return ChatService(db).send_message(current_user.id, payload.receiver_id, payload.content, current_user.name)


@router.get("/notifications")
def notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return ChatService(db).notifications(current_user.id)
