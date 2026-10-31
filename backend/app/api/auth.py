"""Authentication status, profile sync, and RBAC user management router."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
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
    ProfileUpdate,
    RoleUpdatePayload,
    UserListResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()

VALID_ROLES = {"admin", "planner", "officer", "viewer"}


@router.get("/status", response_model=AuthStatusResponse)
def get_auth_status():
    """Retrieve auth system configuration and engine version."""
    settings = get_settings()
    is_supabase_configured = bool(settings.supabase_url and (settings.supabase_anon_key or settings.jwt_secret))
    return AuthStatusResponse(
        auth_enabled=settings.auth_enabled,
        provider="google",
        supabase_configured=is_supabase_configured,
        jwt_algorithm=settings.jwt_algorithm,
        version="2.0.0",
    )


@router.get("/me", response_model=AuthMeResponse)
def get_me(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve current authenticated user details and synchronized PostgreSQL Profile.
    Database Profile.role is authoritative over JWT claims.
    """
    settings = get_settings()
    profile_resp: Optional[ProfileResponse] = None

    try:
        user_uuid = uuid.UUID(user.id)
        profile = db.query(Profile).filter(Profile.id == user_uuid).first()
        if profile:
            if isinstance(getattr(profile, "role", None), str):
                user.role = profile.role
            profile.last_active = datetime.now(timezone.utc)
            db.commit()
            profile_resp = ProfileResponse.model_validate(profile)
    except Exception as exc:
        logger.debug("Profile lookup skipped/failed: %s", exc)

    return AuthMeResponse(
        user=user,
        profile=profile_resp,
        auth_enabled=settings.auth_enabled,
    )


@router.post("/sync-profile", response_model=ProfileResponse)
def sync_user_profile(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Sync or upsert the authenticated user into the PostgreSQL 'profiles' table.
    The very first user in the database is automatically elevated to 'admin'.
    Subsequent users default to 'planner' (or their verified claim).
    """
    try:
        user_uuid = uuid.UUID(user.id)
    except (ValueError, AttributeError):
        user_uuid = uuid.uuid4()

    profile = db.query(Profile).filter(Profile.id == user_uuid).first()

    if profile:
        if user.display_name:
            profile.display_name = user.display_name
        if user.avatar_url:
            profile.avatar_url = user.avatar_url
        if user.department:
            profile.department = user.department
        profile.last_active = datetime.now(timezone.utc)
        profile.updated_at = datetime.now(timezone.utc)
        user.role = profile.role
    else:
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

        profile = Profile(
            id=user_uuid,
            display_name=user.display_name or (user.email.split("@")[0] if user.email else "Watershed User"),
            role=assigned_role,
            avatar_url=user.avatar_url,
            department=user.department,
            last_active=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(profile)
        user.role = assigned_role

    try:
        db.commit()
        db.refresh(profile)
    except Exception as exc:
        logger.warning("Profile commit error: %s", exc)
        db.rollback()

    return ProfileResponse.model_validate(profile)


@router.get("/users", response_model=UserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only: Paginated user management query with role and name filtering.
    """
    query = db.query(Profile)

    if role and role.lower() in VALID_ROLES:
        query = query.filter(Profile.role == role.lower())

    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Profile.display_name.ilike(search_filter),
                Profile.department.ilike(search_filter),
            )
        )

    total = query.count()
    profiles = query.order_by(Profile.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    # Calculate role distribution
    dist: Dict[str, int] = {}
    for r in ["admin", "planner", "officer", "viewer"]:
        try:
            dist[r] = db.query(Profile).filter(Profile.role == r).count()
        except Exception:
            dist[r] = 0

    return UserListResponse(
        users=[ProfileResponse.model_validate(p) for p in profiles],
        total=total,
        page=page,
        limit=limit,
        roles_distribution=dist,
    )


@router.patch("/users/{target_id}/role", response_model=ProfileResponse)
def update_user_role(
    target_id: uuid.UUID,
    payload: RoleUpdatePayload,
    current_user: AuthenticatedUser = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only: Reassign or elevate a user's role.
    Prevents demoting the last active administrator.
    """
    new_role = payload.role.strip().lower()
    if new_role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{payload.role}'. Must be one of: {sorted(list(VALID_ROLES))}",
        )

    profile = db.query(Profile).filter(Profile.id == target_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Profile with ID {target_id} not found",
        )

    # Protect against lock-out: check if target is the last admin
    if profile.role == "admin" and new_role != "admin":
        admin_count = db.query(Profile).filter(Profile.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security protection: Cannot demote the last remaining administrator.",
            )

    profile.role = new_role
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(profile)

    return ProfileResponse.model_validate(profile)


@router.delete("/users/{target_id}")
def delete_or_deactivate_user(
    target_id: uuid.UUID,
    current_user: AuthenticatedUser = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db),
):
    """
    Admin-only: Deactivate or soft-delete user by setting role to 'viewer'.
    """
    profile = db.query(Profile).filter(Profile.id == target_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if profile.role == "admin":
        admin_count = db.query(Profile).filter(Profile.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last administrator.")

    profile.role = "viewer"
    profile.display_name = f"[Deactivated] {profile.display_name}"
    profile.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {"status": "deactivated", "id": str(target_id), "role": "viewer"}
