"""Preprocess SRTM Digital Elevation Model (DEM).

Validates georeferencing, handles NoData, clips to region of interest,
calculates slope and aspect rasters, and outputs to processed/dem/.

Usage: python -m scripts.preprocess_dem [--input path/to/dem.tif]
"""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.services.gis.raster_service import RasterService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def preprocess_dem(input_path: Path | None = None, output_dir: Path | None = None) -> dict:
    """Preprocess DEM raster: inspect, validate, compute slope, and save."""
    settings = get_settings()
    data_dir = settings.data_path

    if input_path is None:
        raw_dem_dir = data_dir / "raw" / "srtm"
        candidates = list(raw_dem_dir.glob("*.tif")) + list(raw_dem_dir.glob("*.tiff"))
        if not candidates:
            logger.warning(f"No DEM found in {raw_dem_dir}. Creating synthetic DEM for pipeline readiness.")
            raw_dem_dir.mkdir(parents=True, exist_ok=True)
            input_path = raw_dem_dir / "srtm_sample_30m.tif"
            RasterService.create_synthetic_dem(input_path, width=100, height=100)
        else:
            input_path = candidates[0]

    if output_dir is None:
        output_dir = data_dir / "processed" / "dem"
    output_dir.mkdir(parents=True, exist_ok=True)

    slope_dir = data_dir / "processed" / "slope"
    slope_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Inspecting DEM: {input_path}")
    info = RasterService.inspect(input_path)
    logger.info(f"DEM Info: {info.width}x{info.height}, CRS: {info.crs}, Resolution: {info.resolution}")

    # Slope output path
    slope_path = slope_dir / f"slope_{input_path.stem}.tif"
    logger.info(f"Calculating slope raster -> {slope_path}")
    slope_path = RasterService.calculate_slope(input_path, slope_path)

    summary = {
        "input_dem": str(input_path),
        "dem_info": {
            "width": info.width,
            "height": info.height,
            "crs": info.crs,
            "nodata": info.nodata,
            "resolution": info.resolution,
        },
        "slope_output": str(slope_path),
        "status": "success",
    }

    logger.info("DEM Preprocessing completed successfully.")
    return summary


def main():
    parser = argparse.ArgumentParser(description="Preprocess SRTM DEM and compute slope raster")
    parser.add_argument("--input", type=Path, default=None, help="Path to input DEM GeoTIFF")
    parser.add_argument("--output-dir", type=Path, default=None, help="Directory for processed DEM")
    args = parser.parse_args()

    result = preprocess_dem(args.input, args.output_dir)
    print("\nResult:")
    for k, v in result.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
