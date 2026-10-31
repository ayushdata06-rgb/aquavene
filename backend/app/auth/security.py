"""Authentication security utilities for Supabase HS256 JWT tokens."""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from jose import ExpiredSignatureError, JWTError, jwt

logger = logging.getLogger(__name__)


@dataclass
class AuthenticatedUser:
    """Strongly typed authenticated user representation."""
    id: str
    email: Optional[str]
    role: str
    display_name: str
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    provider: str = "google"
    is_authenticated: bool = True
    raw_claims: Dict[str, Any] = None

    def __post_init__(self):
        if self.raw_claims is None:
            self.raw_claims = {}

    @property
    def full_name(self) -> str:
        return self.display_name


def decode_supabase_jwt(
    token: str,
    secret: str,
    algorithm: str = "HS256",
) -> Dict[str, Any]:
    """
    Decodes and validates a Supabase HS256 JWT token.
    1. First tries raw secret as string.
    2. If JWTError occurs, tries base64.b64decode(secret) fallback
       (standard Supabase secret format).
    3. Never swallows JWTError silently — re-raises for deps to handle as 401.
    """
    clean_token = token.strip()
    clean_secret = secret.strip()

    # Attempt 1: Raw secret string
    try:
        return jwt.decode(
            clean_token,
            clean_secret,
            algorithms=[algorithm],
            options={"verify_aud": False},
        )
    except ExpiredSignatureError:
        raise
    except JWTError as initial_err:
        logger.debug("Standard JWT decode failed (%s); trying base64 fallback", initial_err)
        # Attempt 2: Base64-decoded secret string
        try:
            clean_sec_no_pad = clean_secret.rstrip("=")
            if len(clean_sec_no_pad) % 4 != 1:
                padded_secret = clean_secret + "=" * (-len(clean_secret) % 4)
                decoded_secret_bytes = base64.b64decode(padded_secret)
                return jwt.decode(
                    clean_token,
                    decoded_secret_bytes,
                    algorithms=[algorithm],
                    options={"verify_aud": False},
                )
        except ExpiredSignatureError:
            raise
        except Exception:
            pass
        raise JWTError(f"Token validation failed: {initial_err}") from initial_err


def parse_user_from_claims(claims: Dict[str, Any]) -> AuthenticatedUser:
    """Extract sub, email, role, and metadata from validated JWT claims."""
    user_id = str(claims.get("sub") or claims.get("id") or "")
    if not user_id:
        raise ValueError("JWT claims missing mandatory 'sub' subject field")

    email = claims.get("email")
    user_metadata = claims.get("user_metadata") or {}
    app_metadata = claims.get("app_metadata") or {}

    role = (
        claims.get("role")
        or app_metadata.get("role")
        or user_metadata.get("role")
        or "viewer"
    ).lower()

    if role == "authenticated":
        role = "planner"

    display_name = (
        user_metadata.get("full_name")
        or user_metadata.get("name")
        or claims.get("name")
        or (email.split("@")[0] if email else "AquaVane User")
    )

    avatar_url = (
        user_metadata.get("avatar_url")
        or user_metadata.get("picture")
        or claims.get("picture")
    )

    department = user_metadata.get("department") or app_metadata.get("department")
    provider = app_metadata.get("provider") or claims.get("iss", "supabase")

    return AuthenticatedUser(
        id=user_id,
        email=email,
        role=role,
        display_name=display_name,
        avatar_url=avatar_url,
        department=department,
        provider=provider,
        is_authenticated=True,
        raw_claims=claims,
    )


def create_test_token(
    user_id: str,
    email: str,
    secret: str = "aquavane-dev-secret-key-32-chars-long",
    role: str = "planner",
    full_name: str = "Test Officer",
    avatar_url: Optional[str] = None,
    expires_in_minutes: int = 60,
) -> str:
    """Generates a synthetic Supabase JWT token for pytest and local testing."""
    now_ts = int(datetime.now(timezone.utc).timestamp())
    exp_ts = now_ts + (expires_in_minutes * 60)

    claims = {
        "sub": user_id,
        "email": email,
        "aud": "authenticated",
        "role": role,
        "iat": now_ts,
        "exp": exp_ts,
        "app_metadata": {"provider": "google", "role": role},
        "user_metadata": {
            "full_name": full_name,
            "avatar_url": avatar_url,
            "role": role,
        },
    }
    return jwt.encode(claims, secret, algorithm="HS256")
