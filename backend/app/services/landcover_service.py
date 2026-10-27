"""Land cover processing service.

Handles ESA WorldCover data inspection, clipping, and classification analysis.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, Optional, Union

from rasterio.enums import Resampling

from app.services.gis.raster_service import RasterService

logger = logging.getLogger(__name__)

# ESA WorldCover 2021 class definitions
WORLDCOVER_CLASSES = {
    10: "Tree cover",
    20: "Shrubland",
    30: "Grassland",
    40: "Cropland",
    50: "Built-up",
    60: "Bare / sparse vegetation",
    70: "Snow and ice",
    80: "Permanent water bodies",
    90: "Herbaceous wetland",
    95: "Mangroves",
    100: "Moss and lichen",
}

# Classes considered degraded for restoration prioritisation
DEGRADED_CLASSES = {50, 60}  # Built-up, Bare/sparse


class LandCoverService:
    """ESA WorldCover analysis."""

    @staticmethod
    def inspect_worldcover(path: Union[str, Path]) -> Dict[str, Any]:
        """Inspect a WorldCover GeoTIFF.

        Validates that it's a categorical raster and reports class distribution.
        """
        info = RasterService.inspect(path)
        result = {
            "path": str(path),
            "width": info.width,
            "height": info.height,
            "crs": info.crs,
            "resolution": info.resolution,
            "nodata": info.nodata,
            "bounds": info.bounds,
            "source": "ESA WorldCover",
            "year": 2021,
            "note": "Categorical raster. Use nearest-neighbour resampling for reprojection.",
        }

        # Get class distribution
        import rasterio
        import numpy as np

        with rasterio.open(path) as src:
            data = src.read(1, masked=True)
            valid = data.compressed()
            unique, counts = np.unique(valid, return_counts=True)
            total = counts.sum()
            result["class_distribution"] = {
                WORLDCOVER_CLASSES.get(int(u), f"Unknown({u})"): {
                    "class_id": int(u),
                    "pixel_count": int(c),
                    "proportion": round(float(c) / total, 4),
                }
                for u, c in zip(unique, counts)
            }

        return result

    @staticmethod
    def clip_to_watershed(
        worldcover_path: Union[str, Path],
        geometry: dict,
        output_path: Union[str, Path],
    ) -> Path:
        """Clip WorldCover raster to a watershed boundary.

        Uses nearest-neighbour resampling if reprojection is needed
        (categorical data must not use bilinear/cubic).
        """
        return RasterService.clip_to_geometry(
            worldcover_path, geometry, output_path, all_touched=True
        )

    @staticmethod
    def reproject_worldcover(
        input_path: Union[str, Path],
        output_path: Union[str, Path],
        dst_crs: str,
    ) -> Path:
        """Reproject WorldCover to a target CRS.

        ALWAYS uses nearest-neighbour resampling for categorical land cover class IDs.
        Never use bilinear or cubic interpolation on class IDs.
        """
        return RasterService.reproject_raster(
            input_path, output_path, dst_crs,
            resampling=Resampling.nearest,
        )

    @staticmethod
    def calculate_degradation(
        class_proportions: Dict[int, float],
    ) -> Dict[str, Any]:
        """Calculate degradation metrics from class proportions.

        Returns:
            Dict with degraded_fraction, class details, and notes.
        """
        degraded_fraction = sum(
            class_proportions.get(cls, 0.0) for cls in DEGRADED_CLASSES
        )
        vegetation_fraction = sum(
            class_proportions.get(cls, 0.0) for cls in [10, 20, 30]
        )
        agricultural_fraction = class_proportions.get(40, 0.0)

        return {
            "degraded_fraction": round(degraded_fraction, 4),
            "vegetation_fraction": round(vegetation_fraction, 4),
            "agricultural_fraction": round(agricultural_fraction, 4),
            "classes": {
                WORLDCOVER_CLASSES.get(cls_id, f"Unknown({cls_id})"): round(prop, 4)
                for cls_id, prop in sorted(class_proportions.items())
            },
            "degraded_classes": [WORLDCOVER_CLASSES[c] for c in DEGRADED_CLASSES],
            "note": "Single-epoch classification. No temporal change analysis.",
        }

    @staticmethod
    def calculate_class_proportions(raster_path: Union[str, Path]) -> Dict[int, float]:
        """Compute proportion of each WorldCover class in raster."""
        import rasterio
        import numpy as np

        with rasterio.open(raster_path) as src:
            data = src.read(1, masked=True)
            valid = data.compressed()
            if len(valid) == 0:
                return {}
            unique, counts = np.unique(valid, return_counts=True)
            total = float(counts.sum())
            return {int(u): round(float(c) / total, 4) for u, c in zip(unique, counts)}

    @staticmethod
    def calculate_degradation_score(class_proportions: Dict[int, float]) -> float:
        """Calculate degradation score as fraction of degraded classes."""
        return round(float(sum(class_proportions.get(cls, 0.0) for cls in DEGRADED_CLASSES)), 4)

    @staticmethod
    def create_synthetic_landcover(
        output_path: Union[str, Path],
        width: int = 100,
        height: int = 100,
    ) -> Path:
        """Create a synthetic WorldCover GeoTIFF for testing."""
        import rasterio
        import numpy as np
        from rasterio.transform import from_bounds

        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        classes = [10, 20, 30, 40, 50, 60]
        probs = [0.40, 0.15, 0.15, 0.15, 0.05, 0.10]
        data = np.random.choice(classes, size=(height, width), p=probs).astype(np.uint8)

        transform = from_bounds(74.0, 15.0, 75.0, 16.0, width, height)
        profile = {
            "driver": "GTiff",
            "height": height,
            "width": width,
            "count": 1,
            "dtype": "uint8",
            "crs": "EPSG:4326",
            "transform": transform,
            "nodata": 0,
        }
        with rasterio.open(output_path, "w", **profile) as dst:
            dst.write(data, 1)
        return output_path

