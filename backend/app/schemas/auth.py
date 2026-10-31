"""Pydantic v2 schemas for Authentication, Profiles, and RBAC."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AuthenticatedUser(BaseModel):
    """Authenticated user parsed from validated JWT claims."""
    id: str = Field(..., description="Unique user UUID (sub)")
    email: Optional[str] = Field(None, description="User email address")
    role: str = Field("viewer", description="Assigned RBAC role: admin, planner, officer, or viewer")
    display_name: str = Field(..., description="Display or full name")
    full_name: Optional[str] = Field(None, description="Full name alias")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    department: Optional[str] = Field(None, description="Assigned government department")
    provider: str = Field("google", description="OAuth identity provider")
    is_authenticated: bool = Field(True, description="Active authentication flag")
    raw_claims: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class ProfileResponse(BaseModel):
    """User profile record representation from database."""
    id: uuid.UUID
    display_name: str
    role: str
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    last_active: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    """Payload for user updating their own profile details."""
    display_name: Optional[str] = Field(None, min_length=2, max_length=255)
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None


class RoleUpdatePayload(BaseModel):
    """Admin-only payload to elevate or reassign user roles."""
    role: str = Field(..., description="Target role: 'admin', 'planner', 'officer', or 'viewer'")


class UserListResponse(BaseModel):
    """Paginated list of user profiles for admin user management."""
    users: List[ProfileResponse]
    total: int
    page: int
    limit: int
    roles_distribution: Dict[str, int] = Field(default_factory=dict)


class AuthStatusResponse(BaseModel):
    """Auth engine configuration status."""
    auth_enabled: bool
    provider: str = "google"
    supabase_configured: bool
    jwt_algorithm: str = "HS256"
    version: str = "2.0.0"


class AuthMeResponse(BaseModel):
    """Response model for /api/auth/me."""
    user: AuthenticatedUser
    profile: Optional[ProfileResponse] = None
    auth_enabled: bool
