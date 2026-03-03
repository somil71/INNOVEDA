import asyncio
import json
import logging
from collections import defaultdict
from contextlib import suppress

import redis.asyncio as redis
from fastapi import WebSocket

from core.config import settings

logger = logging.getLogger(__name__)


from prometheus_client import Gauge

ws_connections = Gauge("inoveda_ws_active_connections", "Current active websocket connections", ["type"])


class WSConnectionManager:
    def __init__(self):
        # We still need to track local connections to actually send the bytes
        self.user_connections: dict[int, list[WebSocket]] = defaultdict(list)
        self.signal_rooms: dict[str, list[WebSocket]] = defaultdict(list)
        self.redis = redis.from_url(settings.redis_url)
        self.pubsub_task = None

    async def _listen_to_redis(self):
        pubsub = self.redis.pubsub()
        await pubsub.subscribe("ws:user_messages", "ws:signal_messages")
        try:
            async for message in pubsub.listen():
                if message["type"] != "message":
                    continue
                data = json.loads(message["data"])
                channel = message["channel"].decode("utf-8")
                
                if channel == "ws:user_messages":
                    user_id = data.get("user_id")
                    payload = data.get("payload")
                    if user_id in self.user_connections:
                        await self._local_send_to_user(user_id, payload)
                
                elif channel == "ws:signal_messages":
                    room_id = data.get("room_id")
                    payload = data.get("payload")
                    sender_id = data.get("sender_id") # Note: we use user_id to avoid echoing
                    if room_id in self.signal_rooms:
                        await self._local_broadcast_signal(room_id, payload, sender_id)
        except Exception:
            logger.exception("redis_pubsub_listener_failed")

    async def start(self):
        if self.pubsub_task is None:
            self.pubsub_task = asyncio.create_task(self._listen_to_redis())

    async def connect_user(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.user_connections[user_id].append(websocket)
        ws_connections.labels(type="user").inc()
        await self.start()

    def disconnect_user(self, user_id: int, websocket: WebSocket):
        if websocket in self.user_connections[user_id]:
            self.user_connections[user_id].remove(websocket)
            ws_connections.labels(type="user").dec()
        if not self.user_connections[user_id]:
            self.user_connections.pop(user_id, None)

    async def send_to_user(self, user_id: int, payload: dict):
        # Scale: Publish to Redis so all instances can see it
        msg = json.dumps({"user_id": user_id, "payload": payload})
        await self.redis.publish("ws:user_messages", msg)

    async def _local_send_to_user(self, user_id: int, payload: dict):
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
        ws_connections.labels(type="signal").inc()
        await self.start()

    def disconnect_signal(self, room_id: str, websocket: WebSocket):
        if websocket in self.signal_rooms[room_id]:
            self.signal_rooms[room_id].remove(websocket)
            ws_connections.labels(type="signal").dec()
        if not self.signal_rooms[room_id]:
            self.signal_rooms.pop(room_id, None)

    async def broadcast_signal(self, room_id: str, payload: dict, sender_id: int):
        msg = json.dumps({"room_id": room_id, "payload": payload, "sender_id": sender_id})
        await self.redis.publish("ws:signal_messages", msg)

    async def _local_broadcast_signal(self, room_id: str, payload: dict, sender_id: int):
        dead = []
        for conn in self.signal_rooms.get(room_id, []):
            # We check the state user_id we attached in ws_routes.py
            if getattr(conn.state, "user_id", None) != sender_id:
                with suppress(Exception):
                    await conn.send_json(payload)
                    continue
                dead.append(conn)
        for conn in dead:
            self.disconnect_signal(room_id, conn)


manager = WSConnectionManager()
