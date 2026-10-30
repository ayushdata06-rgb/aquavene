# AquaVane REST API Specification

The AquaVane backend provides a unified, high-performance RESTful API conforming to OpenAPI 3.1 specifications. Interactive Swagger UI is accessible at `/docs` and ReDoc at `/redoc` when running the backend.

---

## 1. System Health

### `GET /api/health`
Check application health, database connectivity, and GIS runtime readiness.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "version": "2.0.0",
  "database": "connected",
  "gis_engine": "operational",
  "whitebox_available": true
}
```

---

## 2. Dashboard Overview

### `GET /api/dashboard/summary`
Retrieves aggregated statistics for regional screening and executive dashboards.
- **Response `200 OK`**:
```json
{
  "total_watersheds": 15,
  "critical_count": 3,
  "high_count": 5,
  "medium_count": 4,
  "low_count": 3,
  "priority_distribution": {
    "critical": 3,
    "high": 5,
    "medium": 4,
    "low": 3
  },
  "top_watersheds": [
    {
      "rank_position": 1,
      "watershed_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "watershed_code": "WS-KA-001",
      "watershed_name": "Upper Kali Micro-Watershed",
      "state": "Karnataka",
      "district": "Uttara Kannada",
      "overall_score": 79.4,
      "priority_category": "critical"
    }
  ],
  "warnings": [],
  "datasets_count": 4
}
```

---

## 3. Watershed Management & Vector Geometries

### `GET /api/watersheds`
List micro-watersheds with pagination and filtering.
- **Query Parameters**:
  - `page` (int, default: 1): Page number.
  - `page_size` (int, default: 20): Items per page.
  - `state` (string, optional): Filter by state.
  - `district` (string, optional): Filter by district.
  - `search` (string, optional): Search by name or code.

### `GET /api/watersheds/{watershed_id}`
Get detailed attributes and metadata for a specific micro-watershed.

### `GET /api/watersheds/{watershed_id}/geojson`
Return the GeoJSON Feature representation of the micro-watershed boundary.
- **Response `200 OK`**:
```json
{
  "type": "Feature",
  "geometry": {
    "type": "MultiPolygon",
    "coordinates": [[[[74.80, 15.10], [74.92, 15.12], [74.95, 15.02], [74.80, 15.10]]]]
  },
  "properties": {
    "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "watershed_code": "WS-KA-001",
    "name": "Upper Kali Micro-Watershed",
    "area_sq_km": 42.5
  }
}
```

---

## 4. Priority Rankings & Screening

### `GET /api/rankings`
Retrieve prioritized rankings based on the latest scoring run.
- **Query Parameters**:
  - `category` (string, optional): Filter by category (`critical`, `high`, `medium`, `low`).
  - `sort_by` (string, default: `rank_position`): Field to sort by.
  - `order` (string, default: `asc`): `asc` or `desc`.
  - `page` (int, default: 1)
  - `page_size` (int, default: 50)

### `GET /api/rankings/{watershed_id}`
Retrieve a specific watershed's score breakdown and indicator shares.

---

## 5. Machine Learning Prediction & Counterfactual Simulation

### `POST /api/predict/aoi`
Extracts raster and hydrology zonal statistics for an arbitrary user-drawn 4-point polygon, evaluates soil loss via RUSLE, computes 30-day hydrograph discharge, and predicts restoration urgency.

- **Request Body**:
```json
{
  "geojson": {
    "type": "Polygon",
    "coordinates": [
      [
        [74.30, 15.10],
        [74.42, 15.10],
        [74.42, 15.22],
        [74.30, 15.22],
        [74.30, 15.10]
      ]
    ]
  },
  "name": "Upper Kali North Basin"
}
```

- **Response `200 OK`**:
```json
{
  "status": "success",
  "name": "Upper Kali North Basin",
  "score": 76.8,
  "category": "Critical",
  "badge_color": "red",
  "soil_loss_t_ha_yr": 32.4,
  "features": {
    "area_sq_km": 42.5,
    "mean_slope_deg": 17.8,
    "max_slope_deg": 34.2,
    "elevation_relief_m": 540.0,
    "twi_index": 7.2,
    "bare_soil_pct": 34.5,
    "tree_cover_pct": 18.2,
    "cropland_pct": 38.0,
    "builtup_pct": 4.8,
    "rainfall_30d_mm": 360.0,
    "rainfall_anomaly_pct": 42.0,
    "monsoon_storm_p95": 92.0,
    "drainage_density_km_km2": 2.15,
    "stream_order_max": 3
  },
  "shap_drivers": [
    {
      "feature_key": "mean_slope_deg",
      "label": "Steep Slopes",
      "description": "17.8° average hillside slope",
      "impact_pts": 26.4,
      "is_aggravating": true
    }
  ],
  "hydrograph": [
    {
      "day": "Day 1",
      "rainfall_mm": 12.0,
      "discharge_m3s": 21.4,
      "flood_alert_threshold": 45.0
    }
  ],
  "peak_discharge_m3s": 48.2,
  "prescribed_interventions": [
    {
      "title": "Continuous Contour Trenches (CCT)",
      "type": "contour_trenching",
      "quantity": "34.2 km along hillside crests",
      "target_zone": "Hill slopes > 12° with sheet erosion",
      "estimated_cost_lakhs_inr": 95.8,
      "impact": "Stops torrential surface runoff and enhances root-zone water absorption."
    }
  ],
  "estimated_budget_lakhs_inr": 142.5
}
```

### `POST /api/predict/simulate`
Executes real-time (<10ms) counterfactual inference when the user adjusts intervention sliders (Reforest %, Check Dams count, Continuous Contour Trenches %).

- **Request Body**:
```json
{
  "base_features": {
    "original_score": 76.8,
    "bare_soil_pct": 34.5,
    "mean_slope_deg": 17.8,
    "tree_cover_pct": 18.2
  },
  "reforest_bare_soil_pct": 15.0,
  "add_check_dams_count": 6,
  "cct_ridge_coverage_pct": 25.0
}
```

- **Response `200 OK`**:
```json
{
  "simulated_score": 40.3,
  "simulated_category": "Moderate",
  "score_delta": -36.5,
  "reduction_pct": 47.5,
  "new_soil_loss_t_ha_yr": 8.8,
  "modified_features": {
    "bare_soil_pct": 19.5,
    "tree_cover_pct": 33.2,
    "effective_slope_deg": 15.3
  }
}
```

### `GET /api/predict/models-info`
Returns active AI model engine metadata and version information.

---

## 6. Restoration Plans & DPR Proposals

### `POST /api/plans`
Saves a complete Detailed Project Report (DPR) restoration plan with civil works BoQ, budget in ₹ Lakhs, before/after score metrics, and intervention coordinates.

- **Request Body**:
```json
{
  "area_name": "Upper Kali Restoration Sector 1",
  "watershed_id": null,
  "area_sq_km": 42.5,
  "original_score": 76.8,
  "simulated_score": 40.3,
  "original_soil_loss": 32.4,
  "simulated_soil_loss": 8.8,
  "reforest_pct": 15.0,
  "check_dams_count": 6,
  "cct_pct": 25.0,
  "budget_lakhs_inr": 142.5,
  "interventions": [
    {
      "title": "Continuous Contour Trenches (CCT)",
      "quantity": "34.2 km",
      "estimated_cost_lakhs_inr": 95.8
    }
  ]
}
```

- **Response `200 OK`**:
```json
{
  "id": "186358c9-7ef6-4d7a-b2aa-873b88e0e0a5",
  "area_name": "Upper Kali Restoration Sector 1",
  "area_sq_km": 42.5,
  "original_score": 76.8,
  "simulated_score": 40.3,
  "original_soil_loss": 32.4,
  "simulated_soil_loss": 8.8,
  "budget_lakhs_inr": 142.5,
  "created_at": "2026-10-31T01:00:00Z"
}
```

### `GET /api/plans`
Lists all saved DPR restoration plans ordered by most recent.

### `GET /api/plans/{plan_id}`
Retrieves a specific restoration plan by ID.

### `DELETE /api/plans/{plan_id}`
Deletes a saved restoration plan by ID.

---

## 7. Data Exports

### `GET /api/exports/rankings.csv`
Streams the prioritized rankings table as a downloadable UTF-8 CSV file.

### `GET /api/exports/watersheds.geojson`
Streams all micro-watershed boundaries and computed scores as a GeoJSON FeatureCollection.

### `GET /api/exports/watersheds.shp.zip`
Generates and downloads a zipped ESRI Shapefile archive containing `.shp`, `.shx`, `.dbf`, and `.prj` files for government GIS teams.

---

## 8. Dataset Catalogue

### `GET /api/datasets`
Returns registration metadata, source URLs, spatial resolution, and licensing attribution for ingested environmental datasets (SRTM, ESA WorldCover, ERA5-Land).

---

## 9. Authentication & User Profile

### `GET /api/auth/status`
Returns Supabase OAuth status, active authentication provider, and JWT signing configuration.

### `GET /api/auth/me`
Returns the authenticated user's profile and RBAC role (`admin`, `planner`, `viewer`).

### `POST /api/auth/sync-profile`
Synchronizes the user profile from the validated Supabase JWT bearer token.
