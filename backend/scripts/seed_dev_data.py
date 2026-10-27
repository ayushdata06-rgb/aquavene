"""Seed database with sample/fixture watershed data for development.

Usage: python -m scripts.seed_dev_data

Creates sample watersheds, indicators, and a scoring run for development.
All data is clearly labelled as development fixtures.
"""

from __future__ import annotations

import sys
import uuid
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.models import (
    Dataset,
    PriorityScore,
    ProcessingJob,
    ScoringProfile,
    ScoringRun,
    Watershed,
    WatershedIndicator,
)
from app.services.scoring_service import DEFAULT_WEIGHTS, calculate_score, categorise_score

# Sample watersheds (no real geometry for dev — set geom=None)
SAMPLE_WATERSHEDS = [
    {"code": "WS-KAR-001", "name": "Upper Krishna Basin", "state": "Karnataka", "district": "Belgaum", "basin": "Krishna", "area": 245.8},
    {"code": "WS-KAR-002", "name": "Malaprabha Sub-basin", "state": "Karnataka", "district": "Dharwad", "basin": "Krishna", "area": 189.3},
    {"code": "WS-KAR-003", "name": "Ghataprabha Headwaters", "state": "Karnataka", "district": "Belgaum", "basin": "Krishna", "area": 312.5},
    {"code": "WS-MH-001", "name": "Bhima Upper Catchment", "state": "Maharashtra", "district": "Pune", "basin": "Bhima", "area": 178.9},
    {"code": "WS-MH-002", "name": "Nira River Basin", "state": "Maharashtra", "district": "Satara", "basin": "Bhima", "area": 423.1},
    {"code": "WS-MH-003", "name": "Sina Basin", "state": "Maharashtra", "district": "Osmanabad", "basin": "Bhima", "area": 156.2},
    {"code": "WS-AP-001", "name": "Tungabhadra Left Bank", "state": "Andhra Pradesh", "district": "Kurnool", "basin": "Tungabhadra", "area": 287.4},
    {"code": "WS-AP-002", "name": "Pennar Headwaters", "state": "Andhra Pradesh", "district": "Anantapur", "basin": "Pennar", "area": 198.6},
    {"code": "WS-TN-001", "name": "Cauvery Delta East", "state": "Tamil Nadu", "district": "Thanjavur", "basin": "Cauvery", "area": 534.2},
    {"code": "WS-TN-002", "name": "Vaigai Upper Basin", "state": "Tamil Nadu", "district": "Theni", "basin": "Vaigai", "area": 267.8},
    {"code": "WS-RJ-001", "name": "Luni Desert Fringe", "state": "Rajasthan", "district": "Jodhpur", "basin": "Luni", "area": 389.0},
    {"code": "WS-RJ-002", "name": "Banas Headwaters", "state": "Rajasthan", "district": "Rajsamand", "basin": "Banas", "area": 145.7},
    {"code": "WS-MP-001", "name": "Narmada Upper", "state": "Madhya Pradesh", "district": "Dindori", "basin": "Narmada", "area": 456.3},
    {"code": "WS-MP-002", "name": "Betwa Source Region", "state": "Madhya Pradesh", "district": "Raisen", "basin": "Betwa", "area": 223.9},
    {"code": "WS-GJ-001", "name": "Sabarmati Mid-reach", "state": "Gujarat", "district": "Ahmedabad", "basin": "Sabarmati", "area": 301.5},
]

# Synthetic indicator ranges (for development only)
INDICATOR_RANGES = {
    "erosion_potential": (15, 85),
    "runoff_potential": (10, 90),
    "landcover_degradation": (0.02, 0.65),
    "rainfall_pressure": (300, 2800),
    "downstream_exposure": (5000, 500000),
}

INDICATOR_UNITS = {
    "erosion_potential": "index",
    "runoff_potential": "index",
    "landcover_degradation": "fraction",
    "rainfall_pressure": "mm/year",
    "downstream_exposure": "population",
}


