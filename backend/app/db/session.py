"""SQLAlchemy database session and engine configuration."""

from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings


def _get_engine():
    """Create SQLAlchemy engine with cloud compatibility for Render / Supabase."""
    settings = get_settings()
    db_url = settings.database_url or "sqlite:///./aquavene.db"

    # Normalize Render's 'postgres://' or standard 'postgresql://' to use psycopg3
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    connect_args = {}
    if "postgres" in db_url:
        connect_args["connect_timeout"] = 5
        engine = create_engine(
            db_url,
            echo=settings.debug,
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
            pool_recycle=300,
            connect_args=connect_args,
        )
    else:
        connect_args["check_same_thread"] = False
        engine = create_engine(
            db_url,
            echo=settings.debug,
            connect_args=connect_args,
        )
    return engine


engine = _get_engine()

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Session:
    """Dependency that provides a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Test database connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def check_postgis() -> bool:
    """Verify PostGIS extension is available."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT PostGIS_Version()"))
            version = result.scalar()
            return version is not None
    except Exception:
        return False
