from tests.conftest import register_and_login


def test_prescription_adds_medicines_to_cart(client):
    patient_headers, patient = register_and_login(client, role="patient", email="pat-doc@example.com", name="Patient")
    doctor_headers, _ = register_and_login(
        client,
        role="doctor",
        email="doctor-presc@example.com",
        name="Doctor",
        extra={"specialization": "Cardiology", "consultation_fee": 500},
    )

    payload = {
        "patient_id": patient["user_id"],
        "medicines": [{"name": "Paracetamol", "dosage": "1-0-1", "duration": "5 days", "price": 20}],
    }
    r = client.post("/doctor/prescriptions", json=payload, headers=doctor_headers)
    assert r.status_code == 200
    assert "prescription_id" in r.json()

    cart = client.get("/patient/cart", headers=patient_headers)
    assert cart.status_code == 200
    assert any(item["medicine_name"] == "Paracetamol" for item in cart.json()["items"])
