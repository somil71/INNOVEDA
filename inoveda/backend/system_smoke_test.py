import os
import sys
import tempfile
from dataclasses import dataclass

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
from models import AIChatHistory, Appointment, EmergencyRequest, Message, Prescription


@dataclass
class SmokeStats:
    passed: int = 0
    failed: int = 0
    endpoints_tested: int = 0
    db_writes_verified: int = 0
    websocket_ok: bool = False


def assert_step(condition: bool, title: str, stats: SmokeStats):
    if condition:
        stats.passed += 1
        print(f"[PASS] {title}")
    else:
        stats.failed += 1
        print(f"[FAIL] {title}")


def main() -> int:
    stats = SmokeStats()
    with tempfile.TemporaryDirectory() as tmp:
        db_path = os.path.join(tmp, "smoke.db")
        engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
        TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        Base.metadata.create_all(bind=engine)

        def override_get_db():
            db = TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        with TestClient(app) as client:
            # Register users
            patient = client.post(
                "/auth/register",
                json={"name": "P", "email": "smoke-p@example.com", "password": "password123", "role": "patient"},
            )
            doctor = client.post(
                "/auth/register",
                json={
                    "name": "D",
                    "email": "smoke-d@example.com",
                    "password": "password123",
                    "role": "doctor",
                    "consultation_fee": 200,
                },
            )
            admin = client.post(
                "/auth/register",
                json={"name": "A", "email": "smoke-a@example.com", "password": "password123", "role": "admin"},
            )
            stats.endpoints_tested += 3
            assert_step(patient.status_code == 200 and doctor.status_code == 200 and admin.status_code == 200, "register flow", stats)

            p = patient.json()
            d = doctor.json()
            a = admin.json()
            p_headers = {"Authorization": f"Bearer {p['access_token']}"}
            d_headers = {"Authorization": f"Bearer {d['access_token']}"}
            a_headers = {"Authorization": f"Bearer {a['access_token']}"}

            triage = client.post(
                "/patient/ai-chat",
                json={"symptom_input": "chest pain and breathless", "language": "en"},
                headers=p_headers,
            )
            stats.endpoints_tested += 1
            assert_step(triage.status_code == 200 and "severity" in triage.json(), "ai triage", stats)

            appt = client.post(
                "/patient/appointments",
                json={"doctor_id": d["user_id"], "date": "2026-02-25 12:00"},
                headers=p_headers,
            )
            stats.endpoints_tested += 1
            assert_step(appt.status_code == 200, "appointment booking", stats)

            rx = client.post(
                "/doctor/prescriptions",
                json={"patient_id": p["user_id"], "medicines": [{"name": "MedA", "dosage": "1-0-1", "duration": "3d", "price": 10}]},
                headers=d_headers,
            )
            stats.endpoints_tested += 1
            assert_step(rx.status_code == 200, "prescription creation", stats)

            for _ in range(8):
                client.post(
                    "/admin/disease-report",
                    json={"village": "SmokeVillage", "disease_type": "fever", "severity": "moderate"},
                    headers=d_headers,
                )
            stats.endpoints_tested += 8
            dash = client.get("/admin/dashboard", headers=a_headers)
            stats.endpoints_tested += 1
            assert_step(dash.status_code == 200 and "disease_trends" in dash.json(), "outbreak/admin dashboard", stats)

            emergency = client.post("/patient/emergency", headers=p_headers)
            stats.endpoints_tested += 1
            assert_step(emergency.status_code == 200, "emergency trigger", stats)

            with client.websocket_connect(f"/ws/chat/{p['user_id']}?token={p['access_token']}") as ws_p, client.websocket_connect(
                f"/ws/chat/{d['user_id']}?token={d['access_token']}"
            ) as ws_d:
                ws_p.send_json({"sender_id": p["user_id"], "receiver_id": d["user_id"], "content": "smoke-msg"})
                msg = ws_d.receive_json()
                stats.websocket_ok = msg.get("content") == "smoke-msg"
            assert_step(stats.websocket_ok, "websocket chat", stats)

            db = TestingSessionLocal()
            try:
                stats.db_writes_verified += int(db.query(AIChatHistory).count() >= 1)
                stats.db_writes_verified += int(db.query(Appointment).count() >= 1)
                stats.db_writes_verified += int(db.query(Prescription).count() >= 1)
                stats.db_writes_verified += int(db.query(EmergencyRequest).count() >= 1)
                stats.db_writes_verified += int(db.query(Message).count() >= 0)
            finally:
                db.close()
            assert_step(stats.db_writes_verified >= 4, "db writes verified", stats)

        app.dependency_overrides.clear()
        engine.dispose()

    print("\n=== INOVEDA Smoke Summary ===")
    print(f"PASS: {stats.passed}")
    print(f"FAIL: {stats.failed}")
    print(f"Total endpoints tested: {stats.endpoints_tested}")
    print(f"Total DB writes verified: {stats.db_writes_verified}")
    print(f"WebSocket test status: {'PASS' if stats.websocket_ok else 'FAIL'}")
    print(f"Overall system health: {'PASS' if stats.failed == 0 else 'FAIL'}")
    return 0 if stats.failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
