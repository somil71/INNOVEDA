from io import BytesIO
from pathlib import Path

from models import Document
from tests.conftest import register_and_login


def test_valid_pdf_upload_and_retrieval(client, db_session):
    headers, user = register_and_login(client, role="patient", email="upload-valid@example.com")
    files = {"file": ("scan.pdf", BytesIO(b"%PDF-1.4 content"), "application/pdf")}
    upload = client.post("/patient/documents/upload", files=files, headers=headers)
    assert upload.status_code == 200
    body = upload.json()
    row = db_session.query(Document).filter(Document.id == body["id"]).first()
    assert row and row.patient_id == user["user_id"]
    assert Path(row.file_path).exists()

    listed = client.get("/patient/documents", headers=headers)
    assert listed.status_code == 200
    assert any(d["id"] == row.id for d in listed.json())


def test_invalid_extension_rejected(client):
    headers, _ = register_and_login(client, role="patient", email="upload-invalid-ext@example.com")
    files = {"file": ("payload.exe", BytesIO(b"MZ"), "application/octet-stream")}
    r = client.post("/patient/documents/upload", files=files, headers=headers)
    assert r.status_code == 400


def test_large_file_rejected(client, monkeypatch):
    import services.patient_service as patient_service

    headers, _ = register_and_login(client, role="patient", email="upload-large@example.com")
    monkeypatch.setattr(patient_service.settings, "max_upload_mb", 1)
    files = {"file": ("big.pdf", BytesIO(b"a" * (2 * 1024 * 1024)), "application/pdf")}
    r = client.post("/patient/documents/upload", files=files, headers=headers)
    assert r.status_code == 400


def test_upload_traversal_filename_not_used(client, db_session):
    headers, _ = register_and_login(client, role="patient", email="upload-traversal@example.com")
    files = {"file": ("..\\..\\evil.pdf", BytesIO(b"%PDF-1.4 test"), "application/pdf")}
    r = client.post("/patient/documents/upload", files=files, headers=headers)
    assert r.status_code == 200
    row = db_session.query(Document).filter(Document.id == r.json()["id"]).first()
    assert row is not None
    assert ".." not in row.file_path
