from app.services import vision

from .conftest import jpeg_bytes

ON_ROAD = {"lat": "-7.7651", "lng": "112.195"}
FAR_AWAY = {"lat": "-7.70", "lng": "112.10"}

FAKE_AI = {
    "category": "jalan", "category_confidence": 0.9, "is_infrastructure": True,
    "damage_type": "pothole", "severity": "high", "severity_score": 0.9, "model_version": "test",
}


def post_report(client, data=ON_ROAD, **extra):
    files = {"photo": ("p.jpg", jpeg_bytes(), "image/jpeg")}
    return client.post("/api/v1/reports", data={**data, **extra}, files=files)


def test_health(client):
    body = client.get("/api/v1/health").json()
    assert body["status"] == "ok" and body["db"] is True


def test_report_without_ai_is_snapped_scored_and_needs_review(client):
    r = post_report(client, category="jalan", description="Lubang besar")
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["code"].startswith("IPIMS-") and body["status"] == "reported"
    assert body["segment"]["id"] == "1-2-0" and body["snap_distance_m"] < 20
    assert body["needs_review"] is True               # no CV model in tests
    assert body["priority_score"] > 0
    assert [c["criterion"] for c in body["priority_breakdown"]][0] == "severity"
    assert [e["to_status"] for e in body["timeline"]] == ["reported"]
    assert client.get(body["photo_url"]).status_code == 200


def test_report_with_ai_is_verified(client, monkeypatch):
    monkeypatch.setattr(vision, "analyze", lambda img: dict(FAKE_AI))
    body = post_report(client).json()
    assert body["category"] == "jalan" and body["category_source"] == "ai"
    assert body["status"] == "ai_verified" and body["needs_review"] is False
    assert [e["to_status"] for e in body["timeline"]] == ["reported", "ai_verified"]
    sev = next(c for c in body["priority_breakdown"] if c["criterion"] == "severity")
    assert sev["value"] == 0.9


def test_report_far_from_road_is_not_snapped(client):
    body = post_report(client, FAR_AWAY, category="drainase").json()
    assert body["segment"] is None and body["needs_review"] is True


def test_rejects_bad_input(client):
    assert post_report(client, category="kapal").status_code == 400
    files = {"photo": ("x.txt", b"not an image", "text/plain")}
    assert client.post("/api/v1/reports", data=ON_ROAD, files=files).status_code == 400


def test_second_report_on_same_segment_raises_priority(client):
    first = post_report(client, category="jalan").json()
    post_report(client, category="jalan")
    again = client.get(f"/api/v1/reports/{first['code']}").json()
    assert again["priority_score"] > first["priority_score"]


def test_list_filters_and_stats(client):
    post_report(client, category="jalan", description="retak")
    post_report(client, FAR_AWAY, category="drainase")
    assert client.get("/api/v1/reports").json()["total"] == 2
    assert client.get("/api/v1/reports", params={"category": "drainase"}).json()["total"] == 1
    assert client.get("/api/v1/reports", params={"q": "uji coba"}).json()["total"] == 1
    bbox = "112.18,-7.77,112.21,-7.76"
    assert client.get("/api/v1/reports", params={"bbox": bbox}).json()["total"] == 1
    stats = client.get("/api/v1/stats").json()
    assert stats["total"] == 2 and stats["by_category"]["jalan"] == 1 and stats["active"] == 2
    seg = client.get("/api/v1/segments", params={"bbox": bbox}).json()
    assert seg["features"][0]["properties"]["active_reports"] == 1


def test_admin_requires_token(client):
    assert client.get("/api/v1/admin/queue").status_code == 401
    assert client.post("/api/v1/auth/login", json={"username": "admin", "password": "x"}).status_code == 401


