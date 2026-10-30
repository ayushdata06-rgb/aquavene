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
    plans,
    predict,
    processing,
    rankings,
    watersheds,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="AquaVane API",
        description="Watershed Restoration Prioritisation & Decision-Support Platform",
        version="2.0.0",
        lifespan=lifespan,
        default_response_class=ORJSONResponse,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS - Allow local dev and all Vercel deployments
    origins = list(settings.allowed_origins_list)
    if "https://*.vercel.app" not in origins:
        origins.append("https://*.vercel.app")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=r"^https://.*\.vercel\.app$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Clean Core Routers
    app.include_router(health.router, prefix="/api", tags=["Health"])
    app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
    app.include_router(predict.router, prefix="/api/predict", tags=["ML Prediction Suite"])
    app.include_router(watersheds.router, prefix="/api/watersheds", tags=["Watersheds"])
    app.include_router(rankings.router, prefix="/api", tags=["Rankings"])
    app.include_router(plans.router, prefix="/api/plans", tags=["Restoration Plans & DPRs"])
    app.include_router(exports.router, prefix="/api/exports", tags=["Exports"])
    app.include_router(datasets.router, prefix="/api/datasets", tags=["Datasets"])
    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
    app.include_router(processing.router, prefix="/api/processing-jobs", tags=["Processing"])

    return app


app = create_app()
