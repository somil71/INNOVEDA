from io import BytesIO
from pathlib import Path

from models import AIChatHistory, Appointment, Document, EmergencyRequest, Patient
from tests.conftest import register_and_login
from tests.utils import assert_has_keys


def test_patient_ai_triage_saved(client, db_session):
    headers, user = register_and_login(client, role="patient", email="triage-p@example.com")
    r = client.post(
        "/patient/ai-chat",
        json={"symptom_input": "chest pain and breathless", "budget": 200, "language": "en"},
        headers=headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert_has_keys(body, ["severity", "confidence", "requires_emergency", "calming_steps"])
    row = db_session.query(AIChatHistory).filter(AIChatHistory.patient_id == user["user_id"]).first()
    assert row is not None
    assert row.severity == body["severity"]


def test_patient_document_upload_db_and_filesystem(client, db_session):
    headers, user = register_and_login(client, role="patient", email="doc-p@example.com")
    files = {"file": ("report.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf")}
    r = client.post("/patient/documents/upload", files=files, headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert_has_keys(body, ["id", "file_path"])
    saved = db_session.query(Document).filter(Document.id == body["id"]).first()
    assert saved is not None
    assert saved.patient_id == user["user_id"]
    assert Path(saved.file_path).exists()


def test_patient_book_appointment_and_emergency_and_auto_pay(client, db_session):
    patient_headers, patient = register_and_login(client, role="patient", email="flow-p@example.com")
    _, doctor = register_and_login(client, role="doctor", email="flow-d@example.com", extra={"consultation_fee": 120})

    app_res = client.post(
        "/patient/appointments",
        json={"doctor_id": doctor["user_id"], "date": "2026-02-25 15:00"},
        headers=patient_headers,
    )
    assert app_res.status_code == 200
    app_id = app_res.json()["appointment_id"]
    appointment = db_session.query(Appointment).filter(Appointment.id == app_id).first()
    assert appointment is not None
    assert appointment.patient_id == patient["user_id"]
    assert appointment.doctor_id == doctor["user_id"]

    toggle = client.post("/patient/auto-pay/true", headers=patient_headers)
    assert toggle.status_code == 200
    profile = db_session.query(Patient).filter(Patient.user_id == patient["user_id"]).first()
    assert profile and profile.auto_pay_enabled is True

    emergency = client.post("/patient/emergency", headers=patient_headers)
    assert emergency.status_code == 200
    req = db_session.query(EmergencyRequest).filter(EmergencyRequest.patient_id == patient["user_id"]).first()
    assert req is not None
