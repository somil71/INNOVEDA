from dataclasses import dataclass

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, ValidationError

from services.auth_service import AuthService
from services.notifications import manager

router = APIRouter(tags=["ws"])


class ChatMessageWS(BaseModel):
    receiver_id: int
    sender_id: int
    content: str


@dataclass
class WSPrincipal:
    user_id: int
    role: str


def _extract_bearer_token(websocket: WebSocket) -> str | None:
    qtoken = websocket.query_params.get("token")
    if qtoken:
        return qtoken
    auth_header = websocket.headers.get("authorization")
    if not auth_header:
        return None
    parts = auth_header.split(" ", 1)
    if len(parts) == 2 and parts[0].lower() == "bearer" and parts[1].strip():
        return parts[1].strip()
    return None


async def _authenticate_ws(websocket: WebSocket, *, allowed_roles: set[str]) -> WSPrincipal | None:
    token = _extract_bearer_token(websocket)
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None

    try:
        payload = AuthService(None).decode_token(token)
        sub = payload.get("sub")
        role = payload.get("role")
        if sub is None or role not in allowed_roles:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return None
        return WSPrincipal(user_id=int(sub), role=str(role))
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None


@router.websocket("/ws/chat/{user_id}")
async def user_ws(websocket: WebSocket, user_id: int):
    principal = await _authenticate_ws(websocket, allowed_roles={"patient", "doctor"})
    if principal is None:
        return
    if principal.user_id != user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    websocket.state.user_id = principal.user_id
    websocket.state.role = principal.role
    await manager.connect_user(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            try:
                payload = ChatMessageWS(**data)
            except ValidationError:
                await websocket.send_json({"type": "error", "message": "Invalid chat payload"})
                continue
            # Prevent identity spoofing inside websocket payload.
            if payload.sender_id != principal.user_id:
                await websocket.send_json({"type": "error", "message": "sender_id mismatch"})
                continue
            await manager.send_to_user(payload.receiver_id, payload.model_dump())
    except WebSocketDisconnect:
        manager.disconnect_user(user_id, websocket)
    except Exception:
        manager.disconnect_user(user_id, websocket)
        await websocket.close(code=1011)


@router.websocket("/ws/signaling/{room_id}")
async def signaling_ws(websocket: WebSocket, room_id: str):
    principal = await _authenticate_ws(websocket, allowed_roles={"patient", "doctor"})
    if principal is None:
        return
    websocket.state.user_id = principal.user_id
    websocket.state.role = principal.role
    await manager.connect_signal(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast_signal(room_id, data, websocket)
    except WebSocketDisconnect:
        manager.disconnect_signal(room_id, websocket)
    except Exception:
        manager.disconnect_signal(room_id, websocket)
        await websocket.close(code=1011)
