"""Asynchronous background processing tasks for WhiteboxTools and ML pipelines."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from app.models.models import ProcessingJob, Watershed
from app.services.gis.whitebox_service import WhiteboxService
from app.services.gis.raster_service import RasterService
from app.services.ml.shap import TreeSHAPExplainer

logger = logging.getLogger(__name__)


async def run_whitebox_pipeline_job(
    job_id: uuid.UUID,
    watershed_id: Optional[uuid.UUID],
    geojson: Dict[str, Any],
    db: Session,
):
    """
    Background worker task executing the full WhiteboxTools & ML pipeline:
    1. Update job status='running', progress_pct=10
    2. Extract / generate DEM for AOI (progress=30)
    3. Run WhiteboxService.run_full_pipeline (progress=60)
    4. Extract 12 raster zonal features (progress=80)
    5. Run ML vulnerability prediction & TreeSHAP (progress=90)
    6. Update watershed record if watershed_id present (progress=95)
    7. Update job status='completed', progress=100
    """
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        logger.error("ProcessingJob with ID %s not found in DB", job_id)
        return

    job.status = "running"
    job.progress_pct = 10
    job.started_at = datetime.now(timezone.utc)
    db.commit()

    try:
        whitebox_svc = WhiteboxService()
        raster_svc = RasterService()

        # Step 2: Extract DEM for AOI
        dem, transform, crs = await whitebox_svc.extract_dem_from_aoi(geojson)
        job.progress_pct = 30
        db.commit()

        # Step 3: Run WhiteboxTools Hydrological Pipeline
        wb_result = await whitebox_svc.run_full_pipeline(dem, transform, crs)
        job.progress_pct = 60
        db.commit()

        # Step 4: Extract 12 Zonal Features
        features = await raster_svc.extract_12_features(geojson)
        usle = await raster_svc.compute_usle_factors(
            slope_deg=wb_result.slope_stats["mean_deg"],
            cover_pct=features.forest_cover_pct,
        )
        job.progress_pct = 80
        db.commit()

        # Step 5: Explainability with TreeSHAP
        shap_res = TreeSHAPExplainer.explain(features)

        # Baseline composite score
        pvi_score = round(
            float(
                0.20 * (features.mean_slope_deg * 3.5)
                + 0.25 * (features.drainage_density * 22.0)
                + 0.15 * (features.bare_soil_pct * 1.8)
                + 0.20 * (features.rainfall_intensity_idf * 0.9)
                + 0.20 * (wb_result.flow_accumulation_stats.get("p95", 10000) / 300.0)
            ),
            1,
        )
        pvi_score = max(10.0, min(95.0, pvi_score))
        risk_level = (
            "critical" if pvi_score >= 75.0 else ("high" if pvi_score >= 60.0 else ("moderate" if pvi_score >= 40.0 else "low"))
        )

        job.progress_pct = 90
        db.commit()

        # Step 6: Update Watershed Record if linked
        if watershed_id:
            ws = db.query(Watershed).filter(Watershed.id == watershed_id).first()
            if ws:
                ws.priority_score = pvi_score
                ws.risk_level = risk_level
                ws.mean_slope_deg = wb_result.slope_stats["mean_deg"]
                ws.drainage_density = wb_result.drainage_density_km_per_km2
                ws.last_processed = datetime.now(timezone.utc)

        # Step 7: Complete Job
        job.status = "completed"
        job.progress_pct = 100
        job.completed_at = datetime.now(timezone.utc)
        job.result_json = {
            "pvi_score": pvi_score,
            "risk_level": risk_level,
            "drainage_density": wb_result.drainage_density_km_per_km2,
            "stream_count": len(wb_result.stream_network_geojson.get("features", [])),
            "sinks_filled": wb_result.sink_count,
            "annual_soil_loss_t_ha_yr": usle.annual_soil_loss_t_ha_yr,
            "top_drivers": shap_res.top_drivers[:3],
        }
        db.commit()
        logger.info("ProcessingJob %s finished successfully", job_id)

    except Exception as exc:
        logger.exception("ProcessingJob %s failed: %s", job_id, exc)
        job.status = "failed"
        job.error_message = str(exc)
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
