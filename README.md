# AquaVane — Watershed Restoration Planning & Prioritisation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4+-336791.svg?logo=postgresql&logoColor=white)](https://postgis.net)
[![WhiteboxTools](https://img.shields.io/badge/WhiteboxTools-Rust_GIS-CE422B.svg)](https://www.whiteboxgeo.com)
[![Pytest Suite](https://img.shields.io/badge/Tests-35%20Passed-4caf50.svg)](file:///d:/aquavene/backend/tests)

**AquaVane** is a geospatial decision-support web application that helps government district officers, field engineers, and NGO planners prioritize micro-watersheds for soil and water restoration, plan civil engineering works, and export Detailed Project Reports (DPRs) for funding proposals.

The platform answers two critical questions in minutes:
> **1. Which watershed area should we fix first?**  
> **2. What specific civil interventions should we build there, and how much will they cost?**

---

## Guided 4-Step User Journey

The entire application is organized into a connected 4-step workflow. A persistent **Active Area Bar** sits at the top of every screen, keeping all steps in sync with the selected catchment:

```
Step 1: Choose Area  ───>  Step 2: See Priority  ───>  Step 3: Understand Water  ───>  Step 4: Plan & Export
    (MapTab)                   (RankingsTab)                 (HydrologyTab)                 (SimulatorTab)
```

| Step | Screen | Route | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **1** | [**Map**](file:///d:/aquavene/frontend/src/tabs/MapTab.tsx) | `/map` | **4-Pointer Precision Boundary Selector**: Click 4 corners (1: NW $\to$ 2: NE $\to$ 3: SE $\to$ 4: SW) with dashed live boundary lines, coordinate badges, drag adjustment, and undo. Keyless basemaps (Satellite, Dark, Street, Topographic), layer toggles (SRTM slope, streams, WorldCover), and live Zonal Stats HUD. |
| **2** | [**Rankings**](file:///d:/aquavene/frontend/src/tabs/RankingsTab.tsx) | `/rankings` | **Regional Screening Matrix**: Benchmark the chosen area against regional catchments. Plain-language problem tags ("Steep slopes", "High runoff", "Severe bare soil"). 1-click downloads for Spreadsheet (CSV), GIS (GeoJSON), and Government (Shapefile zipped). |
| **3** | [**Hydrology**](file:///d:/aquavene/frontend/src/tabs/HydrologyTab.tsx) | `/hydrology` | **Water Flow & Flood Dynamics**: 30-day rain & streamflow combo hydrograph (EA-LSTM logic) with stream flood limit thresholds, flood warning alerts, Topographic Wetness Index (TWI) groundwater recharge zones, and Strahler stream hierarchy. |
| **4** | [**Simulator**](file:///d:/aquavene/frontend/src/tabs/SimulatorTab.tsx) | `/simulator` | **Civil Works Planning & Live What-If**: Real-time (<10ms) counterfactual sliders (Reforest %, Check Dams, Continuous Contour Trenches %). Live Before vs. After score reduction, TreeSHAP explainability chart, CatBoost Bill of Quantities (BoQ) in ₹ Lakhs, and 1-click DPR proposal saving. |

---

## Plain-Language Design (Zero Jargon)

AquaVane translates complex geospatial and hydrological terminology into plain language:

| Technical Term | What AquaVane Shows | Plain Meaning |
| :--- | :--- | :--- |
| **Urgency Score** | **Restoration Urgency (0 to 100)** | How urgently the land needs soil & water conservation works |
| **RUSLE Soil Loss** | **Soil washed away per year** | Metric tonnes of topsoil lost per hectare each year ($t/ha/yr$) |
| **Runoff Potential** | **Rain runoff tendency** | Share of rainfall that flows away rapidly instead of soaking into soil |
| **Bankfull Capacity** | **Stream safe flood limit** | Maximum water volume the stream channel holds before spilling onto banks |
| **TWI Index** | **Groundwater soaking spots** | Low-lying areas where rainwater naturally pools and recharges water tables |
| **TreeSHAP Values** | **Why this score? (Factor breakdown)** | Explicit breakdown of how slope, bare soil, and rainfall drive the score |
| **CCT** | **Continuous Contour Trenches** | Hillside ditches dug along elevation contours to stop runoff and silt |
| **Check Dam** | **Cascading Stone/Gabion Dams** | Small barriers built across order 2/3 gullies to slow down water velocity |

*Every chart and metric includes a clickable info icon (`ℹ️`) explaining its meaning, units, and field significance. Built-in **Onboarding Tour** and **Glossary Modal** can be opened anytime via the **"Help & Words"** button.*

---

## 3D Architecture Diagram (Graphify)

AquaVane includes a complete **deterministic AST knowledge graph** powered by [Graphify](file:///d:/aquavene/graphify-out/):
- **Corpus**: 90 files, 45,294 words
- **Graph Metrics**: **919 nodes**, **1,816 relationships**, **53 communities**
- **Token Cost**: 0 input / 0 output (pure deterministic tree-sitter parsing)

### Visualizing the Architecture

1. [**3D WebGL Orbit Diagram (`graphify-out/graph_3d.html`)**](file:///d:/aquavene/graphify-out/graph_3d.html):
   Launch in your browser to explore the codebase in full 3D space with particle streams, orbit controls, search, and subsystem filtering:
   ```powershell
   Start-Process "d:\aquavene\graphify-out\graph_3d.html"
   ```
2. [**2D Physics Network (`graphify-out/graph.html`)**](file:///d:/aquavene/graphify-out/graph.html):
   Flat interactive node-link network with God Node inspection and cluster filters.
3. [**Mermaid Call Flow (`graphify-out/callflow.html`)**](file:///d:/aquavene/graphify-out/callflow.html):
   Structured call hierarchy and data flow across ML engines and API routes.

### CLI Graph Queries
```powershell
# Ask questions about the codebase
python -m graphify query "How does RestorationMLEngine work?"

# Find the shortest dependency path between components
python -m graphify path "RestorationMLEngine" "AOIFeatureExtractor"

# Explain a specific component and its connections
python -m graphify explain "SimulatorTab"

# Update graph after modifying code
python -m graphify update .
```

---

## Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Tailwind CSS, Leaflet (keyless free tiles), Recharts, Lucide Icons |
| **State & Flow** | React Context API | `ResearchContext` (single source of truth for active area, sliders, plans) |
| **Backend** | Python 3.12+, FastAPI | SQLAlchemy 2, Alembic, Pydantic v2, GeoAlchemy2 |
| **Restoration ML** | Hybrid 4-Model Engine | **CatBoost** (Civil BoQ & Budget), **TreeSHAP** (Attribution), **EA-LSTM** (Hydrograph), **XGBoost** (Scorer), **RUSLE** (Soil loss) |
| **Geospatial Engine** | Tri-Core Python GIS | **Rasterio** (GDAL windowed I/O), **WhiteboxTools** (Compiled Rust hydrology), **GeoPandas** (Spatial algebra & Shapefile generation) |
| **Database** | PostgreSQL 15+ & PostGIS 3.4+ | Supabase PostgreSQL or local PostGIS instance |

---

## Clean Project Structure

```text
aquavene/
├── frontend/
│   ├── src/
│   │   ├── api/client.ts              # Resilient API client with ML endpoints & offline fixtures
│   │   ├── components/
│   │   │   ├── ActiveAreaBar.tsx      # Persistent top bar with 4-step progress & active study area
│   │   │   ├── AuthModal.tsx          # Supabase / Google OAuth modal
│   │   │   ├── Layout.tsx             # Master application shell
│   │   │   ├── LockedTabBanner.tsx    # Friendly locked-step banner when no area is selected
│   │   │   ├── Navbar.tsx             # Header bar with DB status & credentials
│   │   │   ├── OnboardingModal.tsx    # 4-step welcome tour & plain-language glossary modal
│   │   │   └── Sidebar.tsx            # Collapsible 4-step guided navigation
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Session & profile state
│   │   │   └── ResearchContext.tsx    # Single source of truth connecting all 4 tabs
│   │   ├── tabs/
│   │   │   ├── MapTab.tsx             # Step 1: 4-Point Boundary Selector (/map)
│   │   │   ├── RankingsTab.tsx        # Step 2: Regional Screening Matrix (/rankings)
│   │   │   ├── HydrologyTab.tsx       # Step 3: 30-Day Rain/Flow & TWI Recharge (/hydrology)
│   │   │   └── SimulatorTab.tsx       # Step 4: CatBoost Civil Works & TreeSHAP BoQ (/simulator)
│   │   ├── types/index.ts             # Clean TypeScript domain models
│   │   ├── App.tsx                    # Route definitions (/map, /rankings, /hydrology, /simulator)
│   │   └── index.css                  # Tailwind styles & theme variables
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── predict.py             # POST /api/predict/aoi & POST /api/predict/simulate
│   │   │   ├── plans.py               # POST /api/plans & GET /api/plans (DPR proposals)
│   │   │   ├── rankings.py            # GET /api/rankings (Multi-criteria leaderboard)
│   │   │   ├── exports.py             # GET /api/exports (CSV, GeoJSON, Shapefile zip)
│   │   │   ├── watersheds.py          # GET /api/watersheds & GeoJSON boundaries
│   │   │   ├── dashboard.py           # GET /api/dashboard/summary
│   │   │   ├── datasets.py            # GET /api/datasets
│   │   │   ├── auth.py                # Supabase OAuth endpoints
│   │   │   └── health.py              # Healthcheck & GIS readiness
│   │   ├── models/models.py           # PostGIS SQLAlchemy models (Watershed, SavedPlan, PriorityScore)
│   │   ├── schemas/schemas.py         # Pydantic v2 validation models
│   │   ├── services/
│   │   │   ├── ml/
│   │   │   │   ├── engine.py          # RestorationMLEngine (XGBoost, EA-LSTM, TreeSHAP, CatBoost)
│   │   │   │   └── feature_extractor.py # AOIFeatureExtractor (15 landscape features from rasters)
│   │   │   └── gis/                   # Rasterio, WhiteboxTools, GeoPandas services
│   │   └── main.py                    # FastAPI application initialization
│   ├── tests/                         # Pytest test suite (35 passing tests)
│   └── scripts/                       # Batch GIS ETL scripts
├── graphify-out/                      # Graphify Knowledge Graph
│   ├── graph_3d.html                  # Interactive 3D WebGL Orbit Visualizer
│   ├── graph.html                     # 2D Interactive Physics Graph
│   ├── callflow.html                  # Mermaid Architecture Diagram
│   ├── GRAPH_REPORT.md                # System Architecture Report
│   └── graph.json                     # Queryable graph database
└── docs/                              # Technical Documentation
    ├── architecture.md                # System Architecture & ADRs
    ├── api.md                         # Complete REST API Reference
    ├── database.md                    # PostGIS Schema & SavedPlan Model
    ├── data_pipeline.md               # GIS ETL & Real-Time ML Pipelines
    └── limitations.md                 # Scientific Caveats, Disclaimers & Resolutions
```

---

## Quick Start & Local Setup

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**
- **PostgreSQL 15+** with **PostGIS 3.4+** (optional: app runs with built-in SQLite/fixtures if no PostgreSQL is configured)

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Offline Resilient Mode**: If the backend database is initializing, the frontend automatically falls back to built-in high-fidelity fixtures of Western Ghats micro-watersheds. The interface never crashes or displays blank screens.

---

## Automated Testing

Run the full backend test suite:
```bash
cd backend
python -m pytest tests/ -v
```
**Result**: `35 passed, 0 failed` in ~8.1 seconds.
- `tests/test_ml.py`: Tests `AOIFeatureExtractor`, `RestorationMLEngine`, `/api/predict/aoi`, and `/api/predict/simulate`.
- `tests/test_api.py`: Tests `/api/health`, `/api/dashboard/summary`, `/api/watersheds`, `/api/rankings`, CSV exports, and `/api/plans` DPR workflow.
- `tests/test_gis.py`: Tests DEM slope convolution, WhiteboxTools depression breaching, and ERA5 NetCDF parsing.
- `tests/test_scoring.py`: Tests exact formula evaluation and weight validation.
- `tests/test_indicators.py`: Tests min-max normalization and USLE proxy logic.

Check frontend TypeScript validity:
```bash
cd frontend
npm run build
```
**Result**: `✓ built in 5.3s` with **0 errors**.

---

## Step-by-Step How To Use Guide

### Step 1: Choose Your Area ([Tab 1: Map](file:///d:/aquavene/frontend/src/tabs/MapTab.tsx))
1. Go to `/map`.
2. Click **"Draw My Area"** in the map header.
3. Click 4 points in sequence on the map:
   - Point 1: **North-West corner**
   - Point 2: **North-East corner**
   - Point 3: **South-East corner**
   - Point 4: **South-West corner**
4. Dashed lines connect the points and shade the study area. Drag any corner pin to adjust.
5. Click **"Check This Area"**. AquaVane runs `POST /api/predict/aoi`, evaluates the terrain, and sets the **Active Area** across the entire application.
6. Click **"Next: See How Urgent This Area Is →"**.

### Step 2: See Priority ([Tab 2: Rankings](file:///d:/aquavene/frontend/src/tabs/RankingsTab.tsx))
1. Inspect the summary card displaying your active area's regional rank (e.g., `#2 of 15`), urgency score (`76.8 Critical`), and plain-language explanation.
2. Filter the master table by state, river basin, or problem cause.
3. Use the **"Download Report"** panel to export the data:
   - **Spreadsheet (CSV)** for budget planning.
   - **GeoJSON** for QGIS/ArcGIS mapping.
   - **Shapefile (ZIP)** for government GIS teams.
4. Click **"Next: Understand Water Flow →"**.

### Step 3: Understand Water Flow ([Tab 3: Hydrology](file:///d:/aquavene/frontend/src/tabs/HydrologyTab.tsx))
1. Review the 30-day rain and streamflow combo chart. The blue line tracks daily stream discharge against the red dashed **flood limit**.
2. Read the **Flood Alert Banner**: If runoff exceeds channel limits, specific risky dates are highlighted.
3. Inspect the **Topographic Wetness Index (TWI)** card to locate natural groundwater recharge depressions suitable for percolation tanks.
4. Review the **Stream Size Hierarchy** (Levels 1–2 for silt traps, Levels 3–4 for check dams, Level 5 for main river flood embankments).
5. Click **"Next: Plan Civil Works & Test Ideas →"**.

### Step 4: Plan Civil Works & Export DPR ([Tab 4: Simulator](file:///d:/aquavene/frontend/src/tabs/SimulatorTab.tsx))
1. **Review Current Problem**: See baseline soil washed away ($32.4\text{ t/ha/yr}$) and urgency score ($76.8\text{ Critical}$).
2. **Review Recommended Works (BoQ)**: CatBoost automatically calculates required civil structures (Continuous Contour Trenches, Gabion Check Dams, Percolation Tanks, Afforestation) with estimated budget in **₹ Lakhs**.
3. **Test What-If Ideas**: Move the 3 interactive sliders:
   - *Add plant cover to bare soil (%)*
   - *Build stone check dams (count)*
   - *Add contour trenches on slopes (%)*
4. Watch the score and soil loss drop in real time (<10ms).
5. Inspect the **TreeSHAP Factor Breakdown** to verify which interventions drove the largest score reduction.
6. Click **"Save Restoration Plan"** to store the proposal in the database for funding proposals.
