"""Security utilities for Supabase JWT verification and claim parsing."""

from __future__ import annotations

import base64
import time
from typing import Any, Dict, Optional
from jose import JWTError, ExpiredSignatureError, jwt

from app.schemas.auth import AuthenticatedUser


def decode_supabase_jwt(
    token: str,
    secret: str,
    algorithm: str = "HS256",
    verify_exp: bool = True,
) -> Dict[str, Any]:
    """
    Decode and verify a Supabase JWT token.
    Supabase signs tokens with HMAC-SHA256 (HS256) using the project's JWT Secret.
    """
    if not secret:
        raise ValueError("JWT secret is not configured in settings.")

    # Supabase tokens typically include `aud: "authenticated"`, but we allow flexibility
    # while still strictly validating signature, expiry, and issued-at times.
    options = {
        "verify_signature": True,
        "verify_exp": verify_exp,
        "verify_iat": True,
        "verify_aud": False,
    }

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=[algorithm],
            options=options,
        )
        return payload
    except ExpiredSignatureError as exc:
        raise ExpiredSignatureError("Token has expired.") from exc
    except JWTError as exc:
        # Fallback: Many Supabase project secrets are base64-encoded strings
        try:
            b64_bytes = base64.b64decode(secret)
            return jwt.decode(
                token,
                b64_bytes,
                algorithms=[algorithm],
                options=options,
            )
        except Exception:
            raise JWTError(f"Could not validate credentials: {str(exc)}") from exc


def parse_user_from_claims(claims: Dict[str, Any]) -> AuthenticatedUser:
    """Extract and normalize user profile fields from Supabase JWT claims."""
    user_id = str(claims.get("sub", ""))
    email = claims.get("email")
    
    user_meta = claims.get("user_metadata") or {}
    app_meta = claims.get("app_metadata") or {}

    # Full name can be in user_metadata as 'full_name' or 'name' (Google OAuth)
    full_name = (
        user_meta.get("full_name")
        or user_meta.get("name")
        or (email.split("@")[0] if email else "User")
    )

    # Avatar URL from Google OAuth
    avatar_url = user_meta.get("avatar_url") or user_meta.get("picture")

    # Determine user role (app_metadata takes precedence, then user_metadata, then root role)
    raw_role = (
        app_meta.get("role")
        or user_meta.get("role")
        or claims.get("role", "viewer")
    )
    # Normalize default 'authenticated' to 'viewer' if not specified
    role = "viewer" if raw_role == "authenticated" else raw_role

    # OAuth provider (Google, email, etc.)
    provider = (
        app_meta.get("provider")
        or (app_meta.get("providers", ["google"])[0] if app_meta.get("providers") else "google")
    )

    return AuthenticatedUser(
        id=user_id,
        email=email,
        full_name=full_name,
        avatar_url=avatar_url,
        role=role,
        provider=provider,
        is_authenticated=True,
        raw_claims=claims,
    )


def create_test_token(
    user_id: str,
    email: str,
    secret: str,
    algorithm: str = "HS256",
    expires_in_seconds: int = 3600,
    role: str = "authenticated",
    full_name: str = "Test Planner",
    avatar_url: Optional[str] = "https://lh3.googleusercontent.com/test",
    provider: str = "google",
) -> str:
    """Helper function to create a signed JWT simulating a Supabase Google OAuth token."""
    now = int(time.time())
    payload = {
        "sub": user_id,
        "aud": "authenticated",
        "role": role,
        "email": email,
        "iat": now,
        "exp": now + expires_in_seconds,
        "user_metadata": {
            "full_name": full_name,
            "name": full_name,
            "avatar_url": avatar_url,
            "picture": avatar_url,
            "email": email,
        },
        "app_metadata": {
            "provider": provider,
            "providers": [provider],
        },
    }
    return jwt.encode(payload, secret, algorithm=algorithm)
