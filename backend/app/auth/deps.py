"""FastAPI authentication and RBAC authorization dependencies."""

from __future__ import annotations

import logging
from typing import Callable, List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError

from app.auth.security import AuthenticatedUser, decode_supabase_jwt, parse_user_from_claims
from app.config import get_settings

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> AuthenticatedUser:
    """
    Validates the Bearer JWT token from Supabase Auth.
    Strictly raises HTTP 401 with WWW-Authenticate header on missing or invalid tokens
    when `settings.auth_enabled=True`.
    """
    settings = get_settings()

    if credentials and credentials.credentials:
        token = credentials.credentials.strip()
        try:
            secret = settings.jwt_secret or "aquavane-dev-secret-key-32-chars-long"
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
                headers={"WWW-Authenticate": "Bearer error=\"invalid_token\", error_description=\"token expired\""},
            ) from exc
        except (JWTError, ValueError) as exc:
            logger.warning("Token validation failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid authentication token: {str(exc)}",
                headers={"WWW-Authenticate": "Bearer error=\"invalid_token\""},
            ) from exc

    if settings.auth_enabled:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Supabase Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Local development / test fallback when auth is disabled
    return AuthenticatedUser(
        id="00000000-0000-0000-0000-000000000001",
        email="dev.admin@aquavane.local",
        role="admin",
        display_name="Local Administrator",
        provider="local_dev",
        is_authenticated=True,
    )


def require_auth(
    user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """Dependency verifying that the user is authenticated."""
    if not user or not user.is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[AuthenticatedUser]:
    """Dependency for routes that allow public access but enhance data if authenticated."""
    if not credentials or not credentials.credentials:
        return None
    try:
        settings = get_settings()
        secret = settings.jwt_secret or "aquavane-dev-secret-key-32-chars-long"
        payload = decode_supabase_jwt(
            token=credentials.credentials.strip(),
            secret=secret,
            algorithm=settings.jwt_algorithm,
        )
        return parse_user_from_claims(payload)
    except Exception:
        return None


def require_roles(allowed_roles: List[str]) -> Callable[[AuthenticatedUser], AuthenticatedUser]:
    """
    Dependency factory returning an RBAC checker.
    Raises HTTP 403 with detailed role mismatch payload when unauthorized.
    'admin' has universal override access across all operations.
    """
    def role_checker(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
        user_role = (user.role or "").lower()
        allowed = [r.lower() for r in allowed_roles]

        if "admin" in user_role or user_role in allowed:
            return user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": f"Role '{user.role}' cannot perform this action",
                "required_roles": allowed_roles,
                "your_role": user.role,
            },
        )
    return role_checker
