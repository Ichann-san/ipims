import io
import uuid
from datetime import datetime, timedelta, timezone

from geoalchemy2 import Geography
from geoalchemy2.functions import ST_Distance, ST_DWithin, ST_MakePoint, ST_SetSRID
from PIL import Image, ImageOps
from sqlalchemy import cast, func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Report, Segment, StatusEvent, WeightProfile
from . import scoring, vision
from .lifecycle import ACTIVE

CATEGORIES = ("jalan", "trotoar", "drainase", "lampu_jalan", "halte", "jembatan", "lainnya")
MAX_PHOTO_SIDE = 1600


class PhotoError(ValueError):
    pass


def load_photo(data: bytes) -> Image.Image:
    if len(data) > settings.max_photo_bytes:
        raise PhotoError("photo is larger than 8 MB")
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except Exception:
        raise PhotoError("file is not a readable image")
    if img.format not in ("JPEG", "PNG", "WEBP", "MPO"):
        raise PhotoError("photo must be JPEG, PNG or WEBP")
    img = ImageOps.exif_transpose(img).convert("RGB")
    img.thumbnail((MAX_PHOTO_SIDE, MAX_PHOTO_SIDE))
    return img


def save_photo(img: Image.Image) -> str:
    """Re-encode (drops EXIF metadata) and store; returns path relative to media dir."""
    rel = f"reports/{uuid.uuid4().hex}.jpg"
    path = settings.media_dir / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "JPEG", quality=85)
    return rel


def point(lat: float, lng: float):
    return ST_SetSRID(ST_MakePoint(lng, lat), 4326)


def snap(db: Session, lat: float, lng: float) -> tuple[Segment | None, float | None]:
    p = point(lat, lng)
    row = db.execute(
        select(Segment, ST_Distance(cast(Segment.geom, Geography), cast(p, Geography)).label("d"))
        .where(ST_DWithin(cast(Segment.geom, Geography), cast(p, Geography), settings.snap_max_m))
        .order_by(Segment.geom.op("<->")(p))
        .limit(5)
    ).all()
    if not row:
        return None, None
    seg, dist = min(row, key=lambda r: r[1])
    return seg, round(float(dist), 1)


def weights_for(db: Session, road_group: str) -> dict:
    profile = db.get(WeightProfile, road_group)
    return profile.weights if profile else scoring.DEFAULT_WEIGHTS[road_group]


def active_on_segment(db: Session, segment_id: str) -> int:
    since = datetime.now(timezone.utc) - timedelta(days=30)
    return db.scalar(
        select(func.count()).select_from(Report).where(
            Report.segment_id == segment_id, Report.status.in_(ACTIVE), Report.created_at >= since
        )
    ) or 0


def score(db: Session, report: Report) -> None:
    seg = report.segment
    group = seg.road_group if seg else "lingkungan"
    count = active_on_segment(db, seg.id) if seg else 1
    values = scoring.criteria_values((report.ai or {}).get("severity_score"), seg, count)
    report.priority_score, report.priority_breakdown = scoring.priority(values, weights_for(db, group))
    report.impact_score = seg.impact_score if seg else None


def rescore(db: Session, segment_id: str | None = None) -> None:
    q = select(Report).where(Report.status.in_(ACTIVE))
    if segment_id:
        q = q.where(Report.segment_id == segment_id)
    for r in db.scalars(q).unique():
        score(db, r)


def add_event(db: Session, report: Report, to_status: str, actor: str, note: str | None = None) -> None:
    db.add(StatusEvent(report=report, from_status=report.status if report.events else None,
                       to_status=to_status, actor=actor, note=note))
    report.status = to_status


def create_report(db: Session, *, img: Image.Image, lat: float, lng: float, manual_pin: bool,
                  gps_accuracy_m: float | None, category: str | None, description: str | None,
                  is_seed: bool = False, ai: dict | None = None) -> Report:
    if ai is None:
        ai = vision.analyze(img)
    seg, dist = snap(db, lat, lng)
    report = Report(
        lat=lat, lng=lng, location=point(lat, lng), manual_pin=manual_pin, gps_accuracy_m=gps_accuracy_m,
        category=category or (ai or {}).get("category") or "lainnya",
        category_source="user" if category else ("ai" if ai else "user"),
        description=description, photo_path=save_photo(img), ai=ai,
        segment=seg, snap_distance_m=dist, status="reported", is_seed=is_seed,
    )
    db.add(report)
    add_event(db, report, "reported", "citizen" if not is_seed else "system:seed")
    db.flush()
    report.code = f"IPIMS-{report.created_at.year}-{report.id:06d}"
    score(db, report)
    if ai is not None:
        add_event(db, report, "ai_verified", "system", f"AI {ai['model_version']}: {ai['category']}, severity {ai['severity']}")
    if seg:
        rescore(db, seg.id)
    return report


def needs_review(r: Report) -> bool:
    return r.ai is None or not r.ai.get("is_infrastructure", True) or r.segment_id is None


def to_dict(r: Report, with_timeline: bool = False) -> dict:
    out = {
        "code": r.code,
        "created_at": r.created_at.isoformat(),
        "updated_at": r.updated_at.isoformat(),
        "lat": r.lat, "lng": r.lng,
        "manual_pin": r.manual_pin,
        "category": r.category,
        "category_source": r.category_source,
        "description": r.description,
        "photo_url": f"/media/{r.photo_path}",
        "ai": r.ai,
        "segment": None if r.segment is None else {
            "id": r.segment.id, "name": r.segment.name, "highway": r.segment.highway,
            "road_group": r.segment.road_group, "impact_score": r.segment.impact_score,
        },
        "snap_distance_m": r.snap_distance_m,
        "impact_score": r.impact_score,
        "priority_score": r.priority_score,
        "priority_breakdown": r.priority_breakdown,
        "status": r.status,
        "assigned_to": r.assigned_to,
        "needs_review": needs_review(r),
    }
    if with_timeline:
        out["timeline"] = [
            {"from_status": e.from_status, "to_status": e.to_status, "actor": e.actor,
             "note": e.note, "created_at": e.created_at.isoformat()}
            for e in r.events
        ]
    return out
