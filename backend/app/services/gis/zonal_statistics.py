"""Zonal statistics — calculate raster statistics per watershed polygon.

Uses Rasterio masking for each polygon. For large datasets, consider
the rasterstats library as a declared dependency.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import geopandas as gpd
import numpy as np
import rasterio
from rasterio.mask import mask as rasterio_mask
from shapely.geometry import mapping

logger = logging.getLogger(__name__)


def zonal_stats_for_polygons(
    raster_path: Union[str, Path],
    polygons: gpd.GeoDataFrame,
    id_column: str,
    band: int = 1,
    categorical: bool = False,
    nodata: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """Calculate raster statistics for each polygon in a GeoDataFrame.

    For continuous data (categorical=False):
        Returns mean, min, max, std, median, count for each polygon.

    For categorical data (categorical=True):
        Returns class counts and proportions for each polygon.

    IMPORTANT: The polygons must be in the same CRS as the raster.
    If they differ, the caller must reproject the polygons first.

    Args:
        raster_path: Path to the input raster.
        polygons: GeoDataFrame with polygon geometries.
        id_column: Column in polygons to use as the zone identifier.
        band: Raster band to analyse (1-indexed).
        categorical: If True, compute class counts instead of continuous stats.
        nodata: Override NoData value (if None, use raster's NoData).

    Returns:
        List of dicts, one per polygon, with the zone ID and statistics.
    """
    raster_path = Path(raster_path)
    if not raster_path.exists():
        raise FileNotFoundError(f"Raster not found: {raster_path}")

    results = []

    with rasterio.open(raster_path) as src:
        raster_crs = src.crs
        raster_nodata = nodata if nodata is not None else src.nodata

        # Check CRS
        if polygons.crs and raster_crs and polygons.crs != raster_crs:
            logger.warning(
                "CRS mismatch: polygons=%s, raster=%s. Reprojecting polygons.",
                polygons.crs, raster_crs,
            )
            polygons = polygons.to_crs(raster_crs)

        for idx, row in polygons.iterrows():
            zone_id = row[id_column]
            geom = row.geometry

            if geom is None or geom.is_empty:
                results.append({
                    id_column: zone_id,
                    "error": "null_or_empty_geometry",
                })
                continue

            try:
                geom_geojson = mapping(geom)
                out_image, out_transform = rasterio_mask(
                    src, [geom_geojson], crop=True, filled=False
                )
                data = out_image[band - 1]  # Select band

                # Apply NoData mask
                if raster_nodata is not None:
                    data = np.ma.masked_equal(data, raster_nodata)

                valid = data.compressed()

                if len(valid) == 0:
                    results.append({
                        id_column: zone_id,
                        "valid_pixels": 0,
                        "nodata_pixels": int(data.size),
                        "error": "no_valid_data",
                    })
                    continue

                if categorical:
                    unique, counts = np.unique(valid, return_counts=True)
                    total = counts.sum()
                    results.append({
                        id_column: zone_id,
                        "class_counts": {int(u): int(c) for u, c in zip(unique, counts)},
                        "class_proportions": {
                            int(u): round(float(c) / total, 4)
                            for u, c in zip(unique, counts)
                        },
                        "total_valid_pixels": int(total),
                        "nodata_pixels": int(np.ma.count_masked(data)),
                    })
                else:
                    results.append({
                        id_column: zone_id,
                        "mean": round(float(np.mean(valid)), 4),
                        "min": round(float(np.min(valid)), 4),
                        "max": round(float(np.max(valid)), 4),
                        "std": round(float(np.std(valid)), 4),
                        "median": round(float(np.median(valid)), 4),
                        "sum": round(float(np.sum(valid)), 4),
                        "valid_pixels": int(len(valid)),
                        "nodata_pixels": int(np.ma.count_masked(data)),
                    })

            except Exception as e:
                logger.error("Zonal stats failed for zone %s: %s", zone_id, e)
                results.append({
                    id_column: zone_id,
                    "error": str(e),
                })

    logger.info(
        "Computed zonal stats for %d polygons from %s (categorical=%s)",
        len(results), raster_path.name, categorical,
    )
    return results
