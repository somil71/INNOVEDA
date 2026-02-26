import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from database import Base, get_db
from models import Appointment, User
from tests.conftest import register_and_login


def test_db_connection_and_tables_accessible(db_session):
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1
    inspector_tables = set(Base.metadata.tables.keys())
    assert "users" in inspector_tables
    assert "appointments" in inspector_tables


def test_db_write_read_cycle_and_rollback(db_session):
    user = User(name="Rollback", email="rollback@example.com", password_hash="x", role="patient")
    db_session.add(user)
    db_session.flush()
    user_id = user.id
    assert user_id is not None
    db_session.rollback()
    assert db_session.query(User).filter(User.id == user_id).first() is None


def test_foreign_key_constraints_enforced(db_session):
    with pytest.raises(IntegrityError):
        db_session.add(Appointment(patient_id=9999, doctor_id=8888, date="2026-02-25", status="booked"))
        db_session.commit()
    db_session.rollback()


def test_db_disconnect_graceful_failure(client):
    from main import app

    headers, _ = register_and_login(client, role="patient", email="db-disc@example.com")

    def broken_db():
        raise RuntimeError("db disconnected")
        yield  # pragma: no cover

    app.dependency_overrides[get_db] = broken_db
    with TestClient(app, raise_server_exceptions=False) as no_raise_client:
        failed = no_raise_client.get("/patient/dashboard", headers=headers)
        assert failed.status_code == 500
    app.dependency_overrides.pop(get_db, None)
