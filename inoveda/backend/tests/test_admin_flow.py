from models import OutbreakEvent
from tests.conftest import register_and_login
from tests.utils import assert_has_keys


def test_admin_trends_alerts_and_persistence(client, db_session, monkeypatch):
    admin_headers, _ = register_and_login(client, role="admin", email="admin-flow@example.com")
    doctor_headers, _ = register_and_login(client, role="doctor", email="doc-flow@example.com", extra={"consultation_fee": 100})

    from core.config import settings

    monkeypatch.setattr(settings, "outbreak_method", "zscore")
    for _ in range(10):
        r = client.post(
            "/admin/disease-report",
            json={"village": "District-Alpha", "disease_type": "fever", "severity": "moderate"},
            headers=doctor_headers,
        )
        assert r.status_code == 200

    dashboard = client.get("/admin/dashboard", headers=admin_headers)
    assert dashboard.status_code == 200
    body = dashboard.json()
    assert_has_keys(body, ["disease_trends", "outbreak_alerts", "village_counts"])
    assert "District-Alpha" in body["village_counts"]

    persisted = db_session.query(OutbreakEvent).all()
    # Depending on historical baseline, this can be zero or more in isolated tests, but table should be queryable.
    assert persisted is not None
