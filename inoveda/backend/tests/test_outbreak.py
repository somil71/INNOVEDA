from datetime import datetime, timedelta, timezone

from models import DiseaseReport, OutbreakEvent
from services.outbreak_service import area_net_summary, detect_outbreak
from tests.conftest import register_and_login


def test_detect_outbreak_positive_zscore():
    result = detect_outbreak(current_count=20, historical_counts=[3, 4, 5, 4], method="zscore")
    assert result["is_outbreak"] is True
    assert result["confidence"] > 0


def test_detect_outbreak_no_false_positive_small_deviation():
    result = detect_outbreak(current_count=6, historical_counts=[5, 5, 4, 6], method="zscore")
    assert result["is_outbreak"] is False


def test_detect_outbreak_positive_poisson():
    result = detect_outbreak(current_count=18, historical_counts=[2, 3, 2, 4], method="poisson")
    assert result["is_outbreak"] is True
    assert result["confidence"] > 0.5


def test_areanet_dashboard_outbreak_output(client):
    admin_headers, _ = register_and_login(client, role="admin", email="admin-outbreak@example.com")
    doctor_headers, _ = register_and_login(
        client, role="doctor", email="doctor-outbreak@example.com", extra={"consultation_fee": 100}
    )

    # Load repeated disease reports in current week
    for _ in range(10):
        client.post(
            "/admin/disease-report",
            json={"village": "VillageA", "disease_type": "fever", "severity": "moderate"},
            headers=doctor_headers,
        )

    dashboard = client.get("/admin/dashboard", headers=admin_headers)
    assert dashboard.status_code == 200
    body = dashboard.json()
    assert "outbreak_alerts" in body


def test_outbreak_persisted_in_db_with_historical_baseline(db_session, monkeypatch):
    from core.config import settings

    monkeypatch.setattr(settings, "outbreak_method", "zscore")
    now = datetime.now(timezone.utc)
    for weeks_ago, count in [(4, 2), (3, 2), (2, 3), (1, 2)]:
        for _ in range(count):
            db_session.add(
                DiseaseReport(
                    village="VillageZ",
                    disease_type="fever",
                    severity="moderate",
                    created_at=now - timedelta(weeks=weeks_ago),
                )
            )
    for _ in range(12):
        db_session.add(DiseaseReport(village="VillageZ", disease_type="fever", severity="moderate", created_at=now))
    db_session.commit()

    summary = area_net_summary(db_session)
    assert any(a["village"] == "VillageZ" for a in summary["outbreak_alerts"])
    events = db_session.query(OutbreakEvent).filter(OutbreakEvent.village == "VillageZ").all()
    assert len(events) >= 1
    assert events[0].confidence >= 0
