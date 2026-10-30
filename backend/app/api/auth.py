"""Authentication status and current user endpoints."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.deps import get_current_user, require_roles
from app.config import get_settings
from app.db.session import get_db
from app.models.models import Profile
from app.schemas.auth import (
    AuthenticatedUser,
    AuthMeResponse,
    AuthStatusResponse,
    ProfileResponse,
    RoleUpdatePayload,
)

logger = logging.getLogger(__name__)

router = APIRouter()

VALID_ROLES = {"admin", "planner", "officer", "viewer"}


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
def get_me(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve current authenticated user details from Supabase JWT.
    Synchronizes the authoritative role from the PostgreSQL 'profiles' table.
    """
    settings = get_settings()
    try:
        user_uuid = uuid.UUID(user.id)
        profile = db.query(Profile).filter(Profile.id == user_uuid).first()
        if profile and isinstance(getattr(profile, "role", None), str):
            user.role = profile.role
    except Exception as exc:
        logger.debug("Could not lookup DB profile for user %s: %s", user.id, exc)

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
    - If the user already has a profile in the DB, the DB role is preserved as authoritative.
    - If this is the very first user in the database, promote to 'admin'.
    - Subsequent new users receive role 'planner' (or their specific claim).
    """
    try:
        user_uuid = uuid.UUID(user.id)
    except (ValueError, AttributeError):
        user_uuid = uuid.uuid4()

    existing = db.query(Profile).filter(Profile.id == user_uuid).first()
    if existing and hasattr(existing, "role"):
        if hasattr(existing, "display_name") and user.full_name:
            existing.display_name = user.full_name
        # Database role is authoritative if string
        if isinstance(getattr(existing, "role", None), str):
            user.role = existing.role
        existing.updated_at = datetime.now(timezone.utc)
    else:
        # Determine initial role: first user becomes admin!
        total_profiles = 0
        try:
            total_profiles = db.query(Profile).count()
        except Exception:
            pass

        if total_profiles == 0:
            assigned_role = "admin"
        elif user.role and user.role.lower() in VALID_ROLES and user.role.lower() != "authenticated":
            assigned_role = user.role.lower()
        else:
            assigned_role = "planner"

        new_profile = Profile(
            id=user_uuid,
            display_name=user.full_name or (user.email.split("@")[0] if user.email else "Watershed Planner"),
            role=assigned_role,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(new_profile)
        user.role = assigned_role

    try:
        db.commit()
    except Exception as exc:
        logger.warning("Failed to commit profile upsert: %s", exc)
        db.rollback()

    return user


@router.get("/users", response_model=List[ProfileResponse])
def list_profiles(
    current_user: AuthenticatedUser = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """Admin-only: list all user profiles and their assigned roles."""
    profiles = db.query(Profile).order_by(Profile.created_at.desc()).all()
    results = []
    for p in profiles:
        r = getattr(p, "role", "viewer")
        results.append(
            ProfileResponse(
                id=str(getattr(p, "id", uuid.uuid4())),
                display_name=getattr(p, "display_name", None),
                role=r if isinstance(r, str) else "viewer",
                created_at=getattr(p, "created_at", None),
                updated_at=getattr(p, "updated_at", None),
            )
        )
    return results


@router.patch("/users/{target_user_id}/role", response_model=ProfileResponse)
def update_user_role(
    target_user_id: uuid.UUID,
    payload: RoleUpdatePayload,
    current_user: AuthenticatedUser = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only: elevate or modify a user's RBAC role.
    Allowed roles: 'admin', 'planner', 'officer', 'viewer'.
    """
    norm_role = payload.role.strip().lower()
    if norm_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{payload.role}'. Must be one of: {sorted(list(VALID_ROLES))}",
        )

    profile = db.query(Profile).filter(Profile.id == target_user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {target_user_id} not found.",
        )

    profile.role = norm_role
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)

    return ProfileResponse(
        id=str(profile.id),
        display_name=profile.display_name,
        role=profile.role,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
