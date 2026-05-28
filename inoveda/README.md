# INOVEDA

AI-powered healthcare bridge system for rural India — connecting patients with doctors through intelligent triage, real-time chat, and outbreak monitoring.

**Status:** Production-ready (v0.2.0 — fully audited and hardened)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI 0.111, SQLAlchemy 2, Alembic, Uvicorn |
| Frontend | React 19, Vite 7, Tailwind CSS v4, Material UI v7 |
| Database | PostgreSQL 15 (SQLite supported for local dev) |
| Auth | JWT (python-jose) + bcrypt (passlib), HttpOnly cookies |
| AI/ML | scikit-learn triage classifier, optional OpenAI (GPT-4o-mini) |
| Real-time | WebSocket chat + WebRTC signaling |
| Queue | Celery + Redis (optional) |
| i18n | i18next — English + Hindi |
| PWA | `vite-plugin-pwa` — offline caching |
| Observability | Prometheus metrics, structured JSON request logging |

---

## Quick Start

### Backend

```bash
cd inoveda/backend
python -m venv venv && .\venv\Scripts\Activate.ps1   # Windows
# source venv/bin/activate                            # macOS/Linux
pip install -r requirements.txt
cp .env.example .env          # edit DATABASE_URL and JWT_SECRET
alembic upgrade head
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd inoveda/frontend
npm install
cp .env.example .env          # set VITE_API_URL=http://localhost:8000
npm run dev
```

Frontend: http://localhost:5173

### Full stack (Docker Compose)

```bash
cp backend/.env.example backend/.env   # edit JWT_SECRET and CORS_ORIGINS
docker compose up --build
```

---

## Documentation

| Document | Contents |
|----------|---------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Local dev, Docker Compose, Vercel + Railway/Render/Fly.io, Kubernetes |
| [RECOVERY_NOTES.md](RECOVERY_NOTES.md) | All 15 bugs found and fixed in the v0.2.0 audit (root causes + fixes) |
| [CHANGELOG.md](CHANGELOG.md) | Version history and breaking changes |

---

## Project Structure

```
inoveda/
├── backend/
│   ├── main.py                # FastAPI app, middleware, startup
│   ├── core/
│   │   ├── config.py          # pydantic-settings, optional AWS Secrets
│   │   ├── middleware.py      # async Redis rate limiting, request tracing
│   │   ├── logging_config.py  # structured JSON logging
│   │   └── exceptions.py      # centralized error handlers
│   ├── routes/                # thin HTTP handlers (auth, patient, doctor, admin, ws)
│   ├── services/              # business logic (auth, patient, triage, notifications…)
│   ├── repositories/          # SQLAlchemy data access layer
│   ├── models.py              # 14 SQLAlchemy models
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── auth.py                # get_current_user, require_role dependencies
│   ├── database.py            # engine, session, get_db
│   ├── ml/                    # scikit-learn triage model + training script
│   ├── alembic/               # database migrations
│   ├── tests/                 # pytest test suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/             # PatientDashboard, DoctorDashboard, AdminDashboard…
│   │   ├── components/        # AIChatbox, EmergencyPanel, shared UI
│   │   ├── api.js             # axios instance (VITE_API_URL)
│   │   └── main.jsx
│   ├── vite.config.js         # code splitting, chunk size tuning
│   ├── package.json
│   └── .env.example
├── docker-compose.yml         # full stack: postgres, redis, api, worker, nginx, certbot
├── nginx/nginx.conf           # reverse proxy + SSL termination
├── k8s/                       # Kubernetes manifests
├── vercel.json                # Vercel SPA deployment config
├── DEPLOYMENT_GUIDE.md
├── RECOVERY_NOTES.md
└── CHANGELOG.md
```

---

## Features

- **Role-based auth** — patient / doctor / admin with JWT + HttpOnly cookies
- **AI symptom triage** — hybrid pipeline: LLM extraction (optional) → local ML classifier → deterministic emergency override; returns severity, confidence, doctor suggestions, and prescription advice
- **Voice input** — browser Web Speech API for symptom input
- **Appointments** — patient books, doctor manages
- **Prescriptions** — doctor uploads PDF; medicines auto-added to patient cart
- **Dosage reminders** — mock scheduler with WebSocket push notifications
- **Real-time chat** — WebSocket with Redis pub/sub (Redis optional)
- **Video consultation** — WebRTC signaling via WebSocket
- **Document upload** — patient health records (PDF, images); stored locally or S3
- **Disease trends** — area chart with per-disease breakdown
- **Outbreak detection** — z-score and Poisson statistical alerts
- **Emergency dispatch** — patient SOS → broadcast to nearby doctors
- **Admin dashboard** — user management, disease trends, outbreak events
- **English / Hindi** — runtime language toggle
- **PWA** — installable, offline-capable with API response caching
- **Prometheus metrics** — `/metrics` endpoint for scraping
- **Structured logging** — JSON logs with request-ID tracing

---

## Environment Variables

See [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) for the full annotated lists.

Minimum required for production:

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | backend | PostgreSQL connection string |
| `JWT_SECRET` | backend | 32+ char random secret |
| `CORS_ORIGINS` | backend | `["https://your-app.vercel.app"]` |
| `VITE_API_URL` | frontend | `https://your-backend.railway.app` |
