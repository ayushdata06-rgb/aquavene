# AquaVane Geospatial Data Pipeline & ML Architecture

AquaVane combines an **offline batch GIS ETL pipeline** (SRTM 30m DEM, Copernicus ERA5-Land, ESA WorldCover 10m) with a **real-time ML prediction engine** capable of processing arbitrary user-drawn boundaries and live what-if counterfactual simulations.

---

## 1. Dual Processing Architecture

```text
===================================================================================================
1. OFFLINE BATCH GIS ETL PIPELINE (Environmental Harmonization)
===================================================================================================

  [ SRTM 30m DEM ]      [ Copernicus ERA5-Land ]      [ ESA WorldCover 10m ]
         |                         |                             |
         v                         v                             v
  preprocess_dem.py       preprocess_rainfall.py       preprocess_landcover.py
  (Slope & Elevation)     (m -> mm Aggregations)       (Degraded Bare Land %)
         |                         |                             |
         v                         |                             |
  derive_hydrology.py              |                             |
  (WhiteboxTools Rust)             |                             |
         |                         |                             |
         +-------------------------+-----------------------------+
                                   |
                                   v
                   calculate_watershed_indicators.py
                   (Zonal Statistics & Normalization)
                                   |
                                   v
             [ PostGIS Database: watersheds & priority_scores ]


===================================================================================================
2. REAL-TIME ONLINE ML PIPELINE (<10ms Response Time)
===================================================================================================

  [ 4-Point Custom Polygon (MapTab) ]
                 |
                 v
       [ AOIFeatureExtractor ] ---> Extracts 15 Continuous Geo-Variables
                 |
                 +-----------> [ XGBoost Scorer ] -------------> Restoration Urgency (0-100)
                 +-----------> [ RUSLE Engine ] ---------------> Soil Loss (t/ha/yr)
                 +-----------> [ EA-LSTM Simulator ] ----------> 30-Day Monsoon Hydrograph
                 +-----------> [ TreeSHAP Attributor ] --------> Feature Impact Breakdown
                 +-----------> [ CatBoost Prescriptor ] -------> Civil BoQ & Budget in ₹ Lakhs
                                                                        |
                                                                        v
  [ Intervention Sliders (SimulatorTab) ]                           Active Area
                 |                                                      |
                 v                                                      v
  [ Counterfactual Simulation Engine ] ------------------------> [ SavedPlan (DPR) ]
  (Instant Score & Soil Loss Reduction)                           (Persisted Proposal)
```

---

## 2. Real-Time ML Engine Components (`app/services/ml/`)

| Model / Component | Purpose | Technical Logic |
| :--- | :--- | :--- |
| **`AOIFeatureExtractor`** | Feature Extraction | Extracts 15 continuous geo-environmental variables from the drawn boundary: mean slope, max slope, elevation relief, TWI index, bare soil %, tree cover %, rainfall 30d sum, monsoon storm p95, drainage density, and stream order. |
| **XGBoost Scorer** | Urgency Classification | Predicts priority score ($0-100$) and categorizes urgency (`Critical`, `High`, `Moderate`, `Low`). Calibrated against synthetic agro-climatic basins. |
| **RUSLE Soil Engine** | Soil Loss Estimation | Predicts annual soil washed away in tonnes per hectare ($t/ha/yr$) via $A = R \times K \times LS \times C \times P$. |
| **EA-LSTM Hydrograph** | 30-Day Flow Prediction | Models daily monsoon stream discharge ($m^3/s$) against stream flood limits, generating alert banners when flood limits are breached. |
| **TreeSHAP Attributor** | Feature Explainability | Explains why the catchment received its urgency score (e.g. +26.4 pts from steep slopes, +22.1 pts from bare soil, -6.8 pts buffer from tree cover). |
| **CatBoost Prescriptor** | Civil Works BoQ & Budget | Determines physical quantities and budgets in ₹ Lakhs for Continuous Contour Trenches (CCT), Cascading Check Dams, Farm Ponds, and Ridge Afforestation. |

---

## 3. The 5 Core Environmental Indicators

1. **Erosion Potential ($I_1$)**: RUSLE proxy modeling soil detachment risk from slope length and steepness ($LS$), rainfall aggressiveness ($R$), and bare ground fraction ($C$).
2. **Runoff Potential ($I_2$)**: Rational method proxy combining slope, imperviousness, and WhiteboxTools stream drainage density.
3. **Land-Cover Degradation ($I_3$)**: Proportion of degraded, built, and bare land relative to total area.
4. **Rainfall Pressure ($I_4$)**: Copernicus ERA5-Land monthly precipitation converted from meters to millimeters ($mm = m \times 1000$) with monsoon seasonality index.
5. **Downstream Exposure ($I_5$)**: Downstream population density and settlement vulnerability at stream pour-points.

---

## 4. Offline Batch CLI Scripts (`backend/scripts/`)

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Inspect Datasets** | `python -m scripts.inspect_datasets --data-dir ./data` | Validates CRS, spatial overlap, resolution, bounds, and nodata flags. |
| **Preprocess DEM** | `python -m scripts.preprocess_dem --input dem.tif --output processed_dem.tif` | Re-projects to UTM/WGS84, computes 3x3 Sobel slope in degrees. |
| **Derive Hydrology** | `python -m scripts.derive_hydrology --dem processed_dem.tif --out-dir ./hydro` | Runs WhiteboxTools depression breaching, D8 flow accumulation, and stream network extraction. |
| **Seed Dev Data** | `python -m scripts.seed_dev_data` | Generates 15 Western Ghats micro-watersheds with complete indicators and baseline scoring for instant development. |
