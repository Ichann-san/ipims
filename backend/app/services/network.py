"""Adapter to the accessibility simulation (ml.graph.sim) using the built graph artifacts."""
import json
from functools import lru_cache

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Report
from .lifecycle import ACTIVE


def _properties(path) -> pd.DataFrame:
    data = json.loads(path.read_text(encoding="utf-8"))
    return pd.DataFrame([f["properties"] for f in data["features"]])


@lru_cache(maxsize=1)
def network():
    from ml.graph.sim import Network

    graph_dir = settings.artifacts_dir / "graph"
    nodes = pd.read_csv(graph_dir / "nodes.csv")
    segments = _properties(graph_dir / "segments.geojson")
    facilities = _properties(graph_dir / "facilities.geojson")
    return Network.from_frames(nodes, segments, facilities)


def available() -> bool:
    try:
        network()
        return True
    except Exception:
        return False


def current_damage(db: Session) -> dict:
    """Segment id -> travel-time multiplier from the worst active report on it."""
    from ml.graph.sim import DAMAGE_FACTOR

    rows = db.execute(
        select(Report.segment_id, Report.ai).where(Report.status.in_(ACTIVE), Report.segment_id.is_not(None))
    ).all()
    damage: dict[str, float] = {}
    for segment_id, ai in rows:
        severity = (ai or {}).get("severity") or "mid"
        damage[segment_id] = max(damage.get(segment_id, 1.0), DAMAGE_FACTOR[severity])
    return damage
