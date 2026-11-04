"""Focused chrome/map/pagination checks; mocked inventory never writes demo reports.

Run with the production preview/API available: python e2e/layout.py --base http://localhost:5288
"""
import argparse
import asyncio
import copy
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from playwright.async_api import async_playwright, expect, Error


async def check(base: str, shots: Path | None):
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        errors = []
        checks = 0
        for width, height in [(1366, 900), (390, 844)]:
            context = await browser.new_context(viewport={"width": width, "height": height})
            page = await context.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)))
            await page.goto(base + "/admin/login")
            response = await page.request.post(base + "/api/v1/auth/login", data={"username": "admin", "password": "admin123"})
            assert response.ok
            await page.evaluate("t => localStorage.setItem('ipims_admin_token', t)", (await response.json())["token"])
            for route in ["/", "/laporan", "/peta", "/transparansi", "/admin", "/admin/peta", "/admin/login", "/dev/ui"]:
                await page.goto(base + route)
                await expect(page.locator("footer")).to_have_count(1)
                await expect(page.locator(".site-frame > nav")).to_have_count(1)
                await page.wait_for_timeout(250)
                footer = await page.locator("footer").bounding_box()
                assert abs(footer["y"] + footer["height"] - height) < 2, (route, footer)
                assert await page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"), route
                if route in ["/", "/peta"]:
                    surface = await page.locator(".map-render-surface").bounding_box()
                    assert abs(surface["height"] / height - 1.1) < 0.01
                    assert await page.evaluate("document.documentElement.scrollHeight <= innerHeight + 1")
                    await expect(page.locator(".mapboxgl-ctrl-attrib-button")).to_have_count(0)
                if route == "/":
                    await expect(page.locator(".home-map")).to_have_attribute("data-map-phase", "ready", timeout=25000)
                if route in ["/peta", "/admin/peta"]:
                    toggle = page.get_by_role("button", name="Detailed 3D buildings")
                    await expect(toggle).to_have_attribute("aria-pressed", "false")
                    await toggle.click()
                    await expect(toggle).to_have_attribute("aria-pressed", "true")
                    await toggle.click()
                    await expect(toggle).to_have_attribute("aria-pressed", "false")
                    dock = await page.get_by_role("toolbar", name="Map controls").bounding_box()
                    assert dock["y"] > 80 and dock["y"] + dock["height"] < footer["y"]
                    for name in ["Zoom in", "Zoom out", "Reset north"]:
                        await page.get_by_role("button", name=name, exact=True).click()
                if route == "/laporan":
                    await expect(page.locator(".report-cards > a")).to_have_count(9 if width > 1000 else 3)
                    cards = await page.locator(".report-cards > a").evaluate_all("els => els.map(e => e.getBoundingClientRect().top)")
                    assert sum(abs(top - cards[0]) < 2 for top in cards) == (3 if width > 1000 else 1)
                if shots:
                    shots.mkdir(parents=True, exist_ok=True)
                    await page.screenshot(path=str(shots / f"{route.strip('/').replace('/', '-') or 'home'}-{width}.png"), full_page=route not in ["/", "/peta", "/admin/peta"])
                checks += 1
            await context.close()

        context = await browser.new_context(viewport={"width": 1366, "height": 900})
        page = await context.new_page()
        page.on("pageerror", lambda error: errors.append(str(error)))
        response = await page.request.get(base + "/api/v1/reports?limit=1")
        sample = (await response.json())["items"][0]
        observed = []
        inventory_total = 137

        async def inventory(route):
            query = parse_qs(urlsplit(route.request.url).query)
            limit = int(query.get("limit", [20])[0]); offset = int(query.get("offset", [0])[0])
            q = query.get("q", [""])[0]
            observed.append((limit, offset, q))
            if q == "slow":
                await asyncio.sleep(0.8)
            if q == "error":
                await route.fulfill(status=503, json={"detail": "Verification error"})
                return
            total = 0 if q == "none" else inventory_total
            items = []
            for i in range(offset, min(offset + limit, total)):
                item = copy.deepcopy(sample)
                item["code"] = f"LAYOUT-{i:03}"
                item["segment"]["name"] = f"{q or 'Report'} street {i}"
                items.append(item)
            try:
                await route.fulfill(json={"items": items, "total": total})
            except Error:
                if q != "slow":
                    raise

        async def detail(route):
            item = copy.deepcopy(sample)
            item["code"] = urlsplit(route.request.url).path.split("/")[-1]
            item["timeline"] = []
            await route.fulfill(json=item)

        await page.route("**/api/v1/reports?*", inventory)
        await page.route("**/api/v1/reports/LAYOUT-*", detail)
        await page.goto(base + "/laporan")
        cards = page.locator(".report-cards > a")
        await expect(cards).to_have_count(9)
        await page.get_by_role("combobox", name="Reports per page").select_option("12")
        await expect(cards).to_have_count(12)
        await page.get_by_role("button", name="Page 12", exact=True).click()
        await expect(cards).to_have_count(5)
        assert (12, 132, "") in observed
        await page.goto(base + "/laporan?size=12&page=9999")
        await expect(cards).to_have_count(5)
        await expect(page).to_have_url(base + "/laporan?size=12&page=12")
        inventory_total = 12
        await page.reload()
        await expect(cards).to_have_count(12)
        assert parse_qs(urlsplit(page.url).query)["page"] == ["1"]
        inventory_total = 137
        await page.goto(base + "/laporan?size=12&page=12")
        await expect(cards).to_have_count(5)
        await cards.first.click()
        await expect(page.get_by_role("dialog", name="LAYOUT-132")).to_be_visible()
        await page.go_back()
        await expect(cards).to_have_count(5)
        await page.go_forward()
        await page.get_by_role("button", name="Close", exact=True).click()
        assert parse_qs(urlsplit(page.url).query)["page"] == ["12"]
        await expect(cards).to_have_count(5)
        await page.get_by_role("combobox", name="Category", exact=True).select_option("jalan")
        await expect(cards).to_have_count(12)
        assert parse_qs(urlsplit(page.url).query)["page"] == ["1"]
        search = page.get_by_placeholder("Search code, road, note")
        await search.fill("none"); await search.press("Enter")
        await expect(page.get_by_text("No matching reports.", exact=True)).to_be_visible()
        await search.fill("error"); await search.press("Enter")
        await expect(page.get_by_role("button", name="Retry", exact=True)).to_be_visible()
        await search.fill("slow"); await search.press("Enter")
        await page.wait_for_timeout(80)
        await search.fill("fast"); await search.press("Enter")
        await expect(cards.first).to_contain_text("fast street 0")
        await page.wait_for_timeout(1000)
        await expect(cards.first).to_contain_text("fast street 0")
        await page.set_viewport_size({"width": 683, "height": 450})
        assert await page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        footer = await page.locator("footer").bounding_box()
        pager = await page.locator(".reports-pagination").bounding_box()
        assert pager["y"] + pager["height"] < footer["y"]
        await context.close()
        await browser.close()
        assert not errors, errors
        print(json.dumps({"route_layout_checks": checks, "pagination": "137 reports, last page, filters, Back/Forward, empty and stale responses passed", "browser_errors": errors}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://localhost:5288")
    parser.add_argument("--shots", type=Path)
    args = parser.parse_args()
    asyncio.run(check(args.base, args.shots))
