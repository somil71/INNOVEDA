# INOVEDA — Codebase Recovery Notes

## Recovery Audit Date
2026-05-28

---

## Bugs Fixed

### Critical (Would Crash at Runtime)

**1. `auth.py` — Undefined `pwd_context` + Dead Code**
- **Problem**: `hash_password()` and `verify_password()` referenced `pwd_context` which was never imported in that file. Additionally, `from fastapi import Depends, HTTPException, status` was imported twice. `create_access_token()` had dangling imports for `datetime`, `jwt`, `settings` not present in the file.
- **Root Cause**: These functions were duplicates of methods already on `AuthService` and were never cleaned up.
- **Fix**: Removed all dead code from `auth.py`. Kept only `get_current_user()` and `require_role()` which are the functions actually imported by route modules.

**2. `patient_service.py` — Missing `manager` Import**
- **Problem**: `trigger_emergency()`, `dosage_complete()`, and `send_message()` all called `manager.send_to_user()` but `manager` was never imported.
- **Root Cause**: Import was forgotten when the WebSocket notification system was added.
- **Fix**: Added `from services.notifications import manager`.

**3. `patient_service.py` — `asyncio.create_task()` in Sync Context**
- **Problem**: `trigger_mock_schedule()` is a synchronous method that called `asyncio.create_task()`. Sync FastAPI route handlers run in a thread pool executor with no running event loop — this would crash with `RuntimeError: no running event loop`.
- **Root Cause**: Async/sync boundary confusion.
- **Fix**: Changed to `threading.Thread(target=lambda: asyncio.run(...), daemon=True).start()`.

**4. `patient_service.py` — Missing `schedule_dosage_notification` Import**
- **Problem**: `trigger_mock_schedule()` called `schedule_dosage_notification()` without importing it.
- **Fix**: Added `from services.mock_scheduler import schedule_dosage_notification`.

**5. AI Chat Flow — Completely Broken**
- **Problem**: The `/patient/ai-chat` endpoint was returning `{"task_id": ..., "status": "processing"}` via Celery async task. However, the frontend (`PatientDashboard.jsx`, `AIChatbox.jsx`) expected the full triage result `{severity, ai_response, confidence, ...}` directly from the response.
- **Root Cause**: Architecture mismatch. The Celery async approach requires WebSocket notification delivery (backend has it, frontend doesn't), so the UI received an empty response.
- **Fix**: Changed the endpoint to run `run_triage_pipeline()` inline (synchronous await), save the result to the database, and return the full result directly. The Celery task infrastructure remains but is no longer used for the primary AI chat path.

**6. `core/middleware.py` — Synchronous Redis Blocking Async Event Loop**
- **Problem**: `RedisRateLimitMiddleware` used `redis.pipeline()` (synchronous blocking call) inside an `async def dispatch()`. This blocked the ASGI event loop on every single request.
- **Root Cause**: Wrong Redis client type used (sync `redis` instead of async `redis.asyncio`).
- **Fix**: Replaced with `redis.asyncio`, added graceful fallback when Redis is unavailable (rate limiting is skipped rather than crashing).

**7. `core/config.py` — `fetch_aws_secrets` TypeError at Startup**
- **Problem**: `settings_customise_sources` passed `cls.fetch_aws_secrets` (a staticmethod) as a source to pydantic-settings. Pydantic-settings v2 calls each source as a zero-argument callable returning `dict`, but the method signature was `fetch_aws_secrets(settings_cls)`, causing `TypeError: missing 1 required positional argument`.
- **Root Cause**: pydantic-settings v2 requires sources to be `PydanticBaseSettingsSource` instances, not plain callables.
- **Fix**: Converted to a proper `AWSSecretsManagerSource(PydanticBaseSettingsSource)` class.

---

### High (Feature Broken)

**8. `PatientDashboard.jsx` — Doctor Suggestions Field Mismatch**
- **Problem**: Doctor suggestion cards accessed `doc.id` and `doc.name`, but the AI triage API returns `doctor_id` and no `name` field (only `specialization`, `consultation_fee`, `rating`).
- **Fix**: Updated to use `doc.doctor_id` as the key and display `Dr. #ID` + specialization + fee + rating.

**9. `AdminDashboard.jsx` — Disease Trends Chart Always Empty**
- **Problem**: Recharts `Area` component used `dataKey="count"`, but the disease trends data from backend is shaped as `[{date: "...", fever: 3, cough: 2}, ...]` with no `count` field.
- **Fix**: Changed to dynamically extract disease-type keys from the data and render one `<Area>` per disease type with distinct colors.

**10. `AdminDashboard.jsx` — Sync Events Metric Always Zero**
- **Problem**: `data.disease_trends.reduce((a, b) => a + b.count, 0)` — `b.count` is always `undefined`.
- **Fix**: Changed to sum all non-`date` values across all trend rows.

**11. `alembic/versions/4e9968c07830_initial_migration.py` — Empty Migration**
- **Problem**: `upgrade()` body was just `pass`. Running `alembic upgrade head` on a fresh database would not create any tables.
- **Fix**: Added complete `CREATE TABLE` statements for all 14 models.

---

### Medium (Breaks in Production)

**12. `api.js` / `Records.jsx` / `PatientDetail.jsx` — Hardcoded `localhost:8000`**
- **Problem**: API base URL was hardcoded to `http://localhost:8000` in three places, breaking any deployment where the backend is on a different host.
- **Fix**: Changed to `import.meta.env.VITE_API_URL || "http://localhost:8000"`. Added `frontend/.env` and `frontend/.env.example` with `VITE_API_URL`.

**13. `backend/.env` — Missing `REDIS_URL`**
- **Fix**: Added explicit `REDIS_URL=redis://localhost:6379/0`.

---

### Minor

**14. `EmergencyPanel.jsx` — Typo "Broadcasitng"**
- **Fix**: Corrected to "Broadcasting".

**15. `backend/Dockerfile` — Wrong Python Version + No Migration Step**
- **Fix**: Updated to `python:3.11-slim`. Added `alembic upgrade head` to CMD.

---

## Architecture Decisions Made During Recovery

### AI Chat: Sync vs Async Celery
The original intent was to process AI triage via Celery workers and push the result back via WebSocket pub/sub. This is a valid production architecture, but it requires:
1. Frontend WebSocket client code (missing)
2. Celery workers running alongside the API

Since neither condition was met (no frontend WS integration, Vercel is serverless), the AI chat was changed to run inline and return the result synchronously. The Celery infrastructure (`celery_app.py`, `tasks.py`) is preserved for future use in non-serverless deployments.

### Rate Limiting: Graceful Redis Degradation
Redis rate limiting is now optional — if Redis is unavailable (local dev without Redis, serverless), rate limiting is silently skipped. This prevents startup crashes in minimal deployments.

### `Base.metadata.create_all`
Re-enabled in `main.py` as a safety net. Alembic is the canonical migration tool (and now has real migrations), but `create_all` ensures tables exist on startup even if migrations haven't been run. This is idempotent and harmless.
