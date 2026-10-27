"""Raster data engine using Rasterio.

Handles GeoTIFF inspection, reading, windowed/masked reads, clipping to
watershed boundaries, reprojection, resampling, and output creation.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np
import rasterio
from rasterio.crs import CRS
from rasterio.enums import Resampling
from rasterio.features import geometry_mask
from rasterio.mask import mask as rasterio_mask
from rasterio.transform import from_bounds
from rasterio.warp import calculate_default_transform, reproject
from rasterio.windows import from_bounds as window_from_bounds
from shapely.geometry import box, mapping, shape

logger = logging.getLogger(__name__)


@dataclass
class RasterInfo:
    """Metadata extracted from a raster file."""

    path: str
    driver: str
    width: int
    height: int
    count: int  # number of bands
    dtype: str
    crs: Optional[str]
    transform: Any
    bounds: Tuple[float, float, float, float]
    nodata: Optional[float]
    resolution: Tuple[float, float]
    units: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)


class RasterService:
    """Core raster operations powered by Rasterio."""

    # ---- Inspection ----

    @staticmethod
    def inspect(path: Union[str, Path]) -> RasterInfo:
        """Open and inspect a GeoTIFF, returning comprehensive metadata.

        Raises FileNotFoundError if the path does not exist.
        Raises rasterio.errors.RasterioIOError if the file cannot be read as a raster.
        """
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Raster file not found: {path}")

        with rasterio.open(path) as src:
            info = RasterInfo(
                path=str(path),
                driver=src.driver,
                width=src.width,
                height=src.height,
                count=src.count,
                dtype=str(src.dtypes[0]),
                crs=str(src.crs) if src.crs else None,
                transform=src.transform,
                bounds=src.bounds,
                nodata=src.nodata,
                resolution=src.res,
                extra={
                    "tags": src.tags(),
                    "descriptions": src.descriptions,
                    "compression": src.compression.name if src.compression else None,
                },
            )
            logger.info(
                "Inspected raster: %s — %dx%d, %d band(s), CRS=%s, nodata=%s",
                path.name, info.width, info.height, info.count, info.crs, info.nodata,
            )
            return info

    # ---- Reading ----

    @staticmethod
    def read_band(
        path: Union[str, Path],
        band: int = 1,
        window: Optional[rasterio.windows.Window] = None,
        masked: bool = True,
    ) -> Tuple[np.ma.MaskedArray, dict]:
        """Read a single band, optionally windowed.

        Returns (data_array, profile_dict).
        Uses masked=True to properly handle NoData values.
        """
        with rasterio.open(path) as src:
            data = src.read(band, window=window, masked=masked)
            profile = dict(src.profile)
            if window:
                profile.update(
                    width=window.width,
                    height=window.height,
                    transform=src.window_transform(window),
                )
            return data, profile

    @staticmethod
    def read_window_by_bounds(
        path: Union[str, Path],
        bounds: Tuple[float, float, float, float],
        band: int = 1,
    ) -> Tuple[np.ma.MaskedArray, dict]:
        """Read a subset of the raster defined by geographic bounds (left, bottom, right, top)."""
        with rasterio.open(path) as src:
            window = window_from_bounds(*bounds, transform=src.transform)
            data = src.read(band, window=window, masked=True)
            profile = dict(src.profile)
            profile.update(
                width=int(window.width),
                height=int(window.height),
                transform=src.window_transform(window),
            )
            return data, profile

    # ---- Clipping ----

    @staticmethod
    def clip_to_geometry(
        raster_path: Union[str, Path],
        geometry: dict,
        output_path: Union[str, Path],
        all_touched: bool = False,
        crop: bool = True,
    ) -> Path:
        """Clip a raster to a vector geometry (GeoJSON-like dict) and write the result.

        Uses rasterio.mask to perform the clip. The geometry must be in the same
        CRS as the raster, or the caller must reproject first.

        Args:
            raster_path: Input raster file.
            geometry: GeoJSON-like geometry dict (Polygon/MultiPolygon).
            output_path: Path for the clipped output.
            all_touched: If True, all pixels touched by geometry are included.
            crop: If True, output is cropped to the geometry extent.

        Returns:
            Path to the output raster.
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with rasterio.open(raster_path) as src:
            out_image, out_transform = rasterio_mask(
                src,
                [geometry],
                crop=crop,
                all_touched=all_touched,
                filled=True,
            )
            out_meta = src.meta.copy()
            out_meta.update({
                "height": out_image.shape[1],
                "width": out_image.shape[2],
                "transform": out_transform,
            })

        with rasterio.open(output_path, "w", **out_meta) as dst:
            dst.write(out_image)

        logger.info("Clipped raster to geometry -> %s", output_path)
        return output_path

    # ---- Reprojection ----

    @staticmethod
    def reproject_raster(
        input_path: Union[str, Path],
        output_path: Union[str, Path],
        dst_crs: str,
        resampling: Resampling = Resampling.bilinear,
    ) -> Path:
        """Reproject a raster to a target CRS.

        IMPORTANT: Use Resampling.nearest for categorical data (e.g., land cover class IDs).
        Use Resampling.bilinear or .cubic for continuous data (e.g., elevation).

        Args:
            input_path: Source raster.
            output_path: Destination raster.
            dst_crs: Target CRS (e.g., 'EPSG:32643').
            resampling: Resampling method.

        Returns:
            Path to the reprojected raster.
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with rasterio.open(input_path) as src:
            transform, width, height = calculate_default_transform(
                src.crs, dst_crs, src.width, src.height, *src.bounds
            )
            kwargs = src.meta.copy()
            kwargs.update({
                "crs": dst_crs,
                "transform": transform,
                "width": width,
                "height": height,
            })

            with rasterio.open(output_path, "w", **kwargs) as dst:
                for band_idx in range(1, src.count + 1):
                    reproject(
                        source=rasterio.band(src, band_idx),
                        destination=rasterio.band(dst, band_idx),
                        src_transform=src.transform,
                        src_crs=src.crs,
                        dst_transform=transform,
                        dst_crs=dst_crs,
                        resampling=resampling,
                    )

        logger.info(
            "Reprojected %s -> %s (CRS: %s, resampling: %s)",
            Path(input_path).name, output_path.name, dst_crs, resampling.name,
        )
        return output_path

    # ---- Calculation ----

    @staticmethod
    def calculate_slope(
        dem_path: Union[str, Path],
        output_path: Union[str, Path],
    ) -> Path:
        """Calculate slope in degrees from a DEM using numpy gradient.

        For production use, WhiteboxTools or GDAL DEMProcessing may be preferred.
        This implementation works for projected DEMs where pixel size is in metres.
        For geographic CRS (degrees), results are approximate.

        Returns:
            Path to the slope raster.
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with rasterio.open(dem_path) as src:
            dem = src.read(1, masked=True)
            profile = src.profile.copy()
            transform = src.transform
            res_x = abs(transform.a)
            res_y = abs(transform.e)

        # Calculate gradient
        dy, dx = np.gradient(dem.filled(np.nan), res_y, res_x)
        slope_rad = np.arctan(np.sqrt(dx ** 2 + dy ** 2))
        slope_deg = np.degrees(slope_rad).astype(np.float32)

        # Apply original mask
        if hasattr(dem, "mask"):
            slope_deg[dem.mask] = -9999.0

        profile.update(dtype="float32", nodata=-9999.0, count=1)

        with rasterio.open(output_path, "w", **profile) as dst:
            dst.write(slope_deg, 1)

        logger.info("Calculated slope -> %s", output_path)
        return output_path

    # ---- Writing ----

    @staticmethod
    def write_raster(
        data: np.ndarray,
        profile: dict,
        output_path: Union[str, Path],
    ) -> Path:
        """Write a numpy array as a GeoTIFF with the given profile metadata."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if data.ndim == 2:
            data = data[np.newaxis, :, :]  # Add band dimension

        profile.update(count=data.shape[0])

        with rasterio.open(output_path, "w", **profile) as dst:
            dst.write(data)

        logger.info("Wrote raster -> %s (%dx%d)", output_path, data.shape[2], data.shape[1])
        return output_path

    # ---- Raster Statistics ----

    @staticmethod
    def raster_stats_for_geometry(
        raster_path: Union[str, Path],
        geometry: dict,
        band: int = 1,
        categorical: bool = False,
    ) -> Dict[str, Any]:
        """Calculate statistics for a raster within a geometry boundary.

        For continuous data, returns mean, min, max, std, count, nodata_count.
        For categorical data (categorical=True), returns class counts and proportions.

        The geometry must be in the same CRS as the raster.
        """
        with rasterio.open(raster_path) as src:
            out_image, _ = rasterio_mask(src, [geometry], crop=True, filled=False)

        data = out_image[band - 1]  # Get the requested band

        if categorical:
            valid = data.compressed()  # Remove masked values
            unique, counts = np.unique(valid, return_counts=True)
            total = counts.sum()
            class_counts = {int(u): int(c) for u, c in zip(unique, counts)}
            class_proportions = {int(u): round(float(c) / total, 4) for u, c in zip(unique, counts)}
            return {
                "type": "categorical",
                "class_counts": class_counts,
                "class_proportions": class_proportions,
                "total_valid_pixels": int(total),
                "nodata_pixels": int(data.count() if hasattr(data, 'count') else 0),
            }
        else:
            valid = data.compressed()
            if len(valid) == 0:
                return {
                    "type": "continuous",
                    "mean": None,
                    "min": None,
                    "max": None,
                    "std": None,
                    "valid_pixels": 0,
                    "nodata_pixels": int(np.ma.count_masked(data)),
                }
            return {
                "type": "continuous",
                "mean": float(np.mean(valid)),
                "min": float(np.min(valid)),
                "max": float(np.max(valid)),
                "std": float(np.std(valid)),
                "median": float(np.median(valid)),
                "valid_pixels": int(len(valid)),
                "nodata_pixels": int(np.ma.count_masked(data)),
            }

    # ---- CRS Helpers ----

    @staticmethod
    def check_crs_match(path1: Union[str, Path], path2: Union[str, Path]) -> bool:
        """Check if two rasters share the same CRS."""
        with rasterio.open(path1) as src1, rasterio.open(path2) as src2:
            return src1.crs == src2.crs

    @staticmethod
    def get_crs(path: Union[str, Path]) -> Optional[str]:
        """Return the CRS EPSG code or WKT string for a raster."""
        with rasterio.open(path) as src:
            if src.crs:
                epsg = src.crs.to_epsg()
                return f"EPSG:{epsg}" if epsg else src.crs.to_wkt()
            return None

    @staticmethod
    def get_utm_zone_for_bounds(bounds: Tuple[float, float, float, float]) -> str:
        """Estimate appropriate UTM zone EPSG code for given WGS84 bounds."""
        center_lon = (bounds[0] + bounds[2]) / 2
        center_lat = (bounds[1] + bounds[3]) / 2
        zone_number = int((center_lon + 180) / 6) + 1
        if center_lat >= 0:
            return f"EPSG:{32600 + zone_number}"
        else:
            return f"EPSG:{32700 + zone_number}"

    @staticmethod
    def create_synthetic_dem(
        output_path: Union[str, Path],
        width: int = 100,
        height: int = 100,
        base_elevation: float = 500.0,
    ) -> Path:
        """Create a synthetic DEM GeoTIFF for testing and pipeline fixtures."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        x = np.linspace(-3, 3, width)
        y = np.linspace(-3, 3, height)
        xx, yy = np.meshgrid(x, y)
        elevation = (base_elevation + 150 * np.sin(xx) * np.cos(yy) + 20 * (xx**2 + yy**2)).astype(np.float32)

        transform = from_bounds(74.0, 15.0, 75.0, 16.0, width, height)
        profile = {
            "driver": "GTiff",
            "height": height,
            "width": width,
            "count": 1,
            "dtype": "float32",
            "crs": "EPSG:4326",
            "transform": transform,
            "nodata": -9999.0,
        }
        with rasterio.open(output_path, "w", **profile) as dst:
            dst.write(elevation, 1)
        return output_path

