# AquaVane — Watershed Restoration Planning & Prioritisation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.4+-336791.svg?logo=postgresql&logoColor=white)](https://postgis.net)
[![WhiteboxTools](https://img.shields.io/badge/WhiteboxTools-Rust_GIS-CE422B.svg)](https://www.whiteboxgeo.com)
[![Pytest Suite](https://img.shields.io/badge/Tests-35%20Passed-4caf50.svg)](backend/tests)

**AquaVane** is a geospatial decision-support platform designed for watershed planners, engineers, and restoration teams. When a user defines any catchment boundary (4 points or regional preset), AquaVane scans live open APIs, calculates physical D8 stream networks, diagnoses historical flood/drought risks, and generates a field-ready 5-pillar restoration plan with MGNREGA-aligned budgets.

---

### End-to-End System Architecture

```
                      +------------------------------------------+
                      |         USER INTERACTION (LEAFLET)       |
                      |  - Draw 4-point AOI on OpenStreetMap     |
                      |  - Or 1-click Preset Catchment selector  |
                      |    (Kali, Bhagirathi, Narmada, Palar)    |
                      +--------------------+---------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------+
|                               BACKEND GIS & ML ENGINE                              |
|                                                                                    |
|  [OSM Nominatim]      [Wikipedia GeoSearch]      [Open-Meteo & Open-Elevation]     |
|   Locality, District,  Local Floods, Droughts,    30-Day Precipitation Series,     |
|   State, River Basin   Historical Water Memory    DEM Elevation Relief & Slope     |
|                                                                                    |
|  [WhiteboxTools & GeoPandas D8 Engine]           [XGBoost & Restoration Planner]   |
|   - D8 Flow Accumulation Vectors                  - TreeSHAP Priority Scoring      |
|   - Strahler Stream Orders (1, 2, 3)              - 5-Pillar Restoration Levers    |
|   - Longitudinal Stream Elevation Profile         - MGNREGA / SoR Bill of Quantity |
+------------------------------------------+-----------------------------------------+
                                           |
                                           v
+------------------------------------------------------------------------------------+
|                         FRONTEND 8-TAB INTERACTIVE UI/UX                           |
|                                                                                    |
|  Tab 1: Map & Draw      ==> 60 FPS Streams, D8 Arrows, Rain Dial, Elevation Tray   |
|  Tab 2: History & News  ==> Wikipedia Water Articles, 4-Era Catchment Timeline    |
|  Tab 3: Terrain         ==> Longitudinal Elevation Bed Profile, Whitebox TWI & SPI |
|  Tab 4: Forest & Trees  ==> 3-Tier Riparian Buffer Designer, Water Cooling (-°C)  |
|  Tab 5: Streams & Fish  ==> Incised vs Bio-Bank Cross-Section, Fishway Reconnect  |
|  Tab 6: Farms & Roads   ==> Dirt Road Water Bars, Broad-Based Dips, Cover Crops    |
|  Tab 7: Simulator       ==> Dynamic Hydrograph Flattening, Soil Loss Reduction %   |
|  Tab 8: Plan & Budget   ==> Itemized Schedule of Rates (BoQ), 3-Yr Gantt & CSV/JSON|
+------------------------------------------------------------------------------------+
```

---

## 8-Tab Guided Restoration Flow

| Tab | Name | Route | What It Delivers |
| :--- | :--- | :--- | :--- |
| **1** | [**Map & Draw**](frontend/src/tabs/MapTab.tsx) | `/map` | **Interactive Leaflet GIS**: 4-point precision polygon drawing, 100% keyless OpenStreetMap tiles, 60 FPS animated streams, D8 flow vectors, storm rain dial, and expandable longitudinal elevation profile. |
| **2** | [**History & News**](frontend/src/tabs/HistoryTab.tsx) | `/history` | **Local Water Chronology**: Real Wikipedia GeoSearch articles within 15 km, 4-era timeline (Pre-1980s to Present), and climate anomaly breakdown. |
| **3** | [**Terrain & Health**](frontend/src/tabs/TerrainHealthTab.tsx) | `/terrain` | **Biophysical Diagnosis**: Longitudinal bed elevation profile (Summit to Outlet), Whitebox TWI/SPI indices, 30-day precipitation series, and TreeSHAP drivers. |
| **4** | [**Forest & Trees**](frontend/src/tabs/ReforestationTab.tsx) | `/reforest` | **Pillar 1**: Multi-tier hillside afforestation, riparian buffer designer (cooling stream water by up to -2.4°C and trapping 90% of field sediment). |
| **5** | [**Streams & Fish**](frontend/src/tabs/StreamsWetlandsTab.tsx) | `/streams` | **Pillars 2 & 3**: Bioengineered stream banks (coir geotextiles & large woody debris), floodplain reconnection, and fish barrier removal unlocking upstream habitat. |
| **6** | [**Farms & Roads**](frontend/src/tabs/FarmsRoadsTab.tsx) | `/land-roads` | **Pillars 4 & 5**: Dirt road water bars and broad-based dips stopping sediment bleed, regenerative cover crops (Sunnhemp, Cowpea), and percolation ponds. |
| **7** | [**Simulator**](frontend/src/tabs/SimulatorTab.tsx) | `/simulator` | **Interactive What-If Sandbox**: Move 5 restoration sliders and watch the storm hydrograph flatten below the flood danger line while soil loss drops. |
| **8** | [**Plan & Budget**](frontend/src/tabs/PlanBudgetTab.tsx) | `/plan` | **Detailed Project Report (DPR)**: Itemized MGNREGA / State Forest Schedule of Rates Bill of Quantities (BoQ), 3-year implementation roadmap, and CSV/JSON export. |

---

## The 5 Real-World Restoration Pillars

1. **Reforestation & Vegetation**:
   Planting native trees (Jamun, Arjun, Bamboo) and Vetiver grass contour hedges to hold topsoil, filter agrochemical runoff, and cool water temperatures.
2. **Stream & Wetland Repair**:
   Reconnecting rivers to natural floodplains, stabilizing crumbling cut-banks with coir geotextiles, and keying in Large Woody Debris (LWD) root-wads to create deep resting pools.
3. **Removing Barriers for Migratory Fish**:
   Taking out obsolete silted weirs and retrofitting choked road culverts with rock-ramp fishways so native fish (e.g. Golden Mahseer, Snow Trout) can migrate upstream.
4. **Erosion & Dirt Road Control**:
   Installing $30^\circ$ skewed water bars and broad-based dips across unpaved agricultural tracks to deflect storm runoff into vegetated ditch turnouts before sediment washes into streams.
5. **Better Land Management**:
   Partnering with watershed farmers to plant post-harvest legume cover crops, adopt reduced tillage, and excavate community percolation ponds for groundwater recharge.

---

## Live Zero-Mock Ingestion Pipeline

All metrics are derived in real time from physical algorithms and keyless open APIs:

- **Reverse Geocoding**: OpenStreetMap Nominatim (`/reverse`) resolves administrative boundaries and river basins.
- **Ecological Memory**: Wikipedia GeoSearch API (`list=geosearch&gsradius=15000`) retrieves documented local reservoirs, rivers, and water challenges.
- **Precipitation**: Open-Meteo ECMWF API streams daily rainfall series and monsoon storm peaks ($P_{95}$).
- **Hydrological Physics**: GeoPandas, Shapely, and WhiteboxTools compute Strahler stream orders (1, 2, 3), D8 steepest descent vectors, and longitudinal elevation profiles.

---

## Cloud Deployment

### 1. Backend on Render

The backend is configured via [`render.yaml`](render.yaml):

1. In [Render Dashboard](https://dashboard.render.com/), click **New +** $\rightarrow$ **Web Service**.
2. Connect `ayushdata06-rgb/aquavene`.
3. Set the following:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Environment Variables:
   - `PYTHON_VERSION`: `3.12.7`
   - `APP_ENV`: `production`
   - `DEBUG`: `false`
   - `ALLOWED_ORIGINS`: `http://localhost:5173,https://*.vercel.app`

### 2. Frontend on Vercel

The frontend is configured via [`frontend/vercel.json`](frontend/vercel.json):

1. In [Vercel](https://vercel.com/), click **Add New...** $\rightarrow$ **Project**.
2. Import `ayushdata06-rgb/aquavene`.
3. Set **Root Directory** to `frontend`.
4. Environment Variables:
   - `VITE_API_URL`: `https://<YOUR-RENDER-SERVICE-NAME>.onrender.com`
5. Click **Deploy**.

---

## Local Development

### Backend
```powershell
cd d:\aquavene\backend
python -m uvicorn app.main:app --reload --port 8000
```
API Documentation: `http://localhost:8000/docs`

### Frontend
```powershell
cd d:\aquavene\frontend
npm run dev
```
Development Server: `http://localhost:5173`

### Verification
```powershell
# Run Pytest Suite (35 tests)
python -m pytest backend/tests/ -v

# Run Frontend Production Build
cd frontend; npm run build

# Update Knowledge Graph
graphify update .
```
