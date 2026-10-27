"""Priority rankings endpoint."""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import PriorityScore, ScoringRun, Watershed
from app.schemas.schemas import RankingEntry, RankingResponse

router = APIRouter()


@router.get("/rankings", response_model=RankingResponse)
def get_rankings(
    scoring_run_id: Optional[uuid.UUID] = None,
    priority_category: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = Query("rank_position", pattern="^(rank_position|overall_score|watershed_name)$"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get prioritised watershed rankings from the latest or specified scoring run."""
    # Determine scoring run
    if scoring_run_id:
        run = db.query(ScoringRun).filter(ScoringRun.id == scoring_run_id).first()
        if not run:
            raise HTTPException(status_code=404, detail="Scoring run not found")
    else:
        run = (
            db.query(ScoringRun)
            .filter(ScoringRun.status == "completed")
            .order_by(ScoringRun.completed_at.desc())
            .first()
        )
        if not run:
            return RankingResponse(
                scoring_run_id=uuid.UUID(int=0),
                method_version="v1.0",
                total=0,
                page=page,
                page_size=page_size,
                items=[],
            )

    query = (
        db.query(PriorityScore, Watershed)
        .join(Watershed, PriorityScore.watershed_id == Watershed.id)
        .filter(PriorityScore.scoring_run_id == run.id)
    )

    if priority_category:
        query = query.filter(PriorityScore.priority_category == priority_category)
    if state:
        query = query.filter(Watershed.state == state)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            Watershed.name.ilike(pattern) | Watershed.watershed_code.ilike(pattern)
        )

    total = query.count()

    # Sorting
    if sort_by == "rank_position":
        order_col = PriorityScore.rank_position
    elif sort_by == "overall_score":
        order_col = PriorityScore.overall_score
    else:
        order_col = Watershed.name

    if sort_order == "desc":
        order_col = order_col.desc()

    offset = (page - 1) * page_size
    rows = query.order_by(order_col).offset(offset).limit(page_size).all()

    items = []
    for ps, ws in rows:
        items.append(
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

    return RankingResponse(
        scoring_run_id=run.id,
        method_version=run.method_version,
        total=total,
        page=page,
        page_size=page_size,
        items=items,
    )
