"""Scenario simulation service."""

from __future__ import annotations

from app.services.scoring_service import calculate_score, validate_weights

# Re-export for use by scenario API
__all__ = ["calculate_score", "validate_weights"]
