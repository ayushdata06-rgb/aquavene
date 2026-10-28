"""Dashboard summary endpoint."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import (
    Dataset,
    PriorityScore,
    ProcessingJob,
    ScoringRun,
    Watershed,
    WatershedIndicator,
)
from app.schemas.schemas import DashboardSummary, ProcessingJobResponse, RankingEntry

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Return aggregate dashboard metrics."""
    total_watersheds = db.query(func.count(Watershed.id)).scalar() or 0
    total_datasets = db.query(func.count(Dataset.id)).scalar() or 0

    # Get latest scoring run
    latest_run = (
        db.query(ScoringRun)
        .filter(ScoringRun.status == "completed")
        .order_by(ScoringRun.completed_at.desc())
        .first()
    )

    # Category counts
    category_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    if latest_run:
        rows = (
            db.query(PriorityScore.priority_category, func.count(PriorityScore.id))
            .filter(PriorityScore.scoring_run_id == latest_run.id)
            .group_by(PriorityScore.priority_category)
            .all()
        )
        for cat, cnt in rows:
            if cat in category_counts:
                category_counts[cat] = cnt

    # Top 5 watersheds
    top_items: List[RankingEntry] = []
    if latest_run:
        top_scores = (
            db.query(PriorityScore, Watershed)
            .join(Watershed, PriorityScore.watershed_id == Watershed.id)
            .filter(PriorityScore.scoring_run_id == latest_run.id)
            .order_by(PriorityScore.rank_position)
            .limit(5)
            .all()
        )
        for ps, ws in top_scores:
            top_items.append(
                RankingEntry(
                    rank_position=ps.rank_position,
                    watershed_id=ws.id,
                    watershed_code=ws.watershed_code,
                    watershed_name=ws.name,
                    state=ws.state,
                    district=ws.district,
                    overall_score=ps.overall_score,
                    priority_category=ps.priority_category,
                    indicator_breakdown=ps.indicator_breakdown_json,
                    data_completeness=ps.data_completeness,
                )
            )

    # Recent jobs
    recent_jobs_rows = (
        db.query(ProcessingJob)
        .order_by(ProcessingJob.created_at.desc())
        .limit(5)
        .all()
    )
    recent_jobs = [ProcessingJobResponse.model_validate(j) for j in recent_jobs_rows]

    # Data warnings
    warnings: List[str] = []
    indicator_count = db.query(func.count(WatershedIndicator.id)).scalar() or 0
    if total_watersheds > 0 and indicator_count == 0:
        warnings.append("No watershed indicators have been calculated yet.")
    if total_datasets == 0:
        warnings.append("No datasets have been registered.")
    try:
        missing_indicators = int(
            db.query(WatershedIndicator.watershed_id)
            .filter(WatershedIndicator.quality_status == "missing")
            .distinct()
            .count()
            or 0
        )
    except Exception:
        missing_indicators = 0

    if missing_indicators > 0:
        warnings.append(
            f"{missing_indicators} watershed(s) have missing indicator data."
        )

    last_processing = (
        db.query(func.max(ProcessingJob.finished_at))
        .filter(ProcessingJob.status == "completed")
        .scalar()
    )

    # Map moderate alias for category counts
    dist_with_moderate = dict(category_counts)
    dist_with_moderate["moderate"] = category_counts.get("medium", 0)

    return DashboardSummary(
        total_watersheds=total_watersheds,
        critical_count=category_counts.get("critical", 0),
        high_count=category_counts.get("high", 0),
        medium_count=category_counts.get("medium", 0),
        low_count=category_counts.get("low", 0),
        total_datasets=total_datasets,
        datasets_count=total_datasets,
        last_scoring_date=latest_run.completed_at if latest_run else None,
        last_processing_date=last_processing,
        category_distribution=category_counts,
        priority_distribution=dist_with_moderate,
        top_watersheds=top_items,
        recent_jobs=recent_jobs,
        data_warnings=warnings,
        warnings=warnings,
    )
