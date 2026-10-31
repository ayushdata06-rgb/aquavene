/**
 * AquaVane 2.0 Comprehensive TypeScript Type Definitions
 * Integrates enterprise v2 models with full backward-compatibility definitions.
 */

export type Role = 'admin' | 'planner' | 'officer' | 'viewer';
export type PriorityCategory = 'Critical' | 'High' | 'Moderate' | 'Low' | 'critical' | 'high' | 'medium' | 'low';

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  role: Role;
  display_name: string;
  full_name?: string | null;
  avatar_url?: string | null;
  department?: string | null;
  provider?: string;
  is_authenticated: boolean;
  raw_claims?: Record<string, any>;
}

export type AuthUser = {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  avatar_url?: string | null;
  display_name?: string;
  full_name?: string | null;
  role: string;
  provider: string;
  isAuthenticated: boolean;
  [key: string]: any;
};

export interface UserPersona {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  title: string;
  avatarUrl: string;
  description: string;
}

export interface AuthStatus {
  auth_enabled: boolean;
  provider: string;
  supabase_configured: boolean;
  jwt_algorithm: string;
  version?: string;
}

export interface ProfileResponse {
  id: string;
  display_name: string;
  role: Role;
  avatar_url?: string | null;
  department?: string | null;
  phone?: string | null;
  last_active?: string | null;
  created_at: string;
  updated_at: string;
}

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
  country?: string;
  state: string;
  district: string;
  basin_name: string;
  sub_basin?: string | null;
  area_sq_km: number;
  perimeter_km?: number | null;
  mean_elevation_m?: number | null;
  mean_slope_deg?: number | null;
  drainage_density?: number | null;
  priority_score?: number | null;
  overall_score?: number;
  risk_level?: 'low' | 'medium' | 'high' | 'critical' | null;
  priority_category?: any;
  rank_position?: number;
  geom?: any;
  coordinates?: any;
  centroid?: any;
}

export interface WatershedListResponse {
  items: Watershed[];
  total: number;
  page: number;
  limit: number;
}

export interface PriorityScore {
  id: string;
  watershed_id: string;
  watershed_code: string;
  watershed_name: string;
  state: string;
  district: string;
  basin_name: string;
  area_sq_km?: number;
  overall_score: number;
  priority_category: any;
  rank_position: number;
  indicator_breakdown: any;
  data_completeness: number;
  centroid?: [number, number];
  calculated_at?: string;
}

export interface TerrainElevationPoint {
  station: string;
  distance_km: number;
  elevation_m: number;
  slope_deg: number;
  flow_m3s: number;
}

export interface USLEFactorsDetail {
  soil_loss_t_ha_yr: number;
  r_factor: number;
  k_factor: number;
  ls_factor: number;
  c_factor: number;
  p_factor: number;
  tolerable_t_ha_yr: number;
  erosion_ratio_vs_tolerable: number;
}

