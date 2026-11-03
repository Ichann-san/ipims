"""Collect a small labelled image set from Wikimedia Commons (freely licensed) for CV evaluation.

Labels come from the search query, then every image is checked by eye on a contact sheet
(`python -m ml.cv.collect --sheets`) and wrong ones are listed in `ml/cv/rejected.txt`.

Writes ml/data/cv/images/<class>/<n>.jpg and ml/data/cv/manifest.csv (file, class, title, license, author, url).
Run: python -m ml.cv.collect
"""
import argparse
import csv
import io
import re
import time
from pathlib import Path

import requests
from PIL import Image, ImageDraw

ML_DIR = Path(__file__).resolve().parent.parent
OUT = ML_DIR / "data" / "cv"
API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {"User-Agent": "IPIMS-research/1.0 (student competition project; contact via repository)"}

QUERIES = {
    "jalan": ["pothole road", "damaged asphalt road", "jalan rusak berlubang"],
    "trotoar": ["damaged sidewalk", "broken sidewalk pavement", "trotoar rusak"],
    "drainase": ["drainage ditch street", "clogged drain street", "selokan"],
    "lampu_jalan": ["street light pole", "broken street lamp", "lampu jalan"],
    "halte": ["bus stop shelter", "halte bus"],
    "jembatan": ["damaged bridge", "small bridge river village", "jembatan"],
    "bukan": ["cat portrait", "food dish plate", "flower garden", "people portrait smiling"],
}
PER_QUERY = 14


def search(session, query: str, limit: int) -> list[dict]:
    params = {
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6,
        "gsrsearch": f"{query} filetype:bitmap", "gsrlimit": limit, "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime", "iiurlwidth": 384, "maxlag": 5,
    }
    for attempt in range(5):
        r = session.get(API, params=params, timeout=60)
        if r.status_code == 200 and r.headers.get("content-type", "").startswith("application/json"):
            pages = r.json().get("query", {}).get("pages", {})
            return sorted(pages.values(), key=lambda p: p.get("index", 0))
        time.sleep(5 * (attempt + 1))
    return []


def _meta(info, key):
    value = info.get("extmetadata", {}).get(key, {}).get("value", "")
    return re.sub("<[^>]+>", "", value).strip()


def collect():
    session = requests.Session()
    session.headers.update(HEADERS)
    rows, seen = [], set()
    for cls, queries in QUERIES.items():
        (OUT / "images" / cls).mkdir(parents=True, exist_ok=True)
        n = 0
        for q in queries:
            for page in search(session, q, PER_QUERY):
                info = (page.get("imageinfo") or [{}])[0]
                if page["title"] in seen or info.get("mime") not in ("image/jpeg", "image/png"):
                    continue
                license_name = _meta(info, "LicenseShortName")
                if not license_name or "fair use" in license_name.lower():
                    continue
                try:
                    data = session.get(info["thumburl"], timeout=60).content
                    img = Image.open(io.BytesIO(data)).convert("RGB")
                except Exception:
                    continue
                seen.add(page["title"])
                rel = f"images/{cls}/{n:03d}.jpg"
                img.save(OUT / rel, "JPEG", quality=90)
                rows.append({"file": rel, "class": cls, "title": page["title"], "license": license_name,
                             "author": _meta(info, "Artist")[:120], "url": info.get("descriptionurl", "")})
                n += 1
                time.sleep(0.3)
            time.sleep(1.0)
        print(cls, n)
    with open(OUT / "manifest.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)


def sheets():
    """One numbered contact sheet per class for manual label checking."""
    rows = list(csv.DictReader(open(OUT / "manifest.csv", encoding="utf-8")))
    by_cls: dict[str, list] = {}
    for r in rows:
        by_cls.setdefault(r["class"], []).append(r)
    (OUT / "sheets").mkdir(exist_ok=True)
    for cls, items in by_cls.items():
        cols, size = 6, 160
        rows_n = (len(items) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * size, rows_n * size), "white")
        draw = ImageDraw.Draw(sheet)
        for i, r in enumerate(items):
            img = Image.open(OUT / r["file"])
            img.thumbnail((size - 4, size - 20))
            x, y = (i % cols) * size, (i // cols) * size
            sheet.paste(img, (x + 2, y + 18))
            draw.text((x + 4, y + 2), Path(r["file"]).stem, fill="red")
        sheet.save(OUT / "sheets" / f"{cls}.jpg", quality=85)
        print(OUT / "sheets" / f"{cls}.jpg")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheets", action="store_true")
    args = ap.parse_args()
    sheets() if args.sheets else collect()
