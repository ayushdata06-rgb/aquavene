# AquaVane Database Schema & Spatial Architecture

AquaVane uses a relational PostgreSQL 15+ database with the PostGIS 3.4 spatial extension (hosted on Supabase or locally). All tables use UUID primary keys for distributed safety and auditability.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ SCENARIOS : creates
    PROFILES ||--o{ SCORING_RUNS : executes
    
    WATERSHEDS ||--o{ WATERSHED_INDICATORS : has
    WATERSHEDS ||--o{ PRIORITY_SCORES : scored_in
    WATERSHEDS ||--o{ SCENARIO_RESULTS : simulated_in

    DATASETS ||--o{ DATASET_VERSIONS : tracks
    DATASETS ||--o{ PROCESSING_JOBS : consumed_by

    SCORING_PROFILES ||--o{ SCORING_RUNS : defines_weights_for

    SCORING_RUNS ||--o{ PRIORITY_SCORES : generates
    
    SCENARIOS ||--o{ SCENARIO_RESULTS : produces

    WATERSHEDS {
        uuid id PK
        varchar watershed_code UK
        varchar name
        varchar state
        varchar district
        varchar basin_name
        float area_sq_km
        geometry geom "MultiPolygon (EPSG:4326)"
        geometry centroid "Point (EPSG:4326)"
        geometry bbox "Polygon (EPSG:4326)"
        jsonb metadata_json
        timestamptz created_at
        timestamptz updated_at
    }

    WATERSHED_INDICATORS {
        uuid id PK
        uuid watershed_id FK
        varchar indicator_code
        float raw_value
        float normalized_value
        varchar quality_status
        varchar data_source
        date reference_start
        date reference_end
        varchar confidence_level
        jsonb metadata_json
        timestamptz calculated_at
    }

    SCORING_PROFILES {
        uuid id PK
        varchar name UK
        varchar description
        jsonb weights_json
        boolean is_default
        boolean is_active
        timestamptz created_at
    }

    SCORING_RUNS {
        uuid id PK
        uuid profile_id FK
        uuid executed_by FK
        varchar status
        varchar method_version
        integer total_watersheds
        jsonb summary_stats
        timestamptz started_at
        timestamptz completed_at
    }

    PRIORITY_SCORES {
        uuid id PK
        uuid scoring_run_id FK
        uuid watershed_id FK
        float overall_score
        varchar priority_category
        integer rank_position
        float data_completeness
        jsonb indicator_breakdown_json
        jsonb contribution_shares_json
        timestamptz created_at
    }

    SCENARIOS {
        uuid id PK
        uuid created_by FK
        varchar name UK
        text description
        jsonb weights_json
        boolean is_baseline
        timestamptz created_at
        timestamptz updated_at
    }

    SCENARIO_RESULTS {
        uuid id PK
        uuid scenario_id FK
        uuid watershed_id FK
        float simulated_score
        varchar simulated_category
        integer simulated_rank
        float delta_score
        integer delta_rank
        timestamptz calculated_at
    }

    DATASETS {
        uuid id PK
        varchar name UK
        varchar category
        varchar source
        varchar temporal_coverage
        varchar spatial_resolution
        varchar file_path
        varchar status
        timestamptz last_processed
    }

    DATASET_VERSIONS {
        uuid id PK
        uuid dataset_id FK
        varchar version_tag
        varchar checksum
        bigint file_size_bytes
        varchar file_path
        jsonb metadata_json
        timestamptz created_at
    }

    PROCESSING_JOBS {
        uuid id PK
        uuid dataset_id FK
        varchar job_type
        varchar status
        float progress_pct
        text log_output
        timestamptz started_at
        timestamptz finished_at
    }

    PROFILES {
        uuid id PK
        varchar email UK
        varchar full_name
        varchar role
        timestamptz created_at
    }
```

---

## 2. Table Specifications

### 2.1 `watersheds`
Stores geographical micro-watershed boundaries, bounding boxes, centroids, and regional identifiers.
- **`geom`**: `Geometry('MULTIPOLYGON', srid=4326)` - PostGIS boundary geometry.
- **`centroid`**: `Geometry('POINT', srid=4326)` - Computed geographic center for fast map marker placement.
- **`bbox`**: `Geometry('POLYGON', srid=4326)` - Envelope polygon for sub-second spatial intersection queries.
- **Spatial Index**: `CREATE INDEX idx_watersheds_geom ON watersheds USING GIST (geom);`

### 2.2 `watershed_indicators`
Stores computed and normalized indicator values for each micro-watershed.
- **`indicator_code`**: One of `erosion_potential`, `runoff_potential`, `landcover_degradation`, `rainfall_pressure`, `downstream_exposure`.
- **`raw_value`**: Physical engineering dimension (e.g., $t/ha/yr$, runoff coefficient $C$, degraded area $\%$, annual $mm$, population density).
- **`normalized_value`**: Scaled $0.0 - 100.0$ value used directly in weighted scoring.
- **`quality_status`**: `computed` (directly derived), `imputed` (neighbor-inferred), `missing` (no data available), `stale` (outdated source).
- **Index**: Unique composite index on `(watershed_id, indicator_code)`.

### 2.3 `scoring_profiles` & `scoring_runs`
Maintains auditable history of prioritisation algorithms and weightings.
- **`weights_json`**: Key-value JSON document enforcing $\sum w_i = 1.0 \pm 0.001$.
- **`scoring_runs`**: Immutable audit record of every prioritisation execution, recording the execution timestamp, runtime, total watersheds evaluated, and statistical distribution.

### 2.4 `priority_scores`
Individual micro-watershed scores produced by a specific scoring run.
- **`overall_score`**: $\sum_{i=1}^5 (w_i \times I_i)$ constrained to $[0.0, 100.0]$.
- **`priority_category`**:
  - `critical`: Score $\ge 75.0$
  - `high`: $60.0 \le \text{Score} < 75.0$
  - `medium`: $40.0 \le \text{Score} < 60.0$
  - `low`: Score $< 40.0$
- **`data_completeness`**: Ratio of non-missing indicator weights to total weight.
- **Index**: Composite index on `(scoring_run_id, rank_position)` for sub-millisecond leaderboard retrieval.

### 2.5 `scenarios` & `scenario_results`
Enables exploratory policy simulation without mutating production scoring runs.
- Planners can tweak weightings (e.g. prioritize erosion mitigation vs downstream protection).
- `scenario_results` stores `delta_score` and `delta_rank` relative to the baseline scoring run.

---

## 3. Spatial Queries & Indexing Strategy

AquaVane utilizes PostGIS native functions for maximum geospatial efficiency:
```sql
-- 1. Sub-second Bounding Box Viewport Queries
SELECT id, watershed_code, name, ST_AsGeoJSON(geom)
FROM watersheds
WHERE geom && ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326);

-- 2. Geometry Simplification for High-Zoom Levels
SELECT id, ST_AsGeoJSON(ST_SimplifyPreserveTopology(geom, 0.001))
FROM watersheds;

-- 3. Point-in-Watershed Identification
SELECT id, watershed_code, name
FROM watersheds
WHERE ST_Contains(geom, ST_SetSRID(ST_Point(:lon, :lat), 4326))
LIMIT 1;
```
