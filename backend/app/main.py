"""AquaVane FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.config import get_settings
from app.api import (
    auth,
    dashboard,
    datasets,
    exports,
    health,
    indicators,
    layers,
    processing,
    rainfall,
    rankings,
    reports,
    scenarios,
    terrain,
    watersheds,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # Startup: nothing heavy — DB pool opens lazily
    yield
    # Shutdown: clean up if needed


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="AquaVane API",
        description="Watershed Restoration Prioritisation & Decision-Support Platform",
        version="0.1.0",
        lifespan=lifespan,
        default_response_class=ORJSONResponse,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(health.router, prefix="/api", tags=["Health"])
    app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
    app.include_router(watersheds.router, prefix="/api/watersheds", tags=["Watersheds"])
    app.include_router(rankings.router, prefix="/api", tags=["Rankings"])
    app.include_router(indicators.router, prefix="/api", tags=["Indicators"])
    app.include_router(layers.router, prefix="/api", tags=["Layers"])
    app.include_router(rainfall.router, prefix="/api/rainfall", tags=["Rainfall"])
    app.include_router(terrain.router, prefix="/api/terrain", tags=["Terrain"])
    app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])
    app.include_router(processing.router, prefix="/api/processing-jobs", tags=["Processing"])
    app.include_router(scenarios.router, prefix="/api/scenarios", tags=["Scenarios"])
    app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
    app.include_router(exports.router, prefix="/api/exports", tags=["Exports"])

    return app


app = create_app()
