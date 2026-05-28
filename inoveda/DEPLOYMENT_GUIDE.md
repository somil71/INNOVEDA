# INOVEDA Deployment Guide

This guide covers three deployment targets:

1. [Local development](#1-local-development)
2. [Docker Compose (self-hosted / VPS)](#2-docker-compose-self-hosted--vps)
3. [Cloud: Vercel (frontend) + Railway/Render/Fly.io (backend)](#3-cloud-vercel--railwayrenderflyo)

> **Architecture note:** FastAPI with Celery workers cannot run on Vercel's serverless runtime. The frontend is always a static SPA deployed to Vercel (or any CDN). The backend must run on a container-capable host.

---

## Prerequisites

| Tool | Minimum version | Notes |
|------|----------------|-------|
| Python | 3.11 | 3.10 will not parse `X \| Y` union types |
| Node.js | 18 | Vite 7 requires ≥ 18 |
| PostgreSQL | 14 | 15 used in Docker images |
| Redis | 6 | Optional — rate limiting degrades gracefully without it |
| Docker + Compose | v2 | `docker compose` (plugin syntax) |

---

## 1. Local Development

### 1.1 Backend

```bash
cd inoveda/backend

# Create and activate virtualenv
python -m venv venv
# Windows PowerShell
.\venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — minimum required changes:
#   DATABASE_URL — point to your local Postgres or use SQLite (see note)
#   JWT_SECRET   — any 32+ char random string

# Apply database migrations
alembic upgrade head

# Start the API
uvicorn main:app --reload --port 8000
```

> **SQLite for local dev (no Postgres required):**
> Set `DATABASE_URL=sqlite:///./inoveda.db` in `backend/.env`.
> SQLite is supported by SQLAlchemy; `Base.metadata.create_all` runs at startup.
> Alembic migrations also work with SQLite.

> **Redis not required locally:**
> If Redis is not running, rate limiting is automatically disabled. The API still starts and works normally.

API docs: http://localhost:8000/docs

Optional: Celery worker (only needed if background tasks are re-enabled):
```bash
celery -A celery_app worker --loglevel=info
```

### 1.2 Frontend

```bash
cd inoveda/frontend

npm install

# Configure environment
cp .env.example .env
# Edit .env — only one variable needed:
#   VITE_API_URL=http://localhost:8000

npm run dev
```

Frontend: http://localhost:5173

### 1.3 Retrain the triage model (optional)

The pre-trained model (`ml/triage_model.joblib`) ships with the repo. If you modify the training data:

```bash
cd inoveda/backend
python ml/train_model.py
# Outputs: backend/ml/triage_model.joblib
```

---

## 2. Docker Compose (Self-hosted / VPS)

The Compose stack runs PostgreSQL, Redis, the FastAPI API, a Celery worker, Nginx, and optional Certbot for TLS — everything in one command.

### 2.1 Prepare the environment file

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with production values:

```dotenv
# A real PostgreSQL URL is injected by Compose (see docker-compose.yml)
# Leave DATABASE_URL here as a fallback only — Compose env_file + environment merge
DATABASE_URL=postgresql://postgres:postgres@db:5432/inoveda

REDIS_URL=redis://redis:6379/0

# REQUIRED: change this
JWT_SECRET=change_me_to_a_real_32char_secret

ENVIRONMENT=production

# Your deployed frontend origin (no trailing slash)
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

> **Security:** `main.py` raises `RuntimeError` at startup if `ENVIRONMENT=production` and `JWT_SECRET` is still the default value. This is intentional.

### 2.2 Start the stack

```bash
docker compose up --build -d
```

Services started:
- `db` — PostgreSQL 15 (port not exposed to host)
- `redis` — Redis 7 (port not exposed to host)
- `api` — FastAPI on port 8000, runs `alembic upgrade head` before starting
- `worker` — Celery worker (same image as `api`)
- `nginx` — reverse proxy on ports 80 and 443
- `certbot` — auto-renewal daemon

### 2.3 TLS / HTTPS with Certbot (Let's Encrypt)

1. Point your domain's A record to your server IP.
2. Edit `nginx/nginx.conf` — replace `your-domain.com` with your actual domain.
3. Issue the initial certificate:
   ```bash
   docker compose run --rm certbot certonly \
     --webroot -w /var/www/certbot \
     -d your-domain.com \
     --email admin@your-domain.com \
     --agree-tos --no-eff-email
   ```
4. Restart Nginx: `docker compose restart nginx`

Certbot auto-renews every 12 hours via the `certbot` service.

### 2.4 Database migrations

Migrations run automatically when the `api` container starts (`alembic upgrade head` is the first CMD step). For manual control:

```bash
# Apply pending migrations
docker compose exec api alembic upgrade head

# Rollback one migration
docker compose exec api alembic downgrade -1

# Generate a new migration after model changes
docker compose exec api alembic revision --autogenerate -m "describe_change"
```

### 2.5 File uploads

Uploads are stored in `backend/uploads/`, which is bind-mounted to `./backend/uploads` on the host. Existing uploads survive container restarts. For production, consider switching to S3 (`USE_S3=true` in `.env`).

### 2.6 Monitoring

Prometheus metrics are exposed at `http://your-host:8000/metrics`. To scrape them, add the following to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: inoveda
    static_configs:
      - targets: ['your-host:8000']
```

---

## 3. Cloud: Vercel (frontend) + Railway/Render/Fly.io (backend)

### 3.1 Deploy the frontend to Vercel

The repo root contains `vercel.json` which configures the build.

**Method A — Vercel CLI**

```bash
npm install -g vercel
vercel --prod
```

**Method B — Vercel dashboard**

1. Import the repository in the Vercel dashboard.
2. Set **Root Directory** to the repo root (not `frontend/`).
3. Vercel reads `vercel.json` automatically.

**Environment variables to set in Vercel:**

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.railway.app` (no trailing slash) |

The `vercel.json` SPA rewrite (`"source": "/(.*)", "destination": "/index.html"`) ensures all client-side routes work correctly on hard refresh.

### 3.2 Deploy the backend

Any platform that runs Docker containers will work. Example: Railway.

#### Railway

1. Connect your GitHub repo in the Railway dashboard.
2. Set **Root Directory** to `backend/`.
3. Railway detects the `Dockerfile` automatically.
4. Add environment variables in the Railway dashboard (see table below).
5. Provision a PostgreSQL plugin and a Redis plugin — Railway injects `DATABASE_URL` and `REDIS_URL` automatically.

#### Render

1. Create a new **Web Service** → connect repo → select `backend/` as root.
2. Build command: *(leave blank — Dockerfile is used)*
3. Start command: *(leave blank — from Dockerfile CMD)*
4. Add environment variables (see table below).
5. Create a PostgreSQL and Redis add-on from the Render dashboard.

#### Fly.io

```bash
cd inoveda/backend
fly launch          # generates fly.toml
fly secrets set JWT_SECRET=your_secret CORS_ORIGINS='["https://your-app.vercel.app"]'
fly deploy
```

**Required backend environment variables:**

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | `postgresql://user:pass@host/dbname?sslmode=require` |
| `JWT_SECRET` | Yes | 32+ character random string |
| `ENVIRONMENT` | Yes | `production` |
| `CORS_ORIGINS` | Yes | `["https://your-app.vercel.app"]` |
| `REDIS_URL` | No | `rediss://default:token@host:6380` (Upstash format) |
| `USE_OPENAI` | No | `true` to enable GPT triage |
| `OPENAI_API_KEY` | If above | `sk-...` |
| `USE_S3` | No | `true` for S3 file storage |
| `AWS_ACCESS_KEY_ID` | If above | your key |
| `AWS_SECRET_ACCESS_KEY` | If above | your secret |
| `S3_BUCKET` | If above | bucket name |

### 3.3 CORS

`CORS_ORIGINS` must include your Vercel domain **exactly** (no trailing slash):

```dotenv
CORS_ORIGINS=["https://your-app.vercel.app"]
```

Multiple origins:
```dotenv
CORS_ORIGINS=["https://your-app.vercel.app","https://custom-domain.com"]
```

### 3.4 Post-deployment validation

Run through this checklist after every deployment:

- [ ] `GET /health` on the backend returns `{"status":"ok"}` for both database and redis checks
- [ ] `GET /` returns `{"message":"INOVEDA backend running","version":"0.2.0"}`
- [ ] Register a new patient account — JWT cookie is set, redirect to `/patient-dashboard`
- [ ] AI chat: submit symptoms → full triage response (not a task ID)
- [ ] Admin dashboard: disease trends chart renders data (not empty)
- [ ] File upload: doctor uploads prescription → patient can download it
- [ ] WebSocket chat: two browser tabs with different user sessions exchange messages

---

## 4. Kubernetes (Advanced)

Kubernetes manifests are in `k8s/`. They are functional but require manual image tagging before deployment:

```bash
# Build and push the API image
docker build -t your-registry/inoveda-api:latest backend/
docker push your-registry/inoveda-api:latest

# Update image references in k8s/backend.yaml
# Then apply
kubectl apply -f k8s/
```

**Secrets:** Replace the hardcoded `DATABASE_URL` and `REDIS_URL` in the manifests with `secretKeyRef` references to a Kubernetes Secret before deploying to production.

---

## 5. Environment Variable Quick Reference

### Backend (`backend/.env`)

See [`backend/.env.example`](backend/.env.example) for the full annotated list.

### Frontend (`frontend/.env`)

```dotenv
# Backend API base URL — no trailing slash
VITE_API_URL=http://localhost:8000
```

---

## 6. Troubleshooting

**`RuntimeError: JWT_SECRET must be changed outside development`**
Set a real value for `JWT_SECRET` in your environment (32+ random characters). This guard only activates when `ENVIRONMENT=production`.

**`alembic.util.exc.CommandError: Can't locate revision`**
Run `alembic upgrade head` from the `backend/` directory with your venv active and `DATABASE_URL` pointing to the correct database.

**AI chat returns `{task_id, status: "processing"}`**
You are running old code. After the 0.2.0 recovery, `/patient/ai-chat` returns the full result synchronously. Pull the latest changes and restart.

**Rate limit 429 errors in dev**
Redis is running but returning 429s too aggressively. Either raise `RATE_LIMIT_PER_MINUTE` in `.env`, or stop the local Redis instance — the middleware degrades gracefully to no rate limiting when Redis is unreachable.

**`ModuleNotFoundError: No module named 'X'`**
Activate the virtualenv first (`.\venv\Scripts\Activate.ps1`) then re-run `pip install -r requirements.txt`.

**Vite build fails with `PostCSS` error**
Ensure `postcss.config.js` at the frontend root uses the Tailwind v4 plugin:
```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

**Disease trends chart is empty in production**
Verify the `/admin/disease-trends` endpoint returns data and that `CORS_ORIGINS` includes your frontend domain. Check the browser network tab for 401/403 responses.
