import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import event
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["USE_OPENAI"] = "false"

from core.config import settings  # noqa: E402
from database import Base, get_db  # noqa: E402
from main import app  # noqa: E402


@pytest.fixture()
def client(tmp_path: Path):
    db_file = tmp_path / "test.db"
    engine = create_engine(f"sqlite:///{db_file}", connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _):  # noqa: ANN001
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    old_upload = settings.upload_dir
    settings.upload_dir = str(upload_dir)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    settings.upload_dir = old_upload
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session(client: TestClient):
    override = app.dependency_overrides[get_db]
    gen = override()
    db = next(gen)
    try:
        yield db
    finally:
        db.close()


def register_and_login(client: TestClient, *, role: str, email: str, name: str = "User", extra: dict | None = None):
    payload = {
        "name": name,
        "email": email,
        "password": "password123",
        "role": role,
        "village": "VillageA",
        "phone": "9999999999",
    }
    if extra:
        payload.update(extra)
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, r.json()
