"""Preprocess Copernicus ERA5-Land precipitation data.

Inspects NetCDF, verifies precipitation units (m -> mm), validates accumulation semantics,
aggregates monthly/annual totals, and writes processed results.

Usage: python -m scripts.preprocess_rainfall [--input path/to/era5.nc]
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
from app.services.rainfall_service import RainfallService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def preprocess_rainfall(input_path: Path | None = None, output_dir: Path | None = None) -> dict:
    """Preprocess ERA5-Land precipitation data."""
    settings = get_settings()
    data_dir = settings.data_path

    if input_path is None:
        raw_rain_dir = data_dir / "raw" / "copernicus"
        candidates = list(raw_rain_dir.glob("*.nc")) + list(raw_rain_dir.glob("*.nc4"))
        if not candidates:
            logger.info("No NetCDF found in raw/copernicus. Generating synthetic ERA5-Land fixture for pipeline.")
            raw_rain_dir.mkdir(parents=True, exist_ok=True)
            input_path = raw_rain_dir / "era5_land_precip_sample.nc"
            RainfallService.create_synthetic_netcdf(input_path)
        else:
            input_path = candidates[0]

    if output_dir is None:
        output_dir = data_dir / "processed" / "rainfall"
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Inspecting ERA5-Land file: {input_path}")
    inspection = RainfallService.inspect_netcdf(input_path)
    logger.info(f"Variables: {inspection.get('variables')}, Time range: {inspection.get('time_range')}")

    # Process monthly totals and statistics
    logger.info("Computing monthly precipitation aggregation...")
    monthly_data = RainfallService.aggregate_monthly(input_path)

    # Save summary json
    summary_path = output_dir / f"{input_path.stem}_summary.json"
    with open(summary_path, "w") as f:
        json.dump({
            "source_file": str(input_path),
            "inspection": inspection,
            "monthly_summary": monthly_data,
        }, f, indent=2, default=str)

    logger.info(f"Precipitation preprocessing complete -> {summary_path}")
    return {
        "status": "success",
        "input": str(input_path),
        "summary_output": str(summary_path),
        "months_processed": len(monthly_data),
    }


def main():
    parser = argparse.ArgumentParser(description="Preprocess ERA5-Land precipitation data")
    parser.add_argument("--input", type=Path, default=None, help="Input NetCDF file")
    parser.add_argument("--output-dir", type=Path, default=None, help="Output directory")
    args = parser.parse_args()

    result = preprocess_rainfall(args.input, args.output_dir)
    print("\nResult:")
    for k, v in result.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
