"""Pydantic v2 schemas for all AquaVane API request/response models."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


# ---- Shared ----

class PaginatedParams(BaseModel):
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
    sort_by: Optional[str] = None
    sort_order: str = Field("asc", pattern="^(asc|desc)$")


class PaginatedResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[Any]


class HealthResponse(BaseModel):
    status: str
    database: bool
    postgis: bool
    version: str


class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None


# ---- Watershed ----

class WatershedBase(BaseModel):
    watershed_code: str
    name: str
    country: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    basin_name: Optional[str] = None
    area_sq_km: Optional[float] = None


class WatershedSummary(WatershedBase):
    id: uuid.UUID
    centroid_lat: Optional[float] = None
    centroid_lon: Optional[float] = None
    priority_category: Optional[str] = None
    overall_score: Optional[float] = None

    model_config = {"from_attributes": True}


class WatershedDetail(WatershedSummary):
    indicators: List[IndicatorValue] = []
    created_at: datetime
    updated_at: datetime


class WatershedGeoJSON(BaseModel):
    """GeoJSON FeatureCollection of watershed polygons."""
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]


# ---- Indicator ----

class IndicatorValue(BaseModel):
    id: uuid.UUID
    indicator_code: str
    raw_value: Optional[float] = None
    normalized_score: Optional[float] = None
    unit: Optional[str] = None
    reference_start: Optional[datetime] = None
    reference_end: Optional[datetime] = None
    method_version: str
    quality_status: str
    uncertainty_note: Optional[str] = None
    calculated_at: datetime

    model_config = {"from_attributes": True}


# ---- Dataset ----

class DatasetResponse(BaseModel):
    id: uuid.UUID
    dataset_name: str
    provider: Optional[str] = None
    dataset_type: str
    source_url: Optional[str] = None
    licence_or_attribution: Optional[str] = None
    reference_start: Optional[datetime] = None
    reference_end: Optional[datetime] = None
    native_resolution: Optional[str] = None
    units: Optional[str] = None
    crs: Optional[str] = None
    file_format: Optional[str] = None
    status: str
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Processing Job ----

class ProcessingJobCreate(BaseModel):
    job_type: str
    dataset_id: Optional[uuid.UUID] = None
    parameters: Optional[Dict[str, Any]] = None


class ProcessingJobResponse(BaseModel):
    id: uuid.UUID
    dataset_id: Optional[uuid.UUID] = None
    job_type: str
    status: str
    progress: float
    parameters_json: Optional[Dict[str, Any]] = None
    output_metadata_json: Optional[Dict[str, Any]] = None
    error_summary: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Priority / Ranking ----

class RankingEntry(BaseModel):
    id: Optional[uuid.UUID] = None
    rank_position: int
    watershed_id: uuid.UUID
    watershed_code: str
    watershed_name: str
    state: Optional[str] = None
    district: Optional[str] = None
    basin_name: Optional[str] = None
    area_sq_km: Optional[float] = None
    overall_score: float
    priority_category: str
    indicator_breakdown: Optional[Dict[str, Any]] = None
    data_completeness: float = 1.0
    centroid: Optional[List[float]] = None

    model_config = {"from_attributes": True}


class RankingResponse(BaseModel):
    scoring_run_id: uuid.UUID
    method_version: str
    total: int
    page: int
    page_size: int
    items: List[RankingEntry]


# ---- Scoring Profile ----

class WeightsSchema(BaseModel):
    erosion_potential: float = Field(0.20, ge=0)
    runoff_potential: float = Field(0.25, ge=0)
    landcover_degradation: float = Field(0.15, ge=0)
    rainfall_pressure: float = Field(0.20, ge=0)
    downstream_exposure: float = Field(0.20, ge=0)

    @model_validator(mode="after")
    def weights_sum_to_one(self):
        total = (
            self.erosion_potential
            + self.runoff_potential
            + self.landcover_degradation
            + self.rainfall_pressure
            + self.downstream_exposure
        )
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"Weights must sum to 1.0, got {total:.4f}")
        return self


# ---- Scenario ----

class ScenarioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    baseline_scoring_run_id: Optional[uuid.UUID] = None
    weights: WeightsSchema
    assumptions: Optional[Dict[str, Any]] = None


class ScenarioResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    baseline_scoring_run_id: Optional[uuid.UUID] = None
    weights_json: Dict[str, Any]
    assumptions_json: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScenarioResultEntry(BaseModel):
    watershed_id: uuid.UUID
    watershed_code: str
    watershed_name: str
    baseline_score: float
    scenario_score: float
    baseline_rank: int
    scenario_rank: int
    score_delta: float
    rank_delta: int
    indicator_breakdown: Optional[Dict[str, Any]] = None


class ScenarioResultsResponse(BaseModel):
    scenario_id: uuid.UUID
    scenario_name: str
    status: str
    items: List[ScenarioResultEntry]


# ---- Rainfall ----

class RainfallSummary(BaseModel):
    watershed_id: uuid.UUID
    watershed_name: str
    period: str
    total_mm: Optional[float] = None
    mean_mm: Optional[float] = None
    min_mm: Optional[float] = None
    max_mm: Optional[float] = None
    data_coverage: Optional[float] = None
    native_resolution: Optional[str] = None
    source: str = "ERA5-Land"


class RainfallTimeSeries(BaseModel):
    watershed_id: uuid.UUID
    dates: List[str]
    values: List[Optional[float]]
    unit: str = "mm"
    aggregation: str = "monthly"
    source: str = "ERA5-Land"
    coverage_note: Optional[str] = None


# ---- Terrain & LandCover ----

class TerrainSummary(BaseModel):
    watershed_id: uuid.UUID
    mean_elevation_m: Optional[float] = None
    min_elevation_m: Optional[float] = None
    max_elevation_m: Optional[float] = None
    mean_slope_degrees: Optional[float] = None
    max_slope_degrees: Optional[float] = None
    mean_flow_accumulation: Optional[float] = None
    drainage_density: Optional[float] = None
    processing_status: str
    dem_source: str = "SRTM 30m"
    dem_crs: str = "EPSG:4326"


class LandCoverSummary(BaseModel):
    watershed_id: uuid.UUID
    class_proportions: Dict[str, float] = {}
    dominant_class: Optional[str] = None
    degraded_fraction: Optional[float] = None
    source: str = "ESA WorldCover 10m"
    source_year: Optional[int] = None
    resolution: str = "10m"
    crs: str = "EPSG:4326"
    processing_status: str


# ---- Dashboard ----

class DashboardSummary(BaseModel):
    total_watersheds: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    total_datasets: int
    datasets_count: Optional[int] = None
    last_scoring_date: Optional[datetime] = None
    last_processing_date: Optional[datetime] = None
    category_distribution: Dict[str, int]
    priority_distribution: Optional[Dict[str, int]] = None
    top_watersheds: List[RankingEntry]
    recent_jobs: List[ProcessingJobResponse]
    data_warnings: List[str]
    warnings: Optional[List[str]] = None


# ---- Report ----

class WatershedReportResponse(BaseModel):
    watershed: WatershedSummary
    indicators: List[IndicatorValue]
    scoring_breakdown: Optional[Dict[str, Any]] = None
    data_provenance: List[DatasetResponse]
    limitations: List[str]
    generated_at: datetime


# Fix forward references
WatershedDetail.model_rebuild()
