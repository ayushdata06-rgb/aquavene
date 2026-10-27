"""Authentication and user schemas for Supabase OAuth & JWT."""

from __future__ import annotations

from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class AuthenticatedUser(BaseModel):
    """User profile parsed from validated Supabase JWT claims."""
    id: str = Field(..., description="Unique Supabase user UUID (sub)")
    email: Optional[str] = Field(None, description="User's email address")
    full_name: Optional[str] = Field(None, description="Display name or full name from OAuth provider")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL from Google / OAuth provider")
    role: str = Field("authenticated", description="User role (e.g. planner, admin, viewer)")
    provider: Optional[str] = Field("google", description="OAuth identity provider (e.g. google)")
    is_authenticated: bool = Field(True, description="Whether the user is actively authenticated")
    raw_claims: Dict[str, Any] = Field(default_factory=dict, description="Raw JWT claims payload")


class AuthMeResponse(BaseModel):
    """Response model for /api/auth/me."""
    user: AuthenticatedUser
    auth_enabled: bool


class AuthStatusResponse(BaseModel):
    """Response model for /api/auth/status."""
    auth_enabled: bool
    provider: str = "google"
    supabase_configured: bool
    jwt_algorithm: str = "HS256"
