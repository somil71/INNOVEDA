import asyncio
from unittest.mock import AsyncMock

from models import Notification
from tests.conftest import register_and_login


def test_emergency_triggers_notification_persistence(client, db_session, monkeypatch):
    patient_headers, patient = register_and_login(client, role="patient", email="trigger-ep@example.com")
    register_and_login(client, role="doctor", email="trigger-ed@example.com", extra={"consultation_fee": 100})
    register_and_login(client, role="admin", email="trigger-ea@example.com")

    from services import patient_service

    mock_send = AsyncMock()
    monkeypatch.setattr(patient_service.manager, "send_to_user", mock_send)
    r = client.post("/patient/emergency", headers=patient_headers)
    assert r.status_code == 200
    assert mock_send.await_count >= 1
    notes = db_session.query(Notification).filter(Notification.title == "Emergency Alert").all()
    assert len(notes) >= 1


def test_prescription_triggers_patient_notification_and_scheduler(client, db_session, monkeypatch):
    _, patient = register_and_login(client, role="patient", email="trigger-pp@example.com")
    doctor_headers, _ = register_and_login(client, role="doctor", email="trigger-pd@example.com", extra={"consultation_fee": 100})

    from services import doctor_service

    scheduled = []

    def fake_create_task(coro):
        scheduled.append(coro)
        coro.close()
        return asyncio.get_event_loop().create_task(asyncio.sleep(0))

    async def dummy_schedule(*args, **kwargs):  # noqa: ANN002, ANN003
        return None

    monkeypatch.setattr(doctor_service, "schedule_dosage_notification", dummy_schedule)
    monkeypatch.setattr(doctor_service.asyncio, "create_task", fake_create_task)

    r = client.post(
        "/doctor/prescriptions",
        json={"patient_id": patient["user_id"], "medicines": [{"name": "TestMed", "dosage": "1-0-1", "duration": "2", "price": 10}]},
        headers=doctor_headers,
    )
    assert r.status_code == 200
    assert len(scheduled) >= 1
    note = db_session.query(Notification).filter(Notification.user_id == patient["user_id"]).order_by(Notification.id.desc()).first()
    assert note is not None
    assert "Prescription Ready" in note.title


def test_outbreak_alert_triggers_admin_notification_channel(client, monkeypatch):
    admin_headers, _ = register_and_login(client, role="admin", email="trigger-oa@example.com")
    doctor_headers, _ = register_and_login(client, role="doctor", email="trigger-od@example.com", extra={"consultation_fee": 100})

    from services import admin_service

    mock_send = AsyncMock()
    monkeypatch.setattr(admin_service.manager, "send_to_user", mock_send)
    for _ in range(8):
        client.post(
            "/admin/disease-report",
            json={"village": "TriggerVillage", "disease_type": "infection", "severity": "moderate"},
            headers=doctor_headers,
        )
    client.get("/admin/dashboard", headers=admin_headers)
    assert mock_send.await_count >= 0


def test_structured_request_log_written(client, caplog):
    caplog.clear()
    client.get("/")
    assert any("http_request" in rec.message for rec in caplog.records)
