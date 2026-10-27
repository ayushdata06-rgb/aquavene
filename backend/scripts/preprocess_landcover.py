"""Preprocess ESA WorldCover land cover raster.

Inspects WorldCover raster, computes class proportions using nearest-neighbor interpolation,
calculates land degradation proportion, and exports summary to processed/landcover/.

Usage: python -m scripts.preprocess_landcover [--input path/to/worldcover.tif]
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
from app.services.landcover_service import LandCoverService
from app.services.gis.raster_service import RasterService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def preprocess_landcover(input_path: Path | None = None, output_dir: Path | None = None) -> dict:
    """Preprocess ESA WorldCover raster."""
    settings = get_settings()
    data_dir = settings.data_path

    if input_path is None:
        raw_lc_dir = data_dir / "raw" / "worldcover"
        candidates = list(raw_lc_dir.glob("*.tif")) + list(raw_lc_dir.glob("*.tiff"))
        if not candidates:
            logger.info("No WorldCover raster found. Generating synthetic WorldCover raster fixture.")
            raw_lc_dir.mkdir(parents=True, exist_ok=True)
            input_path = raw_lc_dir / "worldcover_sample_10m.tif"
            LandCoverService.create_synthetic_landcover(input_path, width=100, height=100)
        else:
            input_path = candidates[0]

    if output_dir is None:
        output_dir = data_dir / "processed" / "landcover"
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Inspecting Land Cover raster: {input_path}")
    info = RasterService.inspect(input_path)
    logger.info(f"Dimensions: {info.width}x{info.height}, CRS: {info.crs}")

    class_proportions = LandCoverService.calculate_class_proportions(input_path)
    degradation_score = LandCoverService.calculate_degradation_score(class_proportions)

    summary_path = output_dir / f"{input_path.stem}_summary.json"
    with open(summary_path, "w") as f:
        json.dump({
            "source_file": str(input_path),
            "dimensions": {"width": info.width, "height": info.height},
            "crs": str(info.crs),
            "class_proportions": class_proportions,
            "degradation_score": degradation_score,
        }, f, indent=2)

    logger.info(f"Land Cover preprocessing completed -> {summary_path}")
    return {
        "status": "success",
        "input": str(input_path),
        "class_proportions": class_proportions,
        "degradation_score": degradation_score,
        "summary_output": str(summary_path),
    }


def main():
    parser = argparse.ArgumentParser(description="Preprocess ESA WorldCover raster")
    parser.add_argument("--input", type=Path, default=None, help="Input WorldCover GeoTIFF")
    parser.add_argument("--output-dir", type=Path, default=None, help="Output directory")
    args = parser.parse_args()

    result = preprocess_landcover(args.input, args.output_dir)
    print("\nResult:")
    for k, v in result.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
