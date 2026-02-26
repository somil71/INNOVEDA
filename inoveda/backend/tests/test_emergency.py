from tests.conftest import register_and_login


def test_emergency_stored_and_notifications_visible(client):
    patient_headers, _ = register_and_login(client, role="patient", email="patient-em@example.com")
    doctor_headers, _ = register_and_login(client, role="doctor", email="doctor-em@example.com", extra={"consultation_fee": 100})
    admin_headers, _ = register_and_login(client, role="admin", email="admin-em@example.com")

    trigger = client.post("/patient/emergency", headers=patient_headers)
    assert trigger.status_code == 200

    emergencies = client.get("/admin/emergencies", headers=admin_headers)
    assert emergencies.status_code == 200
    assert len(emergencies.json()) >= 1

    notifications = client.get("/chat/notifications", headers=doctor_headers)
    assert notifications.status_code == 200
    assert any("Emergency Alert" in n["title"] for n in notifications.json())