export interface TerrainHealthData {
  watershed_id: string;
  watershed_code: string;
  watershed_name: string;
  state: string;
  district: string;
  basin_name: string;
  relief_m: number;
  mean_slope_deg: number;
  drainage_density: number;
  topographic_wetness_index: number;
  stream_power_index: number;
  usle: USLEFactorsDetail;
  bare_soil_pct: number;
  plant_cover_pct: number;
  cropland_pct: number;
  monsoon_storm_p95: number;
  rainfall_30d_mm: number;
  rainfall_anomaly_pct: number;
  composite_score: number;
  priority_category: string;
  elevation_profile: TerrainElevationPoint[];
  hydrograph: Array<{ day: string; rainfall_mm: number; discharge_m3s: number; flood_threshold?: number }>;
  shap_drivers: Array<{ feature_key: string; label: string; description: string; impact_pts: number; is_aggravating: boolean }>;
  engine_version: string;
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

export interface TeamOfficer {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  role: Role;
  status: 'active' | 'invited';
  assignedRegionsCount: number;
  avatarUrl?: string;
  joinedAt: string;
}

export interface RegionResearchTask {
  id: string;
  regionId: string;
  regionCode: string;
  regionName: string;
  basinName: string;
  assignedToEmail: string;
  assignedToName: string;
  priority: 'Urgent' | 'High' | 'Normal';
  objectives: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved';
  createdAt: string;
  submittedReport?: {
    title: string;
    fieldNotes: string;
    measuredSlopeDeg?: number;
    measuredSoilLoss?: number;
    fileName?: string;
    fileSize?: string;
    submittedAt: string;
  };
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
  priority_category: any;
}

export interface Dataset {
  id: string;
  dataset_name: string;
  provider: string;
  dataset_type: any;
  source_url: string;
  licence_or_attribution: string;
  native_resolution: string;
  units: string;
  crs: string;
  file_format: string;
  status: any;
  checksum?: string;
  reference_period?: string;
}

export interface ProcessingJob {
  id: string;
  job_type: string;
  status: any;
  progress?: number;
  progress_pct?: number;
  started_at?: string;
  finished_at?: string;
  completed_at?: string;
  error_summary?: string;
  error_message?: string;
  parameters?: Record<string, any>;
  result_json?: any;
  watershed_id?: string | null;
  created_at?: string;
}

export interface DashboardSummary {
  total_watersheds: number;
  priority_distribution?: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
  critical_count?: number;
  high_count?: number;
  medium_count?: number;
  low_count?: number;
  top_watersheds?: any[];
  datasets_count?: number;
  total_datasets?: number;
  last_processing_date?: string | null;
  last_scoring_date?: string | null;
  recent_jobs?: any[];
  warnings?: string[];
  category_distribution?: Record<string, number>;
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

export interface SHAPDriver {
  feature_key: string;
  label: string;
  description: string;
  impact_pts: number;
  is_aggravating: boolean;
}

export interface SHAPContribution {
  feature: string;
  value: number;
  direction: 'up' | 'down';
  description?: string;
}

export interface HydrographPoint {
  hour?: number;
  day?: string;
  rainfall_mm?: number;
  discharge_m3s?: number;
  baseline_discharge?: number;
  simulated_discharge?: number;
  discharge?: number;
  flood_alert_threshold?: number;
}

export interface PrescribedIntervention {
  id?: string;
  title: string;
  type?: string;
  category?: string;
  quantity: string;
  target_zone?: string;
  estimated_cost_lakhs_inr: number;
  impact?: string;
  priority?: string;
  coordinates?: [number, number];
}

export interface LocationInfo {
  display_name: string;
  locality: string;
  district: string;
  state: string;
  country: string;
  river_basin: string;
  agro_climatic_zone: string;
  area_sq_km: number;
  area_hectares: number;
  centroid: [number, number];
  bounds: [number, number, number, number];
}

export interface WikipediaArticle {
  title: string;
  distance_km: number;
  summary: string;
  url: string;
}

export interface WaterChallenge {
  severity: string;
  category: string;
  description: string;
}

export interface HistoricalTimelineItem {
  era: string;
  title: string;
  detail: string;
}

export interface WaterHistoryInfo {
  monsoon_risk_summary?: string;
  [key: string]: any;
  centroid: [number, number];
  district: string;
  river_basin: string;
  nearby_water_features: WikipediaArticle[];
  water_challenges: WaterChallenge[];
  historical_timeline: HistoricalTimelineItem[];
  monsoon_risk_narrative?: string;
  rainfall_trend_pct?: number;
  historical_flash_floods?: Array<{ year: number; event: string; severity: string }>;
  traditional_water_harvesting?: string[];
  cwc_gauging_station?: {
    station_name: string;
    distance_km: number;
    river: string;
    warning_level_m: number;
    danger_level_m: number;
    highest_flood_level_m: number;
    hfl_date: string;
  };
}

export interface HydrologyLayerCollection {
  type?: string;
  streams?: any;
  streams_d8?: any;
  steep_slopes?: any;
  dirt_roads?: any;
  vegetation_zones?: any;
  elevation_profile?: any[];
  flow_vectors?: any;
  barriers?: any;
  [key: string]: any;
}

export interface BoQItem {
  item_code: string;
  description: string;
  quantity: string;
  unit_rate_lakhs: number;
  total_cost_lakhs: number;
}

export interface RestorationPillarDetail {
  title: string;
  target_zone: string;
  boq_items: BoQItem[];
  coordinates: [number, number];
  [key: string]: any;
}

export interface ImplementationPhase {
  phase: string;
  budget_lakhs: number;
  focus: string;
  milestones: string[];
}

export interface RestorationPlan {
  summary: {
    catchment_name: string;
    district: string;
    river_basin: string;
    urgency_score: number;
    total_budget_lakhs_inr: number;
    projected_runoff_reduction_pct: number;
    projected_soil_loss_reduction_pct: number;
  };
  pillar1_reforestation: RestorationPillarDetail;
  pillar2_stream_wetland: RestorationPillarDetail;
  pillar3_barriers_fish: RestorationPillarDetail;
  pillar4_erosion_roads: RestorationPillarDetail;
  pillar5_regenerative_farming: RestorationPillarDetail;
  bill_of_quantities: BoQItem[];
  implementation_roadmap: ImplementationPhase[];
}

export interface FeatureVector {
  mean_slope_deg: number;
  elevation_range_m: number;
  bare_soil_pct: number;
  drainage_density: number;
  flow_accumulation_p95: number;
  rainfall_intensity_idf: number;
  forest_cover_pct: number;
  crop_land_pct: number;
  imperviousness_pct: number;
  soil_erodibility_k: number;
  sediment_delivery_ratio: number;
  stream_power_index: number;
}

export interface USLEFactors {
  r_factor: number;
  k_factor: number;
  ls_factor: number;
  c_factor: number;
  p_factor: number;
  annual_soil_loss_t_ha_yr: number;
}

export interface WhiteboxResult {
  stream_network_geojson: any;
  watershed_polygons_geojson: any;
  flow_accumulation_stats: Record<string, number>;
  slope_stats: {
    mean_deg: number;
    max_deg: number;
    pct_gt_15deg: number;
    pct_gt_30deg: number;
  };
  drainage_density_km_per_km2: number;
  sink_count: number;
  strahler_order_distribution: Record<string, number>;
}

export interface AOIPredictResponse {
  status?: string;
  name?: string;
  score: number;
  priority_category?: any;
  category?: any;
  badge_color?: 'red' | 'orange' | 'yellow' | 'green';
  soil_loss_t_ha_yr: number;
  run_time_sec?: number;
  features?: any;
  feature_vector?: FeatureVector;
  usle?: USLEFactors;
  whitebox_result?: WhiteboxResult;
  shap_explanations?: SHAPContribution[];
  shap_drivers?: SHAPDriver[];
  prescribed_interventions?: PrescribedIntervention[];
  hydrograph?: HydrographPoint[];
  processing_job_id?: string | null;
  location?: LocationInfo;
  history?: WaterHistoryInfo;
  hydrology_network?: HydrologyLayerCollection;
  restoration_plan?: RestorationPlan;
  peak_discharge_m3s?: number;
  estimated_budget_lakhs_inr?: number;
}

export type AOIPredictionResult = AOIPredictResponse;

export interface CounterfactualSimulationResult {
  simulated_score: number;
  simulated_category: any;
  score_delta?: number;
  reduction_pct?: number;
  new_soil_loss_t_ha_yr?: number;
  new_peak_discharge_m3s?: number;
  simulated_hydrograph?: HydrographPoint[];
  modified_features?: any;
  hydrograph?: HydrographPoint[];
  baseline_peak_discharge_m3s?: number;
  simulated_peak_discharge_m3s?: number;
  peak_reduction_pct?: number;
  time_to_peak_baseline_hr?: number;
  time_to_peak_simulated_hr?: number;
  flood_hours_baseline?: number;
  flood_hours_simulated?: number;
  soil_loss_baseline_t_ha_yr?: number;
  soil_loss_simulated_t_ha_yr?: number;
  soil_loss_reduction_pct?: number;
}

export type HydrographResult = CounterfactualSimulationResult;

export interface ActiveArea {
  id: string;
  name: string;
  code: string;
  district: string;
  state: string;
  area_sq_km: number;
  score: number;
  category: any;
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
  bounds?: [number, number, number, number] | null;
  coordinates?: [number, number][];
  fourPoints?: Array<{ id: number; name: string; lat: number; lon: number }>;
  hydrograph?: HydrographPoint[];
  peak_discharge_m3s?: number;
  flood_alert_days?: number;
  most_risky_day?: string;
  prescribed_interventions?: PrescribedIntervention[];
  estimated_budget_lakhs_inr?: number;
  shap_drivers?: SHAPDriver[];
  location?: LocationInfo;
  history?: WaterHistoryInfo;
  hydrology_network?: HydrologyLayerCollection;
  restoration_plan?: RestorationPlan;
  isCustom?: boolean;
  [key: string]: any;
}

export interface InterventionLevers {
  reforest_pct: number;
  check_dams_count: number;
  cct_pct: number;
  stream_repair_km: number;
  road_stabilisation_km: number;
  cover_crop_pct: number;
}

export interface BoQLineItem {
  item_no?: number;
  item_code?: string;
  description: string;
  unit: string;
  quantity: number | string;
  rate_inr?: number;
  unit_rate_lakhs?: number;
  amount_lakhs?: number;
  total_cost_lakhs?: number;
  estimated_cost_lakhs_inr?: number;
  title?: string;
  scheme: string;
  phase: 1 | 2 | 3;
}

export interface SavedPlan {
  id: string;
  watershed_id?: string | null;
  created_by?: string | null;
  area_name: string;
  area_sq_km: number;
  date?: string;
  state?: string | null;
  district?: string | null;
  original_score: number;
  simulated_score: number;
  score_improvement_pct?: number | null;
  original_soil_loss?: number;
  simulated_soil_loss?: number;
  original_soil_loss_t_ha_yr?: number;
  simulated_soil_loss_t_ha_yr?: number;
  reforest_pct: number;
  check_dams_count: number;
  cct_pct: number;
  stream_repair_km?: number;
  road_stabilisation_km?: number;
  cover_crop_pct?: number;
  budget_lakhs_inr: number;
  scheme?: string;
  dpr_status?: 'draft' | 'submitted' | 'approved';
  interventions?: any[];
  interventions_json?: any[];
  phase_1_activities?: any[];
  phase_2_activities?: any[];
  phase_3_activities?: any[];
  approved_by?: string | null;
  approved_at?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface PlanCreate {
  area_name: string;
  watershed_id?: string | null;
  area_sq_km: number;
  state?: string | null;
  district?: string | null;
  geojson_aoi?: any;
  original_score: number;
  simulated_score: number;
  original_peak_discharge_m3s?: number;
  simulated_peak_discharge_m3s?: number;
  original_soil_loss?: number;
  simulated_soil_loss?: number;
  reforest_pct: number;
  check_dams_count: number;
  cct_pct: number;
  stream_repair_km?: number;
  road_stabilisation_km?: number;
  cover_crop_pct?: number;
  budget_lakhs_inr: number;
  scheme?: string;
  interventions?: any[];
  phase_1_activities?: any[];
  phase_2_activities?: any[];
  phase_3_activities?: any[];
}

export interface PlanUpdate {
  area_name?: string;
  dpr_status?: 'draft' | 'submitted' | 'approved';
  budget_lakhs_inr?: number;
  interventions?: any[];
}

export interface RankingEntry {
  rank_position: number;
  watershed_id: string;
  watershed_code: string;
  watershed_name: string;
  state?: string | null;
  district?: string | null;
  overall_score: number;
  priority_category: string;
  indicator_breakdown?: Record<string, number>;
  data_completeness?: number;
}

export interface RankingResponse {
  scoring_run_id: string;
  method_version: string;
  total: number;
  page: number;
  page_size: number;
  items: RankingEntry[];
}
