"""GeoJSON layer endpoints for map display."""

from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, Query
from geoalchemy2.functions import ST_AsGeoJSON, ST_Simplify
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import PriorityScore, ScoringRun, Watershed

router = APIRouter()


@router.get("/layers/watersheds")
def get_watershed_layer(
    simplify: float = Query(0.001, ge=0, le=0.1, description="Geometry simplification tolerance in degrees"),
    state: Optional[str] = None,
    priority_category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Return watershed polygons as GeoJSON FeatureCollection.

    Uses ST_Simplify to reduce geometry complexity for browser rendering.
    """
    # Build query with simplified geometry
    geom_col = func.ST_AsGeoJSON(
        func.ST_Simplify(Watershed.geom, simplify)
    ).label("geojson")

    query = db.query(
        Watershed.id,
        Watershed.watershed_code,
        Watershed.name,
        Watershed.state,
        Watershed.district,
        Watershed.basin_name,
        Watershed.area_sq_km,
        geom_col,
    ).filter(Watershed.geom.isnot(None))

    if state:
        query = query.filter(Watershed.state == state)

    # Get latest scoring run for priority overlay
    latest_run = (
        db.query(ScoringRun)
        .filter(ScoringRun.status == "completed")
        .order_by(ScoringRun.completed_at.desc())
        .first()
    )

    # Get scores if available
    score_map = {}
    if latest_run:
        scores = (
            db.query(
                PriorityScore.watershed_id,
                PriorityScore.overall_score,
                PriorityScore.priority_category,
                PriorityScore.rank_position,
            )
            .filter(PriorityScore.scoring_run_id == latest_run.id)
            .all()
        )
        for s in scores:
            score_map[s.watershed_id] = {
                "overall_score": s.overall_score,
                "priority_category": s.priority_category,
                "rank_position": s.rank_position,
            }

    if priority_category and latest_run:
        ws_ids = [
            wid for wid, info in score_map.items()
            if info["priority_category"] == priority_category
        ]
        if ws_ids:
            query = query.filter(Watershed.id.in_(ws_ids))
        else:
            query = query.filter(False)  # No matches

    rows = query.all()

    features = []
    for row in rows:
        if row.geojson is None:
            continue
        geometry = json.loads(row.geojson)
        score_info = score_map.get(row.id, {})
        features.append({
            "type": "Feature",
            "id": str(row.id),
            "geometry": geometry,
            "properties": {
                "watershed_code": row.watershed_code,
                "name": row.name,
                "state": row.state,
                "district": row.district,
                "basin_name": row.basin_name,
                "area_sq_km": row.area_sq_km,
                **score_info,
            },
        })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


@router.get("/layers")
def get_layers_catalogue():
    """Return available geographic layers and metadata."""
    return [
        {
            "id": "watershed_boundaries",
            "name": "Watershed Boundaries",
            "type": "vector",
            "format": "GeoJSON",
            "source": "India WRIS / PostGIS",
            "description": "Delineated micro-watershed polygon boundaries.",
        },
        {
            "id": "priority_scores",
            "name": "Restoration Priority Heatmap",
            "type": "vector_choropleth",
            "format": "GeoJSON",
            "source": "AquaVane Scoring Engine",
            "description": "Priority score classifications (Critical, High, Moderate, Low).",
        },
        {
            "id": "elevation_dem",
            "name": "SRTM Digital Elevation Model",
            "type": "raster",
            "format": "GeoTIFF",
            "source": "NASA / USGS SRTM 30m",
            "description": "30m spatial resolution ground elevation.",
        },
        {
            "id": "flow_accumulation",
            "name": "Hydrological Flow Accumulation",
            "type": "raster",
            "format": "GeoTIFF",
            "source": "WhiteboxTools D8 Engine",
            "description": "Upstream cell drainage counts.",
        },
        {
            "id": "landcover_worldcover",
            "name": "ESA WorldCover Land Cover",
            "type": "raster_categorical",
            "format": "GeoTIFF",
            "source": "European Space Agency",
            "description": "10m land cover class distribution (2021).",
        },
    ]

