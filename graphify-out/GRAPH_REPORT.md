# Graph Report - aquavene  (2026-10-31)

## Corpus Check
- 103 files · ~62,344 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: (none) 3, .example 2, .ini 1)

## Summary
- 1017 nodes · 2021 edges · 60 communities (31 shown, 29 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 98 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ced36376`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- client.ts
- deps.py
- schemas.py
- RestorationMLEngine
- package.json
- RasterService
- seed_dev_data.py
- AquaVane REST API Specification
- VectorService
- HydrologyService
- models.py
- test_gis.py
- models.py
- LandCoverService
- exports.py
- _to_plan_response
- compilerOptions
- logging
- get_settings
- test_indicators.py
- test_ml.py
- client
- .inspect
- Settings
- Watershed
- 3. Architecture Decision Records (ADRs)
- AquaVane Geospatial Data Pipeline & ML Architecture
- AquaVane Methodological Limitations, Caveats & Disclaimers
- compilerOptions
- inspect_datasets.py
- indicator_service.py
- 2. Table Specifications
- AquaVane — Watershed Restoration Planning & Prioritisation Platform
- sqlalchemy
- services
- .oxlintrc.json
- RestorationMLEngine
- React + TypeScript + Vite
- tsconfig.json
- RestorationPlannerService
- vercel.json
- WaterHistoryService
- HydrologyNetworkService
- LocationIntelligenceService
- numpy

## God Nodes (most connected - your core abstractions)
1. `get_settings()` - 31 edges
2. `useResearch()` - 29 edges
3. `RasterService` - 28 edges
4. `Watershed` - 24 edges
5. `RestorationMLEngine` - 23 edges
6. `react` - 23 edges
7. `PriorityScore` - 20 edges
8. `ScoringRun` - 19 edges
9. `Base` - 18 edges
10. `HydrologyService` - 18 edges

## Surprising Connections (you probably didn't know these)
- `2. Real-Time ML Engine Components (`app/services/ml/`)` --references--> `AOIFeatureExtractor`  [INFERRED]
  docs/data_pipeline.md → backend/app/services/ml/feature_extractor.py
- `ADR 001: 4-Step Guided Flow vs. Disconnected Dashboards` --references--> `ActiveAreaBar()`  [INFERRED]
  docs/architecture.md → frontend/src/components/ActiveAreaBar.tsx
- `2.2 Backend Modules (`backend/app/`)` --references--> `PriorityScore`  [INFERRED]
  docs/architecture.md → backend/app/models/models.py
- `1. System Overview` --references--> `RestorationMLEngine`  [INFERRED]
  docs/architecture.md → backend/app/services/ml/engine.py
- `Automated Testing` --references--> `RestorationMLEngine`  [INFERRED]
  README.md → backend/app/services/ml/engine.py

## Import Cycles
- None detected.

## Communities (60 total, 29 thin omitted)

### Community 0 - "client.ts"
Cohesion: 0.05
Nodes (80): api, apiClient, FIXTURE_DATASETS, FIXTURE_JOBS, FIXTURE_RANKINGS, FIXTURE_WATERSHEDS, setAuthToken(), App() (+72 more)

### Community 1 - "deps.py"
Cohesion: 0.07
Nodes (15): get_auth_status(), get_me(), get_current_user(), require_auth(), require_roles(), create_test_token(), decode_supabase_jwt(), parse_user_from_claims() (+7 more)

### Community 2 - "schemas.py"
Cohesion: 0.06
Nodes (32): get_dataset(), list_datasets(), health_check(), create_processing_job(), get_processing_job(), check_db_connection(), check_postgis(), DashboardSummary (+24 more)

### Community 3 - "RestorationMLEngine"
Cohesion: 0.24
Nodes (3): RestorationMLEngine, test_ml_counterfactual_simulation(), test_ml_engine_analyze_aoi()

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (43): dependencies, clsx@^2.1.1, leaflet@^1.9.4, lucide-react@^0.453.0, react@^18.3.1, react-dom@^18.3.1, react-leaflet@^4.2.1, react-router-dom@^6.23.1 (+35 more)

### Community 6 - "seed_dev_data.py"
Cohesion: 0.10
Nodes (14): PriorityScore, ProcessingJob, ScoringProfile, calculate_score(), categorise_score(), run_scoring(), validate_weights(), main() (+6 more)

### Community 7 - "AquaVane REST API Specification"
Cohesion: 0.06
Nodes (31): 1. System Health, 2. Dashboard Overview, 3. Watershed Management & Vector Geometries, 4. Priority Rankings & Screening, 5. Machine Learning Prediction & Counterfactual Simulation, 6. Restoration Plans & DPR Proposals, 7. Data Exports, 8. Dataset Catalogue (+23 more)

### Community 10 - "models.py"
Cohesion: 0.11
Nodes (9): Base, DatasetVersion, Profile, SavedPlan, Scenario, ScenarioResult, run_migrations_offline(), run_migrations_online() (+1 more)

### Community 11 - "test_gis.py"
Cohesion: 0.15
Nodes (4): RainfallService, main(), preprocess_rainfall(), test_rainfall_service_synthetic()

### Community 12 - "models.py"
Cohesion: 0.12
Nodes (4): get_db(), create_app(), lifespan(), Dataset

### Community 13 - "LandCoverService"
Cohesion: 0.13
Nodes (3): LandCoverService, preprocess_landcover(), test_landcover_service_synthetic()

### Community 16 - "_to_plan_response"
Cohesion: 0.14
Nodes (7): create_saved_plan(), delete_saved_plan(), get_saved_plan(), list_saved_plans(), SavedPlanCreate, SavedPlanResponse, _to_plan_response()

### Community 19 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 20 - "logging"
Cohesion: 0.17
Nodes (5): AOIPredictRequest, CounterfactualSimulateRequest, get_models_info(), predict_aoi(), simulate_counterfactual()

### Community 21 - "get_settings"
Cohesion: 0.11
Nodes (10): get_settings(), _get_engine(), IndicatorService, calculate_indicators(), main(), load_data(), main(), main() (+2 more)

### Community 22 - "test_indicators.py"
Cohesion: 0.05
Nodes (20): calculate_downstream_exposure(), calculate_erosion_potential(), calculate_landcover_degradation(), calculate_rainfall_pressure(), _min_max_normalize(), normalize_indicators(), test_dashboard_summary(), test_export_rankings_csv() (+12 more)

### Community 24 - "client"
Cohesion: 0.15
Nodes (4): client(), sample_indicator_values(), sample_weights(), temp_dir()

### Community 25 - ".inspect"
Cohesion: 0.14
Nodes (6): RasterInfo, derive_hydrology(), main(), test_slope_calculation(), test_synthetic_dem_creation_and_inspection(), test_whitebox_hydrology_wrapper()

### Community 27 - "Watershed"
Cohesion: 0.12
Nodes (9): get_dashboard_summary(), get_rankings(), get_watershed(), get_watershed_history(), get_watershed_indicators(), list_watersheds(), _watershed_to_summary(), ScoringRun (+1 more)

### Community 29 - "3. Architecture Decision Records (ADRs)"
Cohesion: 0.22
Nodes (8): 1. System Overview, 2.1 The 4 Frontend Steps (`frontend/src/`), 2. Component Responsibilities, 3. Architecture Decision Records (ADRs), ADR 001: 4-Step Guided Flow vs. Disconnected Dashboards, ADR 002: 4-Pointer Precision Boundary Placement, ADR 003: Deterministic AST Knowledge Graph (Graphify), AquaVane Architecture Documentation

### Community 30 - "AquaVane Geospatial Data Pipeline & ML Architecture"
Cohesion: 0.33
Nodes (5): 1. Dual Processing Architecture, 2. Real-Time ML Engine Components (`app/services/ml/`), 3. The 5 Core Environmental Indicators, 4. Offline Batch CLI Scripts (`backend/scripts/`), AquaVane Geospatial Data Pipeline & ML Architecture

### Community 31 - "AquaVane Methodological Limitations, Caveats & Disclaimers"
Cohesion: 0.18
Nodes (10): 1. Screening Tool vs. Detailed Engineering Models, 2.1 The ERA5-Land Resolution Discrepancy, 2.2 Modifiable Areal Unit Problem (MAUP), 2. Spatial Scale & Resolution Disparities, 3.1 Copernicus ERA5-Land Precipitation Semantics, 3.2 ESA WorldCover Optical Misclassification, 3. Data Latency and Product Caveats, 4. Unmodeled Sociotechnical Factors (+2 more)

### Community 32 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, lib, module, moduleResolution, noEmit, skipLibCheck, target, tsBuildInfoFile (+1 more)

### Community 33 - "inspect_datasets.py"
Cohesion: 0.31
Nodes (3): file_checksum(), inspect_file(), main()

### Community 34 - "indicator_service.py"
Cohesion: 0.20
Nodes (3): sync_user_profile(), WatershedIndicator, store_indicators()

### Community 35 - "2. Table Specifications"
Cohesion: 0.25
Nodes (7): 1. Entity-Relationship Diagram (ERD), 2.1 `watersheds`, 2.2 `priority_scores`, 2.3 `saved_plans` (DPR Restoration Proposals), 2. Table Specifications, 3. Spatial Queries & Performance Indexing, AquaVane Database Schema & Spatial Architecture

### Community 36 - "AquaVane — Watershed Restoration Planning & Prioritisation Platform"
Cohesion: 0.11
Nodes (18): 1. Prerequisites, 2. Backend Setup, 3. Frontend Setup, 3D Architecture Diagram (Graphify), AquaVane — Watershed Restoration Planning & Prioritisation Platform, Automated Testing, Clean Project Structure, CLI Graph Queries (+10 more)

### Community 38 - "services"
Cohesion: 0.15
Nodes (12): key, value, services, buildCommand, envVars, name, plan, region (+4 more)

### Community 39 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 40 - "RestorationMLEngine"
Cohesion: 0.22
Nodes (3): AOIFeatureExtractor, test_feature_extractor_returns_all_features(), test_predict_simulate_api_endpoint()

### Community 41 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

## Knowledge Gaps
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR 001: 4-Step Guided Flow vs. Disconnected Dashboards` connect `3. Architecture Decision Records (ADRs)` to `client.ts`?**
  _High betweenness centrality (0.200) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `RasterService` (e.g. with `LandCoverService` and `derive_hydrology()`) actually correct?**
  _`RasterService` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `client.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05413507317933345 - nodes in this community are weakly interconnected._
- **Are the 11 inferred relationships involving `Watershed` (e.g. with `get_dashboard_summary()` and `export_rankings_csv()`) actually correct?**
  _`Watershed` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `deps.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06560283687943262 - nodes in this community are weakly interconnected._
- **Should `schemas.py` be split into smaller, more focused modules?**
  _Cohesion score 0.057912457912457915 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0595959595959596 - nodes in this community are weakly interconnected._