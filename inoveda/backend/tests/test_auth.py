from datetime import datetime, timedelta, timezone

from jose import jwt

from core.config import settings
from tests.conftest import register_and_login
from tests.utils import make_token


def test_register_and_login_success(client):
    r = client.post(
        "/auth/register",
        json={
            "name": "Pat",
            "email": "pat@example.com",
            "password": "password123",
            "role": "patient",
            "village": "A",
            "phone": "1234567890",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["role"] == "patient"

    login = client.post("/auth/login", json={"email": "pat@example.com", "password": "password123"})
    assert login.status_code == 200
    assert "access_token" in login.json()


def test_invalid_login(client):
    client.post(
        "/auth/register",
        json={
            "name": "Pat",
            "email": "pat2@example.com",
            "password": "password123",
            "role": "patient",
            "village": "A",
            "phone": "1234567890",
        },
    )
    bad = client.post("/auth/login", json={"email": "pat2@example.com", "password": "wrong-pass"})
    assert bad.status_code == 401


def test_role_based_access_rejected(client):
    headers, _ = register_and_login(client, role="patient", email="p1@example.com")
    r = client.get("/doctor/dashboard", headers=headers)
    assert r.status_code == 403


def test_expired_token_rejected(client):
    _, payload = register_and_login(client, role="patient", email="exp@example.com")
    expired = jwt.encode(
        {"sub": str(payload["user_id"]), "role": "patient", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    r = client.get("/patient/dashboard", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


def test_role_mismatch_token_rejected(client):
    _, payload = register_and_login(client, role="patient", email="mismatch@example.com")
    tampered = make_token(payload["user_id"], "admin", expires_minutes=15)
    r = client.get("/patient/dashboard", headers={"Authorization": f"Bearer {tampered}"})
    assert r.status_code == 401
