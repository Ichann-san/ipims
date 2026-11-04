"""Read-only presentation/focus checks against the production preview and live API."""
import argparse
import copy
import json
from pathlib import Path
from playwright.sync_api import sync_playwright, expect


def check(base: str, shots: Path):
    shots.mkdir(parents=True, exist_ok=True)
    errors = []
    checks = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=True)
        for width, height in [(1366, 900), (768, 800), (390, 844), (320, 568), (683, 450)]:
            context = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce", device_scale_factor=2 if width == 683 else 1)
            page = context.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)))
            login = page.request.post(base + "/api/v1/auth/login", data={"username": "admin", "password": "admin123"})
            assert login.ok
            page.goto(base + "/admin/login")
            page.evaluate("t => localStorage.setItem('ipims_admin_token', t)", login.json()["token"])
            for route in ["/", "/laporan", "/peta", "/transparansi", "/admin", "/admin/peta", "/admin/login", "/dev/ui"]:
                page.goto(base + route)
                expect(page.locator("footer")).to_have_count(1)
                page.evaluate("document.fonts.ready")
                page.wait_for_timeout(250)
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), (width, route)
                assert page.evaluate("document.fonts.check('14px \"Plus Jakarta Sans Variable\"')")
                assert "Intelligence Public Infrastructure Management System" == page.title()
                for image in page.locator("footer img").all():
                    assert image.evaluate("e => e.complete && e.naturalWidth > 0")
                footer = page.locator("footer").bounding_box()
                assert abs(footer["y"] + footer["height"] - height) < 2
                for selector in [".map-control-position", ".reports-pagination"]:
                    element = page.locator(selector)
                    if element.count():
                        if selector == '.reports-pagination' and width < 768:
                            element.scroll_into_view_if_needed()
                        rect = element.bounding_box()
                        assert rect["y"] + rect["height"] <= footer["y"], (width, route, selector)
                        if selector == '.map-control-position':
                            header = page.locator('.site-frame > nav').bounding_box()
                            assert rect['y'] >= header['y'] + header['height'], (width, route, 'dock overlaps header')
                if route in ["/", "/peta"]:
                    canvas = page.locator(".map-render-surface").bounding_box()
                    viewport = page.locator(".map-viewport").bounding_box()
                    assert abs(canvas["height"] / viewport["height"] - 1.1) < .01
                if route == "/dev/ui":
                    assert page.evaluate("!!getComputedStyle(document.documentElement).getPropertyValue('--color-blue-soft').trim()")
                    assert page.evaluate("!!getComputedStyle(document.documentElement).getPropertyValue('--color-ink-700').trim()")
                    page.screenshot(path=str(shots / f"catalog-{width}.png"))
                if route == "/transparansi" and width in [1366, 390]:
                    page.screenshot(path=str(shots / f"transparency-{width}.png"), full_page=True)
                checks += 1

            # Sheets and nested modals must trap focus independently, close one at a time,
            # restore their opener, and restore document scrolling after the last close.
            page.goto(base + "/dev/ui")
            opener = page.get_by_role("button", name="Open sheet", exact=True)
            opener.click()
            sheet = page.get_by_role("dialog", name="Example sheet", exact=True)
            expect(sheet).to_be_visible()
            for _ in range(10):
                page.keyboard.press("Tab")
                assert sheet.evaluate("e => e.contains(document.activeElement)")
            nested = sheet.get_by_role("button", name="Open nested modal", exact=True)
            nested.click()
            modal = page.get_by_role("dialog", name="Example modal", exact=True)
            expect(modal).to_be_visible()
            for _ in range(10):
                page.keyboard.press("Tab")
                assert modal.evaluate("e => e.contains(document.activeElement)")
            page.keyboard.press("Escape")
            expect(modal).to_have_count(0)
            expect(sheet).to_be_visible()
            expect(nested).to_be_focused()
            page.keyboard.press("Escape")
            expect(sheet).to_have_count(0)
            expect(opener).to_be_focused()
            assert page.evaluate("document.body.style.overflow !== 'hidden'")
            context.close()

        context = browser.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        page = context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        sample = page.request.get(base + "/api/v1/reports?limit=1").json()["items"][0]
        fixture = copy.deepcopy(sample)
        fixture.update(code="CONSISTENCY-LAMP", category="lampu_jalan", segment=None, impact_score=None, priority_score=None, timeline=[])
        page.route("**/api/v1/reports/CONSISTENCY-LAMP", lambda route: route.fulfill(json=fixture))
        page.goto(base + "/laporan/CONSISTENCY-LAMP")
        dialog = page.get_by_role("dialog", name="CONSISTENCY-LAMP")
        expect(dialog).to_contain_text("Street light")
        expect(dialog).not_to_contain_text("Outside the road")
        expect(dialog).not_to_contain_text("Nearby road:")
        page.get_by_role("button", name="Close", exact=True).click()
        # Deep links must resolve a report even if it lies outside the latest-100 list.
        page.goto(base + "/peta?r=CONSISTENCY-LAMP")
        popup = page.get_by_role("region", name="Selected report")
        expect(popup).to_contain_text("Street light", timeout=20000)
        assert "Plus Jakarta Sans" in popup.evaluate("e => getComputedStyle(e).fontFamily")
        manifest = page.request.get(base + "/manifest.webmanifest").json()
        for icon in manifest["icons"]:
            response = page.request.get(base + icon["src"])
            assert response.ok and response.headers.get("content-type", "").startswith("image/")
        # Network failure must not look like an empty inventory.
        page.route("**/api/v1/reports?*", lambda route: route.fulfill(status=503, json={"detail": "Fixture unavailable"}))
        page.goto(base + "/laporan")
        expect(page.get_by_role("button", name="Retry", exact=True)).to_be_visible()
        expect(page.get_by_text("Report count unavailable", exact=True)).to_be_visible()
        expect(page.get_by_text("0 reports", exact=True)).to_have_count(0)
        context.close()
        browser.close()
    assert not errors, errors
    print(json.dumps({"route_checks": checks, "focus": "nested trap/restore passed at five viewport layouts", "off_road_identity": "passed", "map_deep_link_and_font": "passed", "errors": errors}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:5289")
    parser.add_argument("--shots", type=Path, default=Path(".venv/refactor-checks/consistency"))
    args = parser.parse_args()
    check(args.base, args.shots)
