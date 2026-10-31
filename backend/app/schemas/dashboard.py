"""Pydantic v2 schemas for Role-Scoped Dashboards."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AdminDashboard(BaseModel):
    role: str = "admin"
    total_users: int = 0
    users_by_role: Dict[str, int] = Field(default_factory=dict)
    total_watersheds: int = 0
    critical_count: int = 0
    plans_by_status: Dict[str, int] = Field(default_factory=dict)
    recent_activity: List[Dict[str, Any]] = Field(default_factory=list)
    system_health: Dict[str, str] = Field(default_factory=dict)


class PlannerDashboard(BaseModel):
    role: str = "planner"
    assigned_watersheds: List[Dict[str, Any]] = Field(default_factory=list)
    my_plans: List[Dict[str, Any]] = Field(default_factory=list)
    pending_approvals: int = 0
    vulnerability_heatmap_data: List[Dict[str, Any]] = Field(default_factory=list)


class ViewerDashboard(BaseModel):
    role: str = "viewer"
    public_plans: List[Dict[str, Any]] = Field(default_factory=list)
    watershed_rankings: List[Dict[str, Any]] = Field(default_factory=list)
    recent_approvals: List[Dict[str, Any]] = Field(default_factory=list)


class DashboardSummary(BaseModel):
    """Backward-compatible general overview summary."""
    total_watersheds: int = 15
    critical_watersheds: int = 4
    high_priority_watersheds: int = 5
    moderate_watersheds: int = 4
    low_priority_watersheds: int = 2
    category_distribution: Dict[str, int] = Field(default_factory=dict)
    top_watersheds: List[Dict[str, Any]] = Field(default_factory=list)
    admin_view: Optional[AdminDashboard] = None
    planner_view: Optional[PlannerDashboard] = None
    viewer_view: Optional[ViewerDashboard] = None
