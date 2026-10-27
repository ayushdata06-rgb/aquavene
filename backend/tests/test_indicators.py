"""Unit tests for the indicator calculation service."""

from __future__ import annotations

import pytest
from app.services.indicator_service import (
    _min_max_normalize,
    calculate_erosion_potential,
    calculate_runoff_potential,
    calculate_landcover_degradation,
    calculate_rainfall_pressure,
    calculate_downstream_exposure,
    normalize_indicators,
)


def test_min_max_normalize():
    """Verify min-max scaling to 0-100 range."""
    assert _min_max_normalize(50, 0, 100) == 50.0
    assert _min_max_normalize(0, 0, 100) == 0.0
    assert _min_max_normalize(100, 0, 100) == 100.0
    # Boundary clamps
    assert _min_max_normalize(-10, 0, 100) == 0.0
    assert _min_max_normalize(150, 0, 100) == 100.0
    # Degenerate case (equal min and max)
    assert _min_max_normalize(50, 50, 50) == 50.0


def test_calculate_erosion_potential_full():
    """Test erosion potential with all 3 parameters provided."""
    raw, quality, note = calculate_erosion_potential(
        mean_slope=22.5,
        rainfall_mm=1500.0,
        bare_soil_fraction=0.30,
    )
    assert raw is not None
    assert 0 <= raw <= 100
    assert quality == "computed"
    assert "All components available" in note


def test_calculate_erosion_potential_missing():
    """Test erosion potential with missing inputs."""
    raw, quality, note = calculate_erosion_potential(None, None, None)
    assert raw is None
    assert quality == "missing"


def test_calculate_runoff_potential():
    """Test runoff potential with partial/full parameters."""
    raw, quality, note = calculate_runoff_potential(
        mean_slope=15.0,
        impervious_fraction=0.10,
        mean_flow_accumulation=1000.0,
        rainfall_mm=1200.0,
    )
    assert raw is not None
    assert 0 <= raw <= 100
    assert quality == "computed"


def test_calculate_landcover_degradation():
    """Test landcover degradation with WorldCover class proportions."""
    class_proportions = {
        10: 0.40,  # Tree cover
        20: 0.10,  # Shrubland
        40: 0.20,  # Cropland
        50: 0.10,  # Built-up (degraded)
        60: 0.20,  # Bare soil (degraded)
    }
    raw, quality, note = calculate_landcover_degradation(class_proportions)
    assert raw == pytest.approx(0.30, 0.001)
    assert quality == "computed"
    assert "ESA WorldCover" in note


def test_calculate_rainfall_pressure():
    """Test rainfall pressure calculation."""
    raw, quality, note = calculate_rainfall_pressure(1250.5)
    assert raw == 1250.5
    assert quality == "computed"
    assert "ERA5-Land" in note


def test_calculate_downstream_exposure():
    """Test downstream population exposure calculation and missing state."""
    raw, quality, note = calculate_downstream_exposure(25000.0, buffer_km=10.0)
    assert raw == 25000.0
    assert quality == "estimated"

    none_raw, none_qual, _ = calculate_downstream_exposure(None)
    assert none_raw is None
    assert none_qual == "missing"


def test_normalize_indicators():
    """Test batch normalization of raw values to 0-100 range."""
    indicators = [
        {"raw_value": 10.0},
        {"raw_value": 30.0},
        {"raw_value": 50.0},
        {"raw_value": None},
    ]
    normalized = normalize_indicators(indicators, "test_ind")
    assert normalized[0]["normalized_score"] == 0.0
    assert normalized[1]["normalized_score"] == 50.0
    assert normalized[2]["normalized_score"] == 100.0
    assert normalized[3]["normalized_score"] is None
