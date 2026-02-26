import time

import pytest
from starlette.websockets import WebSocketDisconnect

from models import Message
from services.notifications import manager
from tests.conftest import register_and_login
from tests.utils import make_token


def _ws_url(path: str, token: str) -> str:
    return f"{path}?token={token}"


def test_websocket_chat_handshake_and_message(client):
    _, user1 = register_and_login(client, role="patient", email="ws1@example.com")
    _, user2 = register_and_login(client, role="doctor", email="ws2@example.com", extra={"consultation_fee": 100})

    uid1 = user1["user_id"]
    uid2 = user2["user_id"]

    with client.websocket_connect(_ws_url(f"/ws/chat/{uid1}", user1["access_token"])) as ws1:
        with client.websocket_connect(_ws_url(f"/ws/chat/{uid2}", user2["access_token"])) as ws2:
            ws1.send_json({"sender_id": uid1, "receiver_id": uid2, "content": "hello"})
            msg = ws2.receive_json()
            assert msg["content"] == "hello"
            assert msg["receiver_id"] == uid2


def test_websocket_auth_via_authorization_header(client):
    _, user = register_and_login(client, role="patient", email="ws-header@example.com")
    with client.websocket_connect(
        f"/ws/chat/{user['user_id']}", headers={"Authorization": f"Bearer {user['access_token']}"}
    ) as ws:
        ws.send_json({"sender_id": user["user_id"], "receiver_id": user["user_id"], "content": "self"})
        msg = ws.receive_json()
        assert msg["content"] == "self"


def test_websocket_message_persistence_cleanup_and_reconnect(client, db_session):
    headers1, user1 = register_and_login(client, role="patient", email="ws-db-1@example.com")
    _, user2 = register_and_login(client, role="doctor", email="ws-db-2@example.com", extra={"consultation_fee": 100})
    uid1, uid2 = user1["user_id"], user2["user_id"]

    with client.websocket_connect(_ws_url(f"/ws/chat/{uid1}", user1["access_token"])) as ws1, client.websocket_connect(
        _ws_url(f"/ws/chat/{uid2}", user2["access_token"])
    ) as ws2:
        ws1.send_json({"sender_id": uid1, "receiver_id": uid2, "content": "persist-me"})
        ws2.receive_json()
        save = client.post("/chat/messages", json={"receiver_id": uid2, "content": "persist-me"}, headers=headers1)
        assert save.status_code == 200
        ws1.close()
        ws2.close()

    time.sleep(0.05)
    assert uid1 not in manager.user_connections or len(manager.user_connections[uid1]) == 0
    assert uid2 not in manager.user_connections or len(manager.user_connections[uid2]) == 0

    with client.websocket_connect(_ws_url(f"/ws/chat/{uid1}", user1["access_token"])) as ws1b, client.websocket_connect(
        _ws_url(f"/ws/chat/{uid2}", user2["access_token"])
    ) as ws2b:
        ws1b.send_json({"sender_id": uid1, "receiver_id": uid2, "content": "reconnect-ok"})
        msg = ws2b.receive_json()
        assert msg["content"] == "reconnect-ok"

    msgs = db_session.query(Message).filter(Message.content == "persist-me").all()
    assert len(msgs) >= 1


def test_signaling_smoke_offer_answer_ice(client):
    _, user1 = register_and_login(client, role="patient", email="sig1@example.com")
    _, user2 = register_and_login(client, role="doctor", email="sig2@example.com", extra={"consultation_fee": 100})
    room = "room-smoke-1"
    with client.websocket_connect(_ws_url(f"/ws/signaling/{room}", user1["access_token"])) as a, client.websocket_connect(
        _ws_url(f"/ws/signaling/{room}", user2["access_token"])
    ) as b:
        offer = {"type": "offer", "sdp": "dummy-offer"}
        a.send_json(offer)
        assert b.receive_json()["type"] == "offer"
        answer = {"type": "answer", "sdp": "dummy-answer"}
        b.send_json(answer)
        assert a.receive_json()["type"] == "answer"
        ice = {"type": "ice", "candidate": "dummy-candidate"}
        a.send_json(ice)
        assert b.receive_json()["type"] == "ice"


def test_websocket_invalid_token_rejected(client):
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/ws/chat/1?token=invalid"):
            pass
    assert exc.value.code == 1008


def test_websocket_missing_token_rejected(client):
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/ws/chat/1"):
            pass
    assert exc.value.code == 1008


def test_websocket_expired_token_rejected(client):
    _, user = register_and_login(client, role="patient", email="ws-expired@example.com")
    expired = make_token(user["user_id"], "patient", expires_minutes=-1)
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"/ws/chat/{user['user_id']}?token={expired}"):
            pass
    assert exc.value.code == 1008


def test_websocket_user_id_mismatch_rejected(client):
    _, user1 = register_and_login(client, role="patient", email="ws-mis-1@example.com")
    _, user2 = register_and_login(client, role="doctor", email="ws-mis-2@example.com", extra={"consultation_fee": 100})
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"/ws/chat/{user2['user_id']}?token={user1['access_token']}"):
            pass
    assert exc.value.code == 1008
