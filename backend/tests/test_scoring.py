"""Unit tests for the scoring engine and weight validation."""

from __future__ import annotations

import pytest
from app.services.scoring_service import (
    calculate_score,
    validate_weights,
    categorise_score,
)


def test_calculate_score_exact(sample_weights, sample_indicator_values):
    """Test standard scoring formula: P = 0.20E + 0.25R + 0.15L + 0.20W + 0.20D."""
    # 0.20*65 + 0.25*78 + 0.15*50 + 0.20*82 + 0.20*60
    # = 13.0 + 19.5 + 7.5 + 16.4 + 12.0 = 68.4
    score, breakdown, completeness = calculate_score(sample_indicator_values, sample_weights)
    assert pytest.approx(score, 0.01) == 68.4
    assert completeness == 1.0
    assert len(breakdown) == 5


def test_determine_priority_category():
    """Verify threshold classification for priorities."""
    assert categorise_score(85.0) == "critical"
    assert categorise_score(75.0) == "critical"
    assert categorise_score(74.9) == "high"
    assert categorise_score(50.0) == "high"
    assert categorise_score(49.9) == "medium"
    assert categorise_score(25.0) == "medium"
    assert categorise_score(24.9) == "low"
    assert categorise_score(10.0) == "low"


def test_validate_weights_success(sample_weights):
    """Valid weights summing to 1.0 should pass."""
    is_valid, msg = validate_weights(sample_weights)
    assert is_valid is True
    assert msg == "Valid"


def test_validate_weights_sum_error():
    """Weights that do not sum to 1.0 should return False."""
    invalid = {
        "erosion_potential": 0.30,
        "runoff_potential": 0.30,
        "landcover_degradation": 0.20,
        "rainfall_pressure": 0.20,
        "downstream_exposure": 0.20,  # Sum = 1.20
    }
    is_valid, msg = validate_weights(invalid)
    assert is_valid is False
    assert "sum" in msg.lower()


def test_validate_weights_negative():
    """Negative weights must return False."""
    negative = {
        "erosion_potential": -0.10,
        "runoff_potential": 0.40,
        "landcover_degradation": 0.20,
        "rainfall_pressure": 0.30,
        "downstream_exposure": 0.20,
    }
    is_valid, msg = validate_weights(negative)
    assert is_valid is False
    assert "negative" in msg.lower()


def test_missing_data_flagging(sample_weights):
    """Missing indicators should result in data_completeness < 1.0."""
    incomplete_values = {
        "erosion_potential": 60.0,
        "runoff_potential": 70.0,
        "landcover_degradation": None,
        "rainfall_pressure": None,
        "downstream_exposure": None,
    }
    score, breakdown, completeness = calculate_score(incomplete_values, sample_weights)
    # Available weight for erosion (0.20) + runoff (0.25) = 0.45
    assert completeness == pytest.approx(0.45, 0.01)
    assert breakdown["landcover_degradation"]["status"] == "missing"

