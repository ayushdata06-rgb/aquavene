"""Pydantic v2 schemas for DPR Proposals and Itemized BoQ Plans."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BoQLineItem(BaseModel):
    item_no: Optional[int] = None
    item_code: Optional[str] = None
    description: str = Field(..., description="Certified scope of works description")
    unit: str = Field("units", description="ha, km, units, sq.m")
    quantity: Any = Field(..., description="Volume or quantity formatted")
    rate_inr: Optional[float] = 0.0
    unit_rate_lakhs: Optional[float] = None
    amount_lakhs: Optional[float] = None
    total_cost_lakhs: Optional[float] = None
    estimated_cost_lakhs_inr: Optional[float] = None
    title: Optional[str] = None
    scheme: str = "MGNREGA"
    phase: int = 1


class PlanCreate(BaseModel):
    area_name: str = Field(..., min_length=2, max_length=255)
    watershed_id: Optional[uuid.UUID] = None
    area_sq_km: float = Field(..., gt=0)
    state: Optional[str] = None
    district: Optional[str] = None
    geojson_aoi: Optional[Dict[str, Any]] = None

    original_score: float = Field(..., ge=0, le=100)
    simulated_score: float = Field(..., ge=0, le=100)
    original_peak_discharge_m3s: Optional[float] = None
    simulated_peak_discharge_m3s: Optional[float] = None
    original_soil_loss: Optional[float] = 25.0
    simulated_soil_loss: Optional[float] = 10.0
    original_soil_loss_t_ha_yr: Optional[float] = None
    simulated_soil_loss_t_ha_yr: Optional[float] = None

    # Restoration Levers
    reforest_pct: float = Field(0.0, ge=0, le=100)
    check_dams_count: int = Field(0, ge=0, le=50)
    cct_pct: float = Field(0.0, ge=0, le=100)
    stream_repair_km: Optional[float] = 0.0
    road_stabilisation_km: Optional[float] = 0.0
    cover_crop_pct: Optional[float] = 0.0

    budget_lakhs_inr: float = Field(..., ge=0)
    scheme: str = "MGNREGA"
    interventions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    phase_1_activities: Optional[List[Dict[str, Any]]] = None
    phase_2_activities: Optional[List[Dict[str, Any]]] = None
    phase_3_activities: Optional[List[Dict[str, Any]]] = None


class PlanUpdate(BaseModel):
    area_name: Optional[str] = None
    dpr_status: Optional[str] = Field(None, description="'draft', 'submitted', or 'approved'")
    budget_lakhs_inr: Optional[float] = None
    interventions: Optional[List[Dict[str, Any]]] = None


class PlanApproval(BaseModel):
    dpr_status: str = Field("approved", description="'approved' or 'rejected'")
    comments: Optional[str] = None


class PlanResponse(BaseModel):
    id: uuid.UUID
    area_name: str
    watershed_id: Optional[uuid.UUID] = None
    created_by: Optional[uuid.UUID] = None
    area_sq_km: float
    state: Optional[str] = None
    district: Optional[str] = None
    original_score: float
    simulated_score: float
    score_improvement_pct: Optional[float] = None
    original_soil_loss: float
    simulated_soil_loss: float
    reforest_pct: float
    check_dams_count: int
    cct_pct: float
    stream_repair_km: Optional[float] = 0.0
    road_stabilisation_km: Optional[float] = 0.0
    cover_crop_pct: Optional[float] = 0.0
    budget_lakhs_inr: float
    scheme: str = "MGNREGA"
    dpr_status: str = "draft"
    interventions: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    phase_1_activities: Optional[List[Dict[str, Any]]] = None
    phase_2_activities: Optional[List[Dict[str, Any]]] = None
    phase_3_activities: Optional[List[Dict[str, Any]]] = None
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
