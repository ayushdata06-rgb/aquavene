# AquaVane Architecture Documentation

## 1. System Overview

AquaVane is a specialized geospatial decision-support and micro-watershed restoration planning platform designed for government district officers, field engineers, and NGO program managers. It bridges the gap between raw Earth Observation data (SRTM 30m DEM, Copernicus ERA5-Land, ESA WorldCover 10m) and actionable, certified civil engineering restoration plans.

The system is structured as a **Modular Monolith**:
- **Frontend SPA**: React 18, TypeScript, Tailwind CSS, Vite, Leaflet (keyless free basemaps), and Recharts. Organized into a **4-step guided journey** linked by a shared application state (`ResearchContext`).
- **Backend Modular Monolith**: High-performance asynchronous API built with FastAPI, SQLAlchemy 2, Pydantic v2, and Alembic.
- **Machine Learning Core**: 4-model restoration intelligence engine (`RestorationMLEngine` + `AOIFeatureExtractor`) combining XGBoost prioritization, NeuralHydrology EA-LSTM hydrograph simulation, TreeSHAP explainability, and CatBoost civil works Bill of Quantities (BoQ) prescription.
- **Geospatial Processing Engine**: Tri-core Python GIS combining Rasterio (GDAL windowed I/O), GeoPandas (GEOS/Shapely spatial algebra), and WhiteboxTools (compiled Rust hydrology engine).
- **Knowledge Graph Engine (Graphify)**: Complete AST-parsed graph of code, schemas, and docs with 3D WebGL orbit visualization (`graph_3d.html`), 2D physics network (`graph.html`), and automated git synchronization hooks.
- **Database**: PostgreSQL 15+ with PostGIS 3.4 spatial extensions (Supabase or local).

