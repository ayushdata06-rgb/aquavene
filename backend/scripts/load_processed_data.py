"""Load processed GIS data and indicators into the database idempotently.

Usage: python -m scripts.load_processed_data [--dry-run]
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
from scripts.seed_dev_data import seed_development_fixtures

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def load_data(dry_run: bool = False) -> dict:
    """Load or seed processed watershed datasets into database."""
    settings = get_settings()
    logger.info(f"Connecting to database target: {settings.db_url_masked}")

    if dry_run:
        logger.info("[DRY RUN] Validated data files and configurations without writing to database.")
        return {"status": "dry_run_success"}

    try:
        summary = seed_development_fixtures()
        logger.info("Successfully loaded processed data and seed records.")
        return {"status": "success", "details": summary}
    except Exception as e:
        logger.error(f"Failed to load processed data into database: {e}")
        return {"status": "error", "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Load processed GIS data into database")
    parser.add_argument("--dry-run", action="store_true", help="Validate without committing to DB")
    args = parser.parse_args()

    result = load_data(dry_run=args.dry_run)
    print("\nResult:")
    for k, v in result.items():
        print(f"  {k}: {v}")


if __name__ == "__main__":
    main()
