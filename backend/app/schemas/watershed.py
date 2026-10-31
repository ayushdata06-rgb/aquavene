"""Pydantic v2 schemas for Watersheds and Indicators."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class IndicatorResponse(BaseModel):
    id: uuid.UUID
    watershed_id: uuid.UUID
    indicator_type: str
    value: float
    unit: str
    measured_at: datetime
    source: str
    raster_resolution_m: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class WatershedCreate(BaseModel):
    watershed_code: str = Field(..., examples=["WS-KA-001"])
    name: str = Field(..., examples=["Upper Kali Micro-Catchment"])
    country: str = "India"
    state: str = Field(..., examples=["Karnataka"])
    district: str = Field(..., examples=["Uttara Kannada"])
    basin_name: str = Field(..., examples=["Kali Basin"])
    sub_basin: Optional[str] = None
    area_sq_km: float = Field(..., gt=0)
    perimeter_km: Optional[float] = None
    mean_elevation_m: Optional[float] = None
    mean_slope_deg: Optional[float] = None
    drainage_density: Optional[float] = None
    priority_score: Optional[float] = Field(None, ge=0, le=100)
    risk_level: Optional[str] = "moderate"
    geojson_geometry: Optional[Dict[str, Any]] = None


class WatershedUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    basin_name: Optional[str] = None
    sub_basin: Optional[str] = None
    priority_score: Optional[float] = None
    risk_level: Optional[str] = None


class WatershedResponse(BaseModel):
    id: uuid.UUID
    watershed_code: str
    name: str
    country: Optional[str] = "India"
    state: Optional[str] = None
    district: Optional[str] = None
    basin_name: Optional[str] = None
    sub_basin: Optional[str] = None
    area_sq_km: Optional[float] = None
    perimeter_km: Optional[float] = None
    mean_elevation_m: Optional[float] = None
    mean_slope_deg: Optional[float] = None
    drainage_density: Optional[float] = None
    priority_score: Optional[float] = None
    risk_level: Optional[str] = "moderate"
    centroid: Optional[List[float]] = None
    coordinates: Optional[List[List[List[float]]]] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class WatershedListResponse(BaseModel):
    items: List[WatershedResponse]
    total: int
    page: int
    limit: int
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]] = Field(default_factory=list)
