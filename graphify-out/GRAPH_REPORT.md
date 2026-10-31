# Graph Report - aquavene  (2026-10-31)

## Corpus Check
- 138 files · ~97,586 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 3, .example 2, .db 1)

## Summary
- 1298 nodes · 2735 edges · 78 communities (44 shown, 34 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 138 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `90836290`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ResearchContext.tsx
- normalize_indicators
- schemas.py
- RestorationMLEngine
- package.json
- RasterService
- App.tsx
- AquaVane REST API Specification
- VectorService
- HydrologyService
- test_gis.py
- preprocess_dem.py
- LandCoverService
- ResearchContext.tsx
- indicator_service.py
- api/plans.py
- terrain.py
- exports.py
- compilerOptions
- inspect_datasets.py
- Watershed
- test_indicators.py
- ContextPanel.tsx
- client
- AuthContext.tsx
- schemas/dashboard.py
- watershed.py
- 3. Architecture Decision Records (ADRs)
- AquaVane Geospatial Data Pipeline & ML Architecture
- AquaVane Methodological Limitations, Caveats & Disclaimers
- compilerOptions
- api/predict.py
- 2. Table Specifications
- AquaVane — Watershed Restoration Planning & Prioritisation Platform
- services
- .oxlintrc.json
- RestorationMLEngine
- React + TypeScript + Vite
- tsconfig.json
- test_api.py
- vercel.json
- WatershedBadge.tsx
- vercel.json
- WaterHistoryService
- external.py
- HydrologyNetworkService
- LocationIntelligenceService
- api/auth.py
- rankings.py
- useAuth
- RankingsTab.tsx
- get_settings
- store_indicators
- package.json
- get_settings
- models.py
- env.py

## God Nodes (most connected - your core abstractions)
1. `react` - 42 edges
2. `RasterService` - 37 edges
3. `useResearch()` - 37 edges
4. `get_settings()` - 33 edges
5. `lucide-react` - 33 edges
6. `Watershed` - 32 edges
7. `RestorationMLEngine` - 24 edges
8. `useAuth()` - 23 edges
9. `react-router-dom` - 19 edges
10. `PriorityScore` - 18 edges

## Surprising Connections (you probably didn't know these)
- `2. Real-Time ML Engine Components (`app/services/ml/`)` --references--> `AOIFeatureExtractor`  [INFERRED]
  docs/data_pipeline.md → backend/app/services/ml/feature_extractor.py
- `2.2 Backend Modules (`backend/app/`)` --references--> `SavedPlan`  [INFERRED]
  docs/architecture.md → backend/app/models/models.py
- `2.2 Backend Modules (`backend/app/`)` --references--> `PriorityScore`  [INFERRED]
  docs/architecture.md → backend/app/models/models.py
- `1. System Overview` --references--> `RestorationMLEngine`  [INFERRED]
  docs/architecture.md → backend/app/services/ml/engine.py
- `1. System Overview` --references--> `AOIFeatureExtractor`  [INFERRED]
  docs/architecture.md → backend/app/services/ml/feature_extractor.py

## Import Cycles
- None detected.

## Communities (78 total, 34 thin omitted)

### Community 0 - "ResearchContext.tsx"
Cohesion: 0.05
Nodes (51): API_BASE, FIXTURE_DATASETS, FIXTURE_JOBS, FIXTURE_RANKINGS, FIXTURE_WATERSHEDS, ResearchContextType, AOIPredictionResult, AOIPredictResponse (+43 more)

### Community 1 - "normalize_indicators"
Cohesion: 0.25
Nodes (4): _min_max_normalize(), normalize_indicators(), test_min_max_normalize(), test_normalize_indicators()

### Community 2 - "schemas.py"
Cohesion: 0.05
Nodes (33): get_dashboard_summary(), get_dataset(), list_datasets(), health_check(), create_processing_job(), get_processing_job(), check_db_connection(), check_postgis() (+25 more)

### Community 3 - "RestorationMLEngine"
Cohesion: 0.15
Nodes (4): simulate_counterfactual(), RestorationMLEngine, test_ml_counterfactual_simulation(), test_ml_engine_analyze_aoi()

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (43): dependencies, clsx@^2.1.1, leaflet@^1.9.4, lucide-react@^0.453.0, react@^18.3.1, react-dom@^18.3.1, react-leaflet@^4.2.1, react-router-dom@^6.23.1 (+35 more)

### Community 6 - "App.tsx"
Cohesion: 0.25
Nodes (16): App(), ActiveAreaBar(), LockedTabBanner(), LockedTabBannerProps, PolicyScenarioTool(), useResearch(), AuthTab(), FarmsRoadsTab() (+8 more)

### Community 7 - "AquaVane REST API Specification"
Cohesion: 0.06
Nodes (31): 1. System Health, 2. Dashboard Overview, 3. Watershed Management & Vector Geometries, 4. Priority Rankings & Screening, 5. Machine Learning Prediction & Counterfactual Simulation, 6. Restoration Plans & DPR Proposals, 7. Data Exports, 8. Dataset Catalogue (+23 more)

### Community 12 - "preprocess_dem.py"
Cohesion: 0.12
Nodes (6): RasterInfo, main(), preprocess_dem(), test_slope_calculation(), test_synthetic_dem_creation_and_inspection(), test_whitebox_hydrology_wrapper()

### Community 13 - "LandCoverService"
Cohesion: 0.12
Nodes (4): LandCoverService, main(), preprocess_landcover(), test_landcover_service_synthetic()

### Community 14 - "ResearchContext.tsx"
Cohesion: 0.19
Nodes (16): calculatePhysicalHydrology(), fetchLiveElevation(), fetchLiveLocation(), fetchLiveRainfall(), fetchLiveWikipediaArticles(), generateLiveHydrologyLayers(), LiveElevationData, LiveLocationResult (+8 more)

### Community 16 - "api/plans.py"
Cohesion: 0.06
Nodes (19): create_saved_plan(), delete_saved_plan(), generate_dpr_plan_get(), generate_dpr_plan_post(), _generate_plan_logic(), get_saved_plan(), list_saved_plans(), _to_plan_response() (+11 more)

### Community 17 - "terrain.py"
Cohesion: 0.19
Nodes (6): analyze_custom_aoi_terrain(), _generate_terrain_stations(), get_terrain_health(), TerrainElevationPoint, TerrainHealthResponse, USLEFactorsDetail

### Community 19 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 20 - "inspect_datasets.py"
Cohesion: 0.31
Nodes (3): file_checksum(), inspect_file(), main()

### Community 21 - "Watershed"
Cohesion: 0.08
Nodes (17): Base, PriorityScore, ScoringProfile, ScoringRun, Watershed, WatershedIndicator, calculate_score(), categorise_score() (+9 more)

### Community 22 - "test_indicators.py"
Cohesion: 0.11
Nodes (10): calculate_downstream_exposure(), calculate_erosion_potential(), calculate_landcover_degradation(), calculate_rainfall_pressure(), test_calculate_downstream_exposure(), test_calculate_erosion_potential_full(), test_calculate_erosion_potential_missing(), test_calculate_landcover_degradation() (+2 more)

### Community 23 - "ContextPanel.tsx"
Cohesion: 0.09
Nodes (21): apiClient, ContextPanelProps, ConfirmDialog(), ConfirmDialogProps, LoadingOverlayProps, colorStyles, MetricCardProps, ProgressRing() (+13 more)

### Community 24 - "client"
Cohesion: 0.15
Nodes (4): client(), sample_indicator_values(), sample_weights(), temp_dir()

### Community 25 - "AuthContext.tsx"
Cohesion: 0.14
Nodes (17): setAuthToken(), INITIAL_TASKS, INITIAL_TEAM, PRESET_REGIONS, ProfileModalProps, AuthContext, AuthContextType, AuthProvider() (+9 more)

### Community 26 - "schemas/dashboard.py"
Cohesion: 0.36
Nodes (4): AdminDashboard, DashboardSummary, PlannerDashboard, ViewerDashboard

### Community 27 - "watershed.py"
Cohesion: 0.11
Nodes (13): create_watershed(), get_watershed(), get_watershed_indicators(), get_watershed_plans(), list_watersheds(), trigger_watershed_analysis(), update_watershed(), _watershed_to_summary() (+5 more)

### Community 29 - "3. Architecture Decision Records (ADRs)"
Cohesion: 0.20
Nodes (9): 1. System Overview, 2.1 The 4 Frontend Steps (`frontend/src/`), 2.2 Backend Modules (`backend/app/`), 2. Component Responsibilities, 3. Architecture Decision Records (ADRs), ADR 001: 4-Step Guided Flow vs. Disconnected Dashboards, ADR 002: 4-Pointer Precision Boundary Placement, ADR 003: Deterministic AST Knowledge Graph (Graphify) (+1 more)

### Community 30 - "AquaVane Geospatial Data Pipeline & ML Architecture"
Cohesion: 0.33
Nodes (5): 1. Dual Processing Architecture, 2. Real-Time ML Engine Components (`app/services/ml/`), 3. The 5 Core Environmental Indicators, 4. Offline Batch CLI Scripts (`backend/scripts/`), AquaVane Geospatial Data Pipeline & ML Architecture

### Community 31 - "AquaVane Methodological Limitations, Caveats & Disclaimers"
Cohesion: 0.18
Nodes (10): 1. Screening Tool vs. Detailed Engineering Models, 2.1 The ERA5-Land Resolution Discrepancy, 2.2 Modifiable Areal Unit Problem (MAUP), 2. Spatial Scale & Resolution Disparities, 3.1 Copernicus ERA5-Land Precipitation Semantics, 3.2 ESA WorldCover Optical Misclassification, 3. Data Latency and Product Caveats, 4. Unmodeled Sociotechnical Factors (+2 more)

### Community 32 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, lib, module, moduleResolution, noEmit, skipLibCheck, target, tsBuildInfoFile (+1 more)

### Community 33 - "api/predict.py"
Cohesion: 0.06
Nodes (17): get_models_info(), predict_aoi(), AOIPredictRequest, AOIPredictResponse, FeatureVector, HydrographPoint, HydrographResult, InterventionLevers (+9 more)

### Community 35 - "2. Table Specifications"
Cohesion: 0.25
Nodes (7): 1. Entity-Relationship Diagram (ERD), 2.1 `watersheds`, 2.2 `priority_scores`, 2.3 `saved_plans` (DPR Restoration Proposals), 2. Table Specifications, 3. Spatial Queries & Performance Indexing, AquaVane Database Schema & Spatial Architecture

### Community 36 - "AquaVane — Watershed Restoration Planning & Prioritisation Platform"
Cohesion: 0.15
Nodes (12): 1. Backend on Render, 2. Frontend on Vercel, 8-Tab Guided Restoration Flow, AquaVane — Watershed Restoration Planning & Prioritisation Platform, Backend, Cloud Deployment, End-to-End System Architecture, Frontend (+4 more)

### Community 38 - "services"
Cohesion: 0.15
Nodes (12): key, value, services, buildCommand, envVars, name, plan, region (+4 more)

### Community 39 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 40 - "RestorationMLEngine"
Cohesion: 0.13
Nodes (5): AOIFeatureExtractor, test_feature_extractor_returns_all_features(), test_models_info_endpoint(), test_predict_aoi_api_endpoint(), test_predict_simulate_api_endpoint()

### Community 41 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 54 - "test_api.py"
Cohesion: 0.15
Nodes (6): test_dashboard_summary(), test_export_rankings_csv(), test_generate_dpr_plan_endpoints(), test_health_check(), test_rankings_list(), test_watersheds_list()

### Community 57 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, installCommand, outputDirectory, rewrites, $schema

### Community 59 - "external.py"
Cohesion: 0.19
Nodes (16): AnnualRainfall, DayForecast, DisasterEvent, FloodAlert, GaugeReading, GaugeStation, GroundwaterData, IDFCurve (+8 more)

### Community 62 - "api/auth.py"
Cohesion: 0.10
Nodes (14): delete_or_deactivate_user(), get_auth_status(), get_me(), list_users(), sync_user_profile(), update_user_role(), Profile, AuthenticatedUser (+6 more)

### Community 64 - "rankings.py"
Cohesion: 0.25
Nodes (3): _build_ranking_entries_from_watersheds(), get_rankings(), _resolve_centroid()

### Community 65 - "useAuth"
Cohesion: 0.14
Nodes (15): AuthModal(), AuthModalProps, ContextPanel(), ErrorBoundary, Props, State, Layout(), Navbar() (+7 more)

### Community 66 - "RankingsTab.tsx"
Cohesion: 0.13
Nodes (18): api, DataResolutionModal(), DataResolutionModalProps, POLICY_PRESETS, PolicyPreset, PolicyScenarioToolProps, SiteDiagnosticModal(), SiteDiagnosticModalProps (+10 more)

### Community 70 - "get_settings"
Cohesion: 0.06
Nodes (16): get_current_user(), get_optional_user(), require_auth(), require_roles(), AuthenticatedUser, create_test_token(), decode_supabase_jwt(), parse_user_from_claims() (+8 more)

### Community 72 - "package.json"
Cohesion: 0.29
Nodes (6): name, private, scripts, build, install:all, version

### Community 73 - "get_settings"
Cohesion: 0.11
Nodes (9): IndicatorService, calculate_indicators(), main(), derive_hydrology(), main(), load_data(), main(), main() (+1 more)

### Community 76 - "models.py"
Cohesion: 0.10
Nodes (5): get_db(), create_app(), lifespan(), Dataset, ProcessingJob

### Community 79 - "env.py"
Cohesion: 0.13
Nodes (5): Scenario, ScenarioResult, run_migrations_offline(), run_migrations_online(), upgrade()

## Knowledge Gaps
- **34 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR 001: 4-Step Guided Flow vs. Disconnected Dashboards` connect `3. Architecture Decision Records (ADRs)` to `App.tsx`?**
  _High betweenness centrality (0.283) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `RasterService` (e.g. with `predict_aoi()` and `FeatureVector`) actually correct?**
  _`RasterService` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `ResearchContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.046103896103896105 - nodes in this community are weakly interconnected._
- **Should `schemas.py` be split into smaller, more focused modules?**
  _Cohesion score 0.05376972530683811 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0595959595959596 - nodes in this community are weakly interconnected._
- **Should `RasterService` be split into smaller, more focused modules?**
  _Cohesion score 0.10153846153846154 - nodes in this community are weakly interconnected._
- **Should `AquaVane REST API Specification` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._