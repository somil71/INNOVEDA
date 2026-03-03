import asyncio
import logging
from celery_app import celery_app
from database import SessionLocal
from services.ai_service import run_triage_pipeline
from repositories.clinical_repository import ClinicalRepository
from services.notifications import manager

logger = logging.getLogger(__name__)

from prometheus_client import Histogram

ai_task_duration = Histogram("inoveda_ai_task_duration_seconds", "Duration of AI triage tasks in seconds")

from services.safety_service import SafetyService

async def _process_triage(user_id: int, symptom_input: str, budget: float | None, language: str):
    db = SessionLocal()
    try:
        with ai_task_duration.time():
             payload = await run_triage_pipeline(db, symptom_input, budget, language)
        
        # Guardrail Validation
        is_safe, safety_msg = SafetyService.validate_triage(
            payload.get("extracted_symptoms", []), 
            payload.get("severity", "mild")
        )
        
        # Track drift monitoring
        SafetyService.log_drift(user_id, "v1", payload.get("confidence", 0.0))

        repo = ClinicalRepository(db)
        repo.save_ai_chat_history(
            patient_id=user_id,
            input_text=symptom_input,
            response_text=payload["ai_response"],
            severity=payload["severity"],
            confidence=payload["confidence"],
            requires_emergency=payload["requires_emergency"],
            extracted_symptoms=",".join(payload.get("extracted_symptoms", [])),
            is_flagged=not is_safe,
            safety_notes=safety_msg,
        )
        db.commit()
        
        # Notify user via WebSocket Pub/Sub
        await manager.send_to_user(user_id, {
            "type": "ai_triage_complete",
            "payload": payload
        })
        return payload
    except Exception:
        logger.exception("celery_triage_task_failed")
        raise
    finally:
        db.close()

@celery_app.task(name="tasks.ai_triage")
def ai_triage_task(user_id: int, symptom_input: str, budget: float | None, language: str):
    return asyncio.run(_process_triage(user_id, symptom_input, budget, language))
