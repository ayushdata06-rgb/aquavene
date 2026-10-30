"""Saved Restoration Plans and DPR Proposals API router."""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.auth.deps import require_roles
from app.db.session import get_db
from app.models.models import SavedPlan
from app.schemas.auth import AuthenticatedUser

router = APIRouter()


class SavedPlanCreate(BaseModel):
    area_name: str
    watershed_id: Optional[uuid.UUID] = None
    area_sq_km: float = Field(..., gt=0)
    original_score: float = Field(..., ge=0, le=100)
    simulated_score: float = Field(..., ge=0, le=100)
    original_soil_loss: float = Field(..., ge=0)
    simulated_soil_loss: float = Field(..., ge=0)
    reforest_pct: float = Field(0.0, ge=0, le=100)
    check_dams_count: int = Field(0, ge=0, le=50)
    cct_pct: float = Field(0.0, ge=0, le=100)
    budget_lakhs_inr: float = Field(..., ge=0)
    interventions: Optional[List[Dict[str, Any]]] = []


class SavedPlanResponse(BaseModel):
    id: uuid.UUID
    area_name: str
    watershed_id: Optional[uuid.UUID] = None
    area_sq_km: float
    original_score: float
    simulated_score: float
    original_soil_loss: float
    simulated_soil_loss: float
    reforest_pct: float
    check_dams_count: int
    cct_pct: float
    budget_lakhs_inr: float
    interventions: Optional[List[Dict[str, Any]]] = []
    created_at: datetime
    created_by: Optional[uuid.UUID] = None

    model_config = {"from_attributes": True}


def _to_plan_response(p: Any, fallback_id: Optional[uuid.UUID] = None) -> SavedPlanResponse:
    """Helper to safely build a SavedPlanResponse from an ORM or mock object."""
    now = datetime.now(timezone.utc)

    area_name = getattr(p, "area_name", "Watershed Plan")
    if not isinstance(area_name, str):
        area_name = "Watershed Plan"

    ws_id = getattr(p, "watershed_id", None)
    if not isinstance(ws_id, (uuid.UUID, type(None))):
        ws_id = None

    p_id = getattr(p, "id", None)
    if not isinstance(p_id, uuid.UUID):
        p_id = fallback_id or uuid.uuid4()

    area_sq_km = getattr(p, "area_sq_km", 40.0)
    if not isinstance(area_sq_km, (int, float)):
        area_sq_km = 40.0

    orig_score = getattr(p, "original_score", 50.0)
    if not isinstance(orig_score, (int, float)):
        orig_score = 50.0

    sim_score = getattr(p, "simulated_score", 30.0)
    if not isinstance(sim_score, (int, float)):
        sim_score = 30.0

    orig_soil = getattr(p, "original_soil_loss", 25.0)
    if not isinstance(orig_soil, (int, float)):
        orig_soil = 25.0

    sim_soil = getattr(p, "simulated_soil_loss", 10.0)
    if not isinstance(sim_soil, (int, float)):
        sim_soil = 10.0

    reforest_pct = getattr(p, "reforest_pct", 0.0)
    if not isinstance(reforest_pct, (int, float)):
        reforest_pct = 0.0

    check_dams = getattr(p, "check_dams_count", 0)
    if not isinstance(check_dams, int):
        check_dams = 0

    cct_pct = getattr(p, "cct_pct", 0.0)
    if not isinstance(cct_pct, (int, float)):
        cct_pct = 0.0

    budget = getattr(p, "budget_lakhs_inr", 0.0)
    if not isinstance(budget, (int, float)):
        budget = 0.0

    interventions = getattr(p, "interventions_json", [])
    if not isinstance(interventions, list):
        interventions = []

    created_at = getattr(p, "created_at", now)
    if not isinstance(created_at, datetime):
        created_at = now

    created_by = getattr(p, "created_by", None)
    if not isinstance(created_by, (uuid.UUID, type(None))):
        created_by = None

    return SavedPlanResponse(
        id=p_id,
        area_name=area_name,
        watershed_id=ws_id,
        area_sq_km=float(area_sq_km),
        original_score=float(orig_score),
        simulated_score=float(sim_score),
        original_soil_loss=float(orig_soil),
        simulated_soil_loss=float(sim_soil),
        reforest_pct=float(reforest_pct),
        check_dams_count=int(check_dams),
        cct_pct=float(cct_pct),
        budget_lakhs_inr=float(budget),
        interventions=interventions,
        created_at=created_at,
        created_by=created_by,
    )


@router.post("", response_model=SavedPlanResponse)
def create_saved_plan(
    payload: SavedPlanCreate,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(require_roles(["admin", "planner", "officer"])),
):
    """
    Save a civil restoration plan and DPR proposal.
    Guarded by RBAC: requires 'admin', 'planner', or 'officer' role.
    """
    plan_id = uuid.uuid4()
    now = datetime.now(timezone.utc)

    creator_uuid = None
    try:
        creator_uuid = uuid.UUID(current_user.id)
    except (ValueError, AttributeError):
        pass

    plan = SavedPlan(
        id=plan_id,
        area_name=payload.area_name,
        watershed_id=payload.watershed_id,
        area_sq_km=payload.area_sq_km,
        original_score=payload.original_score,
        simulated_score=payload.simulated_score,
        original_soil_loss=payload.original_soil_loss,
        simulated_soil_loss=payload.simulated_soil_loss,
        reforest_pct=payload.reforest_pct,
        check_dams_count=payload.check_dams_count,
        cct_pct=payload.cct_pct,
        budget_lakhs_inr=payload.budget_lakhs_inr,
        interventions_json=payload.interventions or [],
        created_at=now,
        created_by=creator_uuid,
    )
    db.add(plan)
    db.commit()

    return _to_plan_response(plan, fallback_id=plan_id)


@router.get("", response_model=List[SavedPlanResponse])
def list_saved_plans(db: Session = Depends(get_db)):
    """List all saved restoration plans ordered by most recent."""
    plans = db.query(SavedPlan).order_by(SavedPlan.created_at.desc()).all()
    return [_to_plan_response(p) for p in plans]


@router.get("/{plan_id}", response_model=SavedPlanResponse)
def get_saved_plan(plan_id: uuid.UUID, db: Session = Depends(get_db)):
    """Retrieve a single saved restoration plan by ID."""
    plan = db.query(SavedPlan).filter(SavedPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Restoration plan not found.")

    return _to_plan_response(plan, fallback_id=plan_id)


@router.delete("/{plan_id}")
def delete_saved_plan(
    plan_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: AuthenticatedUser = Depends(require_roles(["admin"])),
):
    """
    Delete a saved restoration plan by ID.
    Guarded by RBAC: requires 'admin' role.
    """
    plan = db.query(SavedPlan).filter(SavedPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Restoration plan not found.")

    db.delete(plan)
    db.commit()
    return {"status": "deleted", "id": str(plan_id)}
