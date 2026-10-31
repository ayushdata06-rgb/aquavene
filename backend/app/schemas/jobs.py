"""Pydantic v2 schemas for Background Processing Jobs."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class JobCreate(BaseModel):
    watershed_id: Optional[uuid.UUID] = None
    job_type: str = Field(..., description="aoi_predict, simulate, raster_extract, whitebox")
    input_geojson: Dict[str, Any] = Field(default_factory=dict)


class JobResponse(BaseModel):
    id: uuid.UUID
    watershed_id: Optional[uuid.UUID] = None
    created_by: Optional[uuid.UUID] = None
    job_type: str
    status: str
    progress_pct: int
    result_json: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    elapsed_seconds: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
