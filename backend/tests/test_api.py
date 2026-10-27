"""Integration tests for FastAPI endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "healthy", "degraded"]
    assert "version" in data


def test_dashboard_summary(client: TestClient):
    """Test dashboard overview summary."""
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_watersheds" in data
    assert "category_distribution" in data or "priority_distribution" in data
    assert "top_watersheds" in data


def test_watersheds_list(client: TestClient):
    """Test listing watersheds."""
    response = client.get("/api/watersheds")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))
    if isinstance(data, dict):
        assert "items" in data or "features" in data


def test_rankings_list(client: TestClient):
    """Test rankings endpoint."""
    response = client.get("/api/rankings")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data or isinstance(data, list)


def test_layers_metadata(client: TestClient):
    """Test GIS layers metadata endpoint."""
    response = client.get("/api/layers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, (list, dict))


def test_rainfall_summary(client: TestClient):
    """Test rainfall summary endpoint."""
    response = client.get("/api/rainfall/summary")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_scenarios_workflow(client: TestClient):
    """Test scenarios listing and creation."""
    # List scenarios
    get_res = client.get("/api/scenarios")
    assert get_res.status_code == 200

    # Create a scenario
    payload = {
        "name": "High Erosion Focus",
        "description": "Policy scenario prioritizing soil erosion mitigation",
        "weights": {
            "erosion_potential": 0.40,
            "runoff_potential": 0.20,
            "landcover_degradation": 0.15,
            "rainfall_pressure": 0.15,
            "downstream_exposure": 0.10,
        },
    }
    post_res = client.post("/api/scenarios", json=payload)
    assert post_res.status_code in [200, 201]
    scenario = post_res.json()
    assert scenario["name"] == payload["name"]


def test_export_rankings_csv(client: TestClient):
    """Test CSV export endpoint."""
    response = client.get("/api/exports/rankings.csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert len(response.text) > 0
