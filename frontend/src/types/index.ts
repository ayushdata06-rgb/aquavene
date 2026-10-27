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
