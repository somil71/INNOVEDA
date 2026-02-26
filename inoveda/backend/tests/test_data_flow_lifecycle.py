from models import AIChatHistory, Appointment, EmergencyRequest, OutbreakEvent, Prescription
from tests.conftest import register_and_login


def test_end_to_end_data_lifecycle(client, db_session, monkeypatch):
    from core.config import settings

    monkeypatch.setattr(settings, "outbreak_method", "poisson")

    patient_headers, patient = register_and_login(client, role="patient", email="life-p@example.com")
    doctor_headers, doctor = register_and_login(
        client, role="doctor", email="life-d@example.com", extra={"consultation_fee": 200, "specialization": "General"}
    )
    admin_headers, _ = register_and_login(client, role="admin", email="life-a@example.com")

    triage = client.post(
        "/patient/ai-chat",
        json={"symptom_input": "severe chest pain and breathless", "budget": 300, "language": "en"},
        headers=patient_headers,
    )
    assert triage.status_code == 200
    triage_payload = triage.json()
    ai_saved = db_session.query(AIChatHistory).filter(AIChatHistory.patient_id == patient["user_id"]).first()
    assert ai_saved is not None

    book = client.post(
        "/patient/appointments",
        json={"doctor_id": doctor["user_id"], "date": "2026-02-25 17:00"},
        headers=patient_headers,
    )
    assert book.status_code == 200
    aid = book.json()["appointment_id"]
    assert db_session.query(Appointment).filter(Appointment.id == aid).first() is not None

    for _ in range(12):
        client.post(
            "/admin/disease-report",
            json={"village": "Village-Life", "disease_type": "fever", "severity": "moderate"},
            headers=doctor_headers,
        )

    pres = client.post(
        "/doctor/prescriptions",
        json={"patient_id": patient["user_id"], "medicines": [{"name": "Aspirin", "dosage": "1-0-1", "duration": "3 days", "price": 60}]},
        headers=doctor_headers,
    )
    assert pres.status_code == 200
    pid = pres.json()["prescription_id"]
    assert db_session.query(Prescription).filter(Prescription.id == pid).first() is not None

    rx = client.get("/patient/prescriptions", headers=patient_headers)
    assert any(row["id"] == pid for row in rx.json())

    if triage_payload["requires_emergency"]:
        em = client.post("/patient/emergency", headers=patient_headers)
        assert em.status_code == 200
        assert db_session.query(EmergencyRequest).filter(EmergencyRequest.patient_id == patient["user_id"]).first() is not None

    dashboard = client.get("/admin/dashboard", headers=admin_headers)
    assert dashboard.status_code == 200
    assert "village_counts" in dashboard.json()

    # No orphan records for key flow entities.
    for ap in db_session.query(Appointment).all():
        assert ap.patient_id is not None and ap.doctor_id is not None
    for pr in db_session.query(Prescription).all():
        assert pr.patient_id is not None and pr.doctor_id is not None
    assert db_session.query(OutbreakEvent).all() is not None
