from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        protected_namespaces=("settings_",),
    )

    app_name: str = "INOVEDA API"
    app_version: str = "0.2.0"
    environment: str = "development"

    database_url: str = "sqlite:///./inoveda.db"
    jwt_secret: str = "inoveda-dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 24 * 60

    use_openai: bool = False
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    upload_dir: str = "uploads"
    max_upload_mb: int = 10
    allowed_upload_extensions: set[str] = Field(default_factory=lambda: {".pdf", ".png", ".jpg", ".jpeg"})

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"])

    rate_limit_per_minute: int = 120

    outbreak_method: Literal["zscore", "poisson"] = "zscore"
    outbreak_weeks_history: int = 4
    outbreak_z_threshold: float = 2.0
    outbreak_p_threshold: float = 0.05
    outbreak_min_cases: int = 3

    model_path: str = str(BASE_DIR / "ml" / "triage_model.joblib")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
