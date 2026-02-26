import pytest
from starlette.websockets import WebSocketDisconnect

from tests.conftest import register_and_login


def _ws_url(path: str, token: str) -> str:
    return f"{path}?token={token}"


def test_video_signaling_offer_answer_ice_no_500(client):
    room = "video-room-qa"
    _, p = register_and_login(client, role="patient", email="video-p@example.com")
    _, d = register_and_login(client, role="doctor", email="video-d@example.com", extra={"consultation_fee": 100})
    with client.websocket_connect(_ws_url(f"/ws/signaling/{room}", p["access_token"])) as ws1, client.websocket_connect(
        _ws_url(f"/ws/signaling/{room}", d["access_token"])
    ) as ws2:
        ws1.send_json({"type": "offer", "sdp": "offer-sdp"})
        assert ws2.receive_json()["type"] == "offer"
        ws2.send_json({"type": "answer", "sdp": "answer-sdp"})
        assert ws1.receive_json()["type"] == "answer"
        ws1.send_json({"type": "ice", "candidate": "ice-cand"})
        assert ws2.receive_json()["type"] == "ice"


def test_video_signaling_token_validation_enforced(client):
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect("/ws/signaling/room-without-token"):
            pass
    assert exc.value.code == 1008
