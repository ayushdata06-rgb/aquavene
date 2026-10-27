# AquaVane — Watershed Restoration Prioritisation & Decision-Support Platform

AquaVane is a production-grade geospatial decision-support web application that empowers environmental planners, hydrologists, and policy makers to prioritize micro-watersheds for ecological restoration using high-resolution terrain, rainfall, land cover, drainage characteristics, and downstream settlement exposure.

> [!IMPORTANT]
> **Decision-Support Notice**: AquaVane is designed as a macro-to-meso scale screening and prioritisation tool. It is intended to guide resource allocation and target field reconnaissance, **not** to substitute for detailed on-ground civil engineering design or calibrated physical process modelling. For detailed caveats, see [docs/limitations.md](docs/limitations.md).

---

## Key Capabilities & Features

The web application provides eight purpose-built interactive tabs:

1. **Overview Dashboard**: High-level KPIs, critical watershed alerts, priority tier distribution charts, and data warnings.
2. **Watershed Explorer**: Full-screen interactive Leaflet map rendering PostGIS vector boundaries, priority color-coding, bounding box zoom, search filter, and instant watershed property tooltips.
3. **Priority Rankings**: Paginated, sortable leaderboard with composite restoration scores, risk categories, data completeness ratios, and an interactive mathematical formula disclosure drawer.
4. **Indicator Analysis**: Multi-indicator radar profiles, cross-watershed comparisons, and distribution histograms for all 5 core restoration indicators.
5. **Rainfall & Climate**: Copernicus ERA5-Land monthly hyetographs, seasonal precipitation variation, and accumulation semantics disclaimers.
6. **Terrain & Land Cover**: SRTM 30m elevation & slope statistics, WhiteboxTools stream network extraction, and ESA WorldCover 10m class proportions.
7. **Scenario Simulator**: Real-time policy weight adjusters ($\sum w_i = 1.0$), live recalculations, score shift and rank delta waterfall charts, and sensitivity analysis.
8. **Data & Reports**: Raw dataset metadata catalogue, background ETL processing telemetry, CSV rankings download, GeoJSON vector export, and comprehensive multi-page restoration dossiers.

---

## Technology Stack

| Layer | Technology | Key Libraries |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Tailwind CSS, Leaflet, React-Leaflet, Recharts, Lucide Icons |
| **Backend** | Python 3.12+, FastAPI | SQLAlchemy 2, Alembic, Pydantic v2, ORJSON, GeoAlchemy2 |
| **Database** | PostgreSQL 15+ & PostGIS 3.4+ | Supabase PostgreSQL or local PostGIS instance |
| **Geospatial Processing** | Tri-Core Python GIS Engine | **Rasterio** (GDAL windowed I/O), **WhiteboxTools** (Rust compiled hydrology), **GeoPandas** (GEOS/Shapely spatial algebra) |
| **Climate & Data** | Scientific Data Tools | NumPy, Xarray, NetCDF4, SciPy |

---

## Directory Structure

```
aquavene/
├── frontend/                  # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── api/client.ts      # Resilient API client with Western Ghats fallback fixtures
│   │   ├── components/        # Navbar, Sidebar, Layout, MapComponent, StatCard, LoadingSkeleton
│   │   ├── tabs/              # All 8 application tabs
│   │   ├── types/             # TypeScript domain models and schemas
│   │   └── App.tsx            # Main application router and tab state
│   └── package.json
├── backend/                   # FastAPI Modular Monolith
│   ├── app/
│   │   ├── api/               # 13 REST API routes (dashboard, watersheds, rankings, etc.)
│   │   ├── models/            # 11 PostGIS SQLAlchemy models
│   │   ├── schemas/           # Pydantic v2 request/response schemas
│   │   ├── services/gis/      # Rasterio, WhiteboxTools, GeoPandas, Rainfall, LandCover services
│   │   ├── services/          # Scoring engine and Indicator calculation services
│   │   └── main.py            # FastAPI entry point
│   ├── migrations/            # Alembic PostGIS migrations
│   ├── scripts/               # CLI processing and seeding scripts
│   └── tests/                 # pytest automated test suite (27 passing tests)
└── docs/                      # Comprehensive Documentation
    ├── architecture.md        # System architecture, ADRs & Mermaid diagrams
    ├── database.md            # PostGIS schema, ER diagram & spatial queries
    ├── data_pipeline.md       # Geospatial ETL pipeline, WhiteboxTools & indicators
    ├── api.md                 # Complete REST API reference with JSON payloads
    └── limitations.md         # Scientific caveats, resolution mismatch & MAUP
```

---

## Quick Start & Local Setup

### 1. Prerequisites
- **Python 3.12+**
- **Node.js 18+** & **npm**
- **PostgreSQL 15+** with **PostGIS 3.3+** (or a free Supabase project)

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL/Supabase connection string
```

#### Run Database Migrations
```bash
alembic upgrade head
```

#### Seed Development Data
Generate 15 realistic Western Ghats / Deccan micro-watersheds with complete indicators and baseline scoring:
```bash
python -m scripts.seed_dev_data
```

#### Start FastAPI Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Interactive ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend web application will launch at [http://localhost:5173](http://localhost:5173).

> **Offline / Resilient Mode**: If the backend database is initializing or running in offline mode, the frontend automatically falls back to built-in high-fidelity fixtures of 15 Western Ghats micro-watersheds. The interface never crashes or displays blank screens.

---

## Automated Testing

The backend includes a comprehensive pytest suite covering GIS operations, indicator normalization, scoring arithmetic, and API routes:

```bash
cd backend
python -m pytest tests/ -v
```

All 27 unit and integration tests pass:
- `tests/test_scoring.py`: Exact formula evaluation, linear weight constraint ($\sum w_i = 1.0$), missing data redistribution.
- `tests/test_indicators.py`: Normalization boundaries, USLE proxy, Rational proxy, WorldCover degradation fraction, ERA5-Land rainfall pressure, downstream exposure.
- `tests/test_gis.py`: Rasterio synthetic DEM generation, 3x3 slope convolution, WhiteboxTools hydrology conditioning, NetCDF precipitation extraction.
- `tests/test_api.py`: FastAPI route integration tests, ORJSON responses, GeoJSON serialization, CSV downloads.

---

## Production Build

To compile an optimized production frontend bundle:
```bash
cd frontend
npm run build
```
This produces a minified, tree-shaken static bundle in `frontend/dist/` ready to be served by FastAPI, Nginx, or any CDN.

---

## Detailed Documentation Links

- [System Architecture & ADRs](docs/architecture.md)
- [Database Schema & Spatial Queries](docs/database.md)
- [Geospatial Data Pipeline & Indicators](docs/data_pipeline.md)
- [REST API Reference](docs/api.md)
- [Methodological Limitations & Scientific Disclaimers](docs/limitations.md)

---

## License

MIT License. Designed and engineered for transparent watershed restoration and ecological decision support.
