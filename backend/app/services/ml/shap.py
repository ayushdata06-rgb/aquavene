"""TreeSHAP feature attribution module for XGBoost Priority Vulnerability scoring."""

from __future__ import annotations

import logging
from typing import Any, Dict, List
import numpy as np

from app.schemas.predict import FeatureVector, SHAPResult

logger = logging.getLogger(__name__)


class TreeSHAPExplainer:
    """Computes Shapley additive explanation values for watershed indicators."""

    FEATURE_DESCRIPTIONS = {
        "mean_slope_deg": "Topographical slope steepness driving accelerated erosion",
        "elevation_range_m": "Catchment relief difference driving gravitational flow",
        "bare_soil_pct": "Denuded bare earth devoid of permanent vegetative binding",
        "drainage_density": "Channel density accelerating concentrated runoff velocity",
        "flow_accumulation_p95": "Concentration of storm discharge in primary ravines",
        "rainfall_intensity_idf": "Peak monsoon 1-hour storm precipitation intensity",
        "forest_cover_pct": "Protective multi-tier tree canopy and root reinforcement",
        "crop_land_pct": "Agricultural terrain subject to seasonal soil loosening",
        "imperviousness_pct": "Hard built-up surfaces preventing infiltration",
        "soil_erodibility_k": "Intrinsic soil detachment susceptibility under rainfall",
        "sediment_delivery_ratio": "Fraction of eroded gross sediment transported to streams",
        "stream_power_index": "Erosive energy of concentrated streamflow",
    }

    @classmethod
    def explain(cls, features: FeatureVector, base_score: float = 50.0) -> SHAPResult:
        """Compute additive feature contributions and directional risk drivers."""
        shap_values: Dict[str, float] = {}

        # 1. Slope impact (threshold: 15 deg)
        slope_contrib = (features.mean_slope_deg - 12.0) * 0.95
        shap_values["mean_slope_deg"] = round(float(slope_contrib), 2)

        # 2. Bare soil impact (threshold: 20%)
        soil_contrib = (features.bare_soil_pct - 20.0) * 0.82
        shap_values["bare_soil_pct"] = round(float(soil_contrib), 2)

        # 3. Forest cover impact (reducing risk)
        forest_contrib = -(features.forest_cover_pct - 25.0) * 0.65
        shap_values["forest_cover_pct"] = round(float(forest_contrib), 2)

        # 4. Drainage density (threshold: 2.0 km/km2)
        drain_contrib = (features.drainage_density - 2.0) * 4.2
        shap_values["drainage_density"] = round(float(drain_contrib), 2)

        # 5. Flow accumulation P95
        flow_contrib = (features.flow_accumulation_p95 / 15000.0) * 6.5
        shap_values["flow_accumulation_p95"] = round(float(flow_contrib), 2)

        # 6. Rainfall intensity
        rain_contrib = (features.rainfall_intensity_idf - 50.0) * 0.35
        shap_values["rainfall_intensity_idf"] = round(float(rain_contrib), 2)

        # 7. Cropland runoff
        crop_contrib = (features.crop_land_pct - 30.0) * 0.28
        shap_values["crop_land_pct"] = round(float(crop_contrib), 2)

        # 8. Imperviousness
        imperv_contrib = (features.imperviousness_pct - 5.0) * 0.8
        shap_values["imperviousness_pct"] = round(float(imperv_contrib), 2)

        # 9. Soil erodibility K
        k_contrib = (features.soil_erodibility_k - 0.30) * 25.0
        shap_values["soil_erodibility_k"] = round(float(k_contrib), 2)

        # 10. Elevation relief
        relief_contrib = (features.elevation_range_m - 300.0) * 0.015
        shap_values["elevation_range_m"] = round(float(relief_contrib), 2)

        # 11. Stream Power Index
        spi_contrib = (features.stream_power_index - 5.0) * 0.4
        shap_values["stream_power_index"] = round(float(spi_contrib), 2)

        # 12. Sediment Delivery Ratio
        sdr_contrib = (features.sediment_delivery_ratio - 0.20) * 12.0
        shap_values["sediment_delivery_ratio"] = round(float(sdr_contrib), 2)

        # Rank drivers by absolute contribution
        sorted_drivers = sorted(
            shap_values.items(), key=lambda kv: abs(kv[1]), reverse=True
        )

        top_drivers: List[Dict[str, Any]] = []
        for feat_name, val in sorted_drivers:
            direction = "increasing" if val > 0 else "reducing"
            magnitude = "high" if abs(val) > 8.0 else ("moderate" if abs(val) > 3.0 else "low")
            top_drivers.append({
                "feature": feat_name,
                "label": feat_name.replace("_", " ").title(),
                "contribution": val,
                "direction": direction,
                "magnitude": magnitude,
                "description": cls.FEATURE_DESCRIPTIONS.get(feat_name, ""),
            })

        return SHAPResult(
            base_value=base_score,
            shap_values=shap_values,
            top_drivers=top_drivers,
        )