def test_full_lifecycle(client, admin_headers):
    code = post_report(client, category="jalan").json()["code"]
    patch = lambda body: client.patch(f"/api/v1/admin/reports/{code}", json=body, headers=admin_headers)

    assert patch({"status": "completed"}).status_code == 409
    assert patch({"status": "gov_approved", "note": "valid"}).status_code == 200
    assert patch({"status": "assigned"}).status_code == 409            # needs assigned_to
    assert patch({"status": "assigned", "assigned_to": "Dinas PUPR"}).status_code == 200
    assert patch({"status": "in_repair"}).status_code == 200
    queue = client.get("/api/v1/admin/queue", headers=admin_headers).json()
    assert queue["items"][0]["code"] == code
    done = patch({"status": "completed", "note": "selesai"}).json()
    assert done["status"] == "completed" and done["assigned_to"] == "Dinas PUPR"
    assert [e["to_status"] for e in done["timeline"]] == ["reported", "gov_approved", "assigned", "in_repair", "completed"]
    assert done["timeline"][1]["actor"] == "admin:admin"
    assert client.get("/api/v1/admin/queue", headers=admin_headers).json()["total"] == 0
    stats = client.get("/api/v1/stats").json()
    assert stats["by_status"]["completed"] == 1 and stats["completed_rate"] == 1.0


def test_reject_requires_note(client, admin_headers):
    code = post_report(client, category="jalan").json()["code"]
    url = f"/api/v1/admin/reports/{code}"
    assert client.patch(url, json={"status": "rejected"}, headers=admin_headers).status_code == 409
    assert client.patch(url, json={"status": "rejected", "note": "duplikat"}, headers=admin_headers).status_code == 200


def test_weights_update_rescores(client, admin_headers):
    code = post_report(client, category="jalan").json()["code"]
    before = client.get(f"/api/v1/reports/{code}").json()["priority_score"]
    w = {"severity": 0, "traffic": 0, "population": 0, "facility": 1, "impact": 0, "reports": 0}
    saved = client.put("/api/v1/admin/weights", json={"utama": w}, headers=admin_headers).json()
    assert saved["utama"]["facility"] == 1.0
    after = client.get(f"/api/v1/reports/{code}").json()["priority_score"]
    assert after == 100.0 and after != before


def test_whatif_without_graph_is_503(client, admin_headers):
    r = client.post("/api/v1/admin/whatif", json={"repair_segment_ids": []}, headers=admin_headers)
    assert r.status_code == 503


def test_region(client):
    body = client.get("/api/v1/region").json()
    assert body["name"] == "Kota Surabaya" and len(body["kecamatan"]) == 31
    assert body["bbox"] == [112.19, -7.765, 112.2, -7.765]          # extent of the test segment
    assert body["center"] == [112.195, -7.765]


def test_stats_by_kecamatan(client):
    post_report(client, category="jalan")
    post_report(client, FAR_AWAY, category="drainase")
    assert client.get("/api/v1/stats").json()["by_kecamatan"] == {"Pare": 1, "lainnya": 1}


def test_stats_totals_exceed_queue_page_and_use_wib_months(client, admin_headers):
    from datetime import datetime, timezone
    from geoalchemy2.elements import WKTElement
    from app.db import SessionLocal
    from app.models import Report, StatusEvent

    # Late October UTC is November in Surabaya. All active reports are over 7 days old.
    created = datetime(2020, 10, 31, 18, 0, tzinfo=timezone.utc)
    statuses = ["reported"] * 203 + ["ai_verified", "in_repair", "completed", "rejected"]
    with SessionLocal() as db:
        for i, status in enumerate(statuses):
            report = Report(
                code=f"STATS-{i}", lat=-7.765, lng=112.195,
                location=WKTElement("POINT(112.195 -7.765)", srid=4326),
                category="jalan", category_source="user", photo_path="test.jpg",
                status=status, created_at=created,
            )
            db.add(report)
            if status == "completed":
                report.events.append(StatusEvent(to_status="completed", actor="test", created_at=created))
        db.commit()
    queue = client.get("/api/v1/admin/queue", params={"limit": 200}, headers=admin_headers).json()
    assert len(queue["items"]) == 200 and queue["total"] == 205
    stats = client.get("/api/v1/stats").json()
    assert stats["total"] == 207 and stats["active"] == 205
    assert stats["awaiting_approval"] == 204 and stats["open_over_7_days"] == 205
    assert stats["completed_rate"] == 0.5
    assert stats["monthly"] == [{"month": "2020-11", "reported": 207, "completed": 1}]


def test_active_segments_without_bbox(client):
    assert client.get("/api/v1/segments").status_code == 400
    assert client.get("/api/v1/segments", params={"active": 1}).json()["features"] == []
    post_report(client, category="jalan")
    feats = client.get("/api/v1/segments", params={"active": 1}).json()["features"]
    assert [f["properties"]["id"] for f in feats] == ["1-2-0"] and feats[0]["properties"]["active_reports"] == 1
