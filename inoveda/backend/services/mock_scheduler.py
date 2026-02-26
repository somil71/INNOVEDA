import asyncio

from sqlalchemy.orm import Session

from models import Notification


async def schedule_dosage_notification(db_factory, user_id: int, medicine_name: str):
    # Mock scheduler for prototype: sends a reminder shortly after prescription.
    await asyncio.sleep(30)
    db: Session = db_factory()
    try:
        db.add(
            Notification(
                user_id=user_id,
                title="Dosage Reminder",
                message=f"Time to complete your dosage for {medicine_name}.",
            )
        )
        db.commit()
    finally:
        db.close()
