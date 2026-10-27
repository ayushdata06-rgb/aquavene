"""Rainfall & climate data endpoints."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Watershed, WatershedIndicator
from app.schemas.schemas import RainfallSummary, RainfallTimeSeries

router = APIRouter()


@router.get("/summary")
def get_rainfall_summary(
    watershed_id: Optional[uuid.UUID] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Return rainfall summary per watershed from calculated indicators."""
    query = db.query(WatershedIndicator).filter(
        WatershedIndicator.indicator_code == "rainfall_pressure"
    )

    if watershed_id:
        query = query.filter(WatershedIndicator.watershed_id == watershed_id)

    indicators = query.all()

    results = []
    for ind in indicators:
        ws = db.query(Watershed).filter(Watershed.id == ind.watershed_id).first()
        if not ws:
            continue
        results.append(
            RainfallSummary(
                watershed_id=ind.watershed_id,
                watershed_name=ws.name,
                period=f"{ind.reference_start.year if ind.reference_start else '?'}-{ind.reference_end.year if ind.reference_end else '?'}",
                total_mm=ind.raw_value,
                mean_mm=ind.raw_value,  # Will be refined when full timeseries is available
                data_coverage=1.0 if ind.quality_status == "computed" else 0.5,
                native_resolution="~9km (0.1°)",
                source="ERA5-Land",
            )
        )

    return results


@router.get("/timeseries")
def get_rainfall_timeseries(
    watershed_id: uuid.UUID,
    aggregation: str = Query("monthly", pattern="^(monthly|seasonal|annual)$"),
    db: Session = Depends(get_db),
):
    """Return rainfall timeseries for a watershed.

    Note: Full timeseries requires processed ERA5-Land NetCDF data.
    This endpoint returns data from the rainfall processing service.
    """
    ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Watershed not found")

    # Check if we have rainfall indicators
    indicators = (
        db.query(WatershedIndicator)
        .filter(
            WatershedIndicator.watershed_id == watershed_id,
            WatershedIndicator.indicator_code == "rainfall_pressure",
        )
        .order_by(WatershedIndicator.reference_start)
        .all()
    )

    if not indicators:
        return RainfallTimeSeries(
            watershed_id=watershed_id,
            dates=[],
            values=[],
            aggregation=aggregation,
            coverage_note="No rainfall data has been processed for this watershed yet.",
        )

    dates = []
    values = []
    for ind in indicators:
        date_str = ind.reference_start.strftime("%Y-%m") if ind.reference_start else "unknown"
        dates.append(date_str)
        values.append(ind.raw_value)

    return RainfallTimeSeries(
        watershed_id=watershed_id,
        dates=dates,
        values=values,
        aggregation=aggregation,
        coverage_note=f"Data from {len(indicators)} processed period(s).",
    )
