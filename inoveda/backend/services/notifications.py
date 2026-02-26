from collections import defaultdict
from contextlib import suppress

from fastapi import WebSocket


class WSConnectionManager:
    def __init__(self):
        self.user_connections: dict[int, list[WebSocket]] = defaultdict(list)
        self.signal_rooms: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect_user(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.user_connections[user_id].append(websocket)

    def disconnect_user(self, user_id: int, websocket: WebSocket):
        if websocket in self.user_connections[user_id]:
            self.user_connections[user_id].remove(websocket)
        if not self.user_connections[user_id]:
            self.user_connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, payload: dict):
        dead = []
        for conn in self.user_connections.get(user_id, []):
            with suppress(Exception):
                await conn.send_json(payload)
                continue
            dead.append(conn)
        for conn in dead:
            self.disconnect_user(user_id, conn)

    async def connect_signal(self, room_id: str, websocket: WebSocket):
        await websocket.accept()
        self.signal_rooms[room_id].append(websocket)

    def disconnect_signal(self, room_id: str, websocket: WebSocket):
        if websocket in self.signal_rooms[room_id]:
            self.signal_rooms[room_id].remove(websocket)
        if not self.signal_rooms[room_id]:
            self.signal_rooms.pop(room_id, None)

    async def broadcast_signal(self, room_id: str, payload: dict, sender: WebSocket):
        dead = []
        for conn in self.signal_rooms.get(room_id, []):
            if conn != sender:
                with suppress(Exception):
                    await conn.send_json(payload)
                    continue
                dead.append(conn)
        for conn in dead:
            self.disconnect_signal(room_id, conn)


manager = WSConnectionManager()
