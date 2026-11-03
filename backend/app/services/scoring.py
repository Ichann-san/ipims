"""MCDM Priority Score (design doc §6)."""
import math

CRITERIA = ("severity", "traffic", "population", "facility", "impact", "reports")

DEFAULT_WEIGHTS = {
    "utama": {"severity": 0.25, "traffic": 0.25, "population": 0.10, "facility": 0.10, "impact": 0.20, "reports": 0.10},
    "lingkungan": {"severity": 0.25, "traffic": 0.10, "population": 0.15, "facility": 0.25, "impact": 0.15, "reports": 0.10},
}

DEFAULT_SEVERITY = 0.5


def normalise(weights: dict) -> dict:
    clean = {c: max(float(weights.get(c, 0.0)), 0.0) for c in CRITERIA}
    total = sum(clean.values())
    if total <= 0:
        raise ValueError("weights must have a positive sum")
    return {c: round(v / total, 4) for c, v in clean.items()}


def reports_value(active_count: int) -> float:
    return min(1.0, math.log1p(active_count) / math.log(11))


def criteria_values(severity_score: float | None, segment, active_reports: int) -> dict:
    """segment: object with traffic_proxy, population_proxy, facility_proxy, impact_score, or None."""
    return {
        "severity": DEFAULT_SEVERITY if severity_score is None else float(severity_score),
        "traffic": segment.traffic_proxy if segment else 0.0,
        "population": segment.population_proxy if segment else 0.0,
        "facility": segment.facility_proxy if segment else 0.0,
        "impact": (segment.impact_score / 100.0) if segment else 0.0,
        "reports": reports_value(active_reports),
    }


def priority(values: dict, weights: dict) -> tuple[float, list[dict]]:
    breakdown = []
    total = 0.0
    for c in CRITERIA:
        contribution = values[c] * weights[c] * 100
        total += contribution
        breakdown.append({
            "criterion": c,
            "value": round(values[c], 4),
            "weight": weights[c],
            "contribution": round(contribution, 2),
        })
    return round(total, 2), breakdown
