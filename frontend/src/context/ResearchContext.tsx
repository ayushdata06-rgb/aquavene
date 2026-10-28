import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  ActiveArea,
  CounterfactualSimulationResult,
  HydrographPoint,
  PriorityCategory,
  PriorityScore,
  SavedPlan,
  Watershed,
} from '../types';
import { api, FIXTURE_RANKINGS, FIXTURE_WATERSHEDS } from '../api/client';

export interface FourPointMarker {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

interface ResearchContextType {
  activeArea: ActiveArea | null;
  isAreaSelected: boolean;
  activeStep: 1 | 2 | 3 | 4;
  setActiveStep: (step: 1 | 2 | 3 | 4) => void;
  fourPoints: FourPointMarker[];
  setFourPoints: React.Dispatch<React.SetStateAction<FourPointMarker[]>>;
  addFourPoint: (lat: number, lon: number) => void;
  updateFourPoint: (id: number, lat: number, lon: number) => void;
  removeLastFourPoint: () => void;
  clearFourPoints: () => void;
  analyzeFourPointsAOI: (pts?: FourPointMarker[], customName?: string) => Promise<ActiveArea>;
  selectWatershed: (ws: Watershed | PriorityScore) => Promise<void>;
  loadSampleArea: () => void;
  clearActiveArea: () => void;
  sliderValues: { reforest_pct: number; check_dams: number; cct_pct: number };
  setSliderValues: React.Dispatch<React.SetStateAction<{ reforest_pct: number; check_dams: number; cct_pct: number }>>;
  resetSliders: () => void;
  simulatedResult: CounterfactualSimulationResult | null;
  savedPlans: SavedPlan[];
  saveCurrentPlan: (planName?: string) => SavedPlan;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  showGlossary: boolean;
  setShowGlossary: (show: boolean) => void;
  isSimulating: boolean;
  isAnalyzing: boolean;
}

const ResearchContext = createContext<ResearchContextType | undefined>(undefined);

const STORAGE_ACTIVE_KEY = 'aquavene_research_active_area';
const STORAGE_SLIDERS_KEY = 'aquavene_research_sliders';
const STORAGE_PLANS_KEY = 'aquavene_research_saved_plans';
const STORAGE_TOUR_KEY = 'aquavene_tour_completed';

export const SAMPLE_AREA: ActiveArea = {
  id: 'sample-ws-001',
  name: 'Upper Kali Catchment',
  code: 'WS-KA-001',
  district: 'Uttara Kannada',
  state: 'Karnataka',
  area_sq_km: 42.5,
  score: 76.8,
  category: 'Critical',
  soil_loss_t_ha_yr: 32.4,
  bare_soil_pct: 34.5,
  plant_cover_pct: 65.5,
  relief_m: 540.0,
  slope_deg: 17.8,
  rainfall_30d_mm: 360.0,
  rainfall_anomaly_pct: 42.0,
  monsoon_storm_p95: 92.0,
  drainage_density: 2.15,
  rank_text: '#1 of 15 catchments',
  main_problem: 'Steep hillside slopes (17.8°) & exposed topsoil',
  bounds: [74.30, 15.10, 74.42, 15.22],
  coordinates: [
    [15.10, 74.30],
    [15.20, 74.32],
    [15.22, 74.40],
    [15.12, 74.42],
  ],
  fourPoints: [
    { id: 1, name: 'P1 (North-West)', lat: 15.22, lon: 74.30 },
    { id: 2, name: 'P2 (North-East)', lat: 15.22, lon: 74.42 },
    { id: 3, name: 'P3 (South-East)', lat: 15.10, lon: 74.42 },
    { id: 4, name: 'P4 (South-West)', lat: 15.10, lon: 74.30 },
  ],
  hydrograph: Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const rain = day === 18 ? 85.0 : day === 19 ? 52.0 : (Math.sin(day / 3) + 1) * 12.0;
    return {
      day: `Day ${day}`,
      rainfall_mm: Math.round(rain * 10) / 10,
      discharge_m3s: Math.round(((rain * 42.5 * 0.42) / 3.6) * 10) / 10,
      flood_alert_threshold: 45.0,
    };
  }),
  peak_discharge_m3s: 48.2,
  flood_alert_days: 2,
  most_risky_day: 'Day 18',
  prescribed_interventions: [
    {
      title: 'Continuous Contour Trenches (CCT)',
      type: 'contour_trenching',
      quantity: '34.2 km along hillside contours',
      target_zone: 'Slopes > 12° with exposed red soil',
      estimated_cost_lakhs_inr: 95.8,
      impact: 'Holds back rushing rainwater and helps water soak 35% deeper into the soil.',
      coordinates: [15.155, 74.345],
    },
    {
      title: 'Cascading Stone Check Dams',
      type: 'check_dams',
      quantity: '8 small stone walls',
      target_zone: 'Order 2 and 3 stream junctions',
      estimated_cost_lakhs_inr: 12.8,
      impact: 'Traps ~3,600 tonnes of fertile mud and charges nearby drinking water wells.',
      coordinates: [15.146, 74.353],
    },
    {
      title: 'Community Percolation Ponds',
      type: 'farm_ponds',
      quantity: '3 storage ponds',
      target_zone: 'Low farm spots where water collects',
      estimated_cost_lakhs_inr: 6.6,
      impact: 'Saves monsoon rainwater for dry winter crop watering and farm livestock.',
      coordinates: [15.153, 74.358],
    },
    {
      title: 'Native Hillside Tree Planting & Vetiver Grass',
      type: 'afforestation',
      quantity: '42.0 hectares',
      target_zone: 'Upper bare hill crests',
      estimated_cost_lakhs_inr: 27.3,
      impact: 'Deep plant roots anchor the soil permanently and absorb carbon.',
      coordinates: [15.143, 74.344],
    },
  ],
  estimated_budget_lakhs_inr: 142.5,
  shap_drivers: [
    { feature_key: 'mean_slope_deg', label: 'Steep Slopes', description: '17.8° average hillside steepness', impact_pts: 26.4, is_aggravating: true },
    { feature_key: 'bare_soil_pct', label: 'Bare Topsoil', description: '34.5% open soil without plant cover', impact_pts: 22.1, is_aggravating: true },
    { feature_key: 'rainfall_anomaly_pct', label: 'Unusual Monsoon Rain', description: '+42% more rain than 30-year normal', impact_pts: 14.8, is_aggravating: true },
    { feature_key: 'drainage_density_km_km2', label: 'Gully Drainage Network', description: '2.15 km/km² heavy natural stream gullies', impact_pts: 9.5, is_aggravating: true },
    { feature_key: 'tree_cover_pct', label: 'Forest Buffer Protection', description: '18.2% existing tree canopy shield', impact_pts: -6.8, is_aggravating: false },
  ],
  isCustom: false,
};

