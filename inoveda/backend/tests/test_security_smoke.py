import pytest
from starlette.websockets import WebSocketDisconnect

from tests.conftest import register_and_login
from tests.utils import make_token


def test_sql_injection_attempt_rejected(client):
    r = client.post("/auth/login", json={"email": "' OR 1=1 --", "password": "x"})
    assert r.status_code in {401, 422}


def test_jwt_tampering_rejected(client):
    _, payload = register_and_login(client, role="patient", email="jwt-tamper@example.com")
    bad = make_token(payload["user_id"], "patient") + "tampered"
    r = client.get("/patient/dashboard", headers={"Authorization": f"Bearer {bad}"})
    assert r.status_code == 401


def test_role_privilege_escalation_attempt_rejected(client):
    _, payload = register_and_login(client, role="patient", email="jwt-escalate@example.com")
    forged = make_token(payload["user_id"], "admin")
    r = client.get("/admin/dashboard", headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 401


def test_upload_path_traversal_rejected_or_sanitized(client):
    headers, _ = register_and_login(client, role="patient", email="upload-sec@example.com")
    from io import BytesIO

    files = {"file": ("../../secret.pdf", BytesIO(b"%PDF-1.4"), "application/pdf")}
    r = client.post("/patient/documents/upload", files=files, headers=headers)
    assert r.status_code in {200, 400}
    if r.status_code == 200:
        assert ".." not in r.json()["file_path"]


def test_websocket_unauthorized_connection_rejected(client):
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/ws/chat/999"):
            pass
    assert exc.value.code == 1008


def test_websocket_tampered_token_rejected(client):
    _, user = register_and_login(client, role="patient", email="ws-tampered@example.com")
    tampered = user["access_token"] + "x"
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"/ws/chat/{user['user_id']}?token={tampered}"):
            pass
    assert exc.value.code == 1008
