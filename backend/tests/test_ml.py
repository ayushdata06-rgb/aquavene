"""Tests for AquaVane ML Suite and Prediction API."""

import pytest
from fastapi.testclient import TestClient

from app.services.ml.feature_extractor import AOIFeatureExtractor
from app.services.ml.engine import RestorationMLEngine

SAMPLE_POLYGON = {
    "type": "Polygon",
    "coordinates": [
        [
            [74.80, 15.10],
            [74.95, 15.10],
            [74.95, 15.25],
            [74.80, 15.25],
            [74.80, 15.10],
        ]
    ],
}


def test_feature_extractor_returns_all_features():
    """Verify AOIFeatureExtractor extracts all required biophysical metrics."""
    features = AOIFeatureExtractor.extract_features(SAMPLE_POLYGON)

    required_keys = [
        "centroid",
        "bounds",
        "area_sq_km",
        "mean_slope_deg",
        "max_slope_deg",
        "elevation_relief_m",
        "twi_index",
        "bare_soil_pct",
        "tree_cover_pct",
        "cropland_pct",
        "builtup_pct",
        "rainfall_30d_mm",
        "rainfall_anomaly_pct",
        "monsoon_storm_p95",
        "drainage_density_km_km2",
        "stream_order_max",
    ]

    for key in required_keys:
        assert key in features, f"Missing key {key}"
        assert features[key] is not None

    assert features["area_sq_km"] > 0
    assert 0 <= features["bare_soil_pct"] <= 100
    assert 0 <= features["tree_cover_pct"] <= 100


def test_ml_engine_analyze_aoi():
    """Verify RestorationMLEngine runs 4-model pipeline and returns predictions."""
    engine = RestorationMLEngine.get_instance()
    result = engine.analyze_aoi(SAMPLE_POLYGON)

    assert result["status"] == "success"
    assert 0.0 <= result["score"] <= 100.0
    assert result["category"] in ["Critical", "High", "Moderate", "Low"]
    assert result["soil_loss_t_ha_yr"] > 0

    # Model 3: SHAP drivers
    assert len(result["shap_drivers"]) > 0
    for driver in result["shap_drivers"]:
        assert "label" in driver
        assert "impact_pts" in driver

    # Model 2: Dynamic hydrograph
    assert len(result["hydrograph"]) == 30
    assert result["peak_discharge_m3s"] >= 0

    # Model 4: Prescribed civil interventions
    assert len(result["prescribed_interventions"]) > 0
    assert result["estimated_budget_lakhs_inr"] > 0


def test_ml_counterfactual_simulation():
    """Verify counterfactual simulation updates score when user modifies parameters."""
    engine = RestorationMLEngine.get_instance()
    initial = engine.analyze_aoi(SAMPLE_POLYGON)
    base_features = initial["features"]
    base_features["original_score"] = initial["score"]

    sim = engine.simulate_counterfactual(
        base_features=base_features,
        reforest_bare_soil_pct=15.0,
        add_check_dams_count=4,
        cct_ridge_coverage_pct=25.0,
    )

    assert sim["simulated_score"] <= initial["score"]
    assert sim["score_delta"] <= 0
    assert sim["reduction_pct"] >= 0


def test_predict_aoi_api_endpoint(client: TestClient):
    """Test POST /api/predict/aoi endpoint."""
    payload = {
        "geojson": SAMPLE_POLYGON,
        "name": "Western Ghats High Priority Valley",
    }
    response = client.post("/api/predict/aoi", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "success"
    assert "score" in data
    assert "category" in data
    assert "shap_drivers" in data
    assert "hydrograph" in data
    assert "prescribed_interventions" in data


def test_predict_simulate_api_endpoint(client: TestClient):
    """Test POST /api/predict/simulate endpoint."""
    features = AOIFeatureExtractor.extract_features(SAMPLE_POLYGON)
    payload = {
        "base_features": features,
        "reforest_bare_soil_pct": 20.0,
        "add_check_dams_count": 3,
        "cct_ridge_coverage_pct": 30.0,
    }
    response = client.post("/api/predict/simulate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "simulated_score" in data
    assert "simulated_category" in data


def test_models_info_endpoint(client: TestClient):
    """Test GET /api/predict/models-info endpoint."""
    response = client.get("/api/predict/models-info")
    assert response.status_code == 200
    data = response.json()
    assert len(data["models"]) == 4
    assert len(data["datasets"]) == 4
