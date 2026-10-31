"""SQLAlchemy models for AquaVane 2.0 with PostGIS geometries and RBAC constraints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from geoalchemy2 import Geometry
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, synonym

from app.db.base import Base


class Profile(Base):
    """User profile referencing Supabase auth.users with strict RBAC role check."""

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50),
        CheckConstraint("role IN ('admin', 'planner', 'officer', 'viewer')", name="ck_profile_role"),
        nullable=False,
        default="viewer",
        index=True,
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    last_active: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    saved_plans = relationship("SavedPlan", back_populates="creator", foreign_keys="SavedPlan.created_by")


class Watershed(Base):
    """Watershed / micro-watershed spatial boundary with PostGIS geometry and terrain metrics."""

    __tablename__ = "watersheds"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    watershed_code: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), default="India")
    state: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    basin_name: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    sub_basin: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    area_sq_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    perimeter_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mean_elevation_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    mean_slope_deg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    drainage_density: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    priority_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    risk_level: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    last_processed: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    geom = Column(Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=True)
    centroid = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    indicators = relationship("WatershedIndicator", back_populates="watershed", cascade="all, delete-orphan")
    priority_scores = relationship("PriorityScore", back_populates="watershed", cascade="all, delete-orphan")
    saved_plans = relationship("SavedPlan", back_populates="watershed")

    __table_args__ = (
        Index("idx_watersheds_geom", "geom", postgresql_using="gist"),
    )


class WatershedIndicator(Base):
    """Raw physical, hydrological, and vulnerability indicator time-series."""

    __tablename__ = "watershed_indicators"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    watershed_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("watersheds.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    indicator_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(30), default="")
    measured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    source: Mapped[str] = mapped_column(String(100), default="ISRO-BHUVAN/IMD")
    raster_resolution_m: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Legacy compatibility fields
    indicator_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    raw_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    normalized_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    watershed = relationship("Watershed", back_populates="indicators")


class ProcessingJob(Base):
    """Asynchronous background geospatial and ML processing job."""

    __tablename__ = "processing_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True, index=True
    )
    watershed_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("watersheds.id", ondelete="SET NULL"), nullable=True
    )
    job_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    progress_pct: Mapped[int] = mapped_column(Integer, default=0)
    input_geojson = Column(JSONB, default=dict)
    result_json = Column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at = synonym("completed_at")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class SavedPlan(Base):
    """Certified civil restoration plan, detailed project report (DPR), and itemized BoQ."""

    __tablename__ = "saved_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    watershed_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("watersheds.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    area_name: Mapped[str] = mapped_column(String(255), nullable=False)
    area_sq_km: Mapped[float] = mapped_column(Float, nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    geojson_aoi = Column(JSONB, default=dict)

    original_score: Mapped[float] = mapped_column(Float, nullable=False)
    simulated_score: Mapped[float] = mapped_column(Float, nullable=False)
    score_improvement_pct: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    original_peak_discharge_m3s: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    simulated_peak_discharge_m3s: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    original_soil_loss_t_ha_yr: Mapped[float] = mapped_column(Float, default=25.0)
    simulated_soil_loss_t_ha_yr: Mapped[float] = mapped_column(Float, default=10.0)

    # 6 Key Restoration Levers
    reforest_pct: Mapped[float] = mapped_column(Float, default=0.0)
    check_dams_count: Mapped[int] = mapped_column(Integer, default=0)
    cct_pct: Mapped[float] = mapped_column(Float, default=0.0)
    stream_repair_km: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    road_stabilisation_km: Mapped[Optional[float]] = mapped_column(Float, default=0.0)
    cover_crop_pct: Mapped[Optional[float]] = mapped_column(Float, default=0.0)

    budget_lakhs_inr: Mapped[float] = mapped_column(Float, nullable=False)
    scheme: Mapped[str] = mapped_column(String(50), default="MGNREGA")
    interventions_json = Column(JSONB, default=list)

    # Phased Activities
    phase_1_activities = Column(JSONB, nullable=True)
    phase_2_activities = Column(JSONB, nullable=True)
    phase_3_activities = Column(JSONB, nullable=True)

    # Approval Workflow
    dpr_status: Mapped[str] = mapped_column(String(20), default="draft", index=True)
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    watershed = relationship("Watershed", back_populates="saved_plans")
    creator = relationship("Profile", foreign_keys=[created_by], back_populates="saved_plans")
    approver = relationship("Profile", foreign_keys=[approved_by])


class Dataset(Base):
    """Registered source dataset with provenance catalog."""

    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dataset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dataset_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_agency: Mapped[str] = mapped_column(String(100), nullable=False)
    resolution: Mapped[Optional[str]] = mapped_column(String(100))
    coverage: Mapped[Optional[str]] = mapped_column(String(100), default="India")
    storage_path: Mapped[Optional[str]] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )



class ScoringProfile(Base):
    """Named weighting profile for priority scoring."""

    __tablename__ = "scoring_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    weights_json = Column(JSONB, nullable=False, default=dict)
    indicator_schema_version: Mapped[str] = mapped_column(
        String(50), nullable=False, default="v1.0"
    )
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

class ScoringRun(Base):
    """Execution run of composite watershed prioritisation scoring."""

    __tablename__ = "scoring_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    run_name: Mapped[Optional[str]] = mapped_column(String(255), default="Default Run")
    scoring_profile_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scoring_profiles.id", ondelete="SET NULL"), nullable=True
    )
    method_version: Mapped[str] = mapped_column(String(50), default="v1.0")
    run_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(50), default="completed")
    weights_used = Column(JSONB, nullable=True, default=dict)
    input_dataset_versions_json = Column(JSONB, nullable=True, default=dict)

    scoring_profile = relationship("ScoringProfile")
    scores = relationship("PriorityScore", back_populates="run", cascade="all, delete-orphan")


class PriorityScore(Base):
    """Calculated composite score and rank for a micro-watershed."""

    __tablename__ = "priority_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    watershed_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("watersheds.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scoring_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scoring_runs.id", ondelete="CASCADE"), nullable=False, index=True
    )
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    priority_category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    rank_position: Mapped[int] = mapped_column(Integer, nullable=False)
    indicator_scores = Column(JSONB, default=dict)
    data_completeness: Mapped[float] = mapped_column(Float, default=1.0)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Aliases for compatibility
    @property
    def run_id(self):
        return self.scoring_run_id

    @property
    def indicator_breakdown_json(self):
        return self.indicator_scores

    watershed = relationship("Watershed", back_populates="priority_scores")
    run = relationship("ScoringRun", back_populates="scores")
    scoring_run = relationship("ScoringRun", viewonly=True)


class Scenario(Base):
    """What-if intervention scenario comparison model."""

    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    base_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scoring_runs.id", ondelete="CASCADE"), nullable=False
    )
    weight_adjustments = Column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    results = relationship("ScenarioResult", back_populates="scenario", cascade="all, delete-orphan")


class ScenarioResult(Base):
    """Result per watershed for a what-if scenario."""

    __tablename__ = "scenario_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=False
    )
    watershed_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("watersheds.id", ondelete="CASCADE"), nullable=False
    )
    baseline_score: Mapped[float] = mapped_column(Float, nullable=False)
    scenario_score: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_rank: Mapped[int] = mapped_column(Integer, nullable=False)
    scenario_rank: Mapped[int] = mapped_column(Integer, nullable=False)
    score_delta: Mapped[float] = mapped_column(Float, nullable=False)
    rank_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    indicator_breakdown_json = Column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    scenario = relationship("Scenario", back_populates="results")
