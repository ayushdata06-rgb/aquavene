"""AquaVane FastAPI application entry point."""

from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, ORJSONResponse

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

logger = logging.getLogger(__name__)

ERROR_CODE_MAP = {
    401: "AUTH_002",
    403: "AUTH_003",
    404: "RESOURCE_NOT_FOUND",
    422: "VALIDATION_ERROR",
    500: "INTERNAL_SERVER_ERROR",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="AquaVane API",
        description="Enterprise Micro-Watershed Restoration & Hydrological Prioritisation Platform",
        version="2.0.0",
        lifespan=lifespan,
        default_response_class=ORJSONResponse,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # 1. Performance & Request Tracking Middleware
    @app.middleware("http")
    async def add_process_time_and_request_id(request: Request, call_next):
        start_time = time.perf_counter()
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id

        response: Response = await call_next(request)

        process_time = time.perf_counter() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        response.headers["X-Request-ID"] = request_id
        return response

    # 2. CORS - Allow local dev and all Vercel deployments
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
        expose_headers=["X-Process-Time", "X-Request-ID"],
    )

    # 3. Standardized Exception Handlers
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        code = ERROR_CODE_MAP.get(exc.status_code, f"ERR_{exc.status_code}")
        headers = exc.headers or {}

        # If detail is already a dict, preserve it
        if isinstance(exc.detail, dict):
            body = {"error_code": code, **exc.detail}
        else:
            body = {
                "error_code": code,
                "detail": str(exc.detail),
                "status_code": exc.status_code,
            }

        return JSONResponse(
            status_code=exc.status_code,
            content=body,
            headers=headers,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error_code": "VALIDATION_ERROR",
                "detail": exc.errors(),
                "body": str(exc.body),
            },
        )

    # 4. Register Clean Core Routers
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
