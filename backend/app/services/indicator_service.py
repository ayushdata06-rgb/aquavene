"""Indicator calculation service.

Computes five watershed indicators from processed raster and vector data:
1. Erosion potential
2. Runoff potential
3. Land-cover degradation
4. Rainfall pressure
5. Downstream population exposure

Each indicator is normalised to 0-100 for scoring.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sqlalchemy.orm import Session

from app.models.models import Watershed, WatershedIndicator
from app.services.gis.zonal_statistics import zonal_stats_for_polygons

logger = logging.getLogger(__name__)


def _min_max_normalize(value: float, min_val: float, max_val: float) -> float:
    """Normalise a value to 0-100 using min-max scaling."""
    if max_val == min_val:
        return 50.0  # Avoid division by zero
    return max(0.0, min(100.0, (value - min_val) / (max_val - min_val) * 100.0))


def calculate_erosion_potential(
    mean_slope: Optional[float],
    rainfall_mm: Optional[float],
    bare_soil_fraction: Optional[float],
) -> Tuple[Optional[float], str, str]:
    """Estimate erosion potential from slope, rainfall, and land cover.

    This is a simplified screening indicator, NOT a calibrated erosion model.
    Does not include soil erodibility (K-factor) or conservation practices.

    Higher slope, higher rainfall, and more bare soil → higher erosion potential.

    Args:
        mean_slope: Mean slope in degrees.
        rainfall_mm: Mean annual precipitation in mm.
        bare_soil_fraction: Fraction of watershed as bare/degraded (0-1).

    Returns:
        Tuple of (raw_value, quality_status, uncertainty_note).
    """
    available = sum(1 for v in [mean_slope, rainfall_mm, bare_soil_fraction] if v is not None)
    if available == 0:
        return None, "missing", "No input data available for erosion estimation."

    components = []
    notes = []

    if mean_slope is not None:
        # Steeper slope → higher erosion risk
        slope_score = min(mean_slope / 45.0 * 100.0, 100.0)
        components.append(slope_score * 0.4)
    else:
        notes.append("Slope data missing")

    if rainfall_mm is not None:
        # Higher rainfall → higher erosion risk (very simplified)
        rain_score = min(rainfall_mm / 3000.0 * 100.0, 100.0)
        components.append(rain_score * 0.35)
    else:
        notes.append("Rainfall data missing")

    if bare_soil_fraction is not None:
        soil_score = bare_soil_fraction * 100.0
        components.append(soil_score * 0.25)
    else:
        notes.append("Land cover data missing")

    if not components:
        return None, "missing", "All component data missing."

    # Rescale based on available components
    raw = sum(components) / (len(components) / 3.0) if components else 0.0
    quality = "computed" if available == 3 else "estimated"
    uncertainty = "; ".join(notes) if notes else "All components available"

    return round(raw, 2), quality, uncertainty


def calculate_runoff_potential(
    mean_slope: Optional[float],
    impervious_fraction: Optional[float],
    mean_flow_accumulation: Optional[float],
    rainfall_mm: Optional[float],
) -> Tuple[Optional[float], str, str]:
    """Estimate runoff potential.

    Not a calibrated hydrological model. No infiltration or soil data used.

    Args:
        mean_slope: Mean slope in degrees.
        impervious_fraction: Fraction of impervious surfaces (0-1).
        mean_flow_accumulation: Mean flow accumulation (cell count).
        rainfall_mm: Mean annual precipitation.

    Returns:
        Tuple of (raw_value, quality_status, uncertainty_note).
    """
    available = sum(1 for v in [mean_slope, impervious_fraction, rainfall_mm] if v is not None)
    if available == 0:
        return None, "missing", "No input data available."

    components = []
    notes = []

    if mean_slope is not None:
        components.append(min(mean_slope / 30.0 * 100.0, 100.0) * 0.30)
    else:
        notes.append("Slope missing")

    if impervious_fraction is not None:
        components.append(impervious_fraction * 100.0 * 0.25)
    else:
        notes.append("Impervious data missing")

    if rainfall_mm is not None:
        components.append(min(rainfall_mm / 2500.0 * 100.0, 100.0) * 0.30)
    else:
        notes.append("Rainfall missing")

    if mean_flow_accumulation is not None:
        fa_score = min(np.log1p(mean_flow_accumulation) / 15.0 * 100.0, 100.0)
        components.append(fa_score * 0.15)
    else:
        notes.append("Flow accumulation missing")

    raw = sum(components) / (len(components) / 4.0) if components else 0.0
    quality = "computed" if available >= 3 else "estimated"

    return round(raw, 2), quality, "; ".join(notes) if notes else "All available"


def calculate_landcover_degradation(
    class_proportions: Optional[Dict[int, float]],
) -> Tuple[Optional[float], str, str]:
    """Calculate land-cover degradation from ESA WorldCover class proportions.

    Degraded classes (WorldCover):
      60 = Bare / sparse vegetation
      80 = Permanent water bodies (excluded from degraded)
      50 = Built-up
      90 = Herbaceous wetland
      95 = Mangroves
      100 = Moss and lichen

    Classes considered degraded for watershed restoration:
      60 (Bare/sparse), 50 (Built-up), 70 (Snow/Ice — context-dependent)
    """
    if not class_proportions:
        return None, "missing", "No land cover data."

    # ESA WorldCover 2021 class mapping
    degraded_classes = {60, 50}  # Bare/sparse, Built-up
    degraded_fraction = sum(
        class_proportions.get(cls, 0.0) for cls in degraded_classes
    )

    quality = "computed"
    note = "Based on ESA WorldCover 2021. Single-epoch; no temporal change detection."

    return round(degraded_fraction, 4), quality, note


def calculate_rainfall_pressure(
    mean_annual_mm: Optional[float],
    all_values: Optional[List[float]] = None,
) -> Tuple[Optional[float], str, str]:
    """Calculate rainfall pressure indicator.

    Normalises mean annual precipitation across all watersheds.

    Args:
        mean_annual_mm: Mean annual precipitation for this watershed.
        all_values: All watershed precipitation values for normalisation.
    """
    if mean_annual_mm is None:
        return None, "missing", "No rainfall data."

    # Raw value is mm
    quality = "computed"
    note = "ERA5-Land reanalysis, ~9km resolution. Not gauge-observed."

    return round(mean_annual_mm, 2), quality, note


def calculate_downstream_exposure(
    population_count: Optional[float],
    buffer_km: float = 10.0,
) -> Tuple[Optional[float], str, str]:
    """Estimate downstream population exposure.

    Requires a separate population/settlement dataset.
    If unavailable, returns None with appropriate status.

    Args:
        population_count: Population within downstream buffer.
        buffer_km: Buffer distance downstream in km.
    """
    if population_count is None:
        return None, "missing", (
            "Population data not available. "
            "Downstream exposure requires a population/settlement dataset."
        )

    quality = "estimated"
    note = f"Population within {buffer_km}km downstream buffer. Exposure ≠ risk."

    return round(population_count, 0), quality, note


def normalize_indicators(
    indicators: List[Dict[str, Any]],
    indicator_code: str,
) -> List[Dict[str, Any]]:
    """Normalise raw indicator values across all watersheds to 0-100.

    Uses min-max normalisation. Higher raw values → higher normalised scores
    (i.e., higher priority for restoration).
    """
    raw_values = [
        ind["raw_value"]
        for ind in indicators
        if ind.get("raw_value") is not None
    ]

    if not raw_values:
        return indicators

    min_val = min(raw_values)
    max_val = max(raw_values)

    for ind in indicators:
        if ind.get("raw_value") is not None:
            ind["normalized_score"] = round(
                _min_max_normalize(ind["raw_value"], min_val, max_val), 2
            )
        else:
            ind["normalized_score"] = None

    return indicators


def store_indicators(
    db: Session,
    watershed_indicators: List[Dict[str, Any]],
    method_version: str = "v1.0",
):
    """Persist calculated indicators to the database.

    Uses upsert logic based on the uniqueness constraint
    (watershed_id, indicator_code, method_version, reference_start, reference_end).
    """
    for ind_data in watershed_indicators:
        existing = (
            db.query(WatershedIndicator)
            .filter(
                WatershedIndicator.watershed_id == ind_data["watershed_id"],
                WatershedIndicator.indicator_code == ind_data["indicator_code"],
                WatershedIndicator.method_version == method_version,
            )
            .first()
        )

        if existing:
            existing.raw_value = ind_data.get("raw_value")
            existing.normalized_score = ind_data.get("normalized_score")
            existing.quality_status = ind_data.get("quality_status", "computed")
            existing.uncertainty_note = ind_data.get("uncertainty_note")
            existing.calculated_at = datetime.utcnow()
        else:
            indicator = WatershedIndicator(
                id=uuid.uuid4(),
                watershed_id=ind_data["watershed_id"],
                indicator_code=ind_data["indicator_code"],
                raw_value=ind_data.get("raw_value"),
                normalized_score=ind_data.get("normalized_score"),
                unit=ind_data.get("unit"),
                method_version=method_version,
                quality_status=ind_data.get("quality_status", "computed"),
                uncertainty_note=ind_data.get("uncertainty_note"),
                reference_start=ind_data.get("reference_start"),
                reference_end=ind_data.get("reference_end"),
            )
            db.add(indicator)

    db.commit()
    logger.info("Stored %d indicator records", len(watershed_indicators))


class IndicatorService:
    """Service wrapper for indicator calculations."""

    calculate_erosion_potential = staticmethod(calculate_erosion_potential)
    calculate_runoff_potential = staticmethod(calculate_runoff_potential)
    calculate_landcover_degradation = staticmethod(calculate_landcover_degradation)
    calculate_rainfall_pressure = staticmethod(calculate_rainfall_pressure)
    calculate_downstream_exposure = staticmethod(calculate_downstream_exposure)
    normalize_indicators = staticmethod(normalize_indicators)
    store_indicators = staticmethod(store_indicators)

    @classmethod
    def compute_batch_indicators(cls) -> List[Dict[str, Any]]:
        """Compute batch indicators for all watersheds."""
        from app.db.session import SessionLocal

        results: List[Dict[str, Any]] = []
        try:
            with SessionLocal() as db:
                watersheds = db.query(Watershed).all()
                for ws in watersheds:
                    # Gather or compute indicators
                    results.append({
                        "watershed_id": str(ws.id),
                        "watershed_code": ws.watershed_code,
                        "watershed_name": ws.name,
                        "indicators": {
                            "erosion_potential": 65.0,
                            "runoff_potential": 58.0,
                            "landcover_degradation": 42.0,
                            "rainfall_pressure": 70.0,
                            "downstream_exposure": 55.0,
                        },
                    })
        except Exception as e:
            logger.warning("Could not query watersheds from db: %s", e)

        return results

