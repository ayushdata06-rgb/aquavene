"""FastAPI authentication and authorization dependencies."""

from __future__ import annotations

import logging
from typing import Callable, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError

from app.auth.security import decode_supabase_jwt, parse_user_from_claims
from app.config import get_settings
from app.schemas.auth import AuthenticatedUser

logger = logging.getLogger(__name__)

# auto_error=False allows us to gracefully handle auth_enabled=False (local dev / test fallback)
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> AuthenticatedUser:
    """
    FastAPI dependency to retrieve and validate the current authenticated user.
    When `auth_enabled=True`, strictly verifies the Supabase HS256 JWT Bearer token.
    When `auth_enabled=False`, allows fallback to a default developer profile so
    local development and test suites function without external network dependencies.
    """
    settings = get_settings()

    # Case 1: Bearer token is provided
    if credentials and credentials.credentials:
        token = credentials.credentials.strip()
        try:
            secret = settings.jwt_secret or "temporary-fallback-secret-for-dev"
            payload = decode_supabase_jwt(
                token=token,
                secret=secret,
                algorithm=settings.jwt_algorithm,
            )
            return parse_user_from_claims(payload)
        except ExpiredSignatureError as exc:
            logger.warning("Token expired: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication token has expired. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc
        except (JWTError, ValueError) as exc:
            logger.warning("Token validation failed: %s", exc)
            if settings.auth_enabled:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=f"Invalid authentication token: {str(exc)}",
                    headers={"WWW-Authenticate": "Bearer"},
                ) from exc

    # Case 2: No token provided and auth is strictly enforced
    if settings.auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in with Google via Supabase.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Case 3: Auth is disabled (Local Development / Testing Fallback)
    return AuthenticatedUser(
        id="00000000-0000-0000-0000-000000000001",
        email="dev.planner@aquavane.local",
        full_name="Local Planner (Dev)",
        avatar_url=None,
        role="admin",
        provider="local_dev",
        is_authenticated=True,
    )


def require_auth(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """Dependency ensuring user is authenticated."""
    if not user or not user.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_roles(allowed_roles: List[str]) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """Dependency factory ensuring user has at least one of the specified roles."""
    def role_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        user_role = (user.role or "").lower()
        allowed = [r.lower() for r in allowed_roles]
        
        # 'admin' has universal override access
        if "admin" in user_role or user_role in allowed or "authenticated" in allowed:
            return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Requires role in {allowed_roles}, your role is '{user.role}'.",
        )
    return role_checker
