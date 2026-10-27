"""Export endpoints — CSV and GeoJSON."""

from __future__ import annotations

import csv
import io
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from geoalchemy2.functions import ST_AsGeoJSON
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import PriorityScore, ScoringRun, Watershed

router = APIRouter()


@router.get("/rankings.csv")
def export_rankings_csv(
    scoring_run_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Export priority rankings as CSV."""
    if scoring_run_id:
        run = db.query(ScoringRun).filter(ScoringRun.id == scoring_run_id).first()
    else:
        run = (
            db.query(ScoringRun)
            .filter(ScoringRun.status == "completed")
            .order_by(ScoringRun.completed_at.desc())
            .first()
        )

    if not run:
        raise HTTPException(status_code=404, detail="No scoring run found")

    rows = (
        db.query(PriorityScore, Watershed)
        .join(Watershed, PriorityScore.watershed_id == Watershed.id)
        .filter(PriorityScore.scoring_run_id == run.id)
        .order_by(PriorityScore.rank_position)
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Rank", "Watershed Code", "Watershed Name", "State", "District",
        "Overall Score", "Priority Category", "Data Completeness",
    ])
    for ps, ws in rows:
        writer.writerow([
            ps.rank_position,
            ws.watershed_code,
            ws.name,
            ws.state or "",
            ws.district or "",
            round(ps.overall_score, 2),
            ps.priority_category,
            round(ps.data_completeness, 2),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rankings.csv"},
    )


@router.get("/watersheds.geojson")
def export_watersheds_geojson(
    state: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Export watershed boundaries as GeoJSON."""
    query = db.query(
        Watershed.id,
        Watershed.watershed_code,
        Watershed.name,
        Watershed.state,
        Watershed.district,
        Watershed.basin_name,
        Watershed.area_sq_km,
        func.ST_AsGeoJSON(Watershed.geom).label("geojson"),
    ).filter(Watershed.geom.isnot(None))

    if state:
        query = query.filter(Watershed.state == state)

    rows = query.all()
    features = []
    for row in rows:
        if row.geojson is None:
            continue
        features.append({
            "type": "Feature",
            "id": str(row.id),
            "geometry": json.loads(row.geojson),
            "properties": {
                "watershed_code": row.watershed_code,
                "name": row.name,
                "state": row.state,
                "district": row.district,
                "basin_name": row.basin_name,
                "area_sq_km": row.area_sq_km,
            },
        })

    geojson = {"type": "FeatureCollection", "features": features}
    return StreamingResponse(
        iter([json.dumps(geojson)]),
        media_type="application/geo+json",
        headers={"Content-Disposition": "attachment; filename=watersheds.geojson"},
    )
