# INOVEDA

AI-based healthcare bridge system prototype for rural India.

- Production Ready: Yes (Hardened DB, Scalable WS, Async AI)
- Docker: Supported

## Stack

- Backend: FastAPI + SQLAlchemy + PostgreSQL
- Frontend: React (Vite)
- Auth: JWT + bcrypt
- Realtime: WebSocket chat + WebRTC signaling
- AI: Mock triage by default, optional OpenAI integration
- i18n: English + Hindi (i18next)
- PWA: Offline caching enabled via `vite-plugin-pwa`

## Project Structure

```text
inoveda/
├── backend/
│   ├── main.py
│   ├── core/
│   ├── repositories/
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── ml/
│   ├── uploads/
│   └── database.py
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Backend Installation

1. Go to backend folder:
```bash
cd inoveda/backend
```
2. Create virtual environment:
```bash
python -m venv venv
```
3. Activate environment:
```bash
# Windows PowerShell
.\venv\Scripts\Activate.ps1
```
4. Install packages:
```bash
pip install -r requirements.txt
```

### Required pip packages

- `fastapi`
- `uvicorn`
- `sqlalchemy`
- `python-jose`
- `passlib[bcrypt]`
- `email-validator`
- `python-multipart`
- `pydantic`
- `openai`
- `pydantic-settings`
- `python-dotenv`
- `joblib`
- `numpy<2`
- `scikit-learn`
- `pytest`
- `pytest-asyncio`
- `httpx`

### Run backend

```bash
# Run API
uvicorn main:app --reload --port 8000

# Run Celery Worker (in a separate terminal)
celery -A celery_app worker --loglevel=info
```

### Docker Compose (Recommended for Production Setup)

To run the entire stack (PostgreSQL, Redis, API, Worker) with one command:

```bash
docker-compose up --build
```

API docs: `http://localhost:8000/docs`

### Retrain severity model

```bash
cd inoveda/backend
python ml/train_model.py
```

This generates: `backend/ml/triage_model.joblib`

### Database Migrations

```bash
cd inoveda/backend
# Generate migration (after model changes)
alembic revision --autogenerate -m "description"
# Apply migrations
alembic upgrade head
```

### Run tests

## Frontend Installation

1. Go to frontend folder:
```bash
cd inoveda/frontend
```
2. Install packages:
```bash
npm install
```

### Required npm packages

- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`
- `axios`
- `react-router-dom`
- `i18next`
- `react-i18next`
- `recharts`
- `vite-plugin-pwa`

### Run frontend

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Environment Variables (Optional)

Backend:

- `DATABASE_URL` (default: `postgresql://postgres:postgres@localhost:5432/inoveda`)
- `JWT_SECRET` (default: `inoveda-dev-secret`)
- `JWT_EXPIRE_MINUTES` (default: `1440`)
- `USE_OPENAI=true` to enable OpenAI triage
- `OPENAI_API_KEY=...`
- `OPENAI_MODEL=gpt-4o-mini` (optional)
- `OUTBREAK_METHOD=zscore` or `poisson`
- `MODEL_PATH=ml/triage_model.joblib`

Copy `backend/.env.example` to `backend/.env` and edit as needed.

## Implemented Features

- Role-based auth (`patient`, `doctor`, `admin`)
- JWT login/register routes (`/auth/login`, `/auth/register`)
- Separate dashboards:
  - `/patient-dashboard`
  - `/doctor-dashboard`
  - `/admin-dashboard`
- AI symptom triage with severity classification
- AI chat history stored in DB
- Voice symptom input (browser speech recognition)
- Patient document upload and viewing
- Appointments booking
- Doctor prescription upload + medicines auto-added to patient cart
- Mock dosage reminder scheduler + notifications
- Realtime user chat (WebSocket)
- Video consultation signaling (WebRTC + WebSocket)
- AreaNet disease trends + statistical outbreak alerts (z-score / Poisson)
- Emergency requests + mock ambulance dispatch
- English/Hindi toggle
- PWA offline support and API caching fallback

## Refactor Notes

- Added layered architecture:
  - `routes/` thin HTTP handlers
  - `services/` business logic
  - `repositories/` DB access
  - `core/` config, middleware, logging, exceptions
- Added structured JSON logging + request ID tracing.
- Added in-memory rate limiting middleware.
- Added safer upload validation (extension + max size checks).
- Added centralized exception handlers.
- AI triage upgraded to hybrid pipeline:
  - LLM extraction (optional) -> deterministic fallback
  - local sklearn classifier (if model available)
  - deterministic emergency override rules
- Added full pytest suite for auth, patient, doctor, AI, outbreak, emergency, and websocket flows.

## Important Notes

- This is a prototype and not suitable for production use.
- WebRTC signaling is localhost-only and minimal.
- File uploads are stored locally in `backend/uploads/`.
