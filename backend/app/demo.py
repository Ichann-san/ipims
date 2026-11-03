"""Create demo reports on real pilot road segments, clearly marked as seed data.

Photos are freely licensed Wikimedia Commons images from the CV evaluation set (ml.cv.collect);
each report description carries the photo attribution. The real CV model analyses every photo.
Statuses and timestamps are spread over the last 60 days so the dashboards have history.

Run from backend/: python -m app.demo [--count 30] [--reset]
"""
import argparse
import csv
import random
from datetime import datetime, timedelta, timezone

from PIL import Image
from sqlalchemy import delete, func, select

from .config import REPO_DIR
from .db import SessionLocal, init_db
from .models import Report, Segment, StatusEvent
from .services import reports as svc

CV_DIR = REPO_DIR / "ml" / "data" / "cv"
CATEGORY_OF = {"jalan": "jalan", "trotoar": "trotoar", "drainase": "drainase", "lampu_jalan": "lampu_jalan",
               "halte": "halte", "jembatan": "jembatan"}
DESCRIPTIONS = {
    "jalan": ["Lubang cukup dalam, membahayakan pengendara motor saat malam.", "Aspal retak memanjang, makin parah saat hujan.", "Jalan berlubang di depan pertokoan."],
    "trotoar": ["Paving trotoar terangkat, pejalan kaki terpaksa turun ke jalan.", "Trotoar rusak dekat sekolah."],
    "drainase": ["Saluran tersumbat sampah, air meluap ke jalan saat hujan.", "Selokan dangkal, sering banjir."],
    "lampu_jalan": ["Lampu jalan mati sejak seminggu, area gelap.", "PJU berkedip dan sering padam."],
    "halte": ["Atap halte bocor dan bangku rusak.", "Halte tidak terawat."],
    "jembatan": ["Pagar pengaman jembatan patah.", "Retakan pada lantai jembatan kecil."],
}
# (status path after reporting, weight)
PATHS = [
    ([], 6), (["gov_approved"], 4), (["gov_approved", "assigned"], 4),
    (["gov_approved", "assigned", "in_repair"], 3), (["gov_approved", "assigned", "in_repair", "completed"], 6), (["rejected"], 1),
]
OPD = {"lampu_jalan": "Dinas Perkim (PJU)", "halte": "Dinas Perhubungan"}


def load_photos():
    rejected = {}
    for line in open(REPO_DIR / "ml" / "cv" / "rejected.txt", encoding="utf-8"):
        if ":" in line and not line.startswith("#"):
            c, ids = line.split(":")
            rejected[c.strip()] = set(ids.split())
    rows = list(csv.DictReader(open(CV_DIR / "manifest.csv", encoding="utf-8")))
    return [r for r in rows if r["class"] in CATEGORY_OF and r["file"].split("/")[-1][:3] not in rejected.get(r["class"], set())]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=30)
    ap.add_argument("--reset", action="store_true", help="delete previous seed reports first")
    args = ap.parse_args()
    rng = random.Random(42)
    init_db()
    with SessionLocal() as db:
        if args.reset:
            ids = select(Report.id).where(Report.is_seed.is_(True))
            db.execute(delete(StatusEvent).where(StatusEvent.report_id.in_(ids)))
            db.execute(delete(Report).where(Report.is_seed.is_(True)))
            db.commit()
        segments = db.scalars(select(Segment).where(Segment.name.is_not(None), Segment.length_m > 80)).all()
        if not segments:
            raise SystemExit("no segments loaded; run python -m app.seed first")
        # Favour roads that matter, but keep some local roads.
        weighted = sorted(segments, key=lambda s: -s.impact_score)
        pool = weighted[: max(60, len(weighted) // 10)] + rng.sample(weighted, min(60, len(weighted)))
        photos = load_photos()
        rng.shuffle(photos)
        now = datetime.now(timezone.utc)
        for i in range(args.count):
            photo = photos[i % len(photos)]
            seg = rng.choice(pool)
            lng, lat = db.execute(select(func.ST_X(func.ST_LineInterpolatePoint(Segment.geom, 0.5)),
                                         func.ST_Y(func.ST_LineInterpolatePoint(Segment.geom, 0.5))).where(Segment.id == seg.id)).one()
            lat += rng.uniform(-0.00008, 0.00008)
            lng += rng.uniform(-0.00008, 0.00008)
            cls = photo["class"]
            desc = rng.choice(DESCRIPTIONS[cls]) + f" [Data demo. Foto: {photo['author'] or 'Wikimedia Commons'}, {photo['license']}, Wikimedia Commons]"
            img = Image.open(CV_DIR / photo["file"]).convert("RGB")
            report = svc.create_report(db, img=img, lat=lat, lng=lng, manual_pin=False, gps_accuracy_m=rng.choice([5, 8, 12]),
                                       category=None, description=desc, is_seed=True)
            if report.category != CATEGORY_OF[cls] and rng.random() < 0.5:
                report.category, report.category_source = CATEGORY_OF[cls], "user"
            path = rng.choices([p for p, _ in PATHS], weights=[w for _, w in PATHS])[0]
            created = now - timedelta(days=rng.uniform(0, 60), hours=rng.uniform(0, 12))
            if path:
                t = created + timedelta(minutes=2)
                for status in path:
                    t += timedelta(hours=rng.uniform(2, 60))
                    if t > now:
                        break
                    note = {"gov_approved": "Valid, sesuai foto dan lokasi.", "rejected": "Duplikat laporan sebelumnya.",
                            "completed": "Perbaikan selesai, sudah dicek di lapangan."}.get(status)
                    if status == "assigned":
                        report.assigned_to = OPD.get(report.category, "Dinas PUPR")
                    svc.add_event(db, report, status, "admin:demo", note)
                    db.flush()
                    report.events[-1].created_at = t
            db.flush()
            report.created_at = created
            report.events[0].created_at = created
            if len(report.events) > 1 and report.events[1].to_status == "ai_verified":
                report.events[1].created_at = created + timedelta(seconds=3)
            db.flush()
        svc.rescore(db)
        db.commit()
        print("seed reports:", db.scalar(select(func.count()).select_from(Report).where(Report.is_seed.is_(True))))


if __name__ == "__main__":
    main()
