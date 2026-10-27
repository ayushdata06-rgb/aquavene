"""Terrain and land cover endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Watershed, WatershedIndicator
from app.schemas.schemas import LandCoverSummary, TerrainSummary

router = APIRouter()


@router.get("/{watershed_id}", response_model=TerrainSummary)
def get_terrain_summary(watershed_id: uuid.UUID, db: Session = Depends(get_db)):
    """Return terrain analysis summary for a watershed."""
    ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Watershed not found")

    # Query terrain-related indicators
    indicators = (
        db.query(WatershedIndicator)
        .filter(WatershedIndicator.watershed_id == watershed_id)
        .all()
    )

    ind_map = {i.indicator_code: i for i in indicators}
    erosion = ind_map.get("erosion_potential")
    runoff = ind_map.get("runoff_potential")

    # These would come from processed DEM data stored in indicators or metadata
    processing_status = "not_processed"
    if erosion or runoff:
        processing_status = "processed"

    return TerrainSummary(
        watershed_id=watershed_id,
        mean_elevation_m=erosion.raw_value if erosion else None,  # placeholder
        processing_status=processing_status,
    )


@router.get("/{watershed_id}/landcover", response_model=LandCoverSummary)
def get_landcover_summary(watershed_id: uuid.UUID, db: Session = Depends(get_db)):
    """Return land cover analysis for a watershed."""
    ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Watershed not found")

    lc_ind = (
        db.query(WatershedIndicator)
        .filter(
            WatershedIndicator.watershed_id == watershed_id,
            WatershedIndicator.indicator_code == "landcover_degradation",
        )
        .first()
    )

    if not lc_ind:
        return LandCoverSummary(
            watershed_id=watershed_id,
            processing_status="not_processed",
        )

    # Class proportions stored in uncertainty_note as JSON or in a related table
    return LandCoverSummary(
        watershed_id=watershed_id,
        degraded_fraction=lc_ind.raw_value,
        processing_status="processed",
        source_year=2021,
    )
