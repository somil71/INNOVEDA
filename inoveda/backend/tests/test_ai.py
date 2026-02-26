import asyncio
from pathlib import Path

import services.ai_service as ai_service
from schemas import SymptomExtractionOutput
from tests.conftest import register_and_login


def test_ai_severity_and_confidence_present(client):
    headers, _ = register_and_login(client, role="patient", email="ai-user@example.com")
    r = client.post(
        "/patient/ai-chat",
        json={"symptom_input": "I have chest pain and breathless feeling", "budget": 300, "language": "en"},
        headers=headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["severity"] == "critical"
    assert 0 <= body["confidence"] <= 1
    assert "follow_up_questions" in body
    assert "extracted_symptoms" in body
    assert isinstance(body["doctor_suggestions"], list)


def test_ai_empty_symptom_rejected(client):
    headers, _ = register_and_login(client, role="patient", email="ai-empty@example.com")
    r = client.post("/patient/ai-chat", json={"symptom_input": "", "language": "en"}, headers=headers)
    assert r.status_code == 422


def test_ai_fallback_when_model_missing(client, monkeypatch):
    headers, _ = register_and_login(client, role="patient", email="ai-fallback-model@example.com")
    monkeypatch.setattr(ai_service.settings, "model_path", str(Path("missing_model.joblib")))
    ai_service._MODEL_CACHE = None
    r = client.post("/patient/ai-chat", json={"symptom_input": "high fever and cough", "language": "en"}, headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["severity"] in {"mild", "moderate", "critical"}
    assert body["confidence"] > 0


def test_ai_llm_extraction_and_malformed_json_fallback(client, monkeypatch):
    headers, _ = register_and_login(client, role="patient", email="ai-llm-malformed@example.com")

    async def bad_extract(_: str):
        return None

    monkeypatch.setattr(ai_service, "_extract_with_openai", bad_extract)
    r = client.post("/patient/ai-chat", json={"symptom_input": "vomiting and dizziness", "language": "en"}, headers=headers)
    assert r.status_code == 200
    assert len(r.json()["extracted_symptoms"]) >= 1


def test_ai_timeout_fallback_and_emergency_override(client, monkeypatch):
    headers, _ = register_and_login(client, role="patient", email="ai-timeout@example.com")

    async def timeout_extract(_: str):
        await asyncio.sleep(0.01)
        return SymptomExtractionOutput(symptoms=["chest pain"], red_flags=["breathless"], duration_days=1, notes="timeout")

    monkeypatch.setattr(ai_service, "_extract_with_openai", timeout_extract)
    r = client.post("/patient/ai-chat", json={"symptom_input": "pain", "language": "en"}, headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["requires_emergency"] is True
    assert body["severity"] == "critical"
