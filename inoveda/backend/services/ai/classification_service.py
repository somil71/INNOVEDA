import logging
from pathlib import Path
from typing import Tuple, Optional

import joblib

from core.config import settings
from .emergency_engine import CRITICAL_TERMS

logger = logging.getLogger(__name__)

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


def classify(symptoms: list[str]) -> Tuple[str, float]:
    """Return (severity, confidence) using local ML model or heuristics."""
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
