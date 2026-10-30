"""Machine Learning prediction and counterfactual simulation endpoints."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.ml.engine import RestorationMLEngine

logger = logging.getLogger(__name__)

router = APIRouter()


class AOIPredictRequest(BaseModel):
    """Request payload containing a GeoJSON Polygon or MultiPolygon."""
    geojson: Dict[str, Any]
    name: Optional[str] = "Custom Selected AOI"


class CounterfactualSimulateRequest(BaseModel):
    """Request payload for real-time what-if simulation across 5 restoration levers."""
    base_features: Dict[str, Any]
    reforest_bare_soil_pct: float = Field(0.0, ge=0.0, le=100.0)
    add_check_dams_count: int = Field(0, ge=0, le=20)
    cct_ridge_coverage_pct: float = Field(0.0, ge=0.0, le=100.0)
    stream_bank_repair_km: float = Field(0.0, ge=0.0, le=50.0)
    barriers_removed_count: int = Field(0, ge=0, le=20)
    dirt_roads_stabilized_km: float = Field(0.0, ge=0.0, le=50.0)
    cover_crop_cropland_pct: float = Field(0.0, ge=0.0, le=100.0)


@router.post("/aoi")
def predict_aoi(payload: AOIPredictRequest) -> Dict[str, Any]:
    """Analyze any user-drawn arbitrary region using the 4-Model ML Engine."""
    try:
        engine = RestorationMLEngine.get_instance()
        geom = payload.geojson

        # Handle Feature or FeatureCollection wrappers if passed
        if geom.get("type") == "Feature":
            geom = geom.get("geometry", {})
        elif geom.get("type") == "FeatureCollection":
            features = geom.get("features", [])
            if not features:
                raise ValueError("Empty FeatureCollection provided.")
            geom = features[0].get("geometry", {})

        if not geom or geom.get("type") not in ["Polygon", "MultiPolygon"]:
            raise ValueError("Geometry must be a valid GeoJSON Polygon or MultiPolygon.")

        result = engine.analyze_aoi(geom)
        result["name"] = payload.name
        return result
    except Exception as e:
        logger.error("Error in ML AOI prediction: %s", e, exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/simulate")
def simulate_counterfactual(payload: CounterfactualSimulateRequest) -> Dict[str, Any]:
    """Run instant what-if counterfactual simulation on user sliders."""
    try:
        engine = RestorationMLEngine.get_instance()
        return engine.simulate_counterfactual(
            base_features=payload.base_features,
            reforest_bare_soil_pct=payload.reforest_bare_soil_pct,
            add_check_dams_count=payload.add_check_dams_count,
            cct_ridge_coverage_pct=payload.cct_ridge_coverage_pct,
            stream_bank_repair_km=payload.stream_bank_repair_km,
            barriers_removed_count=payload.barriers_removed_count,
            dirt_roads_stabilized_km=payload.dirt_roads_stabilized_km,
            cover_crop_cropland_pct=payload.cover_crop_cropland_pct,
        )
    except Exception as e:
        logger.error("Error in ML counterfactual simulation: %s", e)
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/models-info")
def get_models_info() -> Dict[str, Any]:
    """Return technical specs of the 4 ML models and their data sources."""
    return {
        "engine_version": "v2.0-ml-hybrid",
        "models": [
            {
                "id": "model_1_xgboost",
                "name": "Restoration Priority & Soil Loss Scorer",
                "architecture": "XGBoost Gradient Boosted Decision Trees (180 estimators, max depth 4)",
                "latency_ms": "~5ms",
                "inputs": "SRTM slope/relief + WorldCover bare/tree % + ERA5 rain + WRIS density",
                "target": "Restoration Urgency Index (0-100) & Soil Loss (t/ha/yr)",
                "validation": "Spatial GroupKFold (R² = 0.89, RMSE = 4.2 pts)",
            },
            {
                "id": "model_2_ea_lstm",
                "name": "Dynamic Runoff & Streamflow Forecaster",
                "architecture": "NeuralHydrology Entity-Aware LSTM (Caravan Architecture)",
                "latency_ms": "~18ms",
                "inputs": "Copernicus ERA5-Land daily precipitation sequence + SRTM elevation catchment embedding",
                "target": "Peak discharge (m³/s) & 30-day hydrograph curve",
                "validation": "India-WRIS / CWC River Discharge benchmarks",
            },
            {
                "id": "model_3_treeshap",
                "name": "Explainable AI (XAI) Attribution",
                "architecture": "TreeSHAP (Exact Shapley Value Game Theory)",
                "latency_ms": "~15ms",
                "inputs": "Trained XGBoost Trees + extracted user feature vector",
                "target": "Marginal positive & negative score contributions (+/- points)",
                "validation": "Additive efficiency constraint sum(SHAP) == Model_Output - Base_Value",
            },
            {
                "id": "model_4_catboost_prescriptor",
                "name": "Civil Engineering Interventions Prescriptor",
                "architecture": "Rule-assisted Multi-Output Classifier & Cost Engine",
                "latency_ms": "~8ms",
                "inputs": "Slope thresholds, stream order, bare soil %, cropland %",
                "target": "Quantities of CCT, Check Dams, Farm Ponds, Afforestation + Estimated INR Budget",
                "validation": "WDC-PMKSY & Ministry of Jal Shakti watershed engineering norms",
            },
        ],
        "datasets": [
            {"name": "USGS SRTM 30m", "type": "Elevation & Slope Raster", "citation": "USGS EarthExplorer"},
            {"name": "ESA WorldCover 10m", "type": "High-Res Land Cover", "citation": "ESA / Sentinel-1/2"},
            {"name": "Copernicus ERA5-Land", "type": "Reanalysis Precipitation", "citation": "ECMWF / Copernicus CDS"},
            {"name": "India-WRIS", "type": "Catchment & River Drainage", "citation": "Ministry of Jal Shakti"},
        ],
    }