export const ResearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeArea, setActiveAreaState] = useState<ActiveArea | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  const [fourPoints, setFourPoints] = useState<FourPointMarker[]>(() => {
    if (activeArea?.fourPoints && activeArea.fourPoints.length === 4) {
      return activeArea.fourPoints;
    }
    return [];
  });

  const [sliderValues, setSliderValues] = useState<{ reforest_pct: number; check_dams: number; cct_pct: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SLIDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { reforest_pct: 15, check_dams: 4, cct_pct: 25 };
  });

  const [simulatedResult, setSimulatedResult] = useState<CounterfactualSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLANS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(STORAGE_TOUR_KEY);
    } catch {
      return true;
    }
  });

  const [showGlossary, setShowGlossary] = useState(false);

  // Save active area to localStorage whenever it changes
  useEffect(() => {
    try {
      if (activeArea) {
        localStorage.setItem(STORAGE_ACTIVE_KEY, JSON.stringify(activeArea));
      } else {
        localStorage.removeItem(STORAGE_ACTIVE_KEY);
      }
    } catch {}
  }, [activeArea]);

  // Save sliders
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SLIDERS_KEY, JSON.stringify(sliderValues));
    } catch {}
  }, [sliderValues]);

  // Automatically run counterfactual simulation whenever sliders or active area change
  useEffect(() => {
    let isCurrent = true;
    if (!activeArea) {
      setSimulatedResult(null);
      return;
    }

    const runSimulation = async () => {
      setIsSimulating(true);
      try {
        const payload = {
          base_features: {
            mean_slope_deg: activeArea.slope_deg,
            bare_soil_pct: activeArea.bare_soil_pct,
            tree_cover_pct: activeArea.plant_cover_pct,
            elevation_relief_m: activeArea.relief_m,
            twi_index: 7.2,
            cropland_pct: Math.max(5, 100 - activeArea.bare_soil_pct - activeArea.plant_cover_pct),
            rainfall_30d_mm: activeArea.rainfall_30d_mm,
            rainfall_anomaly_pct: activeArea.rainfall_anomaly_pct,
            monsoon_storm_p95: activeArea.monsoon_storm_p95,
            drainage_density_km_km2: activeArea.drainage_density,
            stream_order_max: 3,
            dist_to_major_river_km: 2.8,
            original_score: activeArea.score,
          },
          reforest_bare_soil_pct: sliderValues.reforest_pct,
          add_check_dams_count: sliderValues.check_dams,
          cct_ridge_coverage_pct: sliderValues.cct_pct,
        };

        const res = await api.simulateCounterfactual(payload);
        if (isCurrent) setSimulatedResult(res);
      } catch (err) {
        console.warn('Simulation failed:', err);
      } finally {
        if (isCurrent) setIsSimulating(false);
      }
    };

    runSimulation();
    return () => {
      isCurrent = false;
    };
  }, [activeArea?.id, activeArea?.score, sliderValues.reforest_pct, sliderValues.check_dams, sliderValues.cct_pct]);

  const addFourPoint = (lat: number, lon: number) => {
    if (fourPoints.length >= 4) return;
    const labels = ['P1 (North-West)', 'P2 (North-East)', 'P3 (South-East)', 'P4 (South-West)'];
    const nextIdx = fourPoints.length;
    const newPt: FourPointMarker = {
      id: nextIdx + 1,
      name: labels[nextIdx] || `P${nextIdx + 1}`,
      lat: Math.round(lat * 100000) / 100000,
      lon: Math.round(lon * 100000) / 100000,
    };
    setFourPoints((prev) => [...prev, newPt]);
  };

  const updateFourPoint = (id: number, lat: number, lon: number) => {
    setFourPoints((prev) =>
      prev.map((p) => (p.id === id ? { ...p, lat: Math.round(lat * 100000) / 100000, lon: Math.round(lon * 100000) / 100000 } : p))
    );
  };

  const removeLastFourPoint = () => {
    setFourPoints((prev) => prev.slice(0, prev.length - 1));
  };

  const clearFourPoints = () => {
    setFourPoints([]);
  };

  const analyzeFourPointsAOI = async (pts?: FourPointMarker[], customName?: string): Promise<ActiveArea> => {
    const pointsToUse = pts || fourPoints;
    if (pointsToUse.length !== 4) {
      throw new Error('Please select all 4 corner points on the map first.');
    }

    setIsAnalyzing(true);
    try {
      // Build GeoJSON Polygon: [lon, lat] pairs closing the ring
      const coordinates = [
        [pointsToUse[0].lon, pointsToUse[0].lat],
        [pointsToUse[1].lon, pointsToUse[1].lat],
        [pointsToUse[2].lon, pointsToUse[2].lat],
        [pointsToUse[3].lon, pointsToUse[3].lat],
        [pointsToUse[0].lon, pointsToUse[0].lat],
      ];

      const geojson = {
        type: 'Polygon',
        coordinates: [coordinates],
      };

      const name = customName || `Study Area (${pointsToUse[0].lat.toFixed(2)}°N, ${pointsToUse[0].lon.toFixed(2)}°E)`;
      const res = await api.predictAOI(geojson, name);

      const f = res.features;
      const lons = pointsToUse.map((p) => p.lon);
      const lats = pointsToUse.map((p) => p.lat);

      const riskyDaysCount = res.hydrograph.filter((h) => h.discharge_m3s > h.flood_alert_threshold).length;
      const peakDay = res.hydrograph.reduce((max, h) => (h.discharge_m3s > max.discharge_m3s ? h : max), res.hydrograph[0]);

      const newArea: ActiveArea = {
        id: `custom-aoi-${Date.now()}`,
        name: res.name || name,
        code: 'AOI-CUSTOM-4PT',
        district: 'Selected Region',
        state: 'India',
        area_sq_km: f.area_sq_km,
        score: res.score,
        category: res.category,
        soil_loss_t_ha_yr: res.soil_loss_t_ha_yr,
        bare_soil_pct: f.bare_soil_pct,
        plant_cover_pct: f.tree_cover_pct,
        relief_m: f.elevation_relief_m,
        slope_deg: f.mean_slope_deg,
        rainfall_30d_mm: f.rainfall_30d_mm,
        rainfall_anomaly_pct: f.rainfall_anomaly_pct,
        monsoon_storm_p95: f.monsoon_storm_p95,
        drainage_density: f.drainage_density_km_km2,
        rank_text: res.score >= 75 ? 'Critical restoration priority' : res.score >= 60 ? 'High restoration priority' : 'Moderate restoration priority',
        main_problem: f.mean_slope_deg > 14 ? `Steep hills (${f.mean_slope_deg}° slope)` : f.bare_soil_pct > 30 ? `Unprotected bare topsoil (${f.bare_soil_pct}%)` : `Monsoon runoff pressure (${f.rainfall_30d_mm}mm)`,
        bounds: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
        coordinates: pointsToUse.map((p) => [p.lat, p.lon]),
        fourPoints: pointsToUse,
        hydrograph: res.hydrograph,
        peak_discharge_m3s: res.peak_discharge_m3s,
        flood_alert_days: riskyDaysCount,
        most_risky_day: peakDay ? peakDay.day : 'Day 18',
        prescribed_interventions: res.prescribed_interventions,
        estimated_budget_lakhs_inr: res.estimated_budget_lakhs_inr,
        shap_drivers: res.shap_drivers,
        isCustom: true,
      };

      setActiveAreaState(newArea);
      return newArea;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectWatershed = async (ws: Watershed | PriorityScore) => {
    setIsAnalyzing(true);
    try {
      const ranking = FIXTURE_RANKINGS.find((r) => r.watershed_id === ws.id || r.watershed_code === ws.watershed_code) || FIXTURE_RANKINGS[0];
      const centroid = ('centroid' in ws && ws.centroid) ? ws.centroid : [15.15, 74.35];
      const area = ('area_sq_km' in ws && ws.area_sq_km) ? ws.area_sq_km : 42.5;

      const p1Lat = centroid[0] + 0.05;
      const p1Lon = centroid[1] - 0.06;
      const p2Lat = centroid[0] + 0.05;
      const p2Lon = centroid[1] + 0.06;
      const p3Lat = centroid[0] - 0.05;
      const p3Lon = centroid[1] + 0.06;
      const p4Lat = centroid[0] - 0.05;
      const p4Lon = centroid[1] - 0.06;

      const pts: FourPointMarker[] = [
        { id: 1, name: 'P1 (North-West)', lat: Math.round(p1Lat * 1000) / 1000, lon: Math.round(p1Lon * 1000) / 1000 },
        { id: 2, name: 'P2 (North-East)', lat: Math.round(p2Lat * 1000) / 1000, lon: Math.round(p2Lon * 1000) / 1000 },
        { id: 3, name: 'P3 (South-East)', lat: Math.round(p3Lat * 1000) / 1000, lon: Math.round(p3Lon * 1000) / 1000 },
        { id: 4, name: 'P4 (South-West)', lat: Math.round(p4Lat * 1000) / 1000, lon: Math.round(p4Lon * 1000) / 1000 },
      ];

      setFourPoints(pts);

      const score = ws.overall_score || ranking.overall_score || 72.0;
      const category: PriorityCategory = score >= 75 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Moderate' : 'Low';
      const rankPos = ws.rank_position || ranking.rank_position || 1;

      const newArea: ActiveArea = {
        id: ws.id,
        name: ('name' in ws && ws.name) ? ws.name : ('watershed_name' in ws ? (ws as any).watershed_name : ranking.watershed_name),
        code: ws.watershed_code,
        district: ws.district,
        state: ws.state,
        area_sq_km: area,
        score,
        category,
        soil_loss_t_ha_yr: Math.round((score / 100) ** 1.8 * 45 * 10) / 10,
        bare_soil_pct: Math.round(Math.min(65, 20 + score * 0.4)),
        plant_cover_pct: Math.round(Math.max(15, 80 - score * 0.6)),
        relief_m: Math.round(280 + score * 4.5),
        slope_deg: Math.round((8 + score * 0.16) * 10) / 10,
        rainfall_30d_mm: Math.round(180 + score * 2.8),
        rainfall_anomaly_pct: Math.round((score - 50) * 1.2),
        monsoon_storm_p95: Math.round(45 + score * 0.6),
        drainage_density: Math.round((1.2 + score * 0.015) * 100) / 100,
        rank_text: `#${rankPos} of ${FIXTURE_RANKINGS.length} catchments`,
        main_problem: score > 70 ? 'High gully erosion & denuded hillside' : 'Runoff pooling in unprotected lowlands',
        bounds: [p1Lon, p3Lat, p2Lon, p1Lat],
        coordinates: pts.map((p) => [p.lat, p.lon]),
        fourPoints: pts,
        hydrograph: Array.from({ length: 30 }, (_, i) => {
          const day = i + 1;
          const rain = day === 18 ? 85.0 : day === 19 ? 52.0 : (Math.sin(day / 3) + 1) * 12.0;
          return {
            day: `Day ${day}`,
            rainfall_mm: Math.round(rain * 10) / 10,
            discharge_m3s: Math.round(((rain * area * 0.42) / 3.6) * 10) / 10,
            flood_alert_threshold: Math.round(area * 1.2 * 10) / 10,
          };
        }),
        peak_discharge_m3s: Math.round(((85.0 * area * 0.42) / 3.6) * 10) / 10,
        flood_alert_days: 2,
        most_risky_day: 'Day 18',
        prescribed_interventions: [
          {
            title: 'Continuous Contour Trenches (CCT)',
            type: 'contour_trenching',
            quantity: `${Math.round(area * 0.8 * 10) / 10} km along ridges`,
            target_zone: 'Hill slopes > 12° with sheet erosion',
            estimated_cost_lakhs_inr: Math.round(area * 0.8 * 2.8 * 10) / 10,
            impact: 'Arrests high-velocity rainwater flow and enhances root-zone moisture.',
            coordinates: [centroid[0] + 0.005, centroid[1] - 0.006],
          },
          {
            title: 'Cascading Gabion Check Dams',
            type: 'check_dams',
            quantity: `${Math.max(2, Math.round(area * 0.2))} masonry structures`,
            target_zone: '2nd & 3rd order stream channels',
            estimated_cost_lakhs_inr: Math.round(Math.max(2, area * 0.2) * 1.6 * 10) / 10,
            impact: 'Slows torrential stream velocity and charges nearby drinking water borewells.',
            coordinates: [centroid[0] - 0.004, centroid[1] + 0.003],
          },
          {
            title: 'Community Farm Percolation Ponds',
            type: 'farm_ponds',
            quantity: `${Math.max(1, Math.round(area * 0.08))} storage ponds`,
            target_zone: 'Mid-slope agricultural depressions',
            estimated_cost_lakhs_inr: Math.round(Math.max(1, area * 0.08) * 2.2 * 10) / 10,
            impact: 'Harvests surplus surface runoff for winter crop supplemental watering.',
            coordinates: [centroid[0] + 0.003, centroid[1] + 0.008],
          },
          {
            title: 'Ridge Afforestation & Vetiver Buffers',
            type: 'afforestation',
            quantity: `${Math.round(area * 1.1 * 10) / 10} hectares`,
            target_zone: 'Denuded upper ridge crests',
            estimated_cost_lakhs_inr: Math.round(area * 1.1 * 0.65 * 10) / 10,
            impact: 'Re-establishes permanent vegetative cohesion and halts gully expansion.',
            coordinates: [centroid[0] - 0.007, centroid[1] - 0.005],
          },
        ],
        estimated_budget_lakhs_inr: Math.round((area * 0.8 * 2.8 + Math.max(2, area * 0.2) * 1.6 + Math.max(1, area * 0.08) * 2.2 + area * 1.1 * 0.65) * 10) / 10,
        shap_drivers: [
          { feature_key: 'mean_slope_deg', label: 'Terrain Slope', description: `${Math.round((8 + score * 0.16) * 10) / 10}° average slope`, impact_pts: Math.round(score * 0.35 * 10) / 10, is_aggravating: true },
          { feature_key: 'bare_soil_pct', label: 'Bare Soil Fraction', description: `${Math.round(20 + score * 0.4)}% exposed topsoil`, impact_pts: Math.round(score * 0.28 * 10) / 10, is_aggravating: true },
          { feature_key: 'rainfall_anomaly_pct', label: 'Monsoon Anomaly', description: `+${Math.round((score - 50) * 1.2)}% vs 30-year normal`, impact_pts: Math.round(score * 0.18 * 10) / 10, is_aggravating: true },
          { feature_key: 'tree_cover_pct', label: 'Forest Buffer Protection', description: `${Math.round(80 - score * 0.6)}% forest canopy shield`, impact_pts: -Math.round(score * 0.1 * 10) / 10, is_aggravating: false },
        ],
        isCustom: false,
      };

      setActiveAreaState(newArea);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSampleArea = () => {
    setActiveAreaState(SAMPLE_AREA);
    setFourPoints(SAMPLE_AREA.fourPoints);
  };

  const clearActiveArea = () => {
    setActiveAreaState(null);
    setFourPoints([]);
    setSliderValues({ reforest_pct: 15, check_dams: 4, cct_pct: 25 });
    setSimulatedResult(null);
  };

  const resetSliders = () => {
    setSliderValues({ reforest_pct: 15, check_dams: 4, cct_pct: 25 });
  };

  const saveCurrentPlan = (planName?: string): SavedPlan => {
    if (!activeArea) throw new Error('No active area selected.');
    const name = planName || `${activeArea.name} DPR Plan`;
    const newPlan: SavedPlan = {
      id: `plan-${Date.now()}`,
      area_name: activeArea.name,
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }),
      area_sq_km: activeArea.area_sq_km,
      original_score: activeArea.score,
      simulated_score: simulatedResult?.simulated_score || activeArea.score - 25,
      original_soil_loss: activeArea.soil_loss_t_ha_yr,
      simulated_soil_loss: simulatedResult?.new_soil_loss_t_ha_yr || Math.round(activeArea.soil_loss_t_ha_yr * 0.4 * 10) / 10,
      reforest_pct: sliderValues.reforest_pct,
      check_dams_count: sliderValues.check_dams,
      cct_pct: sliderValues.cct_pct,
      budget_lakhs_inr: activeArea.estimated_budget_lakhs_inr,
      interventions: activeArea.prescribed_interventions,
    };

    setSavedPlans((prev) => {
      const updated = [newPlan, ...prev];
      try {
        localStorage.setItem(STORAGE_PLANS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    return newPlan;
  };

  return (
    <ResearchContext.Provider
      value={{
        activeArea,
        isAreaSelected: activeArea !== null,
        activeStep,
        setActiveStep,
        fourPoints,
        setFourPoints,
        addFourPoint,
        updateFourPoint,
        removeLastFourPoint,
        clearFourPoints,
        analyzeFourPointsAOI,
        selectWatershed,
        loadSampleArea,
        clearActiveArea,
        sliderValues,
        setSliderValues,
        resetSliders,
        simulatedResult,
        savedPlans,
        saveCurrentPlan,
        showOnboarding,
        setShowOnboarding: (show: boolean) => {
          setShowOnboarding(show);
          try {
            if (!show) localStorage.setItem(STORAGE_TOUR_KEY, 'true');
          } catch {}
        },
        showGlossary,
        setShowGlossary,
        isSimulating,
        isAnalyzing,
      }}
    >
      {children}
    </ResearchContext.Provider>
  );
};

export const useResearch = () => {
  const context = useContext(ResearchContext);
  if (!context) {
    throw new Error('useResearch must be used within a ResearchProvider');
  }
  return context;
};
