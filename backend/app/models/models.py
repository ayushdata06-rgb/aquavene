"""SQLAlchemy models for AquaVane.

All tables defined here with proper constraints, indexes, and PostGIS geometry columns.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

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
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Profile(Base):
    """User profile, references Supabase auth.users when auth is enabled."""

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(50), nullable=False, default="viewer"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Watershed(Base):
    """Watershed / micro-watershed boundary with geometry."""

    __tablename__ = "watersheds"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    watershed_code: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[Optional[str]] = mapped_column(String(100))
    state: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), index=True)
    basin_name: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    area_sq_km: Mapped[Optional[float]] = mapped_column(Float)
    geom = Column(
        Geometry(geometry_type="MULTIPOLYGON", srid=4326), nullable=True
    )
    centroid = Column(
        Geometry(geometry_type="POINT", srid=4326), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    indicators = relationship("WatershedIndicator", back_populates="watershed")
    priority_scores = relationship("PriorityScore", back_populates="watershed")

    __table_args__ = (
        Index("idx_watersheds_geom", "geom", postgresql_using="gist"),
    )


class Dataset(Base):
    """Registered source dataset with full provenance."""

    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dataset_name: Mapped[str] = mapped_column(String(255), nullable=False)
    provider: Mapped[Optional[str]] = mapped_column(String(255))
    dataset_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'raster', 'vector', 'netcdf', 'tabular'
    source_url: Mapped[Optional[str]] = mapped_column(Text)
    licence_or_attribution: Mapped[Optional[str]] = mapped_column(Text)
    reference_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    reference_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    native_resolution: Mapped[Optional[str]] = mapped_column(String(100))
    units: Mapped[Optional[str]] = mapped_column(String(100))
    crs: Mapped[Optional[str]] = mapped_column(String(50))
    file_format: Mapped[Optional[str]] = mapped_column(String(50))
    storage_path: Mapped[Optional[str]] = mapped_column(Text)
    checksum: Mapped[Optional[str]] = mapped_column(String(128))
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="registered"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    versions = relationship("DatasetVersion", back_populates="dataset")
    processing_jobs = relationship("ProcessingJob", back_populates="dataset")


class DatasetVersion(Base):
    """Tracks versions / ingestion records for a dataset."""

    __tablename__ = "dataset_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False
    )
    version_tag: Mapped[str] = mapped_column(String(100), nullable=False)
    checksum: Mapped[Optional[str]] = mapped_column(String(128))
    imported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    validation_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending"
    )
    processing_version: Mapped[Optional[str]] = mapped_column(String(100))
    provenance_json: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)

    dataset = relationship("Dataset", back_populates="versions")

    __table_args__ = (
        UniqueConstraint("dataset_id", "version_tag", name="uq_dataset_version"),
    )


class ProcessingJob(Base):
    """Processing job tracking with status, progress, and errors."""

    __tablename__ = "processing_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dataset_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="SET NULL"), nullable=True
    )
    job_type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending"
    )  # pending, running, completed, failed
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    parameters_json: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    output_metadata_json: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    error_summary: Mapped[Optional[str]] = mapped_column(Text)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))

    dataset = relationship("Dataset", back_populates="processing_jobs")

    __table_args__ = (
        CheckConstraint(
            "progress >= 0 AND progress <= 100", name="ck_job_progress_range"
        ),
    )


class WatershedIndicator(Base):
    """Calculated indicator value for a watershed."""

    __tablename__ = "watershed_indicators"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    watershed_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("watersheds.id", ondelete="CASCADE"),
        nullable=False,
    )
    dataset_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="SET NULL")
    )
    indicator_code: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # erosion_potential, runoff_potential, landcover_degradation, rainfall_pressure, downstream_exposure
    raw_value: Mapped[Optional[float]] = mapped_column(Float)
    normalized_score: Mapped[Optional[float]] = mapped_column(Float)
    unit: Mapped[Optional[str]] = mapped_column(String(50))
    reference_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    reference_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    method_version: Mapped[str] = mapped_column(
        String(50), nullable=False, default="v1.0"
    )
    quality_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="computed"
    )  # computed, estimated, missing, flagged
    uncertainty_note: Mapped[Optional[str]] = mapped_column(Text)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    watershed = relationship("Watershed", back_populates="indicators")

    __table_args__ = (
        UniqueConstraint(
            "watershed_id",
            "indicator_code",
            "method_version",
            "reference_start",
            "reference_end",
            name="uq_watershed_indicator",
        ),
        Index("idx_indicator_code", "indicator_code"),
    )


class ScoringProfile(Base):
    """Named weighting profile for priority scoring."""

    __tablename__ = "scoring_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    weights_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
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
    """Record of a scoring execution."""

    __tablename__ = "scoring_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scoring_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scoring_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    reference_period_start: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    reference_period_end: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True)
    )
    method_version: Mapped[str] = mapped_column(
        String(50), nullable=False, default="v1.0"
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="pending"
    )
    input_dataset_versions_json: Mapped[Optional[dict]] = mapped_column(
        JSONB, default=dict
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    scoring_profile = relationship("ScoringProfile")
    priority_scores = relationship("PriorityScore", back_populates="scoring_run")


class PriorityScore(Base):
    """Priority score result for a watershed in a scoring run."""

    __tablename__ = "priority_scores"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scoring_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scoring_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    watershed_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("watersheds.id", ondelete="CASCADE"),
        nullable=False,
    )
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    priority_category: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # critical, high, medium, low
    rank_position: Mapped[int] = mapped_column(Integer, nullable=False)
    indicator_breakdown_json: Mapped[Optional[dict]] = mapped_column(
        JSONB, default=dict
    )
    data_completeness: Mapped[float] = mapped_column(Float, default=1.0)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    scoring_run = relationship("ScoringRun", back_populates="priority_scores")
    watershed = relationship("Watershed", back_populates="priority_scores")

    __table_args__ = (
        UniqueConstraint(
            "scoring_run_id", "watershed_id", name="uq_score_run_watershed"
        ),
        CheckConstraint(
            "overall_score >= 0 AND overall_score <= 100",
            name="ck_score_range",
        ),
        CheckConstraint(
            "data_completeness >= 0 AND data_completeness <= 1",
            name="ck_data_completeness_range",
        ),
    )


class Scenario(Base):
    """Policy scenario for weight sensitivity analysis."""

    __tablename__ = "scenarios"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    baseline_scoring_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scoring_runs.id", ondelete="SET NULL")
    )
    weights_json: Mapped[dict] = mapped_column(JSONB, nullable=False)
    assumptions_json: Mapped[Optional[dict]] = mapped_column(JSONB, default=dict)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="draft"
    )  # draft, running, completed, failed
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    results = relationship("ScenarioResult", back_populates="scenario")


class ScenarioResult(Base):
    """Comparison result for a watershed in a scenario vs baseline."""

    __tablename__ = "scenario_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    scenario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("scenarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    watershed_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("watersheds.id", ondelete="CASCADE"),
        nullable=False,
    )
    baseline_score: Mapped[float] = mapped_column(Float, nullable=False)
    scenario_score: Mapped[float] = mapped_column(Float, nullable=False)
    baseline_rank: Mapped[int] = mapped_column(Integer, nullable=False)
    scenario_rank: Mapped[int] = mapped_column(Integer, nullable=False)
    score_delta: Mapped[float] = mapped_column(Float, nullable=False)
    rank_delta: Mapped[int] = mapped_column(Integer, nullable=False)
    indicator_breakdown_json: Mapped[Optional[dict]] = mapped_column(
        JSONB, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    scenario = relationship("Scenario", back_populates="results")

    __table_args__ = (
        UniqueConstraint(
            "scenario_id", "watershed_id", name="uq_scenario_watershed"
        ),
    )
