from pathlib import Path
import logging

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from core.config import settings
from core.exceptions import add_exception_handlers
from core.logging_config import setup_logging
from core.middleware import RedisRateLimitMiddleware, RequestContextMiddleware
from database import Base, engine, get_db
from routes.admin_routes import router as admin_router
from routes.auth_routes import router as auth_router
from routes.chat_routes import router as chat_router
from routes.doctor_routes import router as doctor_router
from routes.patient_routes import router as patient_router
from routes.ws_routes import router as ws_router

# Base.metadata.create_all(bind=engine)  # Migrations handled via Alembic
setup_logging()
Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
logger = logging.getLogger(__name__)

if settings.environment.lower() != "development" and settings.jwt_secret == "inoveda-dev-secret":
    raise RuntimeError("JWT_SECRET must be changed outside development")
if settings.jwt_secret == "inoveda-dev-secret":
    logger.warning("default_jwt_secret_in_use")

app = FastAPI(title=settings.app_name, version=settings.app_version)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(RedisRateLimitMiddleware)
add_exception_handlers(app)

app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)

app.include_router(auth_router)
app.include_router(patient_router)
app.include_router(doctor_router)
app.include_router(admin_router)
app.include_router(chat_router)
app.include_router(ws_router)


@app.get("/")
def root():
    return {"message": "INOVEDA backend running", "version": settings.app_version}


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    health = {"status": "ok", "checks": {}}
    
    # Check Database
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        health["checks"]["database"] = "ok"
    except Exception as e:
        health["status"] = "error"
        health["checks"]["database"] = f"error: {str(e)}"
        
    # Check Redis
    try:
        import redis
        r = redis.from_url(settings.redis_url)
        r.ping()
        health["checks"]["redis"] = "ok"
    except Exception as e:
        health["status"] = "error"
        health["checks"]["redis"] = f"error: {str(e)}"

    return health