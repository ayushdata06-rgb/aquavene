"""Calculate the 5 watershed restoration indicators.

Computes:
1. Erosion potential (0-100)
2. Runoff potential (0-100)
3. Land-cover degradation (0-100)
4. Rainfall pressure (0-100)
5. Downstream population exposure (0-100)

Usage: python -m scripts.calculate_watershed_indicators [--output path/to/output.json]
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
from app.services.indicator_service import IndicatorService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def calculate_indicators(output_path: Path | None = None) -> dict:
    """Calculate indicators for all available watersheds."""
    settings = get_settings()
    data_dir = settings.data_path

    if output_path is None:
        ind_dir = data_dir / "processed" / "indicators"
        ind_dir.mkdir(parents=True, exist_ok=True)
        output_path = ind_dir / "watershed_indicators_batch.json"

    logger.info("Computing watershed indicators from processed GIS inputs...")
    results = IndicatorService.compute_batch_indicators()

    with open(output_path, "w") as f:
        json.dump(results, f, indent=2, default=str)

    logger.info(f"Indicators calculated for {len(results)} watersheds -> {output_path}")
    return {
        "status": "success",
        "watersheds_count": len(results),
        "output_path": str(output_path),
    }


def main():
    parser = argparse.ArgumentParser(description="Calculate watershed indicators")
    parser.add_argument("--output", type=Path, default=None, help="Output JSON path")
    args = parser.parse_args()

    result = calculate_indicators(args.output)
    print("\nResult:")
    for k, v in result.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
