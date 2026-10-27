"""Priority scoring engine.

Calculates transparent, configurable weighted priority scores for watersheds
based on normalised indicator values.

P = w₁·E + w₂·R + w₃·L + w₄·W + w₅·D

Where:
  E = Erosion potential (0-100)
  R = Runoff potential (0-100)
  L = Land-cover degradation (0-100)
  W = Rainfall pressure (0-100)
  D = Downstream exposure (0-100)

All indicators are normalised to 0-100 before weighting.
Higher scores indicate higher restoration priority.

IMPORTANT: These are heuristic screening scores, NOT calibrated predictions.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.models import (
    PriorityScore,
    ScoringProfile,
    ScoringRun,
    Watershed,
    WatershedIndicator,
)

logger = logging.getLogger(__name__)

# Default indicator weights
DEFAULT_WEIGHTS = {
    "erosion_potential": 0.20,
    "runoff_potential": 0.25,
    "landcover_degradation": 0.15,
    "rainfall_pressure": 0.20,
    "downstream_exposure": 0.20,
}

# All indicators expected for a complete score
REQUIRED_INDICATORS = list(DEFAULT_WEIGHTS.keys())

# Score thresholds for priority categories
CATEGORY_THRESHOLDS = {
    "critical": 75.0,
    "high": 50.0,
    "medium": 25.0,
    "low": 0.0,
}


def validate_weights(weights: Dict[str, float]) -> Tuple[bool, str]:
    """Validate that weights are non-negative and sum to 1.0."""
    for key, val in weights.items():
        if val < 0:
            return False, f"Weight for '{key}' is negative: {val}"

    total = sum(weights.values())
    if abs(total - 1.0) > 0.001:
        return False, f"Weights sum to {total:.4f}, must sum to 1.0"

    return True, "Valid"


def categorise_score(score: float) -> str:
    """Map a 0-100 score to a priority category."""
    if score >= CATEGORY_THRESHOLDS["critical"]:
        return "critical"
    elif score >= CATEGORY_THRESHOLDS["high"]:
        return "high"
    elif score >= CATEGORY_THRESHOLDS["medium"]:
        return "medium"
    return "low"


def calculate_score(
    indicator_scores: Dict[str, Optional[float]],
    weights: Dict[str, float],
) -> Tuple[float, Dict[str, Any], float]:
    """Calculate weighted priority score from normalised indicators.

    Args:
        indicator_scores: Dict of indicator_code -> normalised score (0-100).
            Missing indicators should be None.
        weights: Dict of indicator_code -> weight (must sum to 1.0).

    Returns:
        Tuple of (overall_score, breakdown_dict, data_completeness).

    Missing data policy:
        - Missing indicators are excluded from the weighted sum.
        - The score is rescaled to account for missing weight.
        - data_completeness reports the fraction of weight covered.
        - If no indicators are available, returns score=0 with completeness=0.
    """
    valid, msg = validate_weights(weights)
    if not valid:
        raise ValueError(f"Invalid weights: {msg}")

    breakdown = {}
    weighted_sum = 0.0
    available_weight = 0.0

    for indicator_code, weight in weights.items():
        score = indicator_scores.get(indicator_code)
        if score is not None:
            contribution = weight * score
            weighted_sum += contribution
            available_weight += weight
            breakdown[indicator_code] = {
                "normalized_score": round(score, 2),
                "weight": weight,
                "contribution": round(contribution, 2),
                "status": "available",
            }
        else:
            breakdown[indicator_code] = {
                "normalized_score": None,
                "weight": weight,
                "contribution": 0.0,
                "status": "missing",
            }

    # Rescale if some indicators are missing
    if available_weight > 0:
        overall_score = weighted_sum / available_weight * 1.0  # Rescale to full range
        # Alternatively, don't rescale: overall_score = weighted_sum
        # We rescale so partial data doesn't unfairly penalise watersheds
        data_completeness = available_weight
    else:
        overall_score = 0.0
        data_completeness = 0.0

    overall_score = round(min(max(overall_score, 0.0), 100.0), 2)

    return overall_score, breakdown, round(data_completeness, 2)


def run_scoring(
    db: Session,
    weights: Optional[Dict[str, float]] = None,
    profile_name: str = "Default",
) -> uuid.UUID:
    """Execute a full scoring run across all watersheds.

    Args:
        db: Database session.
        weights: Indicator weights (uses defaults if None).
        profile_name: Name for the scoring profile.

    Returns:
        UUID of the scoring run.
    """
    weights = weights or DEFAULT_WEIGHTS
    valid, msg = validate_weights(weights)
    if not valid:
        raise ValueError(f"Invalid weights: {msg}")

    # Find or create scoring profile
    profile = (
        db.query(ScoringProfile)
        .filter(ScoringProfile.name == profile_name)
        .first()
    )
    if not profile:
        profile = ScoringProfile(
            id=uuid.uuid4(),
            name=profile_name,
            weights_json=weights,
            is_default=(profile_name == "Default"),
        )
        db.add(profile)
        db.flush()

    # Create scoring run
    run = ScoringRun(
        id=uuid.uuid4(),
        scoring_profile_id=profile.id,
        method_version="v1.0",
        status="running",
        started_at=datetime.utcnow(),
    )
    db.add(run)
    db.flush()

    # Get all watersheds
    watersheds = db.query(Watershed).all()
    if not watersheds:
        logger.warning("No watersheds found for scoring")
        run.status = "completed"
        run.completed_at = datetime.utcnow()
        db.commit()
        return run.id

    # Get all indicators
    all_indicators = db.query(WatershedIndicator).all()
    ws_indicators: Dict[uuid.UUID, Dict[str, Optional[float]]] = {}
    for ind in all_indicators:
        ws_indicators.setdefault(ind.watershed_id, {})[ind.indicator_code] = (
            ind.normalized_score
        )

    # Calculate scores
    score_results = []
    for ws in watersheds:
        ind_scores = ws_indicators.get(ws.id, {})
        overall, breakdown, completeness = calculate_score(ind_scores, weights)
        score_results.append({
            "watershed_id": ws.id,
            "overall_score": overall,
            "breakdown": breakdown,
            "completeness": completeness,
        })

    # Rank by score (descending)
    score_results.sort(key=lambda x: x["overall_score"], reverse=True)

    # Delete old scores for this run (idempotent)
    db.query(PriorityScore).filter(PriorityScore.scoring_run_id == run.id).delete()

    # Create priority scores
    for rank, result in enumerate(score_results, 1):
        category = categorise_score(result["overall_score"])
        ps = PriorityScore(
            id=uuid.uuid4(),
            scoring_run_id=run.id,
            watershed_id=result["watershed_id"],
            overall_score=result["overall_score"],
            priority_category=category,
            rank_position=rank,
            indicator_breakdown_json=result["breakdown"],
            data_completeness=result["completeness"],
        )
        db.add(ps)

    run.status = "completed"
    run.completed_at = datetime.utcnow()
    db.commit()

    logger.info(
        "Scoring run %s completed: %d watersheds scored", run.id, len(score_results)
    )
    return run.id
