"""Tests for Supabase OAuth & JWT-based authentication system."""

import pytest
from fastapi.testclient import TestClient
from app.auth.security import create_test_token, decode_supabase_jwt, parse_user_from_claims
from app.config import get_settings


def test_auth_status_endpoint(client: TestClient):
    """Test /api/auth/status returns provider and algorithm information."""
    response = client.get("/api/auth/status")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "google"
    assert data["jwt_algorithm"] == "HS256"
    assert "auth_enabled" in data


def test_jwt_generation_and_decoding():
    """Test generating a synthetic Supabase JWT token and decoding it."""
    test_secret = "super-secret-supabase-jwt-key-for-testing"
    user_id = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
    email = "planner.watershed@example.com"

    token = create_test_token(
        user_id=user_id,
        email=email,
        secret=test_secret,
        role="planner",
        full_name="Aarav Sharma",
        avatar_url="https://lh3.googleusercontent.com/a/test-avatar",
    )

    claims = decode_supabase_jwt(token, secret=test_secret)
    assert claims["sub"] == user_id
    assert claims["email"] == email
    assert claims["role"] == "planner"

    user = parse_user_from_claims(claims)
    assert user.id == user_id
    assert user.email == email
    assert user.full_name == "Aarav Sharma"
    assert user.avatar_url == "https://lh3.googleusercontent.com/a/test-avatar"
    assert user.role == "planner"
    assert user.provider == "google"
    assert user.is_authenticated is True


def test_get_me_with_valid_bearer_token(client: TestClient, monkeypatch):
    """Test /api/auth/me with a valid Bearer token."""
    test_secret = "test-secret-key-12345"
    monkeypatch.setattr(get_settings(), "jwt_secret", test_secret)

    token = create_test_token(
        user_id="11111111-2222-3333-4444-555555555555",
        email="test.user@aquavane.io",
        secret=test_secret,
        full_name="Priya Patel",
    )

    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "test.user@aquavane.io"
    assert data["user"]["full_name"] == "Priya Patel"
    assert data["user"]["is_authenticated"] is True


def test_auth_enabled_strict_rejection(client: TestClient, monkeypatch):
    """When auth_enabled=True, requests without token or invalid token are rejected with 401."""
    monkeypatch.setattr(get_settings(), "auth_enabled", True)
    monkeypatch.setattr(get_settings(), "jwt_secret", "real-secret")

    # 1. No token -> 401
    res1 = client.get("/api/auth/me")
    assert res1.status_code == 401

    # 2. Invalid token -> 401
    res2 = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.fake.token"})
    assert res2.status_code == 401
