"""AquaVane Location Intelligence Service.

Reverse geocodes polygon centroids via OpenStreetMap Nominatim and derives
administrative bounds, river basin classifications, and agro-climatic zones.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple
import httpx

logger = logging.getLogger(__name__)

# In-memory cache keyed by rounded (lat, lon)
_LOCATION_CACHE: Dict[Tuple[float, float], Dict[str, Any]] = {}

HTTP_TIMEOUT = 5.0
NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "AquaVane-Restoration-Planner/2.0 (watershed-intelligence@aquavane.org)"


class LocationIntelligenceService:
    """Detects administrative location, river basin, and geographic profile for an AOI."""

    @classmethod
    def reverse_geocode(
        cls,
        centroid: List[float],
        bounds: List[float],
        area_sq_km: float,
        elevation_relief_m: float = 0.0,
    ) -> Dict[str, Any]:
        """Detect place name, district, state, country, and river basin from coordinates."""
        lat = float(centroid[0])
        lon = float(centroid[1])
        cache_key = (round(lat, 2), round(lon, 2))

        if cache_key in _LOCATION_CACHE:
            cached = dict(_LOCATION_CACHE[cache_key])
            cached["area_sq_km"] = round(area_sq_km, 2)
            cached["area_hectares"] = round(area_sq_km * 100.0, 1)
            return cached

        # Derive river basin and agro-climatic zone
        river_basin = cls._infer_river_basin(lat, lon)
        agro_zone = cls._infer_agro_zone(lat, lon)

        place_info = {
            "display_name": f"Catchment at {lat:.4f}°N, {lon:.4f}°E",
            "locality": "Rural Catchment",
            "district": "Unknown District",
            "state": "Unknown State",
            "country": "India" if (8.0 <= lat <= 37.0 and 68.0 <= lon <= 97.0) else "Global Region",
            "river_basin": river_basin,
            "agro_climatic_zone": agro_zone,
            "area_sq_km": round(area_sq_km, 2),
            "area_hectares": round(area_sq_km * 100.0, 1),
            "centroid": [round(lat, 5), round(lon, 5)],
            "bounds": [round(b, 5) for b in bounds],
        }

        try:
            params = {
                "lat": lat,
                "lon": lon,
                "format": "jsonv2",
                "zoom": 10,
                "addressdetails": 1,
            }
            headers = {"User-Agent": USER_AGENT}

            with httpx.Client(timeout=HTTP_TIMEOUT, headers=headers) as client:
                resp = client.get(NOMINATIM_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    addr = data.get("address", {})

                    locality = (
                        addr.get("village")
                        or addr.get("town")
                        or addr.get("suburb")
                        or addr.get("city")
                        or addr.get("hamlet")
                        or addr.get("county")
                        or "Rural Micro-Basin"
                    )

                    district = (
                        addr.get("state_district")
                        or addr.get("district")
                        or addr.get("county")
                        or locality
                    )

                    state = addr.get("state") or addr.get("region") or place_info["state"]
                    country = addr.get("country") or place_info["country"]

                    place_info["display_name"] = data.get("display_name", place_info["display_name"])
                    place_info["locality"] = locality
                    place_info["district"] = district
                    place_info["state"] = state
                    place_info["country"] = country

                    _LOCATION_CACHE[cache_key] = place_info
        except Exception as e:
            logger.debug("Nominatim reverse geocode fallback: %s", e)

        return place_info

    @classmethod
    def _infer_river_basin(cls, lat: float, lon: float) -> str:
        """Infers major river basin from geographic coordinates."""
        # India bounds check
        if not (8.0 <= lat <= 37.5 and 68.0 <= lon <= 97.5):
            return "International Basin"

        # Himalayan / Indus
        if lat >= 30.0 and lon <= 78.5:
            return "Indus & Sutlej Upper Catchment"
        # Brahmaputra
        if lon >= 89.0:
            return "Brahmaputra River Basin"
        # Ganges / Yamuna
        if 23.5 <= lat <= 31.0 and 76.0 <= lon <= 88.5:
            return "Ganga - Yamuna River Basin"
        # Narmada
        if 21.0 <= lat <= 23.5 and 73.0 <= lon <= 81.5:
            return "Narmada River Basin"
        # Tapi
        if 20.3 <= lat <= 21.8 and 72.8 <= lon <= 78.5:
            return "Tapi River Basin"
        # Mahanadi
        if 19.5 <= lat <= 23.5 and 80.5 <= lon <= 87.0:
            return "Mahanadi River Basin"
        # Godavari
        if 17.5 <= lat <= 20.8 and 73.5 <= lon <= 82.5:
            return "Godavari River Basin"
        # Krishna
        if 14.5 <= lat <= 17.5 and 73.5 <= lon <= 81.5:
            return "Krishna River Basin"
        # Cauvery
        if 10.5 <= lat <= 14.0 and 75.0 <= lon <= 80.0:
            return "Cauvery River Basin"
        # Western Ghats Coastal drainage (Sharavathi, Kali, Netravati, Periyar)
        if 8.5 <= lat <= 16.0 and 73.5 <= lon <= 75.8:
            return "West-Flowing Western Ghats Catchment"
        # Pennar
        if 13.5 <= lat <= 15.5 and 77.0 <= lon <= 80.5:
            return "Pennar River Basin"

        return "Peninsular River Sub-Basin"

    @classmethod
    def _infer_agro_zone(cls, lat: float, lon: float) -> str:
        """Categorize into primary Indian agro-climatic sub-region."""
        if lat >= 28.0 and lon >= 77.0:
            return "Upper Gangetic Plain"
        if 18.0 <= lat <= 28.0 and lon < 75.0:
            return "Western Dry / Arid Zone"
        if 12.0 <= lat <= 24.0 and 75.0 <= lon <= 80.0:
            return "Deccan Plateau (Semi-Arid)"
        if 8.5 <= lat <= 16.5 and lon <= 76.0:
            return "Western Ghats & Coastal Plain"
        if 10.0 <= lat <= 21.0 and lon >= 80.0:
            return "Eastern Coastal Plain & Delta"
        return "Tropical Monsoon Plateau"

