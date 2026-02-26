from datetime import datetime, timedelta, timezone

from jose import jwt

from core.config import settings


def assert_has_keys(payload: dict, keys: list[str]):
    missing = [k for k in keys if k not in payload]
    assert not missing, f"Missing keys: {missing}"


def make_token(sub: int, role: str, expires_minutes: int = 30):
    exp = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)
    return jwt.encode({"sub": str(sub), "role": role, "exp": exp}, settings.jwt_secret, algorithm=settings.jwt_algorithm)
