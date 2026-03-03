import logging

from schemas import AIChatResponse
from core.config import settings

logger = logging.getLogger(__name__)


def format_response(
    severity: str,
    confidence: float,
    requires_emergency: bool,
    specialization: str,
    follow_up: list[str],
    calming_steps: list[str],
    doctor_list: list[dict],
    extracted_symptoms: list[str],
) -> dict:
    """Build the final response dictionary and add disclaimer."""
    emergency_advice = (
        "Critical symptoms detected. Please press emergency button and call nearest health center."
        if requires_emergency
        else "No immediate emergency detected."
    )
    ai_response = (
        f"Severity {severity} (confidence {confidence:.2f}). "
        f"Possible specialization: {specialization}. "
        f"Follow-up: {' | '.join(follow_up)}."
    )
    # log sanitized data
    logger.info(
        "triage_completed",
        extra={
            "severity": severity,
            "confidence": confidence,
            "emergency": requires_emergency,
            "symptoms": extracted_symptoms[:5],
        },
    )

    payload = AIChatResponse(
        follow_up_questions=follow_up,
        severity=severity,
        confidence=confidence,
        requires_emergency=requires_emergency,
        recommended_specialization=specialization,
        calming_steps=calming_steps,
        doctor_suggestions=doctor_list,
        emergency_advice=emergency_advice,
        ai_response=ai_response,
        extracted_symptoms=extracted_symptoms,
    ).model_dump()

    # append disclaimer
    payload["disclaimer"] = settings.medical_disclaimer
    return payload
