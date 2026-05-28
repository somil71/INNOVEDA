import json
import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from pydantic import Field
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource, SettingsConfigDict

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent


class AWSSecretsManagerSource(PydanticBaseSettingsSource):
    """Optional AWS Secrets Manager source — only active when USE_AWS_SECRETS=true."""

    def __call__(self) -> dict[str, Any]:
        use_aws = os.getenv("USE_AWS_SECRETS", "false").lower() == "true"
        secret_name = os.getenv("AWS_SECRET_NAME")
        region = os.getenv("AWS_REGION", "us-east-1")
        if not use_aws or not secret_name:
            return {}
        try:
            import boto3
            from botocore.exceptions import ClientError
            client = boto3.client("secretsmanager", region_name=region)
            resp = client.get_secret_value(SecretId=secret_name)
            if "SecretString" in resp:
                return json.loads(resp["SecretString"])
        except Exception:
            logger.warning("aws_secrets_fetch_failed")
        return {}

    def get_field_value(self, field: Any, field_name: str) -> Any:
        return None, field_name, False

    def field_is_complex(self, field: Any) -> bool:
        return False


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        protected_namespaces=("settings_",),
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls,
        init_settings,
        env_settings,
        dotenv_settings,
        file_secret_settings,
    ):
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            AWSSecretsManagerSource(settings_cls),
            file_secret_settings,
        )

    app_name: str = "INOVEDA API"
    app_version: str = "0.2.0"
    environment: str = "development"

    database_url: str = "postgresql://postgres:postgres@localhost:5432/inoveda"
    jwt_secret: str = "inoveda-dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 24 * 60

    use_openai: bool = False
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"

    upload_dir: str = "uploads"
    max_upload_mb: int = 10
    allowed_upload_extensions: set[str] = Field(default_factory=lambda: {".pdf", ".png", ".jpg", ".jpeg"})

    cors_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    )

    rate_limit_per_minute: int = 120

    outbreak_method: Literal["zscore", "poisson"] = "zscore"
    outbreak_weeks_history: int = 4
    outbreak_z_threshold: float = 2.0
    outbreak_p_threshold: float = 0.05
    outbreak_min_cases: int = 3

    model_path: str = str(BASE_DIR / "ml" / "triage_model.joblib")
    redis_url: str = "redis://localhost:6379/0"

    # Cloud Storage
    use_s3: bool = False
    aws_access_key_id: str | None = None
    aws_secret_access_key: str | None = None
    aws_region: str = "us-east-1"
    s3_bucket: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
