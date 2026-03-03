import asyncio
import json
import logging
from typing import Optional

from core.config import settings
from schemas import SymptomExtractionOutput
from .utils import exponential_backoff_retry, sanitize_input
from .emergency_engine import CRITICAL_TERMS

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = (
    "You extract structured healthcare symptoms only. Return valid JSON object with keys: "
    "symptoms (string array), duration_days (integer or null), red_flags (string array), notes (string or null)."
)


def _rule_based(symptom_input: str) -> SymptomExtractionOutput:
    text = symptom_input.lower()
    known_terms = [
        "fever",
        "cough",
        "cold",
        "chest pain",
        "bleeding",
        "vomit",
        "dizziness",
        "breathless",
        "headache",
        "seizure",
        "infection",
        "pain",
    ]
    symptoms = [t for t in known_terms if t in text] or ["general discomfort"]
    red_flags = [t for t in symptoms if t in EmergencyEngine.CRITICAL_TERMS]
    return SymptomExtractionOutput(symptoms=symptoms, red_flags=red_flags, notes="rule_based_fallback")


async def _call_openai(symptom_input: str) -> str:
    # wrapper to keep original behavior but allow backoff
    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)

    def run_call() -> str:
        response = client.responses.create(
            model=settings.openai_model,
            input=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": symptom_input},
            ],
            temperature=settings.openai_temperature,
        )
        return response.output_text

    return await asyncio.to_thread(run_call)


async def extract(symptom_input: str) -> SymptomExtractionOutput:
    """Sanitize input, call OpenAI (with retries) or fallback to rule based."""
    clean_text = sanitize_input(symptom_input)

    if not settings.use_openai or not settings.openai_api_key:
        return _rule_based(clean_text)

    try:
        raw = await exponential_backoff_retry(_call_openai, clean_text, retries=3)
        parsed = json.loads(raw)
        # enforce schema; will raise ValidationError on failure
        return SymptomExtractionOutput(**parsed)
    except Exception as exc:  # includes JSON errors and validation
        logger.warning("openai_extraction_error", exc_info=True)
        return _rule_based(clean_text)
