"""Authentication status and current user endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user
from app.config import get_settings
from app.db.session import get_db
from app.models.models import Profile
from app.schemas.auth import AuthenticatedUser, AuthMeResponse, AuthStatusResponse

router = APIRouter()


@router.get("/status", response_model=AuthStatusResponse)
def get_auth_status():
    """Retrieve auth system configuration status."""
    settings = get_settings()
    is_supabase_configured = bool(settings.supabase_url and (settings.supabase_anon_key or settings.jwt_secret))
    return AuthStatusResponse(
        auth_enabled=settings.auth_enabled,
        provider="google",
        supabase_configured=is_supabase_configured,
        jwt_algorithm=settings.jwt_algorithm,
    )


@router.get("/me", response_model=AuthMeResponse)
def get_me(user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieve current authenticated user details from Supabase JWT."""
    settings = get_settings()
    return AuthMeResponse(
        user=user,
        auth_enabled=settings.auth_enabled,
    )


@router.post("/sync-profile", response_model=AuthenticatedUser)
def sync_user_profile(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sync or upsert the authenticated user profile into the AquaVane 'profiles' table.
    Links the Supabase Google OAuth user to local application records.
    """
    try:
        user_uuid = uuid.UUID(user.id)
    except (ValueError, AttributeError):
        user_uuid = uuid.uuid4()

    existing = db.query(Profile).filter(Profile.id == user_uuid).first()
    if existing:
        existing.display_name = user.full_name or existing.display_name
        existing.role = user.role or existing.role
        existing.updated_at = datetime.now(timezone.utc)
    else:
        new_profile = Profile(
            id=user_uuid,
            display_name=user.full_name or (user.email.split("@")[0] if user.email else "User"),
            role=user.role or "viewer",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(new_profile)

    try:
        db.commit()
    except Exception:
        db.rollback()

    return user
