import io
import os
import tempfile

import psycopg
import pytest

ADMIN_URL = "postgresql://ipims:ipims@127.0.0.1:5433/postgres"
TEST_DB = "ipims_test"

os.environ["IPIMS_DATABASE_URL"] = f"postgresql+psycopg://ipims:ipims@127.0.0.1:5433/{TEST_DB}"
os.environ["IPIMS_MEDIA_DIR"] = tempfile.mkdtemp(prefix="ipims-media-")
os.environ["IPIMS_ARTIFACTS_DIR"] = tempfile.mkdtemp(prefix="ipims-artifacts-")  # no graph/CV in unit tests


def _recreate_db():
    with psycopg.connect(ADMIN_URL, autocommit=True) as conn:
        conn.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
        conn.execute(f"CREATE DATABASE {TEST_DB}")


_recreate_db()

from fastapi.testclient import TestClient  # noqa: E402
from geoalchemy2.shape import from_shape  # noqa: E402
from PIL import Image  # noqa: E402
from shapely.geometry import LineString  # noqa: E402

from app.auth import hash_password  # noqa: E402
from app.db import Base, SessionLocal, engine, init_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Admin, Segment  # noqa: E402

# A road segment in Pare running east-west at lat -7.765.
SEG_LINE = LineString([(112.190, -7.765), (112.200, -7.765)])


@pytest.fixture()
def client():
    init_db()
    with SessionLocal() as db:
        db.add(Admin(username="admin", password_hash=hash_password("secret")))
        db.add(Segment(
            id="1-2-0", name="Jl. Uji Coba", highway="primary", road_group="utama", kecamatan="Pare",
            length_m=1100, traffic_proxy=0.9, population_proxy=0.5, facility_proxy=1.0,
            impact_score=80.0, impact_score_sim=80.0, geom=from_shape(SEG_LINE, srid=4326),
        ))
        db.commit()
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(engine)


@pytest.fixture()
def admin_headers(client):
    token = client.post("/api/v1/auth/login", json={"username": "admin", "password": "secret"}).json()["token"]
    return {"Authorization": f"Bearer {token}"}


def jpeg_bytes() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (64, 48), (120, 120, 120)).save(buf, "JPEG")
    return buf.getvalue()
