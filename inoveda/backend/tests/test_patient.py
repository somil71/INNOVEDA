from tests.conftest import register_and_login


def test_patient_appointment_and_cart_read(client):
    patient_headers, _ = register_and_login(client, role="patient", email="pa@example.com", name="Patient")
    _, doctor = register_and_login(
        client,
        role="doctor",
        email="dr@example.com",
        name="Doctor",
        extra={"specialization": "General", "consultation_fee": 100},
    )
    doctor_id = doctor["user_id"]
    book = client.post(
        "/patient/appointments",
        json={"doctor_id": doctor_id, "date": "2026-02-25 10:00"},
        headers=patient_headers,
    )
    assert book.status_code == 200
    cart = client.get("/patient/cart", headers=patient_headers)
    assert cart.status_code == 200
    assert "items" in cart.json()
