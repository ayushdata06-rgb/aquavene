"""AquaVane backend configuration using pydantic-settings."""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    app_name: str = "AquaVane"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-this-to-a-random-secret-string"
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # --- Database ---
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/aquavane"
    database_url_direct: str = ""

    # --- Supabase ---
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_storage_bucket: str = "aquavane-rasters"

    # --- Storage ---
    data_dir: str = "./data"

    # --- WhiteboxTools ---
    whitebox_exe_path: str = "whitebox_tools"
    whitebox_work_dir: str = "./data/interim/whitebox"

    # --- Processing ---
    max_upload_size_mb: int = 500
    processing_timeout_seconds: int = 3600

    # --- Auth ---
    auth_enabled: bool = False
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def data_path(self) -> Path:
        return Path(self.data_dir).resolve()

    @property
    def raw_data_path(self) -> Path:
        return self.data_path / "raw"

    @property
    def interim_data_path(self) -> Path:
        return self.data_path / "interim"

    @property
    def processed_data_path(self) -> Path:
        return self.data_path / "processed"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def db_url_masked(self) -> str:
        if "@" in self.database_url:
            host_part = self.database_url.split("@")[1]
            return f"postgresql://***:***@{host_part}"
        return "postgresql://***:***@localhost"


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
