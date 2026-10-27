"""Report generation endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import Dataset, PriorityScore, ScoringRun, Watershed, WatershedIndicator
from app.schemas.schemas import (
    DatasetResponse,
    IndicatorValue,
    WatershedReportResponse,
    WatershedSummary,
)

router = APIRouter()


LIMITATIONS = [
    "Priority scores are heuristic screening indicators, not calibrated predictions.",
    "Erosion potential does not include soil erodibility (K-factor) or management practice data.",
    "Runoff potential is estimated without infiltration or soil data.",
    "Downstream exposure requires a separate population dataset for accurate assessment.",
    "Land cover data is from a single epoch; temporal change is not assessed.",
    "Rainfall data is from ERA5-Land reanalysis (~9km), not gauge-observed.",
    "Scores should not be used as the sole basis for restoration investment decisions without field verification.",
]


@router.get("/watersheds/{watershed_id}", response_model=WatershedReportResponse)
def get_watershed_report(watershed_id: uuid.UUID, db: Session = Depends(get_db)):
    """Generate a comprehensive report for a watershed."""
    ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
    if not ws:
        raise HTTPException(status_code=404, detail="Watershed not found")

    # Indicators
    indicators = (
        db.query(WatershedIndicator)
        .filter(WatershedIndicator.watershed_id == watershed_id)
        .all()
    )

    # Latest score breakdown
    latest_run = (
        db.query(ScoringRun)
        .filter(ScoringRun.status == "completed")
        .order_by(ScoringRun.completed_at.desc())
        .first()
    )
    scoring_breakdown = None
    priority_category = None
    overall_score = None
    if latest_run:
        ps = (
            db.query(PriorityScore)
            .filter(
                PriorityScore.scoring_run_id == latest_run.id,
                PriorityScore.watershed_id == watershed_id,
            )
            .first()
        )
        if ps:
            scoring_breakdown = ps.indicator_breakdown_json
            priority_category = ps.priority_category
            overall_score = ps.overall_score

    # Datasets used
    dataset_ids = {ind.dataset_id for ind in indicators if ind.dataset_id}
    datasets = db.query(Dataset).filter(Dataset.id.in_(dataset_ids)).all() if dataset_ids else []

    return WatershedReportResponse(
        watershed=WatershedSummary(
            id=ws.id,
            watershed_code=ws.watershed_code,
            name=ws.name,
            country=ws.country,
            state=ws.state,
            district=ws.district,
            basin_name=ws.basin_name,
            area_sq_km=ws.area_sq_km,
            priority_category=priority_category,
            overall_score=overall_score,
        ),
        indicators=[IndicatorValue.model_validate(i) for i in indicators],
        scoring_breakdown=scoring_breakdown,
        data_provenance=[DatasetResponse.model_validate(d) for d in datasets],
        limitations=LIMITATIONS,
        generated_at=datetime.utcnow(),
    )
