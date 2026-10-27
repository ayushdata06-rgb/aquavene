"""Scenario simulation endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import (
    PriorityScore,
    Scenario,
    ScenarioResult,
    ScoringRun,
    Watershed,
    WatershedIndicator,
)
from app.schemas.schemas import (
    ScenarioCreate,
    ScenarioResponse,
    ScenarioResultEntry,
    ScenarioResultsResponse,
)
from app.services.scoring_service import calculate_score, categorise_score

router = APIRouter()


@router.post("", response_model=ScenarioResponse, status_code=201)
def create_scenario(body: ScenarioCreate, db: Session = Depends(get_db)):
    """Create a new policy weight scenario."""
    scenario = Scenario(
        id=uuid.uuid4(),
        name=body.name,
        description=body.description,
        baseline_scoring_run_id=body.baseline_scoring_run_id,
        weights_json=body.weights.model_dump(),
        assumptions_json=body.assumptions or {},
        status="draft",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return ScenarioResponse.model_validate(scenario)


@router.get("", response_model=List[ScenarioResponse])
def list_scenarios(db: Session = Depends(get_db)):
    """List all scenarios."""
    scenarios = db.query(Scenario).order_by(Scenario.created_at.desc()).all()
    return [ScenarioResponse.model_validate(s) for s in scenarios]


@router.get("/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(scenario_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a scenario by ID."""
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return ScenarioResponse.model_validate(scenario)


@router.post("/{scenario_id}/run")
def run_scenario(scenario_id: uuid.UUID, db: Session = Depends(get_db)):
    """Execute a scenario: recalculate scores with scenario weights and compare to baseline."""
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Get baseline scoring run
    baseline_run_id = scenario.baseline_scoring_run_id
    if not baseline_run_id:
        # Use latest completed run
        latest_run = (
            db.query(ScoringRun)
            .filter(ScoringRun.status == "completed")
            .order_by(ScoringRun.completed_at.desc())
            .first()
        )
        if not latest_run:
            raise HTTPException(
                status_code=400,
                detail="No baseline scoring run available. Run scoring first.",
            )
        baseline_run_id = latest_run.id

    # Get baseline scores
    baseline_scores = (
        db.query(PriorityScore)
        .filter(PriorityScore.scoring_run_id == baseline_run_id)
        .all()
    )
    if not baseline_scores:
        raise HTTPException(status_code=400, detail="Baseline has no scores.")

    baseline_map = {ps.watershed_id: ps for ps in baseline_scores}

    # Get all watershed indicators
    watershed_ids = list(baseline_map.keys())
    indicators = (
        db.query(WatershedIndicator)
        .filter(WatershedIndicator.watershed_id.in_(watershed_ids))
        .all()
    )

    # Group indicators by watershed
    ws_indicators = {}
    for ind in indicators:
        ws_indicators.setdefault(ind.watershed_id, {})[ind.indicator_code] = (
            ind.normalized_score
        )

    # Calculate scenario scores
    weights = scenario.weights_json
    scenario_scores = {}
    for ws_id, ind_scores in ws_indicators.items():
        score, breakdown, completeness = calculate_score(ind_scores, weights)
        scenario_scores[ws_id] = {
            "score": score,
            "breakdown": breakdown,
            "completeness": completeness,
        }

    # Rank scenario scores
    sorted_ws = sorted(
        scenario_scores.items(), key=lambda x: x[1]["score"], reverse=True
    )
    scenario_ranks = {ws_id: rank + 1 for rank, (ws_id, _) in enumerate(sorted_ws)}

    # Delete existing results for this scenario
    db.query(ScenarioResult).filter(ScenarioResult.scenario_id == scenario_id).delete()

    # Create scenario results
    for ws_id, info in scenario_scores.items():
        baseline_ps = baseline_map.get(ws_id)
        if not baseline_ps:
            continue

        result = ScenarioResult(
            id=uuid.uuid4(),
            scenario_id=scenario_id,
            watershed_id=ws_id,
            baseline_score=baseline_ps.overall_score,
            scenario_score=info["score"],
            baseline_rank=baseline_ps.rank_position,
            scenario_rank=scenario_ranks[ws_id],
            score_delta=info["score"] - baseline_ps.overall_score,
            rank_delta=baseline_ps.rank_position - scenario_ranks[ws_id],
            indicator_breakdown_json=info["breakdown"],
        )
        db.add(result)

    scenario.status = "completed"
    scenario.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"status": "completed", "scenario_id": str(scenario_id)}


@router.get("/{scenario_id}/results", response_model=ScenarioResultsResponse)
def get_scenario_results(scenario_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get results from a completed scenario run."""
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    results = (
        db.query(ScenarioResult, Watershed)
        .join(Watershed, ScenarioResult.watershed_id == Watershed.id)
        .filter(ScenarioResult.scenario_id == scenario_id)
        .order_by(ScenarioResult.scenario_rank)
        .all()
    )

    items = []
    for sr, ws in results:
        items.append(
            ScenarioResultEntry(
                watershed_id=ws.id,
                watershed_code=ws.watershed_code,
                watershed_name=ws.name,
                baseline_score=sr.baseline_score,
                scenario_score=sr.scenario_score,
                baseline_rank=sr.baseline_rank,
                scenario_rank=sr.scenario_rank,
                score_delta=sr.score_delta,
                rank_delta=sr.rank_delta,
                indicator_breakdown=sr.indicator_breakdown_json,
            )
        )

    return ScenarioResultsResponse(
        scenario_id=scenario_id,
        scenario_name=scenario.name,
        status=scenario.status,
        items=items,
    )
