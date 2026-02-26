import asyncio
import time

import pytest
from httpx import ASGITransport, AsyncClient

from main import app
from services.outbreak_service import detect_outbreak
from tests.conftest import register_and_login


@pytest.mark.asyncio
async def test_ai_response_time_under_threshold(client):
    headers, _ = register_and_login(client, role="patient", email="perf-ai@example.com")
    transport = ASGITransport(app=app)
    start = time.perf_counter()
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        res = await ac.post(
            "/patient/ai-chat",
            json={"symptom_input": "fever and cough", "language": "en"},
            headers=headers,
        )
    elapsed = time.perf_counter() - start
    assert res.status_code == 200
    assert elapsed < 5.0


def test_outbreak_computation_time():
    start = time.perf_counter()
    _ = detect_outbreak(current_count=20, historical_counts=[2, 3, 4, 3], method="zscore")
    elapsed = time.perf_counter() - start
    assert elapsed < 1.0


def test_db_write_time_under_threshold(client):
    headers, doctor = register_and_login(client, role="doctor", email="perf-db-d@example.com", extra={"consultation_fee": 150})
    patient_headers, _ = register_and_login(client, role="patient", email="perf-db-p@example.com")
    start = time.perf_counter()
    r = client.post(
        "/patient/appointments",
        json={"doctor_id": doctor["user_id"], "date": "2026-02-25 18:00"},
        headers=patient_headers,
    )
    elapsed = time.perf_counter() - start
    assert r.status_code == 200
    assert elapsed < 1.0


@pytest.mark.asyncio
async def test_no_significant_event_loop_blocking(client):
    headers, _ = register_and_login(client, role="patient", email="perf-loop@example.com")
    transport = ASGITransport(app=app)
    loop_gaps = []
    running = True

    async def ticker():
        last = time.perf_counter()
        while running:
            await asyncio.sleep(0.01)
            now = time.perf_counter()
            loop_gaps.append(now - last)
            last = now

    task = asyncio.create_task(ticker())
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        await ac.post("/patient/ai-chat", json={"symptom_input": "fever and pain", "language": "en"}, headers=headers)
    running = False
    await task
    worst_gap = max(loop_gaps) if loop_gaps else 0
    assert worst_gap < 0.5


def test_websocket_handshake_time_under_one_second(client):
    _, user = register_and_login(client, role="patient", email="perf-ws@example.com")
    start = time.perf_counter()
    with client.websocket_connect(f"/ws/chat/{user['user_id']}?token={user['access_token']}") as ws:
        ws.send_json({"sender_id": user["user_id"], "receiver_id": user["user_id"], "content": "ping"})
        _ = ws.receive_json()
    elapsed = time.perf_counter() - start
    assert elapsed < 1.0
