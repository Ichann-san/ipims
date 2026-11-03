import json

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..auth import issue_token, require_admin, verify_password
from ..config import settings
from ..db import get_db
from ..models import Admin, Facility, Report, Segment, WeightProfile
from ..services import network, reports as svc, scoring
from ..services.lifecycle import ACTIVE, TransitionError, check_admin_transition

router = APIRouter(prefix="/api/v1")


class Login(BaseModel):
    username: str
    password: str


@router.post("/auth/login")
def login(body: Login, db: Session = Depends(get_db)):
    admin = db.get(Admin, body.username)
    if admin is None or not verify_password(body.password, admin.password_hash):
        raise HTTPException(401, "wrong username or password")
    token, expires = issue_token(admin.username)
    return {"token": token, "expires_at": expires.isoformat()}


@router.get("/admin/queue")
def queue(
    road_group: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: str = Depends(require_admin),
):
    stmt = select(Report).outerjoin(Segment, Report.segment_id == Segment.id).where(Report.status.in_(ACTIVE))
    if road_group:
        stmt = stmt.where(Segment.road_group == road_group)
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    items = db.scalars(
        stmt.order_by(Report.priority_score.desc().nulls_last(), Report.created_at).limit(limit).offset(offset)
    ).unique().all()
    return {"items": [svc.to_dict(r) for r in items], "total": total}


class ReportPatch(BaseModel):
    status: str | None = None
    note: str | None = None
    assigned_to: str | None = None
    category: str | None = None


@router.patch("/admin/reports/{code}")
def update_report(code: str, body: ReportPatch, db: Session = Depends(get_db), user: str = Depends(require_admin)):
    report = db.scalar(select(Report).where(Report.code == code))
    if report is None:
        raise HTTPException(404, "report not found")
    if body.category is not None:
        if body.category not in svc.CATEGORIES:
            raise HTTPException(400, "unknown category")
        report.category, report.category_source = body.category, "user"
    if body.assigned_to is not None:
        report.assigned_to = body.assigned_to.strip() or None
    if body.status is not None:
        try:
            check_admin_transition(report.status, body.status, body.note, report.assigned_to)
        except TransitionError as e:
            raise HTTPException(409, str(e))
        svc.add_event(db, report, body.status, f"admin:{user}", body.note)
    if report.segment_id:
        svc.rescore(db, report.segment_id)
    elif report.status in ACTIVE:
        svc.score(db, report)
    db.commit()
    db.refresh(report)
    return svc.to_dict(report, with_timeline=True)


@router.get("/admin/weights")
def get_weights(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    return {g: svc.weights_for(db, g) for g in scoring.DEFAULT_WEIGHTS}


@router.put("/admin/weights")
def put_weights(body: dict[str, dict[str, float]], db: Session = Depends(get_db), _: str = Depends(require_admin)):
    for group, weights in body.items():
        if group not in scoring.DEFAULT_WEIGHTS:
            raise HTTPException(400, f"unknown road group {group}")
        try:
            normalised = scoring.normalise(weights)
        except ValueError as e:
            raise HTTPException(400, str(e))
        profile = db.get(WeightProfile, group)
        if profile is None:
            db.add(WeightProfile(road_group=group, weights=normalised))
        else:
            profile.weights = normalised
    db.flush()
    svc.rescore(db)
    db.commit()
    return {g: svc.weights_for(db, g) for g in scoring.DEFAULT_WEIGHTS}


@router.get("/admin/graph/summary")
def graph_summary(db: Session = Depends(get_db), _: str = Depends(require_admin)):
    kinds = dict(db.execute(select(Facility.kind, func.count()).group_by(Facility.kind)).all())
    areas = [a for (a,) in db.execute(select(Segment.kecamatan).distinct()).all() if a]
    model = {"version": None, "spearman": None}
    info = settings.artifacts_dir / "gnn" / "eval.json"
    if info.exists():
        data = json.loads(info.read_text())
        model = {"version": data.get("version"), "spearman": data.get("test", {}).get("gnn", {}).get("spearman")}
    return {
        "segments": db.scalar(select(func.count()).select_from(Segment)),
        "facilities": kinds,
        "area": sorted(areas),
        "impact_model": model,
    }


class WhatIf(BaseModel):
    repair_segment_ids: list[str]


def _network_or_503():
    try:
        return network.network()
    except Exception:
        raise HTTPException(503, "graph artifacts are not built")


@router.post("/admin/whatif")
def whatif(body: WhatIf, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    from ml.graph.sim import whatif as run

    net = _network_or_503()
    return run(net, network.current_damage(db), body.repair_segment_ids)


@router.get("/admin/whatif/recommend")
def recommend(budget_idr: float | None = None, db: Session = Depends(get_db), _: str = Depends(require_admin)):
    from ml.graph.sim import recommend as run

    net = _network_or_503()
    result = run(net, network.current_damage(db), budget_idr)
    names = dict(db.execute(select(Segment.id, Segment.name).where(
        Segment.id.in_([r["segment_id"] for r in result["order"]]))).all())
    for r in result["order"]:
        r["name"] = names.get(r["segment_id"])
    return result