def main():
    np.random.seed(42)
    db: Session = SessionLocal()

    try:
        print("Seeding development data...")

        # Check if data already exists
        existing = db.query(Watershed).count()
        if existing > 0:
            print(f"  {existing} watersheds already exist. Skipping seed.")
            return

        # Create sample datasets
        datasets = []
        for ds_info in [
            ("SRTM 30m DEM", "USGS", "raster", "https://earthexplorer.usgs.gov/", "EPSG:4326", "30m"),
            ("ERA5-Land Precipitation", "Copernicus/ECMWF", "netcdf", "https://cds.climate.copernicus.eu/", "Regular grid", "~9km"),
            ("ESA WorldCover 2021", "ESA", "raster", "https://worldcover2021.esa.int/", "EPSG:4326", "10m"),
        ]:
            d = Dataset(
                id=uuid.uuid4(),
                dataset_name=ds_info[0],
                provider=ds_info[1],
                dataset_type=ds_info[2],
                source_url=ds_info[3],
                crs=ds_info[4],
                native_resolution=ds_info[5],
                status="registered",
            )
            db.add(d)
            datasets.append(d)

        # Create watersheds
        watershed_objects = []
        for ws_data in SAMPLE_WATERSHEDS:
            ws = Watershed(
                id=uuid.uuid4(),
                watershed_code=ws_data["code"],
                name=ws_data["name"],
                country="India",
                state=ws_data["state"],
                district=ws_data["district"],
                basin_name=ws_data["basin"],
                area_sq_km=ws_data["area"],
            )
            db.add(ws)
            watershed_objects.append(ws)

        db.flush()

        # Create indicators
        all_indicators = []
        for ws in watershed_objects:
            for code, (low, high) in INDICATOR_RANGES.items():
                raw = round(np.random.uniform(low, high), 2)
                ind = WatershedIndicator(
                    id=uuid.uuid4(),
                    watershed_id=ws.id,
                    indicator_code=code,
                    raw_value=raw,
                    unit=INDICATOR_UNITS[code],
                    method_version="v1.0-dev",
                    quality_status="dev_fixture",
                    uncertainty_note="DEVELOPMENT FIXTURE — not real data",
                )
                db.add(ind)
                all_indicators.append(ind)

        db.flush()

        # Normalise indicators per code
        for code in INDICATOR_RANGES:
            code_indicators = [i for i in all_indicators if i.indicator_code == code]
            raw_vals = [i.raw_value for i in code_indicators]
            min_v, max_v = min(raw_vals), max(raw_vals)
            for ind in code_indicators:
                if max_v > min_v:
                    ind.normalized_score = round(
                        (ind.raw_value - min_v) / (max_v - min_v) * 100, 2
                    )
                else:
                    ind.normalized_score = 50.0

        db.flush()

        # Create scoring profile
        profile = ScoringProfile(
            id=uuid.uuid4(),
            name="Default",
            description="Default illustrative weights for development",
            weights_json=DEFAULT_WEIGHTS,
            is_default=True,
        )
        db.add(profile)
        db.flush()

        # Run scoring
        run = ScoringRun(
            id=uuid.uuid4(),
            scoring_profile_id=profile.id,
            method_version="v1.0-dev",
            status="running",
            started_at=datetime.utcnow(),
        )
        db.add(run)
        db.flush()

        # Calculate scores
        score_results = []
        for ws in watershed_objects:
            ws_inds = [i for i in all_indicators if i.watershed_id == ws.id]
            ind_scores = {i.indicator_code: i.normalized_score for i in ws_inds}
            overall, breakdown, completeness = calculate_score(ind_scores, DEFAULT_WEIGHTS)
            score_results.append({
                "watershed_id": ws.id,
                "overall_score": overall,
                "breakdown": breakdown,
                "completeness": completeness,
            })

        score_results.sort(key=lambda x: x["overall_score"], reverse=True)

        for rank, sr in enumerate(score_results, 1):
            ps = PriorityScore(
                id=uuid.uuid4(),
                scoring_run_id=run.id,
                watershed_id=sr["watershed_id"],
                overall_score=sr["overall_score"],
                priority_category=categorise_score(sr["overall_score"]),
                rank_position=rank,
                indicator_breakdown_json=sr["breakdown"],
                data_completeness=sr["completeness"],
            )
            db.add(ps)

        run.status = "completed"
        run.completed_at = datetime.utcnow()

        # Create sample processing job
        job = ProcessingJob(
            id=uuid.uuid4(),
            job_type="seed_dev_data",
            status="completed",
            progress=100.0,
            parameters_json={"type": "development_fixture"},
            started_at=datetime.utcnow(),
            finished_at=datetime.utcnow(),
        )
        db.add(job)

        db.commit()

        print(f"  Created {len(watershed_objects)} watersheds")
        print(f"  Created {len(all_indicators)} indicators")
        print(f"  Created scoring run with {len(score_results)} priority scores")
        print(f"  Created {len(datasets)} dataset records")
        print("\n  [!] All data is labelled as DEVELOPMENT FIXTURE")
        print("  Replace with real data from actual GIS processing.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


seed_development_fixtures = main

if __name__ == "__main__":
    main()
