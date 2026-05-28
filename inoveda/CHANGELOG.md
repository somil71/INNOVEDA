# Changelog

All notable changes to INOVEDA are documented here.

Format: [Semantic Versioning](https://semver.org). Each entry lists what changed and why.

---

## [0.2.0] — 2026-05-28 — Recovery & Production Hardening

### Breaking Changes

- **AI chat endpoint no longer returns a task ID.** `POST /patient/ai-chat` now returns the full triage result synchronously (`{severity, ai_response, confidence, doctor_suggestions, ...}`). Clients that polled a separate task-status endpoint must update to consume the response directly.
- **`VITE_API_URL` env var required for non-localhost deployments.** The frontend API base URL is no longer hardcoded; set `VITE_API_URL` in `frontend/.env` for any environment other than localhost.

### Fixed — Critical (would crash at runtime)

- **`auth.py` dead code removed.** `hash_password()`, `verify_password()`, and `create_access_token()` all referenced `pwd_context`, `datetime`, `jwt`, and `settings` that were never imported in that file. These were unreachable duplicates of methods on `AuthService`. Removed entirely; only `get_current_user()` and `require_role()` remain.
- **`patient_service.py` missing `manager` import.** `trigger_emergency()`, `dosage_complete()`, and `send_message()` called `manager.send_to_user()` without importing `manager`. Added `from services.notifications import manager`.
- **`patient_service.py` `asyncio.create_task()` in sync context.** `trigger_mock_schedule()` is a synchronous method; calling `asyncio.create_task()` from it crashes with `RuntimeError: no running event loop` in FastAPI's thread pool executor. Changed to `threading.Thread(target=lambda: asyncio.run(...), daemon=True).start()`.
- **`patient_service.py` missing `schedule_dosage_notification` import.** `trigger_mock_schedule()` called the function without importing it. Added `from services.mock_scheduler import schedule_dosage_notification`.
- **AI chat flow completely broken.** The `/patient/ai-chat` endpoint returned a Celery task ID (`{task_id, status: "processing"}`), but the frontend expected the full triage result inline. Changed the endpoint to run `run_triage_pipeline()` inline and return the full result directly. Celery infrastructure preserved for future use.
- **`core/middleware.py` synchronous Redis blocking async event loop.** `RedisRateLimitMiddleware.dispatch()` was `async def` but used `redis.pipeline()` (synchronous blocking call), stalling the ASGI event loop on every request. Replaced with `redis.asyncio` (`aioredis`).
- **`core/config.py` `fetch_aws_secrets` TypeError at startup.** `settings_customise_sources` passed a plain callable to pydantic-settings v2, which requires `PydanticBaseSettingsSource` instances. Converted to a proper `AWSSecretsManagerSource(PydanticBaseSettingsSource)` class with `__call__`, `get_field_value`, and `field_is_complex`.

### Fixed — High (feature broken)

- **`PatientDashboard.jsx` doctor suggestions field mismatch.** Cards accessed `doc.id` and `doc.name`, but the API returns `doctor_id` with no `name` field. Updated to use `doc.doctor_id` as key and display specialization, fee, and rating.
- **`AdminDashboard.jsx` disease trends chart always empty.** `<Area dataKey="count">` referenced a field that doesn't exist; the backend returns `[{date, fever, cough, ...}]`. Chart now dynamically extracts disease keys per row and renders one `<Area>` per disease with distinct colors.
- **`AdminDashboard.jsx` sync events metric always zero.** `reduce((a,b) => a + b.count, 0)` — `b.count` is always `undefined`. Changed to sum all non-`date` values across all trend rows.
- **`alembic/versions/4e9968c07830_initial_migration.py` empty migration.** `upgrade()` body was `pass`, so `alembic upgrade head` on a fresh database created no tables. Added complete `CREATE TABLE` statements for all 14 models.

### Fixed — Medium (breaks in production)

- **Hardcoded `localhost:8000` in frontend.** `api.js`, `Records.jsx`, and `PatientDetail.jsx` all had `http://localhost:8000` hardcoded. Changed to `import.meta.env.VITE_API_URL || "http://localhost:8000"`.
- **`backend/.env` missing `REDIS_URL`.** Added `REDIS_URL=redis://localhost:6379/0` to default env file.

### Fixed — Minor

- **`EmergencyPanel.jsx` typo** "Broadcasitng" → "Broadcasting".
- **`backend/Dockerfile` wrong Python version.** Was `python:3.10-slim`; updated to `python:3.11-slim` to match the `|` union type syntax used throughout the codebase. Added `alembic upgrade head` to CMD.

### Added

- **`core/middleware.py` graceful Redis degradation.** Rate limiting now silently skips rather than crashing when Redis is unavailable (local dev, serverless). Eliminates startup failures on minimal deployments.
- **`main.py` `Base.metadata.create_all` re-enabled.** Acts as a safety net alongside Alembic; idempotent on existing databases.
- **`vercel.json`** — SPA rewrite rules, asset cache headers, and correct build/output configuration for Vercel static deployment.
- **`frontend/.env` / `frontend/.env.example`** — `VITE_API_URL` documented.
- **`backend/.env.example`** — comprehensive production template covering all settings (CORS, Redis, AWS S3, AWS Secrets Manager, rate limiting, outbreak detection).
- **`vite.config.js` code splitting.** `manualChunks` splits vendor bundles into `vendor-react`, `vendor-ui`, `vendor-charts`, `vendor-motion`, `vendor-utils`. Main bundle reduced from ~861 KB to ~283 KB.
- **`RECOVERY_NOTES.md`** — detailed root cause analysis for all 15 bugs found during the audit.
- **`DEPLOYMENT_GUIDE.md`** — step-by-step local dev, Docker Compose, and cloud deployment instructions.

### Architecture Decisions

- **AI chat: sync instead of Celery.** The Celery worker approach is valid for production scaling but required frontend WebSocket integration that wasn't present. Running the pipeline synchronously is the correct default for serverless and single-server deployments. Celery infrastructure kept for future horizontal scaling.
- **Redis optional everywhere.** Both rate limiting (middleware) and WebSocket pub/sub (notifications) now treat Redis as optional. Systems degrade gracefully rather than refusing to start.
- **Vercel = frontend only.** FastAPI with Celery workers cannot run on Vercel's serverless runtime. The frontend deploys to Vercel as a static SPA; the backend requires a container-capable host (Railway, Render, Fly.io, or VPS).

---

## [0.1.0] — 2026-05-27 — UI/UX Overhaul

### Added

- Minimalist SaaS aesthetic with consistent design language across all dashboards.
- PostCSS v4 configuration fixed for Tailwind CSS v4 compatibility.
- Framer Motion v12 animations on page transitions and card interactions.
- notistack snackbar integration for user-facing feedback.

---

## [0.0.1] — Initial Prototype

### Added

- Role-based auth: patient, doctor, admin (JWT + bcrypt).
- Patient dashboard: AI symptom triage, voice input, document upload, appointments, prescriptions, cart, emergency panel.
- Doctor dashboard: patient list, appointment management, prescription upload, real-time chat.
- Admin dashboard: disease trends chart, outbreak alerts (z-score / Poisson), user management.
- AI triage pipeline: scikit-learn classifier, optional OpenAI integration, deterministic emergency override.
- WebSocket real-time chat and WebRTC signaling.
- Celery task queue with Redis broker.
- Docker Compose stack: PostgreSQL, Redis, API, worker, Nginx, Certbot.
- Kubernetes manifests for production cluster deployment.
- Prometheus metrics via `prometheus-fastapi-instrumentator`.
- Structured JSON request logging with request-ID tracing.
- English / Hindi i18n via `i18next`.
- PWA offline support via `vite-plugin-pwa`.
