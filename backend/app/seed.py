"""Load graph artifacts into PostGIS and create the admin account and default weights.

Run from backend/: python -m app.seed [--reset]
"""
import argparse
import json

from geoalchemy2.shape import from_shape
from shapely.geometry import shape
from sqlalchemy import delete, select

from .auth import hash_password
from .config import settings
from .db import SessionLocal, init_db
from .models import Admin, Facility, Report, Segment, StatusEvent, WeightProfile
from .services.reports import rescore, snap
from .services.scoring import DEFAULT_WEIGHTS


def _features(path):
    return json.loads(path.read_text(encoding="utf-8"))["features"]


def load_graph(db) -> int:
    graph_dir = settings.artifacts_dir / "graph"
    impact_path = settings.artifacts_dir / "graph" / "impact.json"
    impact = json.loads(impact_path.read_text()) if impact_path.exists() else {}
    gnn_path = settings.artifacts_dir / "gnn" / "predictions.json"
    gnn = json.loads(gnn_path.read_text()) if gnn_path.exists() else {}

    db.execute(delete(Segment))
    db.execute(delete(Facility))
    for f in _features(graph_dir / "segments.geojson"):
        p = f["properties"]
        sim = float(impact.get(p["segment_id"], 0.0))
        db.add(Segment(
            id=p["segment_id"], name=p.get("name"), highway=p["highway"], road_group=p["road_group"],
            kecamatan=p.get("kecamatan"), length_m=p["length_m"], traffic_proxy=p["traffic_proxy"],
            population_proxy=p["population_proxy"], facility_proxy=p["facility_proxy"],
            impact_score_sim=sim, impact_score=sim,
            impact_score_gnn=float(gnn[p["segment_id"]]) if p["segment_id"] in gnn else None,
            geom=from_shape(shape(f["geometry"]), srid=4326),
        ))
    for f in _features(graph_dir / "facilities.geojson"):
        p = f["properties"]
        db.add(Facility(id=p["fid"], kind=p["kind"], name=p.get("name"), geom=from_shape(shape(f["geometry"]), srid=4326)))
    return db.scalar(select(Segment).limit(1)) is not None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset", action="store_true", help="delete all reports first")
    parser.add_argument("--skip-graph", action="store_true")
    args = parser.parse_args()

    init_db()
    with SessionLocal() as db:
        if args.reset:
            db.execute(delete(StatusEvent))
            db.execute(delete(Report))
        if not args.skip_graph:
            # Reports reference segments; detach them before reloading the graph.
            for r in db.scalars(select(Report)).unique():
                r.segment_id = None
            db.flush()
            load_graph(db)
            db.flush()
            for r in db.scalars(select(Report)).unique():
                r.segment, r.snap_distance_m = snap(db, r.lat, r.lng)
            db.flush()
            rescore(db)
        if db.get(Admin, settings.admin_username) is None:
            db.add(Admin(username=settings.admin_username, password_hash=hash_password(settings.admin_password)))
        for group, weights in DEFAULT_WEIGHTS.items():
            if db.get(WeightProfile, group) is None:
                db.add(WeightProfile(road_group=group, weights=weights))
        db.commit()
        print("segments:", db.query(Segment).count(), "facilities:", db.query(Facility).count())


if __name__ == "__main__":
    main()
