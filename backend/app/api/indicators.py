"""Indicator analysis endpoints."""

from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import WatershedIndicator

router = APIRouter()


INDICATOR_META = {
    "erosion_potential": {
        "label": "Erosion Potential",
        "description": "Composite estimate of soil erosion susceptibility based on slope, rainfall, and land cover",
        "unit": "index (0-100)",
        "method": "Weighted combination of mean slope, rainfall erosivity proxy, and bare-soil fraction",
        "limitations": "Does not include soil erodibility (K-factor) or conservation practice data. Suitable for screening only.",
    },
    "runoff_potential": {
        "label": "Runoff Potential",
        "description": "Estimate of surface runoff generation potential",
        "unit": "index (0-100)",
        "method": "Based on slope, impervious fraction, rainfall intensity, and flow accumulation statistics",
        "limitations": "No infiltration or soil data. Not a calibrated hydrological model output.",
    },
    "landcover_degradation": {
        "label": "Land Cover Degradation",
        "description": "Fraction of watershed area classified as degraded land cover",
        "unit": "fraction (0-1)",
        "method": "ESA WorldCover classes mapped to degradation categories",
        "limitations": "Single-epoch land cover; no temporal change detection.",
    },
    "rainfall_pressure": {
        "label": "Rainfall Pressure",
        "description": "Normalised mean annual or seasonal precipitation intensity",
        "unit": "mm (normalised to 0-100)",
        "method": "ERA5-Land total precipitation aggregated per watershed",
        "limitations": "Reanalysis data, not gauge-observed. Resolution ~9km.",
    },
    "downstream_exposure": {
        "label": "Downstream Population Exposure",
        "description": "Relative exposure of downstream settlements to watershed outflow",
        "unit": "index (0-100)",
        "method": "Population count within downstream buffer, if population data is available",
        "limitations": "Requires separate population dataset. Exposure ≠ risk without vulnerability assessment.",
    },
}


@router.get("/indicators/metadata")
def get_indicator_metadata():
    """Return metadata for all indicator types."""
    return INDICATOR_META


@router.get("/indicators/summary")
def get_indicator_summary(
    indicator_code: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Return aggregate statistics for indicators across all watersheds."""
    query = db.query(
        WatershedIndicator.indicator_code,
        func.count(WatershedIndicator.id).label("count"),
        func.avg(WatershedIndicator.raw_value).label("mean_raw"),
        func.min(WatershedIndicator.raw_value).label("min_raw"),
        func.max(WatershedIndicator.raw_value).label("max_raw"),
        func.avg(WatershedIndicator.normalized_score).label("mean_normalized"),
    ).group_by(WatershedIndicator.indicator_code)

    if indicator_code:
        query = query.filter(WatershedIndicator.indicator_code == indicator_code)

    rows = query.all()
    result = []
    for row in rows:
        meta = INDICATOR_META.get(row.indicator_code, {})
        result.append({
            "indicator_code": row.indicator_code,
            "label": meta.get("label", row.indicator_code),
            "count": row.count,
            "mean_raw": round(row.mean_raw, 3) if row.mean_raw else None,
            "min_raw": round(row.min_raw, 3) if row.min_raw else None,
            "max_raw": round(row.max_raw, 3) if row.max_raw else None,
            "mean_normalized": round(row.mean_normalized, 2) if row.mean_normalized else None,
            "unit": meta.get("unit"),
            "method": meta.get("method"),
            "limitations": meta.get("limitations"),
        })
    return result
