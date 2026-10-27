"""Pytest test configuration and fixtures for AquaVane."""

from __future__ import annotations

import os
import sys
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import create_app
from app.config import get_settings
from app.db.session import get_db
from app.models.models import Watershed, ScoringRun, PriorityScore, Scenario


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Test client for FastAPI endpoints with mock database session."""
    app = create_app()

    def mock_get_db():
        mock_session = MagicMock()
        # Mock query return values
        mock_session.query.return_value.scalar.return_value = 15
        mock_session.query.return_value.count.return_value = 15

        # Mock watershed
        mock_ws = MagicMock()
        mock_ws.id = uuid.uuid4()
        mock_ws.watershed_code = "WS-KA-001"
        mock_ws.name = "Upper Kali Micro-Watershed"
        mock_ws.country = "India"
        mock_ws.state = "Karnataka"
        mock_ws.district = "Uttara Kannada"
        mock_ws.basin_name = "Kali Basin"
        mock_ws.area_sq_km = 42.5
        mock_ws.created_at = datetime.now(timezone.utc)
        mock_ws.updated_at = datetime.now(timezone.utc)

        # Mock latest scoring run
        mock_run = MagicMock()
        mock_run.id = uuid.uuid4()
        mock_run.status = "completed"
        mock_run.method_version = "v1.0"
        mock_run.completed_at = datetime.now(timezone.utc)

        # Mock priority score
        mock_ps = MagicMock()
        mock_ps.id = uuid.uuid4()
        mock_ps.scoring_run_id = mock_run.id
        mock_ps.watershed_id = mock_ws.id
        mock_ps.overall_score = 79.4
        mock_ps.priority_category = "critical"
        mock_ps.rank_position = 1
        mock_ps.data_completeness = 1.0
        breakdown_dict = {
            "erosion_potential": 85.0,
            "runoff_potential": 78.0,
            "landcover_degradation": 70.0,
            "rainfall_pressure": 82.0,
            "downstream_exposure": 75.0,
        }
        mock_ps.indicator_breakdown = breakdown_dict
        mock_ps.indicator_breakdown_json = breakdown_dict

        mock_session.query.return_value.filter.return_value.first.return_value = mock_run
        mock_session.query.return_value.order_by.return_value.first.return_value = mock_run
        mock_session.query.return_value.filter.return_value.order_by.return_value.first.return_value = mock_run
        mock_session.query.return_value.filter.return_value.group_by.return_value.all.return_value = [
            ("critical", 3),
            ("high", 4),
            ("medium", 4),
            ("low", 4),
        ]
        mock_session.query.return_value.join.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = [
            (mock_ps, mock_ws)
        ]
        mock_session.query.return_value.offset.return_value.limit.return_value.all.return_value = [
            mock_ws
        ]
        mock_session.query.return_value.all.return_value = [mock_ws]
        mock_session.query.return_value.first.return_value = mock_ws

        try:
            yield mock_session
        finally:
            pass

    app.dependency_overrides[get_db] = mock_get_db

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def sample_weights() -> dict[str, float]:
    """Default valid policy weights."""
    return {
        "erosion_potential": 0.20,
        "runoff_potential": 0.25,
        "landcover_degradation": 0.15,
        "rainfall_pressure": 0.20,
        "downstream_exposure": 0.20,
    }


@pytest.fixture
def sample_indicator_values() -> dict[str, float]:
    """Sample normalized indicator scores (0-100)."""
    return {
        "erosion_potential": 65.0,
        "runoff_potential": 78.0,
        "landcover_degradation": 50.0,
        "rainfall_pressure": 82.0,
        "downstream_exposure": 60.0,
    }


@pytest.fixture
def temp_dir() -> Generator[Path, None, None]:
    """Temporary directory for synthetic GIS files."""
    with tempfile.TemporaryDirectory() as tmp_dir:
        yield Path(tmp_dir)
