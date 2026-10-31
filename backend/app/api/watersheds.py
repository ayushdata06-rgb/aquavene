"""Watershed CRUD, GeoJSON, and Analysis Trigger endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.deps import require_roles
from app.auth.security import AuthenticatedUser
from app.db.session import get_db
from app.models.models import ProcessingJob, SavedPlan, ScoringRun, Watershed, WatershedIndicator
from app.schemas.schemas import IndicatorValue, WatershedSummary
from app.schemas.watershed import WatershedCreate, WatershedUpdate
from app.services.tasks import run_whitebox_pipeline_job

router = APIRouter()


def _watershed_to_summary(ws: Watershed, db: Session) -> WatershedSummary:
    """Convert a Watershed ORM object to summary schema."""
    centroid_lat = centroid_lon = None
    if ws.centroid is not None:
        try:
            centroid_lat = db.scalar(func.ST_Y(ws.centroid))
            centroid_lon = db.scalar(func.ST_X(ws.centroid))
        except Exception:
            pass
    elif ws.geom is not None:
        try:
            centroid = func.ST_Centroid(ws.geom)
            centroid_lat = db.scalar(func.ST_Y(centroid))
            centroid_lon = db.scalar(func.ST_X(centroid))
        except Exception:
            pass

    return WatershedSummary(
        id=ws.id,
        watershed_code=ws.watershed_code,
        name=ws.name,
        country=ws.country,
        state=ws.state,
        district=ws.district,
        basin_name=ws.basin_name,
        area_sq_km=ws.area_sq_km,
        centroid_lat=centroid_lat,
        centroid_lon=centroid_lon,
        priority_category=ws.risk_level or "moderate",
        overall_score=ws.priority_score or 65.0,
    )


@router.get("", response_model=List[WatershedSummary])
def list_watersheds(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    basin_name: Optional[str] = Query(None),
    risk: Optional[str] = Query(None),
    priority_category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List watersheds with optional filtering and pagination."""
    query = db.query(Watershed)

    if state:
        query = query.filter(Watershed.state.ilike(f"%{state}%"))
    if district:
        query = query.filter(Watershed.district.ilike(f"%{district}%"))
    if basin_name:
        query = query.filter(Watershed.basin_name.ilike(f"%{basin_name}%"))
    if risk:
        query = query.filter(Watershed.risk_level == risk.lower())
    if priority_category:
        query = query.filter(Watershed.risk_level == priority_category.lower())
    if search:
        query = query.filter(
            or_(
                Watershed.name.ilike(f"%{search}%"),
                Watershed.watershed_code.ilike(f"%{search}%"),
            )
        )

    offset = (page - 1) * page_size
    watersheds = query.order_by(Watershed.name).offset(offset).limit(page_size).all()
    return [_watershed_to_summary(ws, db) for ws in watersheds]


@router.get("/{watershed_id}", response_model=WatershedSummary)
def get_watershed(watershed_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get single watershed details."""
    ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Watershed not found")
    return _watershed_to_summary(ws, db)


@router.post("", response_model=WatershedSummary)
def create_watershed(
    payload: WatershedCreate,
    current_user: AuthenticatedUser = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """Admin-only: register a new micro-watershed spatial boundary."""
    existing = db.query(Watershed).filter(Watershed.watershed_code == payload.watershed_code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Watershed code '{payload.watershed_code}' already exists.",
        )

    ws = Watershed(
        id=uuid.uuid4(),
        watershed_code=payload.watershed_code,
        name=payload.name,
        country=payload.country,
        state=payload.state,
        district=payload.district,
        basin_name=payload.basin_name,
        sub_basin=payload.sub_basin,
        area_sq_km=payload.area_sq_km,
        perimeter_km=payload.perimeter_km,
        mean_elevation_m=payload.mean_elevation_m,
        mean_slope_deg=payload.mean_slope_deg,
        drainage_density=payload.drainage_density,
        priority_score=payload.priority_score or 50.0,
        risk_level=payload.risk_level or "moderate",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(ws)
    db.commit()
    db.refresh(ws)
    return _watershed_to_summary(ws, db)


@router.patch("/{watershed_id}", response_model=WatershedSummary)
def update_watershed(
    watershed_id: uuid.UUID,
    payload: WatershedUpdate,
    current_user: AuthenticatedUser = Depends(require_roles(["admin", "planner"])),
    db: Session = Depends(get_db),
):
    """Admin/Planner: update watershed metadata or priority score."""
    ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Watershed not found")

    if payload.name:
        ws.name = payload.name
    if payload.state:
        ws.state = payload.state
    if payload.district:
        ws.district = payload.district
    if payload.basin_name:
        ws.basin_name = payload.basin_name
    if payload.sub_basin:
        ws.sub_basin = payload.sub_basin
    if payload.priority_score is not None:
        ws.priority_score = payload.priority_score
    if payload.risk_level:
        ws.risk_level = payload.risk_level

    ws.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ws)
    return _watershed_to_summary(ws, db)


@router.post("/{watershed_id}/trigger-analysis")
async def trigger_watershed_analysis(
    watershed_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: AuthenticatedUser = Depends(require_roles(["admin", "planner"])),
    db: Session = Depends(get_db),
):
    """Admin/Planner: Enqueue WhiteboxTools & ML pipeline as an asynchronous background job."""
    ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Watershed not found")

    job_id = uuid.uuid4()
    job = ProcessingJob(
        id=job_id,
        created_by=uuid.UUID(current_user.id) if current_user.id else None,
        watershed_id=watershed_id,
        job_type="whitebox_full_pipeline",
        status="pending",
        progress_pct=0,
        input_geojson={"watershed_code": ws.watershed_code, "name": ws.name},
        created_at=datetime.now(timezone.utc),
    )
    db.add(job)
    db.commit()

    # Enqueue background task
    geojson = {"type": "Feature", "properties": {"code": ws.watershed_code}, "geometry": {}}
    background_tasks.add_task(run_whitebox_pipeline_job, job_id, watershed_id, geojson, db)

    return {
        "status": "enqueued",
        "job_id": str(job_id),
        "watershed_code": ws.watershed_code,
        "message": "WhiteboxTools hydrological analysis started in background.",
    }


@router.get("/{watershed_id}/indicators")
def get_watershed_indicators(
    watershed_id: uuid.UUID, db: Session = Depends(get_db)
):
    """Get all calculated indicators for a watershed."""
    ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Watershed not found")

    indicators = (
        db.query(WatershedIndicator)
        .filter(WatershedIndicator.watershed_id == watershed_id)
        .order_by(WatershedIndicator.measured_at.desc())
        .all()
    )
    return [
        {
            "id": str(ind.id),
            "indicator_type": ind.indicator_type,
            "value": ind.value,
            "unit": ind.unit,
            "source": ind.source,
            "measured_at": ind.measured_at.isoformat() if ind.measured_at else None,
        }
        for ind in indicators
    ]


@router.get("/{watershed_id}/plans")
def get_watershed_plans(watershed_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get all saved DPR plans for a specific watershed."""
    plans = db.query(SavedPlan).filter(SavedPlan.watershed_id == watershed_id).all()
    return [
        {
            "id": str(p.id),
            "area_name": p.area_name,
            "budget_lakhs_inr": p.budget_lakhs_inr,
            "original_score": p.original_score,
            "simulated_score": p.simulated_score,
            "dpr_status": p.dpr_status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in plans
    ]
