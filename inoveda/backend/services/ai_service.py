import asyncio
import json
import logging
from pathlib import Path
from typing import Any

import joblib
from sqlalchemy.orm import Session

from core.config import settings
from repositories.doctor_repository import DoctorRepository
from schemas import AIChatResponse, SymptomExtractionOutput

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You extract structured healthcare symptoms only. Return valid JSON object with keys: "
    "symptoms (string array), duration_days (integer or null), red_flags (string array), notes (string or null)."
)
CRITICAL_TERMS = {"chest pain", "unconscious", "bleeding", "stroke", "seizure", "breathless", "severe breathlessness"}
SPECIALIZATION_MAP = {
    "chest pain": "Cardiology",
    "breathless": "Pulmonology",
    "cough": "Pulmonology",
    "fever": "General Medicine",
    "infection": "Infectious Disease",
    "headache": "Neurology",
    "pregnancy": "Gynecology",
}

_MODEL_CACHE = None


def _load_model():
    global _MODEL_CACHE
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE
    model_path = Path(settings.model_path)
    if model_path.exists():
        try:
            _MODEL_CACHE = joblib.load(model_path)
            logger.info("triage_model_loaded")
        except Exception:
            logger.exception("triage_model_load_failed")
            _MODEL_CACHE = None
    else:
        _MODEL_CACHE = None
        logger.warning("triage_model_missing")
    return _MODEL_CACHE


def _extract_rule_based(symptom_input: str) -> SymptomExtractionOutput:
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
    red_flags = [t for t in symptoms if t in CRITICAL_TERMS]
    return SymptomExtractionOutput(symptoms=symptoms, red_flags=red_flags, notes="rule_based_fallback")


async def _extract_with_openai(symptom_input: str) -> SymptomExtractionOutput | None:
    if not settings.use_openai or not settings.openai_api_key:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)

        def run_call() -> str:
            response = client.responses.create(
                model=settings.openai_model,
                input=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": symptom_input},
                ],
            )
            return response.output_text

        raw = await asyncio.to_thread(run_call)
        parsed = json.loads(raw)
        return SymptomExtractionOutput(**parsed)
    except Exception:
        logger.exception("openai_extraction_failed")
        return None


def _predict_ml(symptoms: list[str]) -> tuple[str, float]:
    model = _load_model()
    joined = ", ".join(symptoms)
    if model is None:
        if any(term in joined for term in CRITICAL_TERMS):
            return "critical", 0.9
        if any(term in joined for term in {"fever", "infection", "vomit", "dizziness", "cough", "pain"}):
            return "moderate", 0.72
        return "mild", 0.65
    prediction = model.predict([joined])[0]
    probs = model.predict_proba([joined])[0]
    labels = list(model.classes_)
    confidence = float(max(probs)) if probs is not None else 0.7
    if prediction not in labels:
        prediction = labels[int(probs.argmax())]
    return str(prediction), round(confidence, 4)


def _recommended_specialization(symptoms: list[str]) -> str:
    for symptom in symptoms:
        if symptom in SPECIALIZATION_MAP:
            return SPECIALIZATION_MAP[symptom]
    return "General Medicine"


def get_follow_up_questions(severity: str, language: str) -> list[str]:
    en = {
        "mild": ["How long have you had these symptoms?", "Any allergies or long-term illness?"],
        "moderate": ["Do you have fever duration in days?", "Are symptoms getting worse?"],
        "critical": ["Is breathing difficult right now?", "Is the patient conscious and responsive?"],
    }
    hi = {
        "mild": ["ये लक्षण कब से हैं?", "क्या कोई एलर्जी या पुरानी बीमारी है?"],
        "moderate": ["बुखार कितने दिनों से है?", "क्या लक्षण बढ़ रहे हैं?"],
        "critical": ["क्या अभी सांस लेने में कठिनाई है?", "क्या मरीज होश में है?"],
    }
    return (hi if language == "hi" else en)[severity]


def get_calming_steps(severity: str, language: str) -> list[str]:
    en = ["Stay hydrated", "Rest in a ventilated room", "Avoid self-medication overdose"]
    hi = ["पानी पर्याप्त पिएं", "हवादार कमरे में आराम करें", "दवा की अधिक मात्रा खुद से न लें"]
    common = hi if language == "hi" else en
    if severity == "critical":
        critical_en = ["Call emergency support immediately", "Keep patient lying on side safely"]
        critical_hi = ["तुरंत इमरजेंसी सहायता बुलाएं", "मरीज को सुरक्षित करवट में लिटाएं"]
        return (critical_hi if language == "hi" else critical_en) + common[:1]
    return common


def doctor_suggestions(db: Session, budget: float | None):
    repo = DoctorRepository(db)
    doctors = repo.suggest_doctors(budget=budget, limit=5)
    return [
        {
            "doctor_id": d.user_id,
            "specialization": d.specialization or "General",
            "consultation_fee": d.consultation_fee,
            "rating": d.rating,
        }
        for d in doctors
    ]


async def run_triage_pipeline(db: Session, symptom_input: str, budget: float | None, language: str) -> dict[str, Any]:
    extracted = await _extract_with_openai(symptom_input)
    if extracted is None:
        extracted = _extract_rule_based(symptom_input)

    severity, confidence = _predict_ml(extracted.symptoms)
    red_flag_hit = bool(set(extracted.symptoms + extracted.red_flags) & CRITICAL_TERMS)
    # Deterministic override avoids missing emergency scenarios from model noise.
    if red_flag_hit and severity != "critical":
        severity = "critical"
        confidence = max(confidence, 0.85)
    requires_emergency = severity == "critical"

    follow_up = get_follow_up_questions(severity, language)
    calming_steps = get_calming_steps(severity, language)
    doctor_list = doctor_suggestions(db, budget)
    specialization = _recommended_specialization(extracted.symptoms)
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
    response = AIChatResponse(
        follow_up_questions=follow_up,
        severity=severity,
        confidence=confidence,
        requires_emergency=requires_emergency,
        calming_steps=calming_steps,
        doctor_suggestions=doctor_list,
        emergency_advice=emergency_advice,
        ai_response=ai_response,
        recommended_specialization=specialization,
        extracted_symptoms=extracted.symptoms,
    )
    return response.model_dump()
