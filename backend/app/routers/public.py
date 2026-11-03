import json
import statistics
from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from geoalchemy2.functions import ST_AsGeoJSON, ST_Intersects, ST_MakeEnvelope
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import Facility, Report, Segment
from ..services import network, reports as svc, vision
from ..services.lifecycle import ACTIVE, STATUSES

router = APIRouter(prefix="/api/v1")


def parse_bbox(bbox: str):
    try:
        min_lng, min_lat, max_lng, max_lat = (float(x) for x in bbox.split(","))
    except ValueError:
        raise HTTPException(400, "bbox must be minLng,minLat,maxLng,maxLat")
    return ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)


@router.get("/health")
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return {"status": "ok", "db": db_ok, "models": {"cv": vision.available(), "graph": network.available()}}


@router.post("/analyze")
async def analyze(photo: UploadFile = File(...)):
    try:
        img = svc.load_photo(await photo.read())
    except svc.PhotoError as e:
        raise HTTPException(400, str(e))
    result = vision.analyze(img)
    if result is None:
        raise HTTPException(503, "AI model is not available")
    return result


@router.post("/reports", status_code=201)
async def create_report(
    photo: UploadFile = File(...),
    lat: float = Form(...),
    lng: float = Form(...),
    manual_pin: bool = Form(False),
    gps_accuracy_m: float | None = Form(None),
    category: str | None = Form(None),
    description: str | None = Form(None),
    db: Session = Depends(get_db),
):
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise HTTPException(400, "invalid coordinates")
    if category is not None and category not in svc.CATEGORIES:
        raise HTTPException(400, f"category must be one of {', '.join(svc.CATEGORIES)}")
    if description and len(description) > 1000:
        raise HTTPException(400, "description is longer than 1000 characters")
    try:
        img = svc.load_photo(await photo.read())
    except svc.PhotoError as e:
        raise HTTPException(400, str(e))
    report = svc.create_report(
        db, img=img, lat=lat, lng=lng, manual_pin=manual_pin, gps_accuracy_m=gps_accuracy_m,
        category=category, description=(description or "").strip() or None,
    )
    db.commit()
    return svc.to_dict(report, with_timeline=True)


@router.get("/reports")
def list_reports(
    status: list[str] = Query(default=[]),
    category: list[str] = Query(default=[]),
    q: str | None = None,
    sort: str = "newest",
    bbox: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    stmt = select(Report).outerjoin(Segment, Report.segment_id == Segment.id)
    if status:
        stmt = stmt.where(Report.status.in_(status))
    if category:
        stmt = stmt.where(Report.category.in_(category))
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(Report.description.ilike(like), Segment.name.ilike(like), Report.code.ilike(like)))
    if bbox:
        stmt = stmt.where(ST_Intersects(Report.location, parse_bbox(bbox)))
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    order = Report.priority_score.desc().nulls_last() if sort == "priority" else Report.created_at.desc()
    items = db.scalars(stmt.order_by(order, Report.id.desc()).limit(limit).offset(offset)).unique().all()
    return {"items": [svc.to_dict(r) for r in items], "total": total}


@router.get("/reports/{code}")
def get_report(code: str, db: Session = Depends(get_db)):
    report = db.scalar(select(Report).where(Report.code == code))
    if report is None:
        raise HTTPException(404, "report not found")
    return svc.to_dict(report, with_timeline=True)


def _median_hours(pairs) -> float | None:
    hours = [(b - a).total_seconds() / 3600 for a, b in pairs if a and b]
    return round(statistics.median(hours), 1) if hours else None


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    rows = db.scalars(select(Report)).unique().all()
    by_status = Counter(r.status for r in rows)
    by_category = Counter(r.category for r in rows)
    by_kecamatan = Counter((r.segment.kecamatan if r.segment and r.segment.kecamatan else "lainnya") for r in rows)
    to_verify, to_complete = [], []
    monthly = defaultdict(lambda: {"reported": 0, "completed": 0})
    for r in rows:
        monthly[r.created_at.strftime("%Y-%m")]["reported"] += 1
        first = {}
        for e in r.events:
            first.setdefault(e.to_status, e.created_at)
        verified = first.get("gov_approved")
        to_verify.append((r.created_at, verified))
        if "completed" in first:
            to_complete.append((r.created_at, first["completed"]))
            monthly[first["completed"].strftime("%Y-%m")]["completed"] += 1
    closed = by_status.get("completed", 0) + by_status.get("rejected", 0)
    return {
        "total": len(rows),
        "by_status": {s: by_status.get(s, 0) for s in STATUSES},
        "by_category": {c: by_category.get(c, 0) for c in svc.CATEGORIES},
        "by_kecamatan": dict(by_kecamatan.most_common()),
        "completed_rate": round(by_status.get("completed", 0) / closed, 3) if closed else 0.0,
        "active": sum(by_status.get(s, 0) for s in ACTIVE),
        "median_hours_to_verify": _median_hours(to_verify),
        "median_hours_to_complete": _median_hours(to_complete),
        "monthly": [{"month": m, **v} for m, v in sorted(monthly.items())],
    }


@router.get("/region")
def region(db: Session = Depends(get_db)):
    from ml.graph.config import REGIONS

    cfg = REGIONS[settings.region]
    box = db.execute(select(func.ST_XMin(func.ST_Extent(Segment.geom)), func.ST_YMin(func.ST_Extent(Segment.geom)),
                            func.ST_XMax(func.ST_Extent(Segment.geom)), func.ST_YMax(func.ST_Extent(Segment.geom)))).one()
    bbox = [round(x, 5) for x in box] if box[0] is not None else None
    return {
        "name": cfg["name"],
        "center": [round((bbox[0] + bbox[2]) / 2, 5), round((bbox[1] + bbox[3]) / 2, 5)] if bbox else None,
        "bbox": bbox,
        "kecamatan": sorted(cfg["kecamatan"]),
    }


@router.get("/segments")
def segments(bbox: str | None = None, active: bool = False, db: Session = Depends(get_db)):
    if bbox is None and not active:
        raise HTTPException(400, "bbox is required unless active=1")
    active_counts = (
        select(Report.segment_id, func.count().label("n"))
        .where(Report.status.in_(ACTIVE))
        .group_by(Report.segment_id)
        .subquery()
    )
    stmt = (
        select(Segment, ST_AsGeoJSON(Segment.geom), func.coalesce(active_counts.c.n, 0))
        .outerjoin(active_counts, active_counts.c.segment_id == Segment.id)
    )
    if bbox is not None:
        stmt = stmt.where(ST_Intersects(Segment.geom, parse_bbox(bbox)))
    if active:
        stmt = stmt.where(active_counts.c.n > 0)
    rows = db.execute(stmt.limit(5000)).all()
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "geometry": json.loads(g), "properties": {
            "id": s.id, "name": s.name, "highway": s.highway, "road_group": s.road_group,
            "impact_score": s.impact_score, "active_reports": n,
        }} for s, g, n in rows
    ]}


@router.get("/facilities")
def facilities(bbox: str, db: Session = Depends(get_db)):
    rows = db.execute(select(Facility, ST_AsGeoJSON(Facility.geom)).where(ST_Intersects(Facility.geom, parse_bbox(bbox)))).all()
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "geometry": json.loads(g), "properties": {"id": f.id, "kind": f.kind, "name": f.name}}
        for f, g in rows
    ]}
