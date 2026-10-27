# AquaVane REST API Specification

The AquaVane backend provides a unified RESTful API conforming to OpenAPI 3.1 specifications. Interactive Swagger UI is accessible at `/docs` and ReDoc at `/redoc` when running the backend.

---

## 1. System Health

### `GET /api/health`
Check application health, database connectivity, and GIS runtime readiness.
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "database": "connected",
  "gis_engine": "operational",
  "whitebox_available": true
}
```

---

## 2. Dashboard Overview

### `GET /api/dashboard/summary`
Retrieves aggregated statistics for the primary executive dashboard.
- **Response `200 OK`**:
```json
{
  "total_watersheds": 15,
  "critical_count": 3,
  "high_count": 5,
  "medium_count": 4,
  "low_count": 3,
  "category_distribution": {
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
      "priority_category": "critical",
      "indicator_breakdown": {
        "erosion_potential": 85.0,
        "runoff_potential": 78.0,
        "landcover_degradation": 70.0,
        "rainfall_pressure": 82.0,
        "downstream_exposure": 75.0
      },
      "data_completeness": 1.0
    }
  ],
  "recent_jobs": [],
  "data_warnings": []
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

## 4. Priority Rankings

### `GET /api/rankings`
Retrieve prioritized rankings based on the latest scoring run.
- **Query Parameters**:
  - `category` (string, optional): Filter by category (`critical`, `high`, `medium`, `low`).
  - `sort_by` (string, default: `rank_position`): Field to sort by.
  - `order` (string, default: `asc`): `asc` or `desc`.
  - `min_completeness` (float, optional): Filter by minimum data completeness ratio.

### `GET /api/rankings/{watershed_id}`
Retrieve a specific watershed's score breakdown and contribution shares.

---

## 5. Indicator Analysis

### `GET /api/indicators`
Retrieve raw and normalized indicator values across all watersheds.
- **Query Parameters**:
  - `watershed_id` (UUID, optional)
  - `indicator_code` (string, optional)

### `GET /api/indicators/summary`
Returns population distribution percentiles (min, 25th, median, 75th, max) and standard deviations for all 5 indicators.

---

## 6. GIS Spatial Layers

### `GET /api/layers`
Returns catalogue of active spatial layers with bounding boxes, styles, and legends.

### `GET /api/layers/geojson`
Returns an aggregated GeoJSON `FeatureCollection` of all watershed polygons styled with their priority score properties for direct Leaflet/Mapbox rendering.

---

## 7. Rainfall & Climate (Copernicus ERA5-Land)

### `GET /api/rainfall/summary`
Returns annual mean precipitation, data coverage, and native resolution.

### `GET /api/rainfall/timeseries`
Returns monthly or seasonal precipitation hyetograph series for a watershed.
- **Query Parameters**:
  - `watershed_id` (UUID, required)
  - `aggregation` (string, default: `monthly`, enum: `monthly`, `seasonal`, `annual`)

---

## 8. Terrain & Land Cover

### `GET /api/terrain/elevation-profile`
Returns DEM elevation statistics (min, max, mean, hypsometric curve).

### `GET /api/terrain/landcover-breakdown`
Returns percentage breakdown of ESA WorldCover 10m classes within a watershed:
- Tree cover, Shrubland, Grassland, Cropland, Built-up, Bare / sparse vegetation, Water bodies.

---

## 9. Scenario Simulation

### `GET /api/scenarios`
List saved policy scenarios.

### `POST /api/scenarios`
Create a named policy scenario.
- **Request Body**:
```json
{
  "name": "Erosion Focus 2026",
  "description": "Scenario giving 40% weight to soil loss mitigation",
  "weights": {
    "erosion_potential": 0.40,
    "runoff_potential": 0.20,
    "landcover_degradation": 0.15,
    "rainfall_pressure": 0.15,
    "downstream_exposure": 0.10
  }
}
```

### `POST /api/scenarios/simulate`
Executes an on-the-fly simulation with arbitrary weights without persisting to the database. Returns rank deltas, score shifts, and sensitivity comparisons.

---

## 10. Data Exports & Dossiers

### `GET /api/exports/rankings.csv`
Streams prioritized rankings table as a downloadable UTF-8 CSV file.

### `GET /api/exports/watersheds.geojson`
Streams all watershed boundaries and indicator properties as a GeoJSON file.

### `GET /api/reports/dossier/{watershed_id}`
Generates a complete multi-page structured restoration dossier for a selected micro-watershed.
