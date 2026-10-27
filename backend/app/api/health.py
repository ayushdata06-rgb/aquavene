"""Health check endpoint."""

from fastapi import APIRouter

from app.db.session import check_db_connection, check_postgis
from app.schemas.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    """Check API, database, and PostGIS connectivity."""
    db_ok = check_db_connection()
    postgis_ok = check_postgis() if db_ok else False
    status = "healthy" if db_ok and postgis_ok else "degraded"
    return HealthResponse(
        status=status,
        database=db_ok,
        postgis=postgis_ok,
        version="0.1.0",
    )
