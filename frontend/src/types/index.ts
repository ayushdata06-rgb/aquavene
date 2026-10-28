/**
 * AquaVane Core TypeScript Definitions
 */

export type PriorityCategory = 'Critical' | 'High' | 'Moderate' | 'Low';

export interface IndicatorBreakdown {
  erosion_potential: number;
  runoff_potential: number;
  landcover_degradation: number;
  rainfall_pressure: number;
  downstream_exposure: number;
}

export interface ScoringWeights {
  erosion_potential: number;
  runoff_potential: number;
  landcover_degradation: number;
  rainfall_pressure: number;
  downstream_exposure: number;
}

export interface WatershedIndicator {
  indicator_code: string;
  name: string;
  raw_value: number | null;
  unit: string;
  normalized_score: number | null;
  quality_status: 'computed' | 'estimated' | 'missing';
  uncertainty_note: string;
  reference_period?: string;
  method_version?: string;
}

export interface Watershed {
  id: string;
  watershed_code: string;
  name: string;
  country: string;
  state: string;
  district: string;
  basin_name: string;
  area_sq_km: number;
  coordinates?: [number, number][][];
  centroid?: [number, number];
  priority_category?: PriorityCategory;
  overall_score?: number;
  rank_position?: number;
}

export interface PriorityScore {
  id: string;
  watershed_id: string;
  watershed_code: string;
  watershed_name: string;
  state: string;
  district: string;
  basin_name: string;
  overall_score: number;
  priority_category: PriorityCategory;
  rank_position: number;
  indicator_breakdown: IndicatorBreakdown;
  data_completeness: number;
  calculated_at?: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  weights: ScoringWeights;
  baseline_scoring_run_id?: string;
  created_at: string;
  results?: ScenarioResult[];
}

export interface ScenarioResult {
  watershed_id: string;
  watershed_code: string;
  watershed_name: string;
  baseline_score: number;
  scenario_score: number;
  baseline_rank: number;
  scenario_rank: number;
  score_delta: number;
  rank_delta: number;
  priority_category: PriorityCategory;
}

export interface Dataset {
  id: string;
  dataset_name: string;
  provider: string;
  dataset_type: 'DEM' | 'Precipitation' | 'LandCover' | 'Boundary' | 'Population';
  source_url: string;
  licence_or_attribution: string;
  native_resolution: string;
  units: string;
  crs: string;
  file_format: string;
  status: 'active' | 'processing' | 'error';
  checksum?: string;
  reference_period?: string;
}

export interface ProcessingJob {
  id: string;
  job_type: string;
  status: 'completed' | 'running' | 'failed' | 'pending';
  progress: number;
  started_at: string;
  finished_at?: string;
  error_summary?: string;
  parameters?: Record<string, any>;
}

export interface DashboardSummary {
  total_watersheds: number;
  priority_distribution: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  top_watersheds: PriorityScore[];
  datasets_count: number;
  last_processing_date: string;
  recent_jobs: ProcessingJob[];
  warnings: string[];
}

export interface RainfallMonthly {
  month: string;
  year: number;
  precipitation_mm: number;
  anomaly_mm: number;
}

export interface LandCoverClass {
  code: number;
  name: string;
  percentage: number;
  color: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  role: string;
  provider: string;
  isAuthenticated: boolean;
}

export interface AuthStatus {
  auth_enabled: boolean;
  provider: string;
  supabase_configured: boolean;
  jwt_algorithm: string;
}

export interface SHAPDriver {
  feature_key: string;
  label: string;
  description: string;
  impact_pts: number;
  is_aggravating: boolean;
}

export interface HydrographPoint {
  day: string;
  rainfall_mm: number;
  discharge_m3s: number;
  flood_alert_threshold: number;
}

export interface PrescribedIntervention {
  title: string;
  type: 'contour_trenching' | 'check_dams' | 'farm_ponds' | 'afforestation';
  quantity: string;
  target_zone: string;
  estimated_cost_lakhs_inr: number;
  impact: string;
  coordinates: [number, number];
}

export interface AOIPredictionResult {
  status: string;
  name?: string;
  score: number;
  category: PriorityCategory;
  badge_color: 'red' | 'orange' | 'yellow' | 'green';
  soil_loss_t_ha_yr: number;
  features: {
    centroid: [number, number];
    bounds: [number, number, number, number];
    area_sq_km: number;
    mean_slope_deg: number;
    max_slope_deg: number;
    elevation_relief_m: number;
    twi_index: number;
    bare_soil_pct: number;
    tree_cover_pct: number;
    cropland_pct: number;
    builtup_pct: number;
    rainfall_30d_mm: number;
    rainfall_anomaly_pct: number;
    monsoon_storm_p95: number;
    drainage_density_km_km2: number;
    stream_order_max: number;
    dist_to_major_river_km: number;
  };
  shap_drivers: SHAPDriver[];
  hydrograph: HydrographPoint[];
  peak_discharge_m3s: number;
  prescribed_interventions: PrescribedIntervention[];
  estimated_budget_lakhs_inr: number;
}

export interface CounterfactualSimulationResult {
  simulated_score: number;
  simulated_category: PriorityCategory;
  score_delta: number;
  reduction_pct: number;
  new_soil_loss_t_ha_yr: number;
  modified_features: {
    bare_soil_pct: number;
    tree_cover_pct: number;
    effective_slope_deg: number;
  };
}


export interface ActiveArea {
  id: string;
  name: string;
  code: string;
  district: string;
  state: string;
  area_sq_km: number;
  score: number;
  category: PriorityCategory;
  soil_loss_t_ha_yr: number;
  bare_soil_pct: number;
  plant_cover_pct: number;
  relief_m: number;
  slope_deg: number;
  rainfall_30d_mm: number;
  rainfall_anomaly_pct: number;
  monsoon_storm_p95: number;
  drainage_density: number;
  rank_text: string;
  main_problem: string;
  bounds: [number, number, number, number] | null;
  coordinates: [number, number][];
  fourPoints: Array<{ id: number; name: string; lat: number; lon: number }>;
  hydrograph: HydrographPoint[];
  peak_discharge_m3s: number;
  flood_alert_days: number;
  most_risky_day: string;
  prescribed_interventions: PrescribedIntervention[];
  estimated_budget_lakhs_inr: number;
  shap_drivers: SHAPDriver[];
  isCustom: boolean;
}

export interface SavedPlan {
  id: string;
  area_name: string;
  date: string;
  area_sq_km: number;
  original_score: number;
  simulated_score: number;
  original_soil_loss: number;
  simulated_soil_loss: number;
  reforest_pct: number;
  check_dams_count: number;
  cct_pct: number;
  budget_lakhs_inr: number;
  interventions: PrescribedIntervention[];
}
