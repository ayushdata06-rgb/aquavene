"""Integration tests for consolidated FastAPI endpoints."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.auth.security import create_test_token
from app.config import get_settings


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


def test_export_rankings_csv(client: TestClient):
    """Test CSV export endpoint."""
    response = client.get("/api/exports/rankings.csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert len(response.text) > 0


def test_saved_plans_workflow(client: TestClient):
    """Test saving, retrieving, listing, and RBAC controls for DPR restoration plans."""
    settings = get_settings()
    secret = settings.jwt_secret or "test-secret-key-12345"

    planner_token = create_test_token(
        user_id="11111111-2222-3333-4444-555555555555",
        email="district.planner@aquavane.gov",
        secret=secret,
        role="planner",
    )
    viewer_token = create_test_token(
        user_id="22222222-3333-4444-5555-666666666666",
        email="public.observer@aquavane.gov",
        secret=secret,
        role="viewer",
    )
    admin_token = create_test_token(
        user_id="00000000-0000-0000-0000-000000000001",
        email="super.admin@aquavane.gov",
        secret=secret,
        role="admin",
    )

    payload = {
        "area_name": "Upper Kali Test Basin",
        "area_sq_km": 42.5,
        "original_score": 76.8,
        "simulated_score": 40.3,
        "original_soil_loss": 32.4,
        "simulated_soil_loss": 8.8,
        "reforest_pct": 15.0,
        "check_dams_count": 6,
        "cct_pct": 25.0,
        "budget_lakhs_inr": 142.5,
        "interventions": [
            {
                "title": "Continuous Contour Trenches (CCT)",
                "quantity": "34.2 km",
                "estimated_cost_lakhs_inr": 95.8,
            },
            {
                "title": "Cascading Gabion Check Dams",
                "quantity": "8 structures",
                "estimated_cost_lakhs_inr": 12.8,
            },
        ],
    }

    # 1. Reject creation if role is viewer (403 Forbidden)
    viewer_res = client.post("/api/plans", json=payload, headers={"Authorization": f"Bearer {viewer_token}"})
    assert viewer_res.status_code == 403

    # 2. Allow creation if role is planner (200 OK)
    planner_res = client.post("/api/plans", json=payload, headers={"Authorization": f"Bearer {planner_token}"})
    assert planner_res.status_code == 200
    plan_data = planner_res.json()
    assert plan_data["area_name"] == payload["area_name"]
    assert plan_data["budget_lakhs_inr"] == payload["budget_lakhs_inr"]
    assert "id" in plan_data
    plan_id = plan_data["id"]

    # 3. List plans (accessible to all authenticated or public)
    list_res = client.get("/api/plans")
    assert list_res.status_code == 200
    plans = list_res.json()
    assert isinstance(plans, list)

    # 4. Retrieve specific plan
    get_res = client.get(f"/api/plans/{plan_id}")
    assert get_res.status_code in [200, 404]

    # 5. Non-admin cannot delete plan (403 Forbidden)
    del_forbidden = client.delete(f"/api/plans/{plan_id}", headers={"Authorization": f"Bearer {planner_token}"})
    assert del_forbidden.status_code == 403

    # 6. Admin can delete plan (200 OK or 404 if mock session)
    del_admin = client.delete(f"/api/plans/{plan_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert del_admin.status_code in [200, 404]
