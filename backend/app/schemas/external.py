"""Pydantic schemas for Indian public data integrations (IMD, CWC, Bhuvan, WRIS, Data.gov.in)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RainfallReading(BaseModel):
    station_name: str
    rainfall_mm: float
    date: str
    anomaly_pct_vs_normal: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class DayForecast(BaseModel):
    date: str
    day_name: str
    min_temp_c: float
    max_temp_c: float
    rainfall_mm: float
    humidity_pct: float
    weather_desc: str
    alert_level: str = Field("green", description="'green', 'yellow', 'orange', 'red'")


class FloodAlert(BaseModel):
    district: str
    state: str
    alert_level: str = Field("yellow", description="'red', 'orange', 'yellow'")
    valid_until: str
    description: str
    source: str = "IMD / NDMA"


class GaugeStation(BaseModel):
    station_id: str
    name: str
    river: str
    lat: float
    lon: float
    distance_km: float


class GaugeReading(BaseModel):
    station_id: str
    level_m: float
    discharge_m3s: float
    danger_level_m: float
    warning_level_m: float
    normal_level_m: float
    reading_datetime: str
    status: str = Field("normal", description="'normal', 'warning', 'danger', 'above_danger'")


class ReservoirStatus(BaseModel):
    reservoir_name: str
    district: str
    capacity_mcm: float
    current_storage_mcm: float
    fill_pct: float
    last_year_same_week_pct: float
    ten_year_avg_pct: float


class LULCResult(BaseModel):
    forest_pct: float
    cropland_pct: float
    scrubland_pct: float
    waterbody_pct: float
    builtup_pct: float
    barren_pct: float
    year: int = 2022
    resolution_m: int = 30
    source: str = "ISRO Bhuvan LULC 50K"


class NDVIStats(BaseModel):
    mean_ndvi: float
    min_ndvi: float
    max_ndvi: float
    pct_lt_0_1: float
    pct_0_1_to_0_3: float
    pct_0_3_to_0_6: float
    pct_gt_0_6: float
    acquisition_date: str


class NDVIChangeResult(BaseModel):
    mean_ndvi_start: float
    mean_ndvi_end: float
    change_absolute: float
    change_pct: float
    improved_area_ha: float
    degraded_area_ha: float
    stable_area_ha: float
    change_map_geojson: Optional[Dict[str, Any]] = None
    interpretation: str


class IDFCurve(BaseModel):
    district: str
    P2yr: float
    P5yr: float
    P10yr: float
    P25yr: float
    P50yr: float
    P100yr: float
    duration_hr: float = 1.0
    unit: str = "mm/hr"


class GroundwaterData(BaseModel):
    district: str
    depth_to_water_m: float
    seasonal_fluctuation_m: float
    trend: str = Field("stable", description="'rising', 'stable', 'declining'")
    year_of_data: int = 2023
    source: str = "Central Ground Water Board (CGWB)"


class SoilHealthSummary(BaseModel):
    district: str
    dominant_soil_type: str
    avg_organic_carbon_pct: float
    ph_range: str
    nitrogen_status: str
    phosphorus_status: str
    potassium_status: str = "Medium"
    recommendations: List[str]


class DisasterEvent(BaseModel):
    year: int
    event_type: str
    severity: str = "High"
    affected_area_ha: float
    crop_loss_crores: float
    affected_population: int
    source: str = "NDMA / State Disaster Management Authority"


class MGNREGAWork(BaseModel):
    work_name: str
    work_type: str
    expenditure_inr: float
    person_days: int
    village: str
    gp_name: str
    status: str = "Completed"
    financial_year: str = "2023-2024"


class PMKSYProject(BaseModel):
    project_name: str
    scheme_component: str
    sanctioned_amount_lakhs: float
    utilised_pct: float
    status: str = "Ongoing"


class AnnualRainfall(BaseModel):
    year: int
    annual_mm: float
    deviation_from_normal_pct: float
    monsoon_mm: float
    drought_flag: bool = False
    flood_flag: bool = False

