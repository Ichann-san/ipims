from datetime import datetime, timezone

from geoalchemy2 import Geometry
from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Segment(Base):
    __tablename__ = "segments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str | None] = mapped_column(String(200))
    highway: Mapped[str] = mapped_column(String(40))
    road_group: Mapped[str] = mapped_column(String(20))
    kecamatan: Mapped[str | None] = mapped_column(String(60))
    length_m: Mapped[float] = mapped_column(Float)
    traffic_proxy: Mapped[float] = mapped_column(Float)
    population_proxy: Mapped[float] = mapped_column(Float)
    facility_proxy: Mapped[float] = mapped_column(Float)
    impact_score: Mapped[float] = mapped_column(Float, default=0.0)       # GNN prediction, 0..100
    impact_score_sim: Mapped[float] = mapped_column(Float, default=0.0)   # simulation ground truth, 0..100
    geom = mapped_column(Geometry("LINESTRING", srid=4326, spatial_index=True))


class Facility(Base):
    __tablename__ = "facilities"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    kind: Mapped[str] = mapped_column(String(20))
    name: Mapped[str | None] = mapped_column(String(200))
    geom = mapped_column(Geometry("POINT", srid=4326, spatial_index=True))


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str | None] = mapped_column(String(32), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    location = mapped_column(Geometry("POINT", srid=4326, spatial_index=True))
    manual_pin: Mapped[bool] = mapped_column(Boolean, default=False)
    gps_accuracy_m: Mapped[float | None] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(20))
    category_source: Mapped[str] = mapped_column(String(10))
    description: Mapped[str | None] = mapped_column(Text)
    photo_path: Mapped[str] = mapped_column(String(200))
    ai: Mapped[dict | None] = mapped_column(JSON)
    segment_id: Mapped[str | None] = mapped_column(ForeignKey("segments.id"), index=True)
    snap_distance_m: Mapped[float | None] = mapped_column(Float)
    impact_score: Mapped[float | None] = mapped_column(Float)
    priority_score: Mapped[float | None] = mapped_column(Float, index=True)
    priority_breakdown: Mapped[list | None] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(String(20), index=True)
    assigned_to: Mapped[str | None] = mapped_column(String(120))
    is_seed: Mapped[bool] = mapped_column(Boolean, default=False)

    segment: Mapped[Segment | None] = relationship(lazy="joined")
    events: Mapped[list["StatusEvent"]] = relationship(
        back_populates="report", order_by="StatusEvent.id", cascade="all, delete-orphan"
    )


class StatusEvent(Base):
    __tablename__ = "status_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), index=True)
    from_status: Mapped[str | None] = mapped_column(String(20))
    to_status: Mapped[str] = mapped_column(String(20))
    actor: Mapped[str] = mapped_column(String(80))
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    report: Mapped[Report] = relationship(back_populates="events")


class Admin(Base):
    __tablename__ = "admins"

    username: Mapped[str] = mapped_column(String(60), primary_key=True)
    password_hash: Mapped[str] = mapped_column(String(200))


class WeightProfile(Base):
    __tablename__ = "weight_profiles"

    road_group: Mapped[str] = mapped_column(String(20), primary_key=True)
    weights: Mapped[dict] = mapped_column(JSON)
