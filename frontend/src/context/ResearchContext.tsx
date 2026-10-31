import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  ActiveArea,
  CounterfactualSimulationResult,
  HydrographPoint,
  PriorityCategory,
  PriorityScore,
  SavedPlan,
  Watershed,
  LocationInfo,
  WaterHistoryInfo,
  HydrologyLayerCollection,
  RestorationPlan,
} from '../types';
import { api, FIXTURE_RANKINGS, FIXTURE_WATERSHEDS } from '../api/client';

export interface FourPointMarker {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

export interface RestorationSliders {
  reforest_pct: number;
  check_dams: number;
  cct_pct: number;
  stream_repair_km: number;
  barriers_removed: number;
  road_stabilize_km: number;
  cover_crop_pct: number;
}

interface ResearchContextType {
  activeArea: ActiveArea | null;
  isAreaSelected: boolean;
  activeStep: number;
  setActiveStep: (step: number) => void;
  activeTab: number;
  setActiveTab: (tab: number) => void;
  analysisResult?: any;
  jobStatus?: 'idle' | 'running' | 'completed' | 'failed';
  processingJobId?: string | null;
  fourPoints: FourPointMarker[];
  setFourPoints: React.Dispatch<React.SetStateAction<FourPointMarker[]>>;
  addFourPoint: (lat: number, lon: number) => void;
  updateFourPoint: (id: number, lat: number, lon: number) => void;
  removeLastFourPoint: () => void;
  clearFourPoints: () => void;
  analyzeFourPointsAOI: (pts?: FourPointMarker[], customName?: string) => Promise<ActiveArea>;
  selectWatershed: (ws: Watershed | PriorityScore) => Promise<void>;
  loadSampleArea: () => void;
  loadPresetCatchment: (presetKey: string) => Promise<ActiveArea | void>;
  clearActiveArea: () => void;
  sliderValues: RestorationSliders;
  setSliderValues: React.Dispatch<React.SetStateAction<RestorationSliders>>;
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
  location: {
    display_name: 'Upper Kali River Catchment, Uttara Kannada, Karnataka, India',
    locality: 'Kali Valley Forest Reach',
    district: 'Uttara Kannada',
    state: 'Karnataka',
    country: 'India',
    river_basin: 'West-Flowing Western Ghats Catchment',
    agro_climatic_zone: 'Western Ghats & Coastal Plain',
    area_sq_km: 42.5,
    area_hectares: 4250.0,
    centroid: [15.15, 74.35],
    bounds: [74.30, 15.10, 74.42, 15.22],
  },
  history: {
    centroid: [15.15, 74.35],
    district: 'Uttara Kannada',
    river_basin: 'West-Flowing Western Ghats Catchment',
    nearby_water_features: [
      {
        title: 'Kali River (Karnataka)',
        distance_km: 2.4,
        summary: 'The Kali River rises near Diggi village in the Western Ghats and flows through Uttara Kannada district into the Arabian Sea. It supports vital tropical rainforest ecosystems and hydroelectric reservoirs.',
        url: 'https://en.wikipedia.org/wiki/Kali_River_(Karnataka)',
      },
      {
        title: 'Supa Dam Reservoir',
        distance_km: 8.5,
        summary: 'Built across the Kali River, Supa Dam impounds 4.1 cubic kilometers of monsoon storage. Sedimentation in upper reaches affects seasonal capacity.',
        url: 'https://en.wikipedia.org/wiki/Supa_Dam',
      },
    ],
    water_challenges: [
      {
        severity: 'Critical',
        category: 'High-Velocity Slope Gully Erosion',
        description: 'Steep escarpments face intense monsoon bursts causing rapid gully formation and high reservoir sediment loads.',
      },
      {
        severity: 'High',
        category: 'Agricultural Silt Bleed from Dirt Roads',
        description: 'Unpaved farm access roads act as drainage trenches during storms, bleeding tons of silt into streams.',
      },
      {
        severity: 'Medium',
        category: 'Fish Migration Obstruction',
        description: 'Unregulated small check dams and steep road culverts restrict seasonal upstream migration of endemic fish.',
      },
    ],
    historical_timeline: [
      {
        era: 'Pre-1980s',
        title: 'Traditional Catchment Tank Systems',
        detail: 'Interconnected village percolation tanks and field bunds maintained groundwater recharge throughout the basin.',
      },
      {
        era: '1990s - 2005',
        title: 'Deep Borewells & Hillside Clearing',
        detail: 'Rapid mechanization and shift to commercial cash crops led to clearing of upper ridge vegetation and unpaved farm roads.',
      },
      {
        era: '2010 - 2020',
        title: 'Monsoon Extremes & Stream Bank Siltation',
        detail: 'Increased frequency of intense short-duration rainfall caused severe stream bank erosion and reservoir siltation.',
      },
      {
        era: 'Present Day',
        title: 'Integrated Catchment Restoration Need',
        detail: 'State watershed guidelines prioritize bio-engineering, barrier removal, and regenerative farming.',
      },
    ],
    monsoon_risk_summary: 'Surplus Rainfall (+42%): High runoff risk, requiring urgent contour trenching and gully stabilization.',
  },
  hydrology_network: {
    type: 'FeatureCollection',
    streams: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [74.34, 15.21],
              [74.35, 15.18],
              [74.36, 15.15],
              [74.37, 15.11],
            ],
          },
          properties: {
            name: 'Kali River Main Branch',
            strahler_order: 3,
            flow_rate_m3s: 4.8,
            color: '#0369a1',
            stroke_width: 5,
            is_main_stem: true,
          },
        },
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [74.31, 15.20],
              [74.33, 15.18],
              [74.35, 15.18],
            ],
          },
          properties: {
            name: 'West Ridge Feeder Nullah',
            strahler_order: 2,
            flow_rate_m3s: 2.1,
            color: '#0284c7',
            stroke_width: 3.5,
            is_main_stem: false,
          },
        },
      ],
    },
    flow_vectors: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [74.33, 15.18] },
          properties: { bearing_deg: 135.0, velocity_ms: 1.45, flow_intensity: 'High' },
        },
      ],
    },
    barriers: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [74.355, 15.165] },
          properties: {
            title: 'Silted Masonry Causeway / Choked Culvert',
            type: 'blocked_culvert',
            action: 'Remove sediment plug & construct 2.5m box culvert for fish migration',
            fish_impact: 'High (blocks upstream Tor tor migration during monsoon)',
          },
        },
      ],
    },
    dirt_roads: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [74.31, 15.19],
              [74.34, 15.17],
              [74.38, 15.14],
            ],
          },
          properties: {
            road_name: 'Ridge Plantation Dirt Track',
            surface: 'Unpaved / Gravel',
            erosion_risk: 'Severe Sediment Runoff into Streams',
            intervention: 'Install 6 water bars & vegetated ditch turnouts',
          },
        },
      ],
    },
  },
  restoration_plan: {
    summary: {
      catchment_name: 'Upper Kali Catchment',
      district: 'Uttara Kannada',
      river_basin: 'West-Flowing Western Ghats Catchment',
      urgency_score: 76.8,
      total_budget_lakhs_inr: 89.25,
      projected_runoff_reduction_pct: 42.5,
      projected_soil_loss_reduction_pct: 68.0,
    },
    pillar1_reforestation: {
      title: 'Reforestation & Native Vegetation',
      afforestation_area_ha: 34.0,
      riparian_buffer_km: 25.5,
      target_zone: 'Upper denuded ridges and 20m stream setbacks',
      recommended_species: [
        { name: 'Jamun (Syzygium cumini)', role: 'Riparian canopy & bank root holding' },
        { name: 'Arjun (Terminalia arjuna)', role: 'Water-cooling riparian tree' },
        { name: 'Bamboo (Bambusa bambos)', role: 'High-tensile bank bio-shield' },
        { name: 'Vetiver Grass (Chrysopogon zizanioides)', role: 'Sediment filtering contour hedge' },
      ],
      ecological_benefit: 'Forms a multi-tier canopy to dissipate rainfall kinetic energy, cool stream water temperatures by 2-4°C, and anchor unstable slopes.',
      boq_items: [
        { item_code: 'SOR-P1-01', description: 'Ridge Afforestation & Sapling Plantation (34.0 ha @ 800 saplings/ha)', quantity: '34.0 ha', unit_rate_lakhs: 0.65, total_cost_lakhs: 22.1 },
        { item_code: 'SOR-P1-02', description: 'Vetiver Grass Riparian Buffer Hedge (25.5 km along stream banks)', quantity: '25.5 km', unit_rate_lakhs: 0.45, total_cost_lakhs: 11.48 },
      ],
      coordinates: [15.155, 74.345],
    },
    pillar2_stream_wetland: {
      title: 'Stream & Wetland Bio-Repair',
      floodplain_reconnection_ha: 14.5,
      large_woody_debris_structures: 14,
      coir_geotextile_km: 4.5,
      target_zone: 'Main stem and seasonal floodplains',
      restoration_actions: [
        'Set back agricultural levees to restore seasonal flood dissipation zones.',
        'Anchor Large Woody Debris (LWD) and root wads to create scouring pools for aquatic life.',
        'Install biodegradable coir geotextile mats on vertical collapsing banks.',
      ],
      boq_items: [
        { item_code: 'SOR-P2-01', description: 'Large Woody Debris (LWD) & Root Wad In-Stream Flow Baffles (14 units)', quantity: '14 units', unit_rate_lakhs: 0.35, total_cost_lakhs: 4.9 },
        { item_code: 'SOR-P2-02', description: 'Coir Geotextile Bio-Engineered Bank Armoring (4.5 km)', quantity: '4.5 km', unit_rate_lakhs: 1.80, total_cost_lakhs: 8.1 },
      ],
      coordinates: [15.146, 74.353],
    },
    pillar3_barriers_fish: {
      title: 'Barrier Removal & Free Fish Migration',
      barriers_identified: 3,
      target_zone: 'Choked road stream crossings and silted obsolete check weirs',
      restoration_actions: [
        'De-silt and widen restrictive pipe culverts into open-bottom box culverts.',
        'Construct step-pool rock ramps on drops > 0.5m.',
      ],
      migratory_species_benefited: 'Mahseer (Tor tor), Freshwater Eel (Anguilla), and local stream Barbs',
      boq_items: [
        { item_code: 'SOR-P3-01', description: 'Ecological Culvert Retrofit & Fish-Passable Open Bottom Box Structures (3 sites)', quantity: '3 units', unit_rate_lakhs: 1.25, total_cost_lakhs: 3.75 },
      ],
      coordinates: [15.145, 74.349],
    },
    pillar4_erosion_roads: {
      title: 'Erosion & Dirt Road Runoff Control',
      unpaved_roads_stabilized_km: 6.2,
      water_bars_planned: 36,
      gully_plugs_count: 18,
      target_zone: 'Unpaved hillside access tracks and active secondary gully incisions',
      restoration_actions: [
        'Install 36 diagonal earth/timber water bars to eject storm sheetwash.',
        'Construct broad-based dips and armored outfall turnouts.',
        'Erect 18 dry stone loose boulder gully plugs along first-order ravines.',
      ],
      boq_items: [
        { item_code: 'SOR-P4-01', description: 'Dirt Road Runoff Interception (Water bars & gravel stabilization for 6.2 km)', quantity: '6.2 km', unit_rate_lakhs: 1.10, total_cost_lakhs: 6.82 },
        { item_code: 'SOR-P4-02', description: 'Dry Boulder & Loose Stone Gully Plugs (18 structures)', quantity: '18 units', unit_rate_lakhs: 0.25, total_cost_lakhs: 4.5 },
      ],
      coordinates: [15.152, 74.355],
    },
    pillar5_regenerative_farming: {
      title: 'Regenerative Farm & Soil Management',
      cropland_enrolled_ha: 120.0,
      community_farm_ponds: 4,
      target_zone: 'Mid-reach agricultural lands and natural surface depressions',
      restoration_actions: [
        'Establish legume cover crops (Sunnhemp / Cowpea) during fallow windows.',
        'Subsidize zero-till seed drills to eliminate topsoil pulverization.',
        'Excavate 4 community percolation farm ponds in high-TWI depressions.',
      ],
      boq_items: [
        { item_code: 'SOR-P5-01', description: 'Cover Cropping & Conservation Tillage Farmer Subsidy (120 ha)', quantity: '120.0 ha', unit_rate_lakhs: 0.12, total_cost_lakhs: 14.4 },
        { item_code: 'SOR-P5-02', description: 'Community Farm Ponds & Percolation Units (4 units)', quantity: '4 units', unit_rate_lakhs: 2.20, total_cost_lakhs: 8.8 },
      ],
      coordinates: [15.151, 74.357],
    },
    bill_of_quantities: [
      { item_code: 'SOR-P1-01', description: 'Ridge Afforestation & Sapling Plantation (34.0 ha @ 800 saplings/ha)', quantity: '34.0 ha', unit_rate_lakhs: 0.65, total_cost_lakhs: 22.1 },
      { item_code: 'SOR-P1-02', description: 'Vetiver Grass Riparian Buffer Hedge (25.5 km along stream banks)', quantity: '25.5 km', unit_rate_lakhs: 0.45, total_cost_lakhs: 11.48 },
      { item_code: 'SOR-P2-01', description: 'Large Woody Debris (LWD) Flow Deflectors & Root Wads', quantity: '14 units', unit_rate_lakhs: 0.35, total_cost_lakhs: 4.9 },
      { item_code: 'SOR-P2-02', description: 'Coir Geotextile Bio-Engineered Bank Armoring', quantity: '4.5 km', unit_rate_lakhs: 1.80, total_cost_lakhs: 8.1 },
      { item_code: 'SOR-P3-01', description: 'Culvert De-silting & Fish-Passable Open Box Structure Retrofit', quantity: '3 sites', unit_rate_lakhs: 1.25, total_cost_lakhs: 3.75 },
      { item_code: 'SOR-P4-01', description: 'Dirt Road Runoff Interception: Water Bars & Broad-Based Dips', quantity: '6.2 km', unit_rate_lakhs: 1.10, total_cost_lakhs: 6.82 },
      { item_code: 'SOR-P4-02', description: 'Dry Stone Boulder Gully Plugs in First-Order Ravines', quantity: '18 units', unit_rate_lakhs: 0.25, total_cost_lakhs: 4.5 },
      { item_code: 'SOR-P5-01', description: 'Farmer Cover Cropping & Zero-Till Equipment Partnership Subsidy', quantity: '120.0 ha', unit_rate_lakhs: 0.12, total_cost_lakhs: 14.4 },
      { item_code: 'SOR-P5-02', description: 'Community Farm Ponds & Groundwater Percolation Tanks', quantity: '4 units', unit_rate_lakhs: 2.20, total_cost_lakhs: 8.8 },
    ],
    implementation_roadmap: [
      {
        phase: 'Year 1 (Foundation & Erosion Arrest)',
        budget_lakhs: 40.16,
        focus: 'Dirt road drainage, water bars, gully plugs, culvert retrofits, and contour trench excavation before monsoon.',
        milestones: [
          'Survey and benchmark all unpaved roads and stream barrier sites.',
          'Complete 100% of water bars and dry stone gully plugs.',
          'Retrofit critical perched culverts for fish passage.',
          'Pre-monsoon pitting and soil preparation on upper ridges.',
        ],
      },
      {
        phase: 'Year 2 (Vegetation & Stream Bio-Repair)',
        budget_lakhs: 35.70,
        focus: 'Native tree planting, coir bank geotextile placement, large woody debris anchor, and farmer cover-crop rollout.',
        milestones: [
          'Plant 800 native saplings/ha with community protection fences.',
          'Establish continuous Vetiver grass hedges along riparian buffer.',
          'Install large woody debris deflectors and bio-engineered bank coir mats.',
          'Distribute cover crop seed kits to enrolled watershed farmers.',
        ],
      },
      {
        phase: 'Year 3 (Stewardship, Monitoring & Handover)',
        budget_lakhs: 13.39,
        focus: 'Sapling replacement for >85% survival rate, silt trap cleanouts, groundwater well monitoring, and Gram Panchayat handover.',
        milestones: [
          'Conduct survival audit for plantations and perform gap filling.',
          'Measure peak discharge reduction in stream gauge post-monsoon.',
          'Train village water user committees for annual maintenance.',
          'Submit final Detailed Project Report (DPR) closure report to district authority.',
        ],
      },
    ],
  },
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
  estimated_budget_lakhs_inr: 89.25,
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
    return SAMPLE_AREA;
  });

  const [activeStep, setActiveStep] = useState<number>(1);

  const [fourPoints, setFourPoints] = useState<FourPointMarker[]>(() => {
    if (activeArea?.fourPoints && activeArea.fourPoints.length === 4) {
      return activeArea.fourPoints;
    }
    return SAMPLE_AREA.fourPoints;
  });

  const [sliderValues, setSliderValues] = useState<RestorationSliders>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SLIDERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      reforest_pct: 20,
      check_dams: 4,
      cct_pct: 25,
      stream_repair_km: 4.5,
      barriers_removed: 2,
      road_stabilize_km: 3.0,
      cover_crop_pct: 35,
    };
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
            area_sq_km: activeArea.area_sq_km,
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
          stream_bank_repair_km: sliderValues.stream_repair_km || 4.5,
          barriers_removed_count: sliderValues.barriers_removed || 2,
          dirt_roads_stabilized_km: sliderValues.road_stabilize_km || 3.0,
          cover_crop_cropland_pct: sliderValues.cover_crop_pct || 35.0,
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
  }, [sliderValues, activeArea?.id, activeArea?.score]);

  const addFourPoint = (lat: number, lon: number) => {
    if (fourPoints.length >= 4) return;
    const labels = ['P1 (NW)', 'P2 (NE)', 'P3 (SE)', 'P4 (SW)'];
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
        name: res.location?.display_name || res.name || name,
        code: 'AOI-CUSTOM-4PT',
        district: res.location?.district || 'Selected Region',
        state: res.location?.state || 'India',
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
        location: res.location,
        history: res.history,
        hydrology_network: res.hydrology_network,
        restoration_plan: res.restoration_plan,
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
        { id: 1, name: 'P1 (NW)', lat: Math.round(p1Lat * 1000) / 1000, lon: Math.round(p1Lon * 1000) / 1000 },
        { id: 2, name: 'P2 (NE)', lat: Math.round(p2Lat * 1000) / 1000, lon: Math.round(p2Lon * 1000) / 1000 },
        { id: 3, name: 'P3 (SE)', lat: Math.round(p3Lat * 1000) / 1000, lon: Math.round(p3Lon * 1000) / 1000 },
        { id: 4, name: 'P4 (SW)', lat: Math.round(p4Lat * 1000) / 1000, lon: Math.round(p4Lon * 1000) / 1000 },
      ];

      setFourPoints(pts);

      const score = ws.overall_score || ranking.overall_score || 72.0;
      const category: PriorityCategory = score >= 75 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Moderate' : 'Low';

      const wsName = ('name' in ws && ws.name) ? ws.name : ('watershed_name' in ws ? (ws as any).watershed_name : ranking.watershed_name);

      const newArea: ActiveArea = {
        id: ws.id,
        name: wsName,
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
        rank_text: `Priority Rank Score ${score.toFixed(1)}`,
        main_problem: score > 70 ? 'High gully erosion & denuded hillside' : 'Runoff pooling in unprotected lowlands',
        bounds: [p1Lon, p3Lat, p2Lon, p1Lat],
        coordinates: pts.map((p) => [p.lat, p.lon]),
        fourPoints: pts,
        hydrograph: SAMPLE_AREA.hydrograph,
        peak_discharge_m3s: 48.2,
        flood_alert_days: 2,
        most_risky_day: 'Day 18',
        prescribed_interventions: SAMPLE_AREA.prescribed_interventions,
        estimated_budget_lakhs_inr: SAMPLE_AREA.estimated_budget_lakhs_inr,
        shap_drivers: SAMPLE_AREA.shap_drivers,
        location: {
          display_name: `${wsName}, ${ws.district}, ${ws.state}`,
          locality: wsName,
          district: ws.district,
          state: ws.state,
          country: 'India',
          river_basin: ws.basin_name || 'Peninsular Basin',
          agro_climatic_zone: 'Deccan Plateau',
          area_sq_km: area,
          area_hectares: area * 100,
          centroid: [centroid[0], centroid[1]],
          bounds: [p1Lon, p3Lat, p2Lon, p1Lat],
        },
        history: SAMPLE_AREA.history,
        hydrology_network: SAMPLE_AREA.hydrology_network,
        restoration_plan: SAMPLE_AREA.restoration_plan,
        isCustom: false,
      };

      setActiveAreaState(newArea);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const PRESET_CATCHMENTS: Record<string, { name: string; pts: [number, number][] }> = {
    kali: {
      name: 'Upper Kali River Catchment (Karnataka)',
      pts: [
        [15.22, 74.30],
        [15.22, 74.42],
        [15.10, 74.42],
        [15.10, 74.30],
      ],
    },
    bhagirathi: {
      name: 'Bhagirathi Headwaters (Garhwal, Uttarakhand)',
      pts: [
        [30.48, 78.35],
        [30.48, 78.50],
        [30.35, 78.50],
        [30.35, 78.35],
      ],
    },
    narmada: {
      name: 'Narmada Valley Gorge (Hoshangabad, MP)',
      pts: [
        [22.82, 77.65],
        [22.82, 77.82],
        [22.68, 77.82],
        [22.68, 77.65],
      ],
    },
    palar: {
      name: 'Palar River Sub-Basin (Vellore, Tamil Nadu)',
      pts: [
        [12.98, 79.05],
        [12.98, 79.22],
        [12.85, 79.22],
        [12.85, 79.05],
      ],
    },
  };

  const loadPresetCatchment = async (presetKey: string) => {
    const preset = PRESET_CATCHMENTS[presetKey] || PRESET_CATCHMENTS.kali;
    const cornerNames = ['P1 (North-West)', 'P2 (North-East)', 'P3 (South-East)', 'P4 (South-West)'];
    const pts: FourPointMarker[] = preset.pts.map((coord, idx) => ({
      id: idx + 1,
      name: cornerNames[idx],
      lat: coord[0],
      lon: coord[1],
    }));

    setFourPoints(pts);
    return await analyzeFourPointsAOI(pts, preset.name);
  };

  const loadSampleArea = () => {
    setActiveAreaState(SAMPLE_AREA);
    setFourPoints(SAMPLE_AREA.fourPoints);
  };

  const clearActiveArea = () => {
    setActiveAreaState(null);
    setFourPoints([]);
    setSliderValues({
      reforest_pct: 20,
      check_dams: 4,
      cct_pct: 25,
      stream_repair_km: 4.5,
      barriers_removed: 2,
      road_stabilize_km: 3.0,
      cover_crop_pct: 35,
    });
    setSimulatedResult(null);
  };

  const resetSliders = () => {
    setSliderValues({
      reforest_pct: 20,
      check_dams: 4,
      cct_pct: 25,
      stream_repair_km: 4.5,
      barriers_removed: 2,
      road_stabilize_km: 3.0,
      cover_crop_pct: 35,
    });
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
        activeTab: activeStep,
        setActiveTab: setActiveStep,
        analysisResult: activeArea,
        jobStatus: isSimulating ? 'running' : 'idle',
        processingJobId: null,
        fourPoints,
        setFourPoints,
        addFourPoint,
        updateFourPoint,
        removeLastFourPoint,
        clearFourPoints,
        analyzeFourPointsAOI,
        selectWatershed,
        loadSampleArea,
        loadPresetCatchment,
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
