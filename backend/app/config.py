"""AquaVane backend configuration settings using Pydantic Settings."""

from __future__ import annotations

from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application configuration."""

    # Application
    app_name: str = "AquaVane"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "aquavane-enterprise-secret-key-production-ready-2026"

    # Database (Supabase PostgreSQL + PostGIS)
    database_url: str = "sqlite:///./aquavane_dev.db"
    database_url_direct: Optional[str] = None

    # Supabase Credentials
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    # Storage
    data_dir: str = "./data"
    supabase_storage_bucket: str = "aquavane-rasters"

    # WhiteboxTools configuration
    whitebox_exe_path: str = "whitebox_tools"
    whitebox_work_dir: str = "/tmp/whitebox"
    whitebox_stream_threshold: int = 500

    # Hydrograph Physical Defaults (SCS-CN)
    default_soil_group: str = "B"
    default_storm_duration_hr: float = 24.0
    default_amc: str = "II"

    # Public Open Data API Keys (Free Registration)
    data_gov_api_key: str = ""
    bhuvan_api_key: str = ""

    # Processing limits
    max_upload_size_mb: int = 500
    processing_timeout_seconds: int = 3600

    # Auth & JWT
    auth_enabled: bool = False
    jwt_secret: Optional[str] = "aquavane-dev-secret-key-32-chars-long"
    jwt_algorithm: str = "HS256"

    # Cache & Rate Limiting
    cache_enabled: bool = True
    public_rate_limit: str = "60/minute"
    auth_rate_limit: str = "300/minute"

    # CORS
    allowed_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


_settings: Optional[Settings] = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
