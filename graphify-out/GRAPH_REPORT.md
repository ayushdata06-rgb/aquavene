# Graph Report - aquavene  (2026-10-31)

## Corpus Check
- 133 files · ~80,409 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 3, .example 2, .db 1)

## Summary
- 1231 nodes · 2563 edges · 76 communities (48 shown, 28 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 140 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `66157c60`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ResearchContext.tsx
- deps.py
- schemas.py
- RestorationMLEngine
- package.json
- RasterService
- App.tsx
- AquaVane REST API Specification
- VectorService
- HydrologyService
- env.py
- test_gis.py
- main.py
- LandCoverService
- ResearchContext.tsx
- _to_plan_response
- api/plans.py
- test_scoring.py
- compilerOptions
- export_rankings_csv
- recharts
- test_indicators.py
- AdminTab.tsx
- client
- AuthContext.tsx
- preprocess_dem.py
- watershed.py
- 3. Architecture Decision Records (ADRs)
- AquaVane Geospatial Data Pipeline & ML Architecture
- AquaVane Methodological Limitations, Caveats & Disclaimers
- compilerOptions
- api/predict.py
- watersheds.py
- 2. Table Specifications
- AquaVane — Watershed Restoration Planning & Prioritisation Platform
- watershed.py
- services
- .oxlintrc.json
- RestorationMLEngine
- React + TypeScript + Vite
- tsconfig.json
- RestorationPlannerService
- test_api.py
- vercel.json
- inspect_datasets.py
- vercel.json
- WaterHistoryService
- external.py
- HydrologyNetworkService
- LocationIntelligenceService
- api/auth.py
- json
- typing
- react
- PolicyScenarioTool.tsx
- get_settings
- schemas/auth.py
- test_auth.py
- datasets.py
- derive_hydrology.py
- numpy
- schemas/dashboard.py
- jobs.py

## God Nodes (most connected - your core abstractions)
1. `react` - 40 edges
2. `RasterService` - 36 edges
3. `useResearch()` - 35 edges
4. `get_settings()` - 33 edges
5. `lucide-react` - 30 edges
6. `Watershed` - 28 edges
7. `RestorationMLEngine` - 22 edges
8. `AuthenticatedUser` - 21 edges
9. `PriorityScore` - 18 edges
10. `HydrologyService` - 18 edges

## Surprising Connections (you probably didn't know these)
- `2. Real-Time ML Engine Components (`app/services/ml/`)` --references--> `AOIFeatureExtractor`  [INFERRED]
  docs/data_pipeline.md → backend/app/services/ml/feature_extractor.py
- `1. System Overview` --references--> `RestorationMLEngine`  [INFERRED]
  docs/architecture.md → backend/app/services/ml/engine.py
- `1. System Overview` --references--> `AOIFeatureExtractor`  [INFERRED]
  docs/architecture.md → backend/app/services/ml/feature_extractor.py
- `ADR 001: 4-Step Guided Flow vs. Disconnected Dashboards` --references--> `ActiveAreaBar()`  [INFERRED]
  docs/architecture.md → frontend/src/components/ActiveAreaBar.tsx
- `2.2 Backend Modules (`backend/app/`)` --references--> `SavedPlan`  [INFERRED]
  docs/architecture.md → backend/app/models/models.py

## Import Cycles
- None detected.

## Communities (76 total, 28 thin omitted)

### Community 0 - "ResearchContext.tsx"
Cohesion: 0.05
Nodes (52): api, API_BASE, FIXTURE_DATASETS, FIXTURE_JOBS, FIXTURE_RANKINGS, FIXTURE_WATERSHEDS, ResearchContextType, AOIPredictionResult (+44 more)

### Community 1 - "deps.py"
Cohesion: 0.12
Nodes (6): get_optional_user(), require_auth(), require_roles(), AuthenticatedUser, decode_supabase_jwt(), parse_user_from_claims()

### Community 2 - "schemas.py"
Cohesion: 0.06
Nodes (31): health_check(), create_processing_job(), get_processing_job(), get_rankings(), check_db_connection(), check_postgis(), DashboardSummary, DatasetResponse (+23 more)

### Community 3 - "RestorationMLEngine"
Cohesion: 0.16
Nodes (4): simulate_counterfactual(), RestorationMLEngine, test_ml_counterfactual_simulation(), test_ml_engine_analyze_aoi()

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (41): dependencies, clsx@^2.1.1, leaflet@^1.9.4, lucide-react@^0.453.0, react@^18.3.1, react-dom@^18.3.1, react-leaflet@^4.2.1, react-router-dom@^6.23.1 (+33 more)

### Community 6 - "App.tsx"
Cohesion: 0.18
Nodes (23): App(), ActiveAreaBar(), DataResolutionModal(), DataResolutionModalProps, LockedTabBanner(), LockedTabBannerProps, PolicyScenarioTool(), SiteDiagnosticModal() (+15 more)

### Community 7 - "AquaVane REST API Specification"
Cohesion: 0.06
Nodes (31): 1. System Health, 2. Dashboard Overview, 3. Watershed Management & Vector Geometries, 4. Priority Rankings & Screening, 5. Machine Learning Prediction & Counterfactual Simulation, 6. Restoration Plans & DPR Proposals, 7. Data Exports, 8. Dataset Catalogue (+23 more)

### Community 10 - "env.py"
Cohesion: 0.11
Nodes (8): Base, PriorityScore, SavedPlan, Scenario, ScenarioResult, run_migrations_offline(), run_migrations_online(), 2.2 Backend Modules (`backend/app/`)

### Community 11 - "test_gis.py"
Cohesion: 0.15
Nodes (4): RainfallService, main(), preprocess_rainfall(), test_rainfall_service_synthetic()

### Community 13 - "LandCoverService"
Cohesion: 0.13
Nodes (3): LandCoverService, preprocess_landcover(), test_landcover_service_synthetic()

### Community 14 - "ResearchContext.tsx"
Cohesion: 0.21
Nodes (14): calculatePhysicalHydrology(), fetchLiveElevation(), fetchLiveLocation(), fetchLiveRainfall(), fetchLiveWikipediaArticles(), LiveElevationData, LiveLocationResult, LiveRainfallData (+6 more)

### Community 16 - "_to_plan_response"
Cohesion: 0.15
Nodes (5): delete_saved_plan(), get_saved_plan(), list_saved_plans(), _to_plan_response(), update_saved_plan()

### Community 17 - "api/plans.py"
Cohesion: 0.27
Nodes (6): create_saved_plan(), BoQLineItem, PlanApproval, PlanCreate, PlanResponse, PlanUpdate

### Community 18 - "test_scoring.py"
Cohesion: 0.10
Nodes (13): ScoringProfile, ScoringRun, calculate_score(), categorise_score(), run_scoring(), validate_weights(), main(), test_calculate_score_exact() (+5 more)

### Community 19 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 21 - "recharts"
Cohesion: 0.22
Nodes (5): HydrographChartProps, HydroPoint, PVIComponents, PVIRadarChartProps, recharts

### Community 22 - "test_indicators.py"
Cohesion: 0.09
Nodes (14): calculate_downstream_exposure(), calculate_erosion_potential(), calculate_landcover_degradation(), calculate_rainfall_pressure(), _min_max_normalize(), normalize_indicators(), test_calculate_downstream_exposure(), test_calculate_erosion_potential_full() (+6 more)

### Community 23 - "AdminTab.tsx"
Cohesion: 0.11
Nodes (12): apiClient, ConfirmDialog(), ConfirmDialogProps, LoadingOverlayProps, colorStyles, MetricCardProps, RBACButtonProps, TabHeader() (+4 more)

### Community 24 - "client"
Cohesion: 0.15
Nodes (4): client(), sample_indicator_values(), sample_weights(), temp_dir()

### Community 25 - "AuthContext.tsx"
Cohesion: 0.22
Nodes (12): @supabase/supabase-js@^2.118.0, setAuthToken(), AuthContext, AuthContextType, AuthProvider(), PRESET_USERS, isSupabaseConfigured, supabase (+4 more)

### Community 26 - "preprocess_dem.py"
Cohesion: 0.12
Nodes (6): RasterInfo, main(), preprocess_dem(), test_slope_calculation(), test_synthetic_dem_creation_and_inspection(), test_whitebox_hydrology_wrapper()

### Community 27 - "watershed.py"
Cohesion: 0.14
Nodes (8): create_watershed(), get_watershed(), get_watershed_indicators(), get_watershed_plans(), list_watersheds(), trigger_watershed_analysis(), update_watershed(), _watershed_to_summary()

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

### Community 33 - "api/predict.py"
Cohesion: 0.06
Nodes (17): get_models_info(), predict_aoi(), AOIPredictRequest, AOIPredictResponse, FeatureVector, HydrographPoint, HydrographResult, InterventionLevers (+9 more)

### Community 34 - "watersheds.py"
Cohesion: 0.15
Nodes (4): get_dashboard_summary(), Dataset, ProcessingJob, Watershed

### Community 35 - "2. Table Specifications"
Cohesion: 0.25
Nodes (7): 1. Entity-Relationship Diagram (ERD), 2.1 `watersheds`, 2.2 `priority_scores`, 2.3 `saved_plans` (DPR Restoration Proposals), 2. Table Specifications, 3. Spatial Queries & Performance Indexing, AquaVane Database Schema & Spatial Architecture

### Community 36 - "AquaVane — Watershed Restoration Planning & Prioritisation Platform"
Cohesion: 0.15
Nodes (12): 1. Backend on Render, 2. Frontend on Vercel, 8-Tab Guided Restoration Flow, AquaVane — Watershed Restoration Planning & Prioritisation Platform, Backend, Cloud Deployment, End-to-End System Architecture, Frontend (+4 more)

### Community 37 - "watershed.py"
Cohesion: 0.39
Nodes (5): IndicatorResponse, WatershedCreate, WatershedListResponse, WatershedResponse, WatershedUpdate

### Community 38 - "services"
Cohesion: 0.15
Nodes (12): key, value, services, buildCommand, envVars, name, plan, region (+4 more)

### Community 39 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 40 - "RestorationMLEngine"
Cohesion: 0.15
Nodes (5): AOIFeatureExtractor, test_feature_extractor_returns_all_features(), test_models_info_endpoint(), test_predict_aoi_api_endpoint(), test_predict_simulate_api_endpoint()

### Community 41 - "React + TypeScript + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + TypeScript + Vite

### Community 54 - "test_api.py"
Cohesion: 0.17
Nodes (6): test_dashboard_summary(), test_export_rankings_csv(), test_health_check(), test_rankings_list(), test_saved_plans_workflow(), test_watersheds_list()

### Community 56 - "inspect_datasets.py"
Cohesion: 0.31
Nodes (3): file_checksum(), inspect_file(), main()

### Community 57 - "vercel.json"
Cohesion: 0.29
Nodes (6): buildCommand, framework, installCommand, outputDirectory, rewrites, $schema

### Community 59 - "external.py"
Cohesion: 0.19
Nodes (16): AnnualRainfall, DayForecast, DisasterEvent, FloodAlert, GaugeReading, GaugeStation, GroundwaterData, IDFCurve (+8 more)

### Community 62 - "api/auth.py"
Cohesion: 0.16
Nodes (8): delete_or_deactivate_user(), get_me(), list_users(), sync_user_profile(), update_user_role(), Profile, AuthenticatedUser, ProfileResponse

### Community 63 - "json"
Cohesion: 0.15
Nodes (5): WatershedIndicator, IndicatorService, store_indicators(), calculate_indicators(), main()

### Community 65 - "react"
Cohesion: 0.13
Nodes (20): AuthModal(), AuthModalProps, ContextPanel(), ContextPanelProps, Layout(), Navbar(), OnboardingModal(), Sidebar() (+12 more)

### Community 66 - "PolicyScenarioTool.tsx"
Cohesion: 0.40
Nodes (5): POLICY_PRESETS, PolicyPreset, PolicyScenarioToolProps, SiteDiagnosticModalProps, ActiveArea

### Community 67 - "get_settings"
Cohesion: 0.15
Nodes (5): get_auth_status(), get_current_user(), get_settings(), Settings, _get_engine()

### Community 69 - "schemas/auth.py"
Cohesion: 0.21
Nodes (5): AuthMeResponse, AuthStatusResponse, ProfileUpdate, RoleUpdatePayload, UserListResponse

### Community 70 - "test_auth.py"
Cohesion: 0.21
Nodes (5): create_test_token(), test_auth_enabled_strict_rejection(), test_auth_status_endpoint(), test_get_me_with_valid_bearer_token(), test_jwt_generation_and_decoding()

### Community 73 - "derive_hydrology.py"
Cohesion: 0.19
Nodes (5): derive_hydrology(), main(), load_data(), main(), main()

### Community 75 - "schemas/dashboard.py"
Cohesion: 0.36
Nodes (4): AdminDashboard, DashboardSummary, PlannerDashboard, ViewerDashboard

## Knowledge Gaps
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ADR 001: 4-Step Guided Flow vs. Disconnected Dashboards` connect `3. Architecture Decision Records (ADRs)` to `App.tsx`?**
  _High betweenness centrality (0.243) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `RasterService` (e.g. with `predict_aoi()` and `FeatureVector`) actually correct?**
  _`RasterService` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `ResearchContext.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.045739348370927316 - nodes in this community are weakly interconnected._
- **Should `deps.py` be split into smaller, more focused modules?**
  _Cohesion score 0.12333333333333334 - nodes in this community are weakly interconnected._
- **Should `schemas.py` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06201550387596899 - nodes in this community are weakly interconnected._
- **Should `RasterService` be split into smaller, more focused modules?**
  _Cohesion score 0.10153846153846154 - nodes in this community are weakly interconnected._