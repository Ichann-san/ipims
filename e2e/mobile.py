"""Mobile workspace regression: tests usable content, not just viewport bounds.

Read-only API calls and browser-local fixtures; no incident writes.
Run against the production preview: .venv/Scripts/python e2e/mobile.py
"""
import argparse
import copy
import json
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

SIZES = [(320, 568), (360, 640), (375, 667), (390, 844), (412, 915),
         (430, 932), (844, 390), (768, 1024), (1366, 900)]


def unobstructed(locator):
    """Center and inset corners must hit this control, not persistent chrome."""
    assert locator.evaluate("""e => {
      const r = e.getBoundingClientRect();
      return [[.5,.5],[.15,.2],[.85,.8]].every(([x,y]) => {
        const hit = document.elementFromPoint(r.x+r.width*x, r.y+r.height*y);
        return hit && (e===hit || e.contains(hit));
      });
    }"""), locator


def check(base, shots, sizes=SIZES):
    shots.mkdir(parents=True, exist_ok=True)
    errors, measurements = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        for width, height in sizes:
            compact = width < 768 or (width < 1024 and height <= 500)
            ctx = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
            page = ctx.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(base + "/admin/login")
            login = page.request.post(base + "/api/v1/auth/login", data={"username": "admin", "password": "admin123"})
            assert login.ok
            page.evaluate("t => localStorage.setItem('ipims_admin_token',t)", login.json()["token"])
            for route in ["/", "/laporan", "/peta", "/transparansi", "/admin", "/admin/peta", "/admin/login"]:
                page.goto(base + route)
                expect(page.locator(".site-navbar")).to_have_count(1)
                expect(page.locator(".site-footer")).to_have_count(1)
                page.evaluate("document.fonts.ready")
                if route == "/":
                    expect(page.locator(".home-map")).to_have_attribute("data-map-phase", "ready", timeout=30000)
                page.wait_for_timeout(150)
                footer = page.locator("footer").bounding_box()
                header = page.locator(".site-navbar").bounding_box()
                assert abs(footer["y"] + footer["height"] - height) < 2
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+1"), (width, route)
                if compact:
                    workspace = page.locator(".site-workspace").bounding_box()
                    assert abs(workspace["y"] - header["y"] - header["height"]) < 2
                    assert abs(workspace["y"] + workspace["height"] - footer["y"]) < 2
                    assert footer["height"] <= 65, (width, footer)
                    for name in (["Menu", "Report"] if not route.startswith("/admin") or route == "/admin/login" else ["Menu"]):
                        unobstructed(page.locator(".site-navbar").get_by_role("button", name=name, exact=True))
                if route == "/laporan":
                    first = page.locator(".report-cards > a").first
                    expect(first).to_be_visible()
                    if compact:
                        card = first.bounding_box()
                        assert card["y"] + min(card["height"], 80) < footer["y"], (width, card, footer)
                        unobstructed(first)
                        title = page.get_by_role("heading", name="Reports", exact=True).bounding_box()
                        assert abs(card["x"] - title["x"]) < 2
                        pager = page.locator(".reports-pagination")
                        assert pager.evaluate("e => getComputedStyle(e).position") == "static"
                        pager.scroll_into_view_if_needed()
                        unobstructed(pager.get_by_role("button", name="Next", exact=True))
                        page.locator(".site-workspace").evaluate("e => e.scrollTop = 0")
                if route in ["/", "/peta"]:
                    surface = page.locator(".map-render-surface").bounding_box()
                    viewport = page.locator(".map-viewport").bounding_box()
                    assert abs(surface["height"] / viewport["height"] - 1.1) < .01
                if route in ["/peta", "/admin/peta"]:
                    unobstructed(page.get_by_role("button", name="Zoom in", exact=True))
                    unobstructed(page.get_by_role("button", name="Zoom out", exact=True))
                    logo = page.locator(".mapboxgl-ctrl-logo")
                    expect(logo).to_be_visible(timeout=20000)
                    unobstructed(logo)
                    if compact and route == "/peta":
                        expect(page.locator("[data-map-panel-active]")).to_have_count(0)
                        page.get_by_role("button", name="Layers", exact=True).click()
                        expect(page.locator("[data-map-panel-active]")).to_have_count(1)
                        page.get_by_role("button", name="Close map layers", exact=True).click()
                if route == "/admin" and compact:
                    queue = page.get_by_role("list", name="Officer report queue")
                    if queue.count():
                        expect(queue.locator("a").first).to_be_visible()
                        rect = queue.locator("a").first.bounding_box()
                        assert rect["y"] + 44 < footer["y"], (width, rect)
                if width in [320, 390, 844, 1366] and route in ["/", "/laporan", "/peta", "/admin", "/admin/peta", "/transparansi"]:
                    page.screenshot(path=str(shots / f"{route.strip('/').replace('/','-') or 'home'}-{width}.png"))
                measurements.append({"width": width, "height": height, "route": route, "header": header["height"], "footer": footer["height"]})
            if compact:
                page.goto(base + "/laporan")
                menu = page.get_by_role("button", name="Menu", exact=True)
                menu.click()
                dialog = page.get_by_role("dialog", name="Menu", exact=True)
                expect(dialog.get_by_role("link", name="Transparency", exact=True)).to_be_visible()
                page.keyboard.press("Escape")
                expect(menu).to_be_focused()
                page.get_by_role("button", name="About", exact=True).click()
                about = page.get_by_role("dialog", name="About IPIMS", exact=True)
                for image in about.locator("img").all():
                    expect(image).to_be_visible()
                    assert image.evaluate("e => e.complete && e.naturalWidth>0")
                expect(about).to_contain_text("Agil - Khalisya - Ikhsan")
                page.keyboard.press("Escape")
                page.get_by_role("button", name="Filters", exact=True).click()
                filters = page.get_by_role("dialog", name="Report filters")
                filters.get_by_role("combobox", name="Reports per page", exact=True).select_option("6")
                filters.get_by_role("button", name="Show reports", exact=True).click()
                expect(page.locator(".report-cards > a")).to_have_count(6)
                assert "size=6" in page.url
            ctx.close()
            print(f"passed {width}x{height}", flush=True)

        # Deep selection outside latest100, one panel, expansion and rotation preserve identity.
        ctx = browser.new_context(viewport={"width": 320, "height": 568}, reduced_motion="reduce")
        page = ctx.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        sample = page.request.get(base + "/api/v1/reports?limit=1").json()["items"][0]
        fixture = copy.deepcopy(sample)
        fixture.update(code="MOBILE-LAMP", category="lampu_jalan", segment=None, timeline=[])
        page.route("**/api/v1/reports/MOBILE-LAMP", lambda route: route.fulfill(json=fixture))
        page.goto(base + "/peta?r=MOBILE-LAMP")
        selected = page.get_by_role("region", name="Selected report")
        expect(selected).to_contain_text("Street light", timeout=20000)
        expect(page.locator("[data-map-panel-active]")).to_have_count(1)
        details = selected.get_by_role("button", name="View details", exact=True)
        details.scroll_into_view_if_needed()
        unobstructed(details)
        page.screenshot(path=str(shots / "selected-320.png"))
        details.click()
        expect(page.get_by_role("dialog", name="Report details")).to_contain_text("MOBILE-LAMP")
        page.keyboard.press("Escape")
        page.set_viewport_size({"width": 844, "height": 390})
        expect(selected).to_contain_text("MOBILE-LAMP")
        details.scroll_into_view_if_needed()
        unobstructed(details)
        page.screenshot(path=str(shots / "selected-landscape.png"))

        # Keyboard-like available-height change. No submission or backend writes.
        page.goto(base + "/laporan?buat=1")
        form = page.get_by_role("dialog", name="Report damage", exact=True)
        expect(form).to_be_visible()
        note = form.get_by_label("Note (optional)")
        note.fill("Keep this draft through rotation and keyboard resize.")
        page.set_viewport_size({"width": 390, "height": 420})
        expect(note).to_have_value("Keep this draft through rotation and keyboard resize.")
        note.scroll_into_view_if_needed()
        unobstructed(note)
        close = form.get_by_role("button", name="Close", exact=True)
        unobstructed(close)
        rect = form.bounding_box()
        assert abs(rect["y"]) < 2 and abs(rect["height"] - 420) < 2
        page.screenshot(path=str(shots / "keyboard-form.png"))
        page.keyboard.press("Escape")
        page.set_viewport_size({"width": 390, "height": 844})
        page.goto(base + "/laporan")
        page.evaluate("document.documentElement.style.fontSize='200%'")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+1")
        page.locator(".report-cards > a").first.scroll_into_view_if_needed()
        unobstructed(page.locator(".report-cards > a").first)
        assert page.locator(".report-cards > a").first.evaluate("e => [...e.querySelectorAll('*')].every(child => child.getBoundingClientRect().right <= e.getBoundingClientRect().right+1)")
        assert page.get_by_role("group", name="Report scope").evaluate("e => [...e.children].every(child => child.scrollWidth <= child.clientWidth+1)")
        page.screenshot(path=str(shots / "text-200-percent.png"))
        ctx.close()
        browser.close()
    assert not errors, errors
    (shots / "measurements.json").write_text(json.dumps(measurements, indent=2), encoding="utf-8")
    print(json.dumps({"route_checks": len(measurements), "viewport_sizes": len(sizes), "selection_rotation_filters_focus_keyboard_text_scale": "passed", "browser_errors": errors}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:5289")
    parser.add_argument("--shots", type=Path, default=Path(".venv/mobile-checks"))
    parser.add_argument("--size", action="append", help="Optional focused viewport, for example 844x390")
    args = parser.parse_args()
    check(args.base, args.shots, [tuple(map(int, size.split('x'))) for size in args.size] if args.size else SIZES)
