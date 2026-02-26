from sqlalchemy.orm import Session

from repositories.clinical_repository import ClinicalRepository


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ClinicalRepository(db)

    def history(self, user_id: int, other_user_id: int):
        rows = self.repo.message_history(user_id, other_user_id)
        return [
            {"id": r.id, "sender_id": r.sender_id, "receiver_id": r.receiver_id, "content": r.content, "timestamp": r.timestamp}
            for r in rows
        ]

    def send_message(self, sender_id: int, receiver_id: int, content: str, sender_name: str):
        self.repo.create_message(sender_id, receiver_id, content)
        self.repo.add_notification(receiver_id, "New Message", f"New message from {sender_name}")
        self.db.commit()
        return {"message": "Message stored"}

    def notifications(self, user_id: int):
        rows = self.repo.get_notifications(user_id)
        return [{"id": n.id, "title": n.title, "message": n.message, "is_read": n.is_read, "created_at": n.created_at} for n in rows]
