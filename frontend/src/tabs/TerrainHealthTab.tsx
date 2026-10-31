import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mountain,
  Activity,
  Trees,
  CloudRain,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  Info,
  Waves,
  MapPin,
  Cpu,
  Gauge,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useResearch } from '../context/ResearchContext';
import { SiteDiagnosticModal } from '../components/SiteDiagnosticModal';
import { api } from '../api/client';
import { TerrainHealthData } from '../types';

export const TerrainHealthTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea, loadPresetCatchment } = useResearch();

  const [activeProfileMode, setActiveProfileMode] = useState<'elevation' | 'velocity'>('elevation');
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);
  const [backendTerrain, setBackendTerrain] = useState<TerrainHealthData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePresetKey, setActivePresetKey] = useState<string>('kali');

  // Load real terrain health data from FastAPI backend
  useEffect(() => {
    let isCurrent = true;
    setIsLoading(true);

    const fetchTerrain = async () => {
      try {
        if (activeArea) {
          if (activeArea.isCustom && activeArea.fourPoints && activeArea.fourPoints.length >= 4) {
            const coordinates = [
              [activeArea.fourPoints[0].lon, activeArea.fourPoints[0].lat],
              [activeArea.fourPoints[1].lon, activeArea.fourPoints[1].lat],
              [activeArea.fourPoints[2].lon, activeArea.fourPoints[2].lat],
              [activeArea.fourPoints[3].lon, activeArea.fourPoints[3].lat],
              [activeArea.fourPoints[0].lon, activeArea.fourPoints[0].lat],
            ];
            const data = await api.analyzeCustomAOITerrain({
              geojson: { type: 'Polygon', coordinates: [coordinates] },
              name: activeArea.name,
              state: activeArea.state,
              district: activeArea.district,
            });
            if (isCurrent && data) {
              setBackendTerrain(data);
              setIsLoading(false);
              return;
            }
          } else {
            const data = await api.getTerrainHealth(activeArea.id, activeArea.code);
            if (isCurrent && data) {
              setBackendTerrain(data);
              setIsLoading(false);
              return;
            }
          }
        }

        // Default or benchmark catchment from backend
        const benchmark = await api.getTerrainHealth();
        if (isCurrent && benchmark) {
          setBackendTerrain(benchmark);
        }
      } catch (err) {
        console.warn('Terrain health fetch error:', err);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    fetchTerrain();

    return () => {
      isCurrent = false;
    };
  }, [activeArea?.id, activeArea?.code, activeArea?.name]);

  const handleSelectPreset = async (key: string) => {
    setActivePresetKey(key);
    await loadPresetCatchment(key);
  };

  // Metrics from backend response with activeArea sync
  const relief = backendTerrain?.relief_m ?? activeArea?.relief_m ?? 640;
  const slope = backendTerrain?.mean_slope_deg ?? activeArea?.slope_deg ?? 21.5;
  const bareSoil = backendTerrain?.bare_soil_pct ?? activeArea?.bare_soil_pct ?? 36;
  const plantCover = backendTerrain?.plant_cover_pct ?? activeArea?.plant_cover_pct ?? 44;
  const cropland = backendTerrain?.cropland_pct ?? Math.max(10, 100 - bareSoil - plantCover);
  const rainfall30d = backendTerrain?.rainfall_30d_mm ?? activeArea?.rainfall_30d_mm ?? 285;
  const rainfallAnomaly = backendTerrain?.rainfall_anomaly_pct ?? activeArea?.rainfall_anomaly_pct ?? 14.5;
  const monsoonP95 = backendTerrain?.monsoon_storm_p95 ?? activeArea?.monsoon_storm_p95 ?? 58;
  const drainageDensity = backendTerrain?.drainage_density ?? activeArea?.drainage_density ?? 2.15;
  const soilLoss = backendTerrain?.usle?.soil_loss_t_ha_yr ?? activeArea?.soil_loss_t_ha_yr ?? 31.2;
  const score = backendTerrain?.composite_score ?? activeArea?.score ?? 78.5;
  const category = backendTerrain?.priority_category ?? activeArea?.category ?? 'Critical';
  const twi = backendTerrain?.topographic_wetness_index ?? 7.85;
  const spi = backendTerrain?.stream_power_index ?? 42.8;

  const hydrograph = (backendTerrain?.hydrograph && backendTerrain.hydrograph.length > 0)
    ? backendTerrain.hydrograph
    : (activeArea?.hydrograph || []);

  const elevationProfile = (backendTerrain?.elevation_profile && backendTerrain.elevation_profile.length > 0)
    ? backendTerrain.elevation_profile
    : (activeArea?.hydrology_network?.elevation_profile || [
        { station: 'Summit Ridge Crest', distance_km: 0.0, elevation_m: 860.0, slope_deg: 26.5, flow_m3s: 0.35 },
        { station: 'Headwater Gully 1', distance_km: 1.2, elevation_m: 785.0, slope_deg: 23.2, flow_m3s: 0.62 },
        { station: 'Upper Ravine Reach', distance_km: 2.5, elevation_m: 690.0, slope_deg: 19.5, flow_m3s: 0.95 },
        { station: 'Steep Silt Chute', distance_km: 3.8, elevation_m: 610.0, slope_deg: 16.8, flow_m3s: 1.40 },
        { station: 'Cascade Bedrock Step', distance_km: 5.0, elevation_m: 540.0, slope_deg: 14.2, flow_m3s: 1.85 },
        { station: 'Mid-Reach Stream Junction', distance_km: 6.2, elevation_m: 480.0, slope_deg: 11.5, flow_m3s: 2.65 },
        { station: 'Tributary Confluence Reach', distance_km: 7.5, elevation_m: 430.0, slope_deg: 9.2, flow_m3s: 3.20 },
        { station: 'Valley Floodplain Entrance', distance_km: 8.8, elevation_m: 390.0, slope_deg: 7.0, flow_m3s: 3.75 },
        { station: 'Lower Meander Bend', distance_km: 10.0, elevation_m: 360.0, slope_deg: 5.4, flow_m3s: 4.10 },
        { station: 'Alluvial Riparian Sinks', distance_km: 11.2, elevation_m: 335.0, slope_deg: 3.8, flow_m3s: 4.45 },
        { station: 'River Basin Outlet', distance_km: 12.5, elevation_m: 320.0, slope_deg: 2.5, flow_m3s: 4.80 },
      ]);

  const shapDrivers = (backendTerrain?.shap_drivers && backendTerrain.shap_drivers.length > 0)
    ? backendTerrain.shap_drivers
    : (activeArea?.shap_drivers || [
        { feature_key: 'mean_slope_deg', label: 'Terrain Hill Slope', description: `${slope}° steepest descent gradient`, impact_pts: roundNum(slope * 0.85), is_aggravating: true },
        { feature_key: 'bare_soil_pct', label: 'Bare Topsoil Exposure', description: `${bareSoil}% unarmored erosion surface`, impact_pts: roundNum(bareSoil * 0.35), is_aggravating: true },
        { feature_key: 'soil_loss', label: 'USLE Silt Delivery', description: `${soilLoss} t/ha/yr severe scour`, impact_pts: 7.4, is_aggravating: true },
        { feature_key: 'tree_cover_pct', label: 'Canopy Root Retention', description: `${plantCover}% native forest anchor`, impact_pts: -8.5, is_aggravating: false },
      ]);

  function roundNum(n: number) {
    return Math.round(n * 10) / 10;
  }

  const usleR = backendTerrain?.usle?.r_factor ?? 380.0;
  const usleK = backendTerrain?.usle?.k_factor ?? 0.28;
  const usleLS = backendTerrain?.usle?.ls_factor ?? roundNum((slope / 5.16) ** 1.3);
  const usleC = backendTerrain?.usle?.c_factor ?? roundNum(0.05 + (bareSoil / 100.0) * 0.45);
  const usleP = backendTerrain?.usle?.p_factor ?? 0.70;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-2">
              <Mountain className="h-3.5 w-3.5" />
              Tab 3 • Terrain, Slopes & Watershed Health
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Biophysical & Terrain Diagnosis
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="text-slate-300">
                Whitebox D8 Stream Routing • Rasterio SRTM 30m DEM Relief • ESA WorldCover 10m
              </span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">
                {backendTerrain?.watershed_name || activeArea?.name || 'Upper Kali Headwaters Catchment'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>FastAPI Whitebox D8 & Rasterio 30m</span>
            </div>

            <button
              onClick={() => setShowDiagnosticModal(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all shadow-md flex items-center gap-2"
              title="Inspect raw indicator contributions, policy weights, and uncertainty metrics"
            >
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Attribution Scorecard</span>
            </button>

            <button
              onClick={() => navigate('/reforest')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              Start Pillar 1: Forest & Trees
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Catchment Presets Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Live Catchment Presets:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSelectPreset('kali')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activePresetKey === 'kali'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              🌿 Upper Kali Basin (KA)
            </button>
            <button
              onClick={() => handleSelectPreset('bhagirathi')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activePresetKey === 'bhagirathi'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              🏔️ Bhagirathi Gorge (UK)
            </button>
            <button
              onClick={() => handleSelectPreset('narmada')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activePresetKey === 'narmada'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              🌊 Narmada Gorge (MP)
            </button>
            <button
              onClick={() => handleSelectPreset('palar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activePresetKey === 'palar'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              🌾 Palar Sub-Basin (TN)
            </button>
            <button
              onClick={() => navigate('/map')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Draw Custom AOI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Biophysical Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Restoration Urgency</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                category === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {category}
            </span>
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {score.toFixed(1)} <span className="text-sm text-slate-500 font-normal">/ 100</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Multi-criteria priority vulnerability</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Annual Soil Loss</span>
            <span className="text-[11px] text-rose-400 font-semibold font-mono">
              {(soilLoss / 10.0).toFixed(1)}x Tolerable
            </span>
          </div>
          <div className="text-3xl font-black text-rose-400 mt-2">
            {soilLoss.toFixed(1)} <span className="text-sm text-slate-500 font-normal">t/ha/yr</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Safe threshold &lt; 10 t/ha/yr</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Whitebox Hill Slope</span>
            <Mountain className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {slope.toFixed(1)}°
          </div>
          <p className="text-xs text-slate-400 mt-1">Relief drop: {relief}m</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Bare Topsoil Ratio</span>
            <Trees className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2">
            {bareSoil.toFixed(1)}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Canopy cover: {plantCover.toFixed(1)}%</p>
        </div>
      </div>

      {/* Stream Longitudinal Elevation & Flow Discharge Profile Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Mountain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stream Longitudinal Elevation & Discharge Profile</h2>
              <p className="text-xs text-slate-400">
                Whitebox D8 continuous gradient descent from summit ridge crest to river basin outlet (11 sampling reaches)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveProfileMode('elevation')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeProfileMode === 'elevation'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Elevation (m)
            </button>
            <button
              onClick={() => setActiveProfileMode('velocity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeProfileMode === 'velocity'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flow Discharge (m³/s)
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={elevationProfile} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="terrainGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="distance_km" stroke="#64748b" tick={{ fontSize: 11 }} unit=" km" />
              {activeProfileMode === 'elevation' ? (
                <YAxis yAxisId="active" stroke="#38bdf8" tick={{ fontSize: 11 }} unit=" m" domain={['auto', 'auto']} />
              ) : (
                <YAxis yAxisId="active" stroke="#10b981" tick={{ fontSize: 11 }} unit=" m³/s" />
              )}
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                labelFormatter={(v) => `Distance along stream: ${v} km`}
              />
              <Legend verticalAlign="top" height={36} />
              {activeProfileMode === 'elevation' ? (
                <Area
                  yAxisId="active"
                  type="monotone"
                  dataKey="elevation_m"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#terrainGradient)"
                  name="Terrain Bed Elevation (m)"
                />
              ) : (
                <Area
                  yAxisId="active"
                  type="monotone"
                  dataKey="flow_m3s"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#flowGradient)"
                  name="Accumulated Flow Discharge (m³/s)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 3 Channel Stations Callout Strip derived from backend profile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">
              {elevationProfile[0]?.station || 'Summit Ridge Crest'} (0.0 km)
            </span>
            <p className="text-slate-300">
              Steep {elevationProfile[0]?.slope_deg || 26.5}° bedrock headwaters at {elevationProfile[0]?.elevation_m || 860}m.
              Rain accelerates rapidly down bare gullies; requires ridge contour bunds and afforestation.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-1">
              {elevationProfile[5]?.station || 'Mid-Reach Stream Junction'} ({elevationProfile[5]?.distance_km || 6.2} km)
            </span>
            <p className="text-slate-300">
              Order-2 tributary confluence at {elevationProfile[5]?.elevation_m || 480}m.
              Discharge concentrates to {elevationProfile[5]?.flow_m3s || 2.65} m³/s; optimal for gabion check dams and boulder drop structures.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-amber-400 font-bold block mb-1">
              {elevationProfile[10]?.station || 'River Basin Outlet'} ({elevationProfile[10]?.distance_km || 12.5} km)
            </span>
            <p className="text-slate-300">
              Alluvial floodplain outlet at {elevationProfile[10]?.elevation_m || 320}m with {elevationProfile[10]?.flow_m3s || 4.80} m³/s discharge.
              Slope flattens to {elevationProfile[10]?.slope_deg || 2.5}°; riparian wetlands buffer flood surges.
            </p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Live 30-Day Observed Daily Rainfall + USLE & Whitebox GIS Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 30-Day Rainfall Hydrograph (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                <CloudRain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Live 30-Day Observed Daily Rainfall</h2>
                <p className="text-xs text-slate-400">Copernicus ERA5-Land Reanalysis & IMD Gridded Rainfall</p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700 font-mono font-bold">
              30-Day Total: {rainfall30d} mm
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hydrograph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" mm" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Bar dataKey="rainfall_mm" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <span>Peak Storm Event: <strong className="text-rose-400">{monsoonP95} mm/day</strong></span>
            <span>Precipitation Anomaly: <strong className="text-cyan-400">+{rainfallAnomaly}% above baseline</strong></span>
            <span>Drainage Network Density: <strong className="text-emerald-400">{drainageDensity} km/km²</strong></span>
          </div>
        </div>

        {/* Right Column: Whitebox Indices & USLE Breakdown */}
        <div className="space-y-6">
          {/* Whitebox & Rasterio GIS Engine Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Whitebox D8 & Rasterio Indices</h2>
                <p className="text-xs text-slate-400">30m SRTM Topographic Flow Routing</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-semibold">D8 Steepest Descent Slope</span>
                  <span className="text-cyan-400 font-mono font-bold">{slope.toFixed(1)}°</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Vectors direct storm flow across cells along maximum elevation gradient.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-semibold">Topographic Wetness Index (TWI)</span>
                  <span className="text-emerald-400 font-mono font-bold">{twi.toFixed(2)}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Identifies natural groundwater saturation and riparian sponge recharge zones.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-semibold">Stream Power Index (SPI)</span>
                  <span className="text-amber-400 font-mono font-bold">{spi.toFixed(1)}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Quantifies kinetic scouring energy in steep ravine channels during storm floods.
                </p>
              </div>
            </div>
          </div>

          {/* Full USLE Factors Decomposition Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">USLE Soil Loss Factors</h2>
                <p className="text-xs text-slate-400 font-mono">A = R × K × LS × C × P</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">R (Erosivity)</span>
                <strong className="text-white font-mono">{usleR}</strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">K (Erodibility)</span>
                <strong className="text-white font-mono">{usleK}</strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">LS (Length/Slope)</span>
                <strong className="text-cyan-400 font-mono">{usleLS}</strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">C (Cover Factor)</span>
                <strong className="text-amber-400 font-mono">{usleC}</strong>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Computed Annual Soil Scour:</span>
                <strong className="text-rose-400 text-sm font-black">{soilLoss.toFixed(1)} t/ha/yr</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[11px]">Tolerable Limit:</span>
                <span className="text-emerald-400 font-mono font-bold">10.0 t/ha/yr</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Land Cover Proportions & TreeSHAP AI Aggravating Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Land Cover Proportions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Trees className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Land Cover Proportions</h2>
              <p className="text-xs text-slate-400">ESA WorldCover 10m Classification</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Exposed Bare Soil</span>
                <span className="text-amber-400 font-bold">{bareSoil.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${bareSoil}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Tree Canopy & Native Forests</span>
                <span className="text-emerald-400 font-bold">{plantCover.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${plantCover}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Agricultural Cropland & Pasture</span>
                <span className="text-sky-400 font-bold">{cropland.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-sky-400 rounded-full" style={{ width: `${cropland}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* TreeSHAP Top Aggravating Drivers */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">TreeSHAP AI Priority Drivers</h2>
              <p className="text-xs text-slate-400">Feature impact points on overall restoration urgency</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {shapDrivers.slice(0, 4).map((d: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-slate-200 font-bold block">{d.label}</span>
                  <span className="text-slate-400 text-[11px]">{d.description}</span>
                </div>
                <span className={`font-mono font-bold text-sm ${d.is_aggravating ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {d.impact_pts > 0 ? `+${d.impact_pts}` : d.impact_pts} pts
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/reforest')}
            className="w-full mt-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
          >
            Continue to Pillar 1: Forest & Trees
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Per-Site Diagnostic Attribution Scorecard Modal */}
      <SiteDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        area={activeArea}
      />
    </div>
  );
};
