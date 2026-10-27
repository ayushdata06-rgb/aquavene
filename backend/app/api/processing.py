"""Processing job endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import ProcessingJob
from app.schemas.schemas import ProcessingJobCreate, ProcessingJobResponse

router = APIRouter()

ALLOWED_JOB_TYPES = {
    "preprocess_dem",
    "derive_hydrology",
    "preprocess_rainfall",
    "preprocess_landcover",
    "calculate_indicators",
    "run_scoring",
    "load_data",
}


@router.post("", response_model=ProcessingJobResponse, status_code=201)
def create_processing_job(
    body: ProcessingJobCreate, db: Session = Depends(get_db)
):
    """Create a new processing job.

    The job is queued and will be executed by a background worker or CLI script.
    """
    if body.job_type not in ALLOWED_JOB_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid job_type. Allowed: {sorted(ALLOWED_JOB_TYPES)}",
        )

    job = ProcessingJob(
        id=uuid.uuid4(),
        dataset_id=body.dataset_id,
        job_type=body.job_type,
        status="pending",
        progress=0.0,
        parameters_json=body.parameters or {},
        created_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return ProcessingJobResponse.model_validate(job)


@router.get("/{job_id}", response_model=ProcessingJobResponse)
def get_processing_job(job_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get processing job status and details."""
    job = db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Processing job not found")
    return ProcessingJobResponse.model_validate(job)