```text
+---------------------------------------------------------------------------------------------------+
|                           FRONTEND CLIENT (React 18 + TypeScript + Vite)                          |
+---------------------------------------------------------------------------------------------------+
|  [ ActiveAreaBar ] (Persistent Context & 4-Step Progress Indicator)                               |
|                                                                                                   |
|  +--------------------+  +--------------------+  +--------------------+  +--------------------+   |
|  |    Tab 1: Map      |  |  Tab 2: Rankings   |  | Tab 3: Hydrology   |  |  Tab 4: Simulator  |   |
|  |      (/map)        |  |    (/rankings)     |  |    (/hydrology)    |  |    (/simulator)    |   |
|  | 4-Pointer Boundary |  | Priority Leaderboard|  | 30-Day Rain/Flow   |  | CatBoost BoQ Works |   |
|  | SRTM & WorldCover  |  | CSV/SHP DPR Export |  | TWI Recharge Spots |  | Live What-If (<10ms)|   |
|  +---------+----------+  +---------+----------+  +---------+----------+  +---------+----------+   |
|            ^                       ^                       ^                       ^              |
|            |                       |                       |                       |              |
|            +-----------------------+-----------+-----------+-----------------------+              |
|                                                |                                                  |
|                                                v                                                  |
|                                  [ ResearchContext (State Store) ]                                |
+------------------------------------------------+--------------------------------------------------+
                                                 |
                                      HTTP / REST JSON Payloads
                                                 |
                                                 v
+---------------------------------------------------------------------------------------------------+
|                                     BACKEND API (FastAPI)                                         |
+---------------------------------------------------------------------------------------------------+
|  Routers:                                                                                         |
|  * /api/predict     --> Arbitrary AOI raster extraction & counterfactual slider simulation        |
|  * /api/plans       --> DPR proposal storage & Civil BoQ persistence                              |
|  * /api/rankings    --> Regional screening leaderboard & sorting                                  |
|  * /api/exports     --> Streaming CSV, GeoJSON FeatureCollections, ESRI Shapefile Zips            |
|  * /api/watersheds  --> PostGIS vector boundary geometry & summary attributes                     |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                     4-MODEL RESTORATION INTELLIGENCE CORE (services/ml/)                    |  |
|  |                                                                                             |  |
|  |  [ AOIFeatureExtractor ] (15 Continuous Geo-Environmental Variables from Rasters)           |  |
|  |             |                                                                               |  |
|  |             +--------------> [ XGBoost Scorer ] ----------> Restoration Urgency Score       |  |
|  |             +--------------> [ RUSLE Modeler ] -----------> Annual Soil Loss (t/ha/yr)      |  |
|  |             +--------------> [ EA-LSTM Engine ] ----------> 30-Day Daily Hydrograph         |  |
|  |             +--------------> [ TreeSHAP Attributor ] -----> Feature Impact Factor Breakdown |  |
|  |             +--------------> [ CatBoost Prescriptor ] ----> Certified Civil BoQ & Budget    |  |
|  +---------------------------------------------+-----------------------------------------------+  |
|                                                |                                                  |
|  +---------------------------------------------v-----------------------------------------------+  |
|  |                              GEOSPATIAL PROCESSING ENGINE                                   |  |
|  |  * Rasterio / GDAL Engine   : Windowed raster reads, zonal statistics, 3x3 slope convolution|  |
|  |  * WhiteboxTools (Rust GIS) : Depression breaching, D8 flow accumulation, stream networks  |  |
|  |  * GeoPandas                : Planar geometry validation, coordinate reprojection, spatial |  |
|  +---------------------------------------------------------------------------------------------+  |
+------------------------------------------------+--------------------------------------------------+
                                                 |
                                 SQLAlchemy 2 / GeoAlchemy2 / Files
                                                 |
                                                 v
+------------------------------------------------+--------------------------------------------------+
|                                      PERSISTENT STORAGE                                           |
+---------------------------------------------------------------------------------------------------+
|  * PostgreSQL 15+ & PostGIS 3.4 Spatial Database (watersheds, priority_scores, saved_plans)       |
|  * Graphify Knowledge Graph (graphify-out/): AST graph.json, 3D WebGL orbit, 2D physics network    |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Component Responsibilities

### 2.1 The 4 Frontend Steps (`frontend/src/`)
| Step / Tab | Route | Responsibility | Key Interactions |
| :--- | :--- | :--- | :--- |
| **ActiveAreaBar** | Global | Persistent top header across all screens. Displays active catchment, area in $\text{km}^2$, urgency badge, and a 4-step progress indicator. | `ResearchContext` |
| **Tab 1: Map** | `/map` | **4-Pointer Precision Boundary Selector**: Click 4 points in sequence (1: NW, 2: NE, 3: SE, 4: SW) to define any watershed AOI. Keyless basemaps (Satellite, Dark, Street, Topo), layer toggles (SRTM slope, streams, WorldCover), and live Zonal Stats HUD. | `POST /api/predict/aoi` |
| **Tab 2: Rankings** | `/rankings` | **Regional Urgency Leaderboard**: Sort and filter catchments by soil loss, bare land, and rainfall. Download DPR packages in Spreadsheet (CSV), GIS (GeoJSON), and Government (Shapefile zipped) formats. | `GET /api/rankings`, `GET /api/exports` |
| **Tab 3: Hydrology** | `/hydrology` | **Water Flow & Flood Dynamics**: 30-day rain & streamflow hydrograph with flood limit threshold, monsoon storm anomaly tracking, Topographic Wetness Index (TWI) groundwater recharge spots, and Strahler stream breakdown. | `POST /api/predict/aoi` |
| **Tab 4: Simulator** | `/simulator` | **Civil Works Planning & Live What-If**: Interactive sliders (Reforest %, Check Dams count, Contour Trenches %). Live Before vs. After score reduction, TreeSHAP explanation chart, Bill of Quantities (BoQ) in ₹ Lakhs, and 1-click DPR proposal saving. | `POST /api/predict/simulate`, `POST /api/plans` |

### 2.2 Backend Modules (`backend/app/`)
| Module | Responsibility | Key Dependencies |
| :--- | :--- | :--- |
| **`app.api.predict`** | Arbitrary AOI raster extraction, RUSLE soil loss modeling, counterfactual live slider inference, and TreeSHAP attribution. | `app.services.ml` |
| **`app.api.plans`** | CRUD operations for certified civil restoration proposals and funding DPR packages. | `app.models.SavedPlan` |
| **`app.api.rankings`** | Paginated multi-criteria screening leaderboard with priority thresholds. | `app.models.PriorityScore` |
| **`app.api.exports`** | Streaming UTF-8 CSV downloads, GeoJSON feature collections, and zipped ESRI Shapefiles. | `geopandas`, `zipfile` |
| **`app.services.ml.engine`** | Orchestrates the 4-model pipeline: XGBoost priority scorer, EA-LSTM 30-day monsoon hydrograph generator, TreeSHAP impact factor calculator, and CatBoost civil works estimator. | `numpy`, `math` |
| **`app.services.ml.feature_extractor`** | Extracts 15 continuous landscape features from DEM rasters, ESA WorldCover, and ERA5 rainfall for arbitrary GeoJSON polygons. | `numpy` |
| **`app.services.gis.hydrology_service`** | WhiteboxTools Rust hydrological conditioning: depression breaching, D8 flow accumulation, stream network extraction. | `whitebox` binary |
| **`app.services.gis.raster_service`** | GeoTIFF metadata inspection, GDAL windowed reads, zonal statistics, 3x3 Sobel slope calculation. | `rasterio`, `numpy` |
| **`app.services.gis.vector_service`** | GeoJSON/Shapefile ingestion, CRS re-projection to EPSG:4326/EPSG:3857, geometry validation and repair. | `geopandas`, `shapely` |

---

## 3. Architecture Decision Records (ADRs)

### ADR 001: 4-Step Guided Flow vs. Disconnected Dashboards
- **Context**: Government district officers and field planners need clear answers to: "Which area should we fix first, and what should we build there?" Prior 8-tab dashboards were fragmented and required training.
- **Decision**: Consolidate the entire user journey into **4 connected steps** (Map $\to$ Rankings $\to$ Hydrology $\to$ Simulator) unified by a persistent `ActiveAreaBar` and friendly locked-tab banners.
- **Consequence**: Non-technical planners can complete an end-to-end DPR proposal in one short session without technical GIS training.

### ADR 002: 4-Pointer Precision Boundary Placement
- **Context**: Drawing complex freeform polygons on mobile tablets in the field is error-prone and often causes self-intersecting geometries.
- **Decision**: Implement a 4-point sequential corner placement protocol (1: NW $\to$ 2: NE $\to$ 3: SE $\to$ 4: SW) with dashed live boundary lines, coordinate badges, drag adjustments, and an Undo stack.
- **Consequence**: Guaranteed valid topological polygons with 0 self-intersections, instant server-side extraction, and intuitive mobile tablet operation.

### ADR 003: Deterministic AST Knowledge Graph (Graphify)
- **Context**: Complex codebases suffer from context fragmentation when AI agents or new developers navigate across GIS services, ML models, and React contexts.
- **Decision**: Integrate **Graphify** (`graphifyy`) to build a deterministic AST knowledge graph (919 nodes, 1,816 edges, 53 communities) with WebGL 3D visualization (`graph_3d.html`), 2D physics map (`graph.html`), and automatic git hooks.
- **Consequence**: Instant architectural navigation, zero LLM token cost for code mapping, and automated sync on commits.
