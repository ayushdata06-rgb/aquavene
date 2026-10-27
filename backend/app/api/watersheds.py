"""Watershed CRUD and GeoJSON endpoints."""

from __future__ import annotations

import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from geoalchemy2.functions import ST_AsGeoJSON, ST_X, ST_Y, ST_Centroid
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import PriorityScore, ScoringRun, Watershed, WatershedIndicator
from app.schemas.schemas import (
    IndicatorValue,
    WatershedDetail,
    WatershedGeoJSON,
    WatershedSummary,
)

router = APIRouter()


def _watershed_to_summary(ws: Watershed, db: Session) -> WatershedSummary:
    """Convert a Watershed ORM object to summary schema."""
    # Get centroid coords
    centroid_lat = centroid_lon = None
    if ws.centroid is not None:
        coords = db.execute(
            func.ST_Y(ws.centroid).label("lat"),
        ).scalar()
        centroid_lat = db.scalar(func.ST_Y(ws.centroid))
        centroid_lon = db.scalar(func.ST_X(ws.centroid))
    elif ws.geom is not None:
        centroid = func.ST_Centroid(ws.geom)
        centroid_lat = db.scalar(func.ST_Y(centroid))
        centroid_lon = db.scalar(func.ST_X(centroid))

    # Latest priority score
    latest_run = (
        db.query(ScoringRun)
        .filter(ScoringRun.status == "completed")
        .order_by(ScoringRun.completed_at.desc())
        .first()
    )
    priority_category = None
    overall_score = None
    if latest_run:
        ps = (
            db.query(PriorityScore)
            .filter(
                PriorityScore.scoring_run_id == latest_run.id,
                PriorityScore.watershed_id == ws.id,
            )
            .first()
        )
        if ps:
            priority_category = ps.priority_category
            overall_score = ps.overall_score

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
        priority_category=priority_category,
        overall_score=overall_score,
    )


@router.get("", response_model=List[WatershedSummary])
def list_watersheds(
    search: Optional[str] = Query(None, description="Search by code, name, district, state, or basin"),
    state: Optional[str] = None,
    district: Optional[str] = None,
    basin_name: Optional[str] = None,
    priority_category: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List watersheds with filtering and pagination."""
    query = db.query(Watershed)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Watershed.watershed_code.ilike(pattern),
                Watershed.name.ilike(pattern),
                Watershed.district.ilike(pattern),
                Watershed.state.ilike(pattern),
                Watershed.basin_name.ilike(pattern),
            )
        )
    if state:
        query = query.filter(Watershed.state == state)
    if district:
        query = query.filter(Watershed.district == district)
    if basin_name:
        query = query.filter(Watershed.basin_name == basin_name)

    # Priority category filter requires join
    if priority_category:
        latest_run = (
            db.query(ScoringRun)
            .filter(ScoringRun.status == "completed")
            .order_by(ScoringRun.completed_at.desc())
            .first()
        )
        if latest_run:
            query = query.join(
                PriorityScore,
                (PriorityScore.watershed_id == Watershed.id)
                & (PriorityScore.scoring_run_id == latest_run.id),
            ).filter(PriorityScore.priority_category == priority_category)

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


@router.get("/{watershed_id}/indicators", response_model=List[IndicatorValue])
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
        .order_by(WatershedIndicator.indicator_code)
        .all()
    )
    return [IndicatorValue.model_validate(ind) for ind in indicators]


@router.get("/{watershed_id}/history")
def get_watershed_history(
    watershed_id: uuid.UUID, db: Session = Depends(get_db)
):
    """Get scoring history for a watershed across all scoring runs."""
    ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Watershed not found")

    scores = (
        db.query(PriorityScore, ScoringRun)
        .join(ScoringRun, PriorityScore.scoring_run_id == ScoringRun.id)
        .filter(PriorityScore.watershed_id == watershed_id)
        .order_by(ScoringRun.completed_at.desc())
        .all()
    )

    history = []
    for ps, sr in scores:
        history.append({
            "scoring_run_id": str(sr.id),
            "completed_at": sr.completed_at.isoformat() if sr.completed_at else None,
            "method_version": sr.method_version,
            "overall_score": ps.overall_score,
            "priority_category": ps.priority_category,
            "rank_position": ps.rank_position,
            "indicator_breakdown": ps.indicator_breakdown_json,
        })

    return {"watershed_id": str(watershed_id), "history": history}
