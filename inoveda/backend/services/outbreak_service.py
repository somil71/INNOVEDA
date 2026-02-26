import math
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from core.config import settings
from repositories.clinical_repository import ClinicalRepository


def _week_start(dt: datetime) -> datetime:
    return dt - timedelta(days=dt.weekday())


def _poisson_sf(k: int, lam: float) -> float:
    # Survival function P(X >= k) for Poisson(lam) using stable summation.
    if lam <= 0:
        return 0.0 if k <= 0 else 1.0
    cumulative = 0.0
    for i in range(max(k, 0)):
        cumulative += math.exp(-lam) * (lam**i) / math.factorial(i)
    return max(0.0, min(1.0, 1.0 - cumulative))


def detect_outbreak(current_count: int, historical_counts: list[int], method: str | None = None) -> dict:
    method = method or settings.outbreak_method
    hist = [h for h in historical_counts if h is not None]
    if len(hist) < 2:
        return {"is_outbreak": False, "confidence": 0.0, "metric_value": 0.0, "baseline": float(sum(hist or [0]))}

    baseline = sum(hist) / len(hist)
    if current_count < settings.outbreak_min_cases:
        return {"is_outbreak": False, "confidence": 0.0, "metric_value": 0.0, "baseline": baseline}

    # False-positive reduction: require relative growth above baseline.
    growth_ratio = (current_count / baseline) if baseline > 0 else float(current_count)
    if growth_ratio < 1.3:
        return {"is_outbreak": False, "confidence": 0.0, "metric_value": 0.0, "baseline": baseline}

    if method == "poisson":
        p_value = _poisson_sf(current_count, baseline if baseline > 0 else 0.1)
        confidence = 1 - p_value
        return {
            "is_outbreak": p_value < settings.outbreak_p_threshold,
            "confidence": round(confidence, 4),
            "metric_value": round(p_value, 6),
            "baseline": baseline,
            "method": "poisson",
        }

    mean = baseline
    variance = sum((x - mean) ** 2 for x in hist) / (len(hist) - 1)
    std = math.sqrt(max(variance, 1e-6))
    z_score = (current_count - mean) / std
    confidence = min(0.999, max(0.0, (z_score / (z_score + 2)) if z_score > 0 else 0.0))
    return {
        "is_outbreak": z_score > settings.outbreak_z_threshold,
        "confidence": round(confidence, 4),
        "metric_value": round(z_score, 4),
        "baseline": mean,
        "method": "zscore",
    }


def _aggregate_weekly(reports, weeks_history: int):
    today = datetime.now(timezone.utc)
    current_week = _week_start(today)
    grouped = defaultdict(lambda: defaultdict(int))  # (village, disease) -> week_start -> count
    village_counts = defaultdict(int)
    trend_rows = defaultdict(lambda: defaultdict(int))

    for report in reports:
        ws = _week_start(report.created_at)
        week_key = ws.strftime("%Y-%m-%d")
        key = (report.village, report.disease_type)
        grouped[key][week_key] += 1
        village_counts[report.village] += 1
        trend_rows[week_key][report.disease_type] += 1

    current_key = current_week.strftime("%Y-%m-%d")
    historical_keys = [(_week_start(current_week - timedelta(weeks=i))).strftime("%Y-%m-%d") for i in range(1, weeks_history + 1)]
    return grouped, village_counts, trend_rows, current_key, historical_keys


def area_net_summary(db: Session):
    repo = ClinicalRepository(db)
    reports = repo.list_disease_reports()
    grouped, village_counts, trend_rows, current_key, historical_keys = _aggregate_weekly(
        reports, settings.outbreak_weeks_history
    )
    outbreak_alerts = []

    for (village, disease_type), week_data in grouped.items():
        current_count = week_data.get(current_key, 0)
        historical = [week_data.get(k, 0) for k in historical_keys]
        detection = detect_outbreak(current_count, historical, method=settings.outbreak_method)
        if detection.get("is_outbreak"):
            alert = {
                "village": village,
                "disease_type": disease_type,
                "method": detection["method"],
                "confidence": detection["confidence"],
                "metric_value": detection["metric_value"],
                "baseline": round(float(detection["baseline"]), 2),
                "current_count": current_count,
                "week_start": current_key,
            }
            outbreak_alerts.append(alert)
            repo.add_outbreak_event(
                village=village,
                disease_type=disease_type,
                detection_method=alert["method"],
                confidence=alert["confidence"],
                metric_value=alert["metric_value"],
                baseline=alert["baseline"],
                current_count=current_count,
                week_start=current_key,
            )

    trend_list = []
    for day, disease_map in trend_rows.items():
        row = {"date": day}
        row.update(disease_map)
        trend_list.append(row)

    db.commit()
    return {
        "village_counts": dict(village_counts),
        "trend_rows": sorted(trend_list, key=lambda x: x["date"]),
        "outbreak_alerts": outbreak_alerts,
    }
