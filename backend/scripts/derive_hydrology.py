"""Derive hydrological features from DEM using WhiteboxTools.

Runs depression breaching/filling, D8 flow direction, D8 flow accumulation,
and stream network extraction.

Usage: python -m scripts.derive_hydrology [--dem path/to/dem.tif] [--threshold 500]
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.services.gis.hydrology_service import HydrologyService
from app.services.gis.raster_service import RasterService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def derive_hydrology(
    dem_path: Path | None = None,
    stream_threshold: float = 500.0,
    output_dir: Path | None = None,
) -> dict:
    """Run full hydrological terrain processing pipeline."""
    settings = get_settings()
    data_dir = settings.data_path

    if dem_path is None:
        candidates = list((data_dir / "processed" / "dem").glob("*.tif"))
        if not candidates:
            candidates = list((data_dir / "raw" / "srtm").glob("*.tif"))
        if not candidates:
            logger.info("No DEM found. Generating synthetic DEM for pipeline readiness.")
            raw_dir = data_dir / "raw" / "srtm"
            raw_dir.mkdir(parents=True, exist_ok=True)
            dem_path = raw_dir / "srtm_sample_30m.tif"
            RasterService.create_synthetic_dem(dem_path, width=100, height=100)
        else:
            dem_path = candidates[0]

    if output_dir is None:
        output_dir = data_dir / "processed"
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Running hydrology pipeline on DEM: {dem_path}")
    service = HydrologyService()

    try:
        results = service.process_dem_pipeline(
            dem_path=dem_path,
            output_dir=output_dir,
            stream_threshold=stream_threshold,
        )
        logger.info("Hydrology processing completed successfully.")
        
        # Save manifest
        manifest_dir = data_dir / "manifests"
        manifest_dir.mkdir(parents=True, exist_ok=True)
        manifest_path = manifest_dir / "hydrology_manifest.json"
        with open(manifest_path, "w") as f:
            json.dump({k: str(v) for k, v in results.items()}, f, indent=2)
            
        return {
            "status": "success",
            "results": {k: str(v) for k, v in results.items()},
            "manifest": str(manifest_path),
        }
    except Exception as e:
        logger.error(f"Hydrology processing failed or tool unavailable: {e}")
        return {
            "status": "partial_or_error",
            "error": str(e),
            "note": "Ensure WhiteboxTools executable is available in PATH or WBT directory."
        }


def main():
    parser = argparse.ArgumentParser(description="Derive hydrology layers from DEM")
    parser.add_argument("--dem", type=Path, default=None, help="Input DEM path")
    parser.add_argument("--threshold", type=float, default=500.0, help="Stream initiation threshold")
    parser.add_argument("--output-dir", type=Path, default=None, help="Output root directory")
    args = parser.parse_args()

    result = derive_hydrology(args.dem, args.threshold, args.output_dir)
    print("\nResult:")
    for k, v in result.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
