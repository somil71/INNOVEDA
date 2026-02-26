from models import Medicine, PatientCartItem, Prescription
from tests.conftest import register_and_login


def test_doctor_assigned_patients_and_prescription_linking(client, db_session):
    patient_headers, patient = register_and_login(client, role="patient", email="docflow-p@example.com")
    doctor_headers, doctor = register_and_login(
        client, role="doctor", email="docflow-d@example.com", extra={"consultation_fee": 300, "specialization": "General"}
    )

    book = client.post(
        "/patient/appointments",
        json={"doctor_id": doctor["user_id"], "date": "2026-02-25 16:00"},
        headers=patient_headers,
    )
    assert book.status_code == 200

    assigned = client.get("/doctor/patients", headers=doctor_headers)
    assert assigned.status_code == 200
    assert any(p["id"] == patient["user_id"] for p in assigned.json())

    pres = client.post(
        "/doctor/prescriptions",
        json={
            "patient_id": patient["user_id"],
            "medicines": [
                {"name": "Amoxicillin", "dosage": "1-1-1", "duration": "5 days", "price": 120},
                {"name": "ORS", "dosage": "SOS", "duration": "2 days", "price": 40},
            ],
        },
        headers=doctor_headers,
    )
    assert pres.status_code == 200
    pid = pres.json()["prescription_id"]

    rx = db_session.query(Prescription).filter(Prescription.id == pid).first()
    meds = db_session.query(Medicine).filter(Medicine.prescription_id == pid).all()
    cart = db_session.query(PatientCartItem).filter(PatientCartItem.patient_id == patient["user_id"]).all()
    assert rx is not None and rx.patient_id == patient["user_id"] and rx.doctor_id == doctor["user_id"]
    assert len(meds) == 2
    assert len(cart) >= 2

    patient_rx = client.get("/patient/prescriptions", headers=patient_headers)
    assert patient_rx.status_code == 200
    assert any(row["id"] == pid for row in patient_rx.json())
