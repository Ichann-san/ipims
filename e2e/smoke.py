"""End-to-end smoke test of the running app in a real browser (installed Microsoft Edge, headless).

Walks the whole closed loop: a citizen on an emulated phone (with GPS) reports damage, the report shows up in the
public pages, an officer logs in and moves it through approval, assignment, repair and completion, edits weights
and runs a what-if simulation. Fails on any uncaught page error or console error.

Needs the API (port 8000) and the web dev server running. Creates one real report.
Run: python e2e/smoke.py [--base http://localhost:5288] [--shots DIR] [--headed]
"""
import argparse
import json
import re
import ssl
import sys
import urllib.request
from pathlib import Path

from playwright.sync_api import Page, expect, sync_playwright

REPO = Path(__file__).resolve().parent.parent
PHOTO = REPO / "ml" / "data" / "cv" / "images" / "jalan" / "004.jpg"
FALLBACK_PHOTO = REPO / "legacy" / "assets" / "report-lubang.jpg"


class Checker:
    def __init__(self, shots: Path | None):
        self.errors: list[str] = []
        self.steps: list[str] = []
        self.shots = shots

    def watch(self, page: Page, label: str):
        page.on("pageerror", lambda e: self.errors.append(f"[{label}] page error: {e}"))
        page.on("console", lambda m: m.type == "error" and self.errors.append(f"[{label}] console: {m.text}"))

    def ok(self, page: Page, step: str):
        self.steps.append(step)
        print("ok  ", step, flush=True)
        if self.shots:
            name = re.sub(r"[^a-z0-9]+", "-", step.lower()).strip("-")[:50]
            page.screenshot(path=str(self.shots / f"{len(self.steps):02d}-{name}.png"), full_page=True)


def road_point(base: str) -> tuple[float, float]:
    """A location on a real pilot road, taken from an existing report."""
    # The HTTPS dev server uses a self-signed certificate.
    insecure = ssl._create_unverified_context()
    with urllib.request.urlopen(f"{base}/api/v1/reports?limit=1", context=insecure) as r:
        items = json.load(r)["items"]
    if items and items[0]["segment"]:
        return items[0]["lat"], items[0]["lng"]
    return -7.7651, 112.195


def citizen(browser, base: str, c: Checker) -> str:
    lat, lng = road_point(base)
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=2,
        geolocation={"latitude": lat, "longitude": lng, "accuracy": 8}, permissions=["geolocation"], locale="id-ID", ignore_https_errors=True,
    )
    page = ctx.new_page()
    c.watch(page, "citizen")

    page.goto(base + "/")
    expect(page.get_by_role("heading", name=re.compile("Jalan rusak dilaporkan"))).to_be_visible()
    expect(page.get_by_text("Laporan aktif")).to_be_visible()
    c.ok(page, "home with map and stats")

    page.get_by_role("navigation").get_by_role("button", name="Lapor").click()
    form = page.get_by_role("dialog", name="Lapor kerusakan")
    expect(form).to_be_visible()
    form.locator("input[type=file]").set_input_files(str(PHOTO if PHOTO.exists() else FALLBACK_PHOTO))
    expect(form.get_by_text(re.compile(r"^AI: "))).to_be_visible(timeout=60_000)
    expect(form.get_by_text(re.compile(r"GPS ±"))).to_be_visible(timeout=20_000)
    expect(form.get_by_role("combobox")).not_to_have_value("")
    c.ok(page, "photo analysed, GPS located, category prefilled")
    form.locator("textarea").fill("Uji end-to-end: lubang di badan jalan.")
    form.get_by_role("button", name="Kirim laporan").click()
    page.wait_for_url(re.compile(r"/laporan/IPIMS-"), timeout=60_000)
    code = page.url.rstrip("/").split("/")[-1]
    drawer = page.get_by_role("dialog", name=code)
    expect(drawer).to_be_visible()
    expect(drawer.get_by_text("Terverifikasi AI").first).to_be_visible()
    c.ok(page, f"report submitted {code}, detail drawer")

    drawer.get_by_role("button", name="Tutup").click()
    page.get_by_placeholder("Cari kode").fill(code)
    page.get_by_placeholder("Cari kode").press("Enter")
    expect(page.get_by_text("1 laporan", exact=True)).to_be_visible()
    c.ok(page, "search finds the report")

    page.goto(base + "/peta")
    expect(page.locator(".mapboxgl-canvas")).to_be_visible(timeout=20_000)
    c.ok(page, "public map")

    page.goto(base + "/transparansi")
    expect(page.get_by_text("Progres laporan")).to_be_visible()
    expect(page.get_by_text("Posisi laporan")).to_be_visible()
    c.ok(page, "transparency with progress")
    ctx.close()
    return code


def officer(browser, base: str, code: str, password: str, c: Checker):
    ctx = browser.new_context(viewport={"width": 1366, "height": 900}, locale="id-ID", ignore_https_errors=True)
    page = ctx.new_page()
    c.watch(page, "officer")

    page.goto(base + "/admin")
    expect(page.get_by_role("heading", name="Masuk petugas")).to_be_visible()
    page.get_by_label("Password").fill(password)
    page.get_by_role("button", name="Masuk").click()
    expect(page.get_by_role("heading", name="Dasbor")).to_be_visible()
    row = page.locator("tbody tr", has_text=code)
    expect(row).to_be_visible()
    c.ok(page, "officer login and queue")

    row.click()
    drawer = page.get_by_role("dialog", name=code)
    expect(drawer.get_by_text("Prioritas", exact=True)).to_be_visible()
    for action in ["Disetujui Pemerintah", "Ditugaskan", "Dalam Perbaikan", "Selesai"]:
        drawer.get_by_role("button", name=action, exact=True).click()
        expect(drawer.locator("ol.border-l li").last.get_by_text(action)).to_be_visible()
    expect(drawer.locator("ol.border-l li")).to_have_count(6)
    c.ok(page, "lifecycle approve assign repair complete")

    page.goto(f"{base}/laporan/{code}")
    expect(page.get_by_role("dialog", name=code).get_by_text("Ditangani")).to_be_visible()
    c.ok(page, "public detail shows completion")

    page.goto(base + "/admin")
    page.get_by_role("button", name="Bobot prioritas").click()
    page.get_by_role("button", name="Simpan dan hitung ulang").click()
    expect(page.get_by_role("dialog", name="Bobot prioritas")).to_be_hidden()
    c.ok(page, "weights saved and rescored")

    page.goto(base + "/admin/peta")
    page.get_by_role("tab", name="Simulasi").click()
    page.get_by_role("button", name="3 rekomendasi").click()
    expect(page.get_by_text("akses yang pulih")).to_be_visible(timeout=30_000)
    c.ok(page, "what-if simulation on real graph")
    ctx.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:5288")
    ap.add_argument("--password", default="admin123")
    ap.add_argument("--shots", type=Path)
    ap.add_argument("--headed", action="store_true")
    args = ap.parse_args()
    if args.shots:
        args.shots.mkdir(parents=True, exist_ok=True)
    c = Checker(args.shots)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=not args.headed,
                                    args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        try:
            code = citizen(browser, args.base, c)
            officer(browser, args.base, code, args.password, c)
        finally:
            browser.close()
    print(f"\n{len(c.steps)} steps passed")
    if c.errors:
        print("browser errors:\n  " + "\n  ".join(c.errors))
        sys.exit(1)


if __name__ == "__main__":
    main()
