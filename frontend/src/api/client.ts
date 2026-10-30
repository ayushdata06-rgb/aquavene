/**
 * AquaVane API Client
 * Connects to FastAPI backend and includes fallback development fixtures.
 */

import {
  AOIPredictionResult,
  CounterfactualSimulationResult,
  AuthStatus,
  AuthUser,
  DashboardSummary,
  Dataset,
  LandCoverClass,
  PriorityCategory,
  PriorityScore,
  ProcessingJob,
  RainfallMonthly,
  Scenario,
  ScenarioResult,
  ScoringWeights,
  Watershed,
  WatershedIndicator,
} from '../types';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').trim();
const cleanUrl = rawApiUrl.replace(/\/+$/, '');
const API_BASE = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;

let currentAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
};

export const getAuthToken = () => currentAuthToken;

export const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const headers = new Headers(init?.headers || {});
  if (currentAuthToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${currentAuthToken}`);
  }
  return fetch(input, {
    ...init,
    headers,
  });
};

// Fallback development fixtures (15 Indian Micro-Watersheds)
export const FIXTURE_WATERSHEDS: Watershed[] = [
  {
    id: 'ws-001',
    watershed_code: 'WS-KA-001',
    name: 'Upper Kali Micro-Watershed',
    country: 'India',
    state: 'Karnataka',
    district: 'Uttara Kannada',
    basin_name: 'Kali Basin',
    area_sq_km: 42.5,
    centroid: [15.15, 74.35],
    coordinates: [
      [[15.10, 74.30], [15.20, 74.32], [15.22, 74.40], [15.12, 74.42], [15.10, 74.30]]
    ],
    priority_category: 'Critical',
    overall_score: 79.4,
    rank_position: 1,
  },
  {
    id: 'ws-002',
    watershed_code: 'WS-KA-002',
    name: 'Sharavathi Ridge Watershed',
    country: 'India',
    state: 'Karnataka',
    district: 'Shimoga',
    basin_name: 'Sharavathi Basin',
    area_sq_km: 56.1,
    centroid: [14.22, 74.95],
    coordinates: [
      [[14.15, 74.90], [14.28, 74.92], [14.30, 75.02], [14.18, 75.01], [14.15, 74.90]]
    ],
    priority_category: 'Critical',
    overall_score: 76.8,
    rank_position: 2,
  },
  {
    id: 'ws-003',
    watershed_code: 'WS-MH-003',
    name: 'Koyna Valley Micro-Catchment',
    country: 'India',
    state: 'Maharashtra',
    district: 'Satara',
    basin_name: 'Krishna Basin',
    area_sq_km: 68.3,
    centroid: [17.40, 73.75],
    coordinates: [
      [[17.32, 73.68], [17.48, 73.70], [17.50, 73.82], [17.35, 73.83], [17.32, 73.68]]
    ],
    priority_category: 'Critical',
    overall_score: 75.1,
    rank_position: 3,
  },
  {
    id: 'ws-004',
    watershed_code: 'WS-KA-004',
    name: 'Bhadra Upper Catchment',
    country: 'India',
    state: 'Karnataka',
    district: 'Chikkamagaluru',
    basin_name: 'Tungabhadra Basin',
    area_sq_km: 51.0,
    centroid: [13.25, 75.60],
    coordinates: [
      [[13.18, 75.52], [13.32, 75.54], [13.34, 75.68], [13.20, 75.67], [13.18, 75.52]]
    ],
    priority_category: 'High',
    overall_score: 69.2,
    rank_position: 4,
  },
  {
    id: 'ws-005',
    watershed_code: 'WS-KL-005',
    name: 'Periyar Foothills',
    country: 'India',
    state: 'Kerala',
    district: 'Idukki',
    basin_name: 'Periyar Basin',
    area_sq_km: 48.7,
    centroid: [9.85, 77.05],
    coordinates: [
      [[9.78, 76.98], [9.92, 77.00], [9.94, 77.12], [9.80, 77.11], [9.78, 76.98]]
    ],
    priority_category: 'High',
    overall_score: 67.5,
    rank_position: 5,
  },
  {
    id: 'ws-006',
    watershed_code: 'WS-TN-006',
    name: 'Bhavani River Tributary',
    country: 'India',
    state: 'Tamil Nadu',
    district: 'Nilgiris',
    basin_name: 'Cauvery Basin',
    area_sq_km: 62.4,
    centroid: [11.35, 76.70],
    coordinates: [
      [[11.28, 76.62], [11.42, 76.65], [11.44, 76.78], [11.30, 76.77], [11.28, 76.62]]
    ],
    priority_category: 'High',
    overall_score: 64.9,
    rank_position: 6,
  },
  {
    id: 'ws-007',
    watershed_code: 'WS-KA-007',
    name: 'Hemavathi Headwaters',
    country: 'India',
    state: 'Karnataka',
    district: 'Hassan',
    basin_name: 'Cauvery Basin',
    area_sq_km: 44.8,
    centroid: [12.95, 75.80],
    coordinates: [
      [[12.88, 75.72], [13.02, 75.75], [13.04, 75.88], [12.90, 75.87], [12.88, 75.72]]
    ],
    priority_category: 'High',
    overall_score: 61.3,
    rank_position: 7,
  },
  {
    id: 'ws-008',
    watershed_code: 'WS-MH-008',
    name: 'Vaitarna Ridge',
    country: 'India',
    state: 'Maharashtra',
    district: 'Nashik',
    basin_name: 'Godavari Basin',
    area_sq_km: 58.2,
    centroid: [19.80, 73.55],
    coordinates: [
      [[19.72, 73.48], [19.88, 73.50], [19.90, 73.62], [19.75, 73.63], [19.72, 73.48]]
    ],
    priority_category: 'Moderate',
    overall_score: 54.2,
    rank_position: 8,
  },
  {
    id: 'ws-009',
    watershed_code: 'WS-AP-009',
    name: 'Pennar Scrub Catchment',
    country: 'India',
    state: 'Andhra Pradesh',
    district: 'Anantapur',
    basin_name: 'Pennar Basin',
    area_sq_km: 74.0,
    centroid: [14.65, 77.40],
    coordinates: [
      [[14.58, 77.32], [14.72, 77.35], [14.74, 77.48], [14.60, 77.47], [14.58, 77.32]]
    ],
    priority_category: 'Moderate',
    overall_score: 48.7,
    rank_position: 9,
  },
  {
    id: 'ws-010',
    watershed_code: 'WS-KA-010',
    name: 'Malaprabha Upper Valley',
    country: 'India',
    state: 'Karnataka',
    district: 'Belagavi',
    basin_name: 'Krishna Basin',
    area_sq_km: 52.8,
    centroid: [15.70, 74.55],
    coordinates: [
      [[15.62, 74.48], [15.78, 74.50], [15.80, 74.62], [15.65, 74.63], [15.62, 74.48]]
    ],
    priority_category: 'Moderate',
    overall_score: 45.3,
    rank_position: 10,
  },
  {
    id: 'ws-011',
    watershed_code: 'WS-MP-011',
    name: 'Narmada Tributary Catchment',
    country: 'India',
    state: 'Madhya Pradesh',
    district: 'Hoshangabad',
    basin_name: 'Narmada Basin',
    area_sq_km: 66.5,
    centroid: [22.70, 77.75],
    coordinates: [
      [[22.62, 77.68], [22.78, 77.70], [22.80, 77.82], [22.65, 77.83], [22.62, 77.68]]
    ],
    priority_category: 'Moderate',
    overall_score: 41.8,
    rank_position: 11,
  },
  {
    id: 'ws-012',
    watershed_code: 'WS-KA-012',
    name: 'Ghataprabha Agricultural Plain',
    country: 'India',
    state: 'Karnataka',
    district: 'Bagalkot',
    basin_name: 'Krishna Basin',
    area_sq_km: 80.2,
    centroid: [16.20, 75.70],
    coordinates: [
      [[16.12, 75.62], [16.28, 75.65], [16.30, 75.78], [16.15, 75.77], [16.12, 75.62]]
    ],
    priority_category: 'Low',
    overall_score: 36.4,
    rank_position: 12,
  },
  {
    id: 'ws-013',
    watershed_code: 'WS-TG-013',
    name: 'Manjeera Sub-Catchment',
    country: 'India',
    state: 'Telangana',
    district: 'Medak',
    basin_name: 'Godavari Basin',
    area_sq_km: 71.3,
    centroid: [17.85, 78.10],
    coordinates: [
      [[17.78, 78.02], [17.92, 78.05], [17.94, 78.18], [17.80, 78.17], [17.78, 78.02]]
    ],
    priority_category: 'Low',
    overall_score: 31.9,
    rank_position: 13,
  },
  {
    id: 'ws-014',
    watershed_code: 'WS-GJ-014',
    name: 'Sabarmati Upstream Plain',
    country: 'India',
    state: 'Gujarat',
    district: 'Sabarkantha',
    basin_name: 'Sabarmati Basin',
    area_sq_km: 63.9,
    centroid: [23.80, 73.05],
    coordinates: [
      [[23.72, 72.98], [23.88, 73.00], [23.90, 73.12], [23.75, 73.13], [23.72, 72.98]]
    ],
    priority_category: 'Low',
    overall_score: 28.5,
    rank_position: 14,
  },
  {
    id: 'ws-015',
    watershed_code: 'WS-RJ-015',
    name: 'Chambal Semi-Arid Sub-Basin',
    country: 'India',
    state: 'Rajasthan',
    district: 'Kota',
    basin_name: 'Ganga Basin',
    area_sq_km: 88.6,
    centroid: [25.15, 75.85],
    coordinates: [
      [[25.08, 75.78], [25.22, 75.80], [25.24, 75.92], [25.10, 75.93], [25.08, 75.78]]
    ],
    priority_category: 'Low',
    overall_score: 24.1,
    rank_position: 15,
  },
];

export const FIXTURE_RANKINGS: PriorityScore[] = FIXTURE_WATERSHEDS.map((ws) => ({
  id: `rank-${ws.id}`,
  watershed_id: ws.id,
  watershed_code: ws.watershed_code,
  watershed_name: ws.name,
  state: ws.state,
  district: ws.district,
  basin_name: ws.basin_name,
  overall_score: ws.overall_score || 50,
  priority_category: ws.priority_category || 'Moderate',
  rank_position: ws.rank_position || 1,
  data_completeness: 1.0,
  indicator_breakdown: {
    erosion_potential: Math.min(100, Math.round((ws.overall_score || 50) * 1.05)),
    runoff_potential: Math.min(100, Math.round((ws.overall_score || 50) * 0.98)),
    landcover_degradation: Math.min(100, Math.round((ws.overall_score || 50) * 0.92)),
    rainfall_pressure: Math.min(100, Math.round((ws.overall_score || 50) * 1.12)),
    downstream_exposure: Math.min(100, Math.round((ws.overall_score || 50) * 0.95)),
  },
}));

export const FIXTURE_DATASETS: Dataset[] = [
  {
    id: 'ds-01',
    dataset_name: 'USGS SRTM 30m Digital Elevation Model',
    provider: 'NASA / USGS',
    dataset_type: 'DEM',
    source_url: 'https://earthexplorer.usgs.gov/',
    licence_or_attribution: 'Public Domain / Open Data',
    native_resolution: '30m (1 arc-second)',
    units: 'Meters (ellipsoidal)',
    crs: 'EPSG:4326 (WGS 84)',
    file_format: 'Cloud Optimized GeoTIFF',
    status: 'active',
    reference_period: 'Feb 2000 mission',
  },
  {
    id: 'ds-02',
    dataset_name: 'Copernicus ERA5-Land Hourly Precipitation',
    provider: 'ECMWF / Copernicus Climate Change Service',
    dataset_type: 'Precipitation',
    source_url: 'https://cds.climate.copernicus.eu/',
    licence_or_attribution: 'Copernicus Licence',
    native_resolution: '0.1° (~9 km)',
    units: 'Meters (converted to mm)',
    crs: 'EPSG:4326',
    file_format: 'NetCDF-4 / HDF5',
    status: 'active',
    reference_period: '2020 - 2024 (Monthly aggregations)',
  },
  {
    id: 'ds-03',
    dataset_name: 'ESA WorldCover 10m v200',
    provider: 'European Space Agency (ESA)',
    dataset_type: 'LandCover',
    source_url: 'https://esa-worldcover.org/',
    licence_or_attribution: 'CC BY 4.0',
    native_resolution: '10m',
    units: 'Categorical class codes (10-100)',
    crs: 'EPSG:4326',
    file_format: 'GeoTIFF',
    status: 'active',
    reference_period: '2021 Epoch',
  },
  {
    id: 'ds-04',
    dataset_name: 'India WRIS River Basins & Watershed Boundaries',
    provider: 'Central Water Commission / NRSC',
    dataset_type: 'Boundary',
    source_url: 'https://indiawris.gov.in/',
    licence_or_attribution: 'Government of India Open Data',
    native_resolution: '1:50,000 scale',
    units: 'Vector polygons',
    crs: 'EPSG:4326',
    file_format: 'GeoPackage / GeoJSON',
    status: 'active',
    reference_period: '2022 Boundary Update',
  },
  {
    id: 'ds-05',
    dataset_name: 'High-Resolution Settlement Layer & Census Downstream Exposure',
    provider: 'Columbia CIESIN / Meta HRSL',
    dataset_type: 'Population',
    source_url: 'https://dataforgood.facebook.com/',
    licence_or_attribution: 'ODbL / Attribution 3.0',
    native_resolution: '30m grid count',
    units: 'Persons count in buffer',
    crs: 'EPSG:4326',
    file_format: 'GeoTIFF & GeoJSON',
    status: 'active',
    reference_period: '2020 projection',
  },
];

export const FIXTURE_JOBS: ProcessingJob[] = [
  {
    id: 'job-101',
    job_type: 'DEM Hydrology Delineation & Flow Accumulation',
    status: 'completed',
    progress: 100,
    started_at: '2026-10-26T10:15:00Z',
    finished_at: '2026-10-26T10:22:30Z',
  },
  {
    id: 'job-102',
    job_type: 'ESA WorldCover Zonal Statistics Extraction',
    status: 'completed',
    progress: 100,
    started_at: '2026-10-26T11:00:00Z',
    finished_at: '2026-10-26T11:04:12Z',
  },
  {
    id: 'job-103',
    job_type: 'ERA5-Land Precipitation Aggregation (5-Yr Mean)',
    status: 'completed',
    progress: 100,
    started_at: '2026-10-26T11:30:00Z',
    finished_at: '2026-10-26T11:35:45Z',
  },
  {
    id: 'job-104',
    job_type: 'Priority Scoring Run (Baseline Profile v1.0)',
    status: 'completed',
    progress: 100,
    started_at: '2026-10-26T12:00:00Z',
    finished_at: '2026-10-26T12:00:15Z',
  },
];

export const api = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/dashboard/summary`);
      if (res.ok) {
        const raw = await res.json();
        const dist = raw.priority_distribution || raw.category_distribution || {};
        return {
          total_watersheds: raw.total_watersheds ?? 15,
          priority_distribution: {
            critical: dist.critical ?? raw.critical_count ?? 3,
            high: dist.high ?? raw.high_count ?? 4,
            moderate: dist.moderate ?? dist.medium ?? raw.medium_count ?? 4,
            low: dist.low ?? raw.low_count ?? 4,
          },
          top_watersheds: raw.top_watersheds || FIXTURE_RANKINGS.slice(0, 5),
          datasets_count: raw.datasets_count ?? raw.total_datasets ?? 4,
          last_processing_date: raw.last_processing_date || raw.last_scoring_date || '2026-10-28',
          recent_jobs: raw.recent_jobs || FIXTURE_JOBS,
          warnings: raw.warnings || raw.data_warnings || [],
        };
      }
    } catch (e) {
      console.warn('API getDashboardSummary fallback:', e);
    }
    return {
      total_watersheds: 15,
      priority_distribution: {
        critical: 3,
        high: 4,
        moderate: 4,
        low: 4,
      },
      top_watersheds: FIXTURE_RANKINGS.slice(0, 5),
      datasets_count: 5,
      last_processing_date: '2026-10-26',
      recent_jobs: FIXTURE_JOBS,
      warnings: [
        'Screening decision-support system: Field ground-truthing required before capital investment.',
        'Downstream settlement exposure is derived from 30m gridded population buffers (±15% variance).',
      ],
    };
  },

  async getWatersheds(): Promise<Watershed[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/watersheds`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.items || FIXTURE_WATERSHEDS;
      }
    } catch {}
    return FIXTURE_WATERSHEDS;
  },

  async getWatershed(id: string): Promise<Watershed | null> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/watersheds/${id}`);
      if (res.ok) return await res.json();
    } catch {}
    return FIXTURE_WATERSHEDS.find((w) => w.id === id || w.watershed_code === id) || FIXTURE_WATERSHEDS[0];
  },

  async getWatershedIndicators(id: string): Promise<WatershedIndicator[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/watersheds/${id}/indicators`);
      if (res.ok) return await res.json();
    } catch {}
    const ws = FIXTURE_RANKINGS.find((r) => r.watershed_id === id) || FIXTURE_RANKINGS[0];
    const b = ws.indicator_breakdown;
    return [
      {
        indicator_code: 'erosion_potential',
        name: 'Erosion Potential',
        raw_value: Math.round(b.erosion_potential * 0.45 * 10) / 10,
        unit: 'Slope-cover index (0-45°)',
        normalized_score: b.erosion_potential,
        quality_status: 'computed',
        uncertainty_note: 'Calculated from SRTM 30m slope and WorldCover bare fraction. Not USLE-calibrated.',
        method_version: 'v1.1',
      },
      {
        indicator_code: 'runoff_potential',
        name: 'Runoff Potential',
        raw_value: Math.round(b.runoff_potential * 0.8 * 10) / 10,
        unit: 'Flow accumulation / slope ratio',
        normalized_score: b.runoff_potential,
        quality_status: 'computed',
        uncertainty_note: 'Derived from WhiteboxTools D8 accumulation and terrain curvature.',
        method_version: 'v1.1',
      },
      {
        indicator_code: 'landcover_degradation',
        name: 'Land-Cover Degradation',
        raw_value: Math.round(b.landcover_degradation * 0.35 * 100) / 100,
        unit: 'Degraded / bare fraction (0-1)',
        normalized_score: b.landcover_degradation,
        quality_status: 'computed',
        uncertainty_note: 'ESA WorldCover class 50 (built) and 60 (bare/sparse) proportions.',
        method_version: 'v1.0',
      },
      {
        indicator_code: 'rainfall_pressure',
        name: 'Rainfall Pressure',
        raw_value: Math.round(1200 + b.rainfall_pressure * 18),
        unit: 'mm / year',
        normalized_score: b.rainfall_pressure,
        quality_status: 'computed',
        uncertainty_note: 'Copernicus ERA5-Land reanalysis (~9km grid). Multi-year mean precipitation.',
        method_version: 'v1.0',
      },
      {
        indicator_code: 'downstream_exposure',
        name: 'Downstream Population Exposure',
        raw_value: Math.round(5000 + b.downstream_exposure * 350),
        unit: 'Persons in 10km buffer',
        normalized_score: b.downstream_exposure,
        quality_status: 'estimated',
        uncertainty_note: 'Downstream buffer intersection with HRSL population. Proxy for vulnerable assets.',
        method_version: 'v1.0',
      },
    ];
  },

  async getRankings(): Promise<PriorityScore[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/rankings`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data) ? data : data.items || FIXTURE_RANKINGS;
      }
    } catch {}
    return FIXTURE_RANKINGS;
  },

  async getDatasets(): Promise<Dataset[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/datasets`);
      if (res.ok) return await res.json();
    } catch {}
    return FIXTURE_DATASETS;
  },

  async getProcessingJobs(): Promise<ProcessingJob[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/processing-jobs`);
      if (res.ok) return await res.json();
    } catch {}
    return FIXTURE_JOBS;
  },

  async getRainfallMonthly(watershedId?: string): Promise<RainfallMonthly[]> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monsoonPattern = [15, 18, 35, 60, 110, 420, 580, 460, 240, 150, 45, 12];
    return months.map((m, i) => ({
      month: m,
      year: 2024,
      precipitation_mm: monsoonPattern[i],
      anomaly_mm: Math.round((Math.random() - 0.5) * 50),
    }));
  },

  async getLandCoverDistribution(watershedId?: string): Promise<LandCoverClass[]> {
    return [
      { code: 10, name: 'Tree cover (Forest)', percentage: 42.5, color: '#15803d' },
      { code: 20, name: 'Shrubland', percentage: 14.2, color: '#ca8a04' },
      { code: 30, name: 'Grassland', percentage: 11.8, color: '#84cc16' },
      { code: 40, name: 'Cropland', percentage: 18.0, color: '#f59e0b' },
      { code: 50, name: 'Built-up (Degraded)', percentage: 5.5, color: '#ef4444' },
      { code: 60, name: 'Bare soil / Sparse', percentage: 6.2, color: '#dc2626' },
      { code: 80, name: 'Permanent water', percentage: 1.8, color: '#0284c7' },
    ];
  },

  async getScenarios(): Promise<Scenario[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/scenarios`);
      if (res.ok) return await res.json();
    } catch {}
    return [
      {
        id: 'sc-01',
        name: 'Soil Erosion Mitigation Priority',
        description: 'Focuses funding on watersheds with extreme slope and bare soil erosion vulnerability.',
        weights: {
          erosion_potential: 0.40,
          runoff_potential: 0.20,
          landcover_degradation: 0.20,
          rainfall_pressure: 0.10,
          downstream_exposure: 0.10,
        },
        created_at: '2026-10-25T14:20:00Z',
      },
      {
        id: 'sc-02',
        name: 'Downstream Community Flood Protection',
        description: 'Weight shift towards high-volume runoff and densely populated downstream valleys.',
        weights: {
          erosion_potential: 0.10,
          runoff_potential: 0.35,
          landcover_degradation: 0.10,
          rainfall_pressure: 0.15,
          downstream_exposure: 0.30,
        },
        created_at: '2026-10-26T09:15:00Z',
      },
    ];
  },

  simulateScenario(weights: ScoringWeights): ScenarioResult[] {
    return FIXTURE_RANKINGS.map((item) => {
      const b = item.indicator_breakdown;
      const newScore = Math.round(
        (weights.erosion_potential * b.erosion_potential +
          weights.runoff_potential * b.runoff_potential +
          weights.landcover_degradation * b.landcover_degradation +
          weights.rainfall_pressure * b.rainfall_pressure +
          weights.downstream_exposure * b.downstream_exposure) * 10
      ) / 10;
      return {
        watershed_id: item.watershed_id,
        watershed_code: item.watershed_code,
        watershed_name: item.watershed_name,
        baseline_score: item.overall_score,
        scenario_score: newScore,
        baseline_rank: item.rank_position,
        scenario_rank: 0, // calculated after sorting
        score_delta: Math.round((newScore - item.overall_score) * 10) / 10,
        rank_delta: 0,
        priority_category: (newScore >= 75
          ? 'Critical'
          : newScore >= 60
          ? 'High'
          : newScore >= 40
          ? 'Moderate'
          : 'Low') as PriorityCategory,
      };
    })
      .sort((a, b) => b.scenario_score - a.scenario_score)
      .map((item, index) => ({
        ...item,
        scenario_rank: index + 1,
        rank_delta: item.baseline_rank - (index + 1), // positive means moved up in priority
      }));
  },

  getExportRankingsCsvUrl(): string {
    return `${API_BASE}/exports/rankings.csv`;
  },

  getExportWatershedsGeoJsonUrl(): string {
    return `${API_BASE}/watersheds/geojson`;
  },

  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/status`);
      if (res.ok) return await res.json();
    } catch {}
    return {
      auth_enabled: false,
      provider: 'google',
      supabase_configured: false,
      jwt_algorithm: 'HS256',
    };
  },

  async getCurrentUser(): Promise<{ user: AuthUser; auth_enabled: boolean } | null> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/me`);
      if (res.ok) return await res.json();
    } catch {}
    return null;
  },

  async syncUserProfile(): Promise<AuthUser | null> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/auth/sync-profile`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name || data.fullName,
          avatarUrl: data.avatar_url || data.avatarUrl,
          role: data.role,
          provider: data.provider || 'google',
          isAuthenticated: true,
        };
      }
    } catch {}
    return null;
  },

  async updateUserRole(userId: string, role: string): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/auth/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update user role');
    }
    return await res.json();
  },

  async createSavedPlan(payload: any): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server returned ${res.status}`);
    }
    return await res.json();
  },

  async listSavedPlans(): Promise<any[]> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/plans`);
      if (res.ok) return await res.json();
    } catch {}
    return [];
  },

  async deleteSavedPlan(planId: string): Promise<any> {
    const res = await fetchWithAuth(`${API_BASE}/plans/${planId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Server returned ${res.status}`);
    }
    return await res.json();
  },
  async predictAOI(geojson: any, name?: string): Promise<AOIPredictionResult> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/predict/aoi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geojson, name: name || 'Custom Study Area' }),
      });
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Backend predict API failed, using fallback:', err);
    }

    const centroid = geojson?.coordinates?.[0]?.[0]
      ? [geojson.coordinates[0][0][1], geojson.coordinates[0][0][0]]
      : [15.15, 74.35];

    return {
      status: 'success',
      name: name || 'Custom Selected Catchment',
      score: 76.8,
      category: 'Critical',
      badge_color: 'red',
      soil_loss_t_ha_yr: 32.4,
      features: {
        centroid: [centroid[0], centroid[1]],
        bounds: [centroid[1] - 0.08, centroid[0] - 0.08, centroid[1] + 0.08, centroid[0] + 0.08],
        area_sq_km: 42.5,
        mean_slope_deg: 17.8,
        max_slope_deg: 34.2,
        elevation_relief_m: 540.0,
        twi_index: 7.2,
        bare_soil_pct: 34.5,
        tree_cover_pct: 18.2,
        cropland_pct: 38.0,
        builtup_pct: 4.8,
        rainfall_30d_mm: 360.0,
        rainfall_anomaly_pct: 42.0,
        monsoon_storm_p95: 92.0,
        drainage_density_km_km2: 2.15,
        stream_order_max: 3,
        dist_to_major_river_km: 2.8,
      },
      shap_drivers: [
        { feature_key: 'mean_slope_deg', label: 'Steep Slopes', description: '17.8° average hillside slope', impact_pts: 26.4, is_aggravating: true },
        { feature_key: 'bare_soil_pct', label: 'Bare Soil Fraction', description: '34.5% exposed denuded soil', impact_pts: 22.1, is_aggravating: true },
        { feature_key: 'rainfall_anomaly_pct', label: 'Monsoon Anomaly', description: '+42% above normal storm intensity', impact_pts: 14.8, is_aggravating: true },
        { feature_key: 'drainage_density_km_km2', label: 'Drainage Network', description: '2.15 km/km² heavy gully density', impact_pts: 9.5, is_aggravating: true },
        { feature_key: 'tree_cover_pct', label: 'Forest Buffer Protection', description: '18.2% tree canopy mitigation', impact_pts: -6.8, is_aggravating: false },
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
      prescribed_interventions: [
        {
          title: 'Continuous Contour Trenches (CCT)',
          type: 'contour_trenching',
          quantity: '34.2 km along hillside crests',
          target_zone: 'Hill slopes > 12° with sheet erosion',
          estimated_cost_lakhs_inr: 95.8,
          impact: 'Stops torrential surface runoff and enhances root-zone water absorption.',
          coordinates: [centroid[0] + 0.005, centroid[1] - 0.006],
        },
        {
          title: 'Cascading Stone Check Dams',
          type: 'check_dams',
          quantity: '8 cascading stone structures',
          target_zone: 'Order 2 and 3 stream junctions',
          estimated_cost_lakhs_inr: 12.8,
          impact: 'Slows torrential stream velocity and charges nearby drinking water wells.',
          coordinates: [centroid[0] - 0.004, centroid[1] + 0.003],
        },
        {
          title: 'Community Percolation Tanks',
          type: 'farm_ponds',
          quantity: '3 percolation units',
          target_zone: 'Mid-slope agricultural depressions',
          estimated_cost_lakhs_inr: 6.6,
          impact: 'Harvests surplus surface runoff for winter crop supplemental watering.',
          coordinates: [centroid[0] + 0.003, centroid[1] + 0.008],
        },
        {
          title: 'Ridge Afforestation & Vetiver Grass',
          type: 'afforestation',
          quantity: '42.0 hectares',
          target_zone: 'Upper denuded ridge crests',
          estimated_cost_lakhs_inr: 27.3,
          impact: 'Re-establishes permanent vegetative cohesion and halts gully expansion.',
          coordinates: [centroid[0] - 0.007, centroid[1] - 0.005],
        },
      ],
      estimated_budget_lakhs_inr: 142.5,
    };
  },

  async simulateCounterfactual(request: any): Promise<CounterfactualSimulationResult> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/predict/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (res.ok) return await res.json();
    } catch {}

    const reforest = request.reforest_bare_soil_pct || 0;
    const dams = request.add_check_dams_count || 0;
    const cct = request.cct_ridge_coverage_pct || 0;
    const reduction = reforest * 0.45 + dams * 2.2 + cct * 0.25;
    const origScore = request.base_features?.original_score || 76.8;
    const simulated_score = Math.max(10.0, Math.round((origScore - reduction) * 10) / 10);

    return {
      simulated_score,
      simulated_category: (simulated_score >= 75 ? 'Critical' : simulated_score >= 60 ? 'High' : simulated_score >= 40 ? 'Moderate' : 'Low') as PriorityCategory,
      score_delta: Math.round((simulated_score - origScore) * 10) / 10,
      reduction_pct: Math.round((reduction / origScore) * 1000) / 10,
      new_soil_loss_t_ha_yr: Math.max(1.5, Math.round(((simulated_score / 100) ** 1.8 * 45) * 10) / 10),
      modified_features: {
        bare_soil_pct: Math.max(2.0, (request.base_features?.bare_soil_pct || 34.5) - reforest),
        tree_cover_pct: Math.min(85.0, (request.base_features?.tree_cover_pct || 18.2) + reforest),
        effective_slope_deg: Math.max(2.0, (request.base_features?.mean_slope_deg || 17.8) - cct * 0.1),
      },
    };
  },

  async getModelsInfo(): Promise<any> {
    try {
      const res = await fetchWithAuth(`${API_BASE}/predict/models-info`);
      if (res.ok) return await res.json();
    } catch {}
    return {
      engine_version: 'v2.0-ml-hybrid',
      models: [
        { id: 'm1', name: 'XGBoost Priority Scorer' },
        { id: 'm2', name: 'NeuralHydrology EA-LSTM' },
        { id: 'm3', name: 'TreeSHAP Attribution' },
        { id: 'm4', name: 'CatBoost Prescriptor' },
      ],
    };
  },
};

export const apiClient = api;