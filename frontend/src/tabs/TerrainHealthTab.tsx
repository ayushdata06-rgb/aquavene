import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useResearch } from '../context/ResearchContext';

export const TerrainHealthTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea } = useResearch();

  const [activeProfileMode, setActiveProfileMode] = useState<'elevation' | 'velocity'>('elevation');

  const f = activeArea ? {
    relief_m: activeArea.relief_m,
    slope_deg: activeArea.slope_deg,
    bare_soil_pct: activeArea.bare_soil_pct,
    plant_cover_pct: activeArea.plant_cover_pct,
    rainfall_30d_mm: activeArea.rainfall_30d_mm,
    rainfall_anomaly_pct: activeArea.rainfall_anomaly_pct,
    monsoon_storm_p95: activeArea.monsoon_storm_p95,
    drainage_density: activeArea.drainage_density,
    soil_loss_t_ha_yr: activeArea.soil_loss_t_ha_yr,
    score: activeArea.score,
    category: activeArea.category,
  } : {
    relief_m: 540.0,
    slope_deg: 17.8,
    bare_soil_pct: 34.5,
    plant_cover_pct: 65.5,
    rainfall_30d_mm: 360.0,
    rainfall_anomaly_pct: 42.0,
    monsoon_storm_p95: 92.0,
    drainage_density: 2.15,
    soil_loss_t_ha_yr: 32.4,
    score: 76.8,
    category: 'Critical',
  };

  const hydrograph = activeArea?.hydrograph || [];
  const elevationProfile = activeArea?.hydrology_network?.elevation_profile || [
    { station: 'Summit Ridge Crest', distance_km: 0.0, elevation_m: 860.0, slope_deg: 26.5, flow_m3s: 0.35 },
    { station: '1.2 km', distance_km: 1.2, elevation_m: 785.0, slope_deg: 23.2, flow_m3s: 0.62 },
    { station: '2.5 km', distance_km: 2.5, elevation_m: 690.0, slope_deg: 19.5, flow_m3s: 0.95 },
    { station: '3.8 km', distance_km: 3.8, elevation_m: 610.0, slope_deg: 16.8, flow_m3s: 1.40 },
    { station: '5.0 km', distance_km: 5.0, elevation_m: 540.0, slope_deg: 14.2, flow_m3s: 1.85 },
    { station: 'Mid-Reach Stream Junction', distance_km: 6.2, elevation_m: 480.0, slope_deg: 11.5, flow_m3s: 2.65 },
    { station: '7.5 km', distance_km: 7.5, elevation_m: 430.0, slope_deg: 9.2, flow_m3s: 3.20 },
    { station: '8.8 km', distance_km: 8.8, elevation_m: 390.0, slope_deg: 7.0, flow_m3s: 3.75 },
    { station: '10.0 km', distance_km: 10.0, elevation_m: 360.0, slope_deg: 5.4, flow_m3s: 4.10 },
    { station: '11.2 km', distance_km: 11.2, elevation_m: 335.0, slope_deg: 3.8, flow_m3s: 4.45 },
    { station: 'River Outlet', distance_km: 12.5, elevation_m: 320.0, slope_deg: 2.5, flow_m3s: 4.80 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
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
            <p className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="text-slate-300">
                Whitebox D8 Stream Routing • Rasterio DEM Relief • ESA WorldCover 10m Land Use
              </span>
              <span>•</span>
              <span className="text-cyan-400 font-medium">
                {activeArea?.location?.river_basin || 'Catchment Basin'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reforest')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              Start Pillar 1: Forest & Trees
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Restoration Urgency</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              f.category === 'Critical' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {f.category}
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {f.score} <span className="text-sm text-slate-500 font-normal">/ 100</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">XGBoost Multidimensional Priority</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Annual Soil Loss</span>
            <span className="text-[11px] text-rose-400 font-semibold font-mono">3.2x Tolerable</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {f.soil_loss_t_ha_yr} <span className="text-sm text-slate-500 font-normal">t/ha/yr</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Safe threshold &lt; 10 t/ha/yr</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Average Hill Slope</span>
            <Mountain className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {f.slope_deg}°
          </div>
          <p className="text-xs text-slate-400 mt-1">Relief drop: {f.relief_m}m</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Bare Topsoil Ratio</span>
            <Trees className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2">
            {f.bare_soil_pct}%
          </div>
          <p className="text-xs text-slate-400 mt-1">Needs vegetative armor</p>
        </div>
      </div>

      {/* Stream Longitudinal Elevation & Flow Velocity Profile Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
              <Mountain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stream Longitudinal Elevation & Discharge Profile</h2>
              <p className="text-xs text-slate-400">Whitebox D8 continuous gradient descent from summit ridge crest to river outlet</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveProfileMode('elevation')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeProfileMode === 'elevation'
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Elevation (m)
            </button>
            <button
              onClick={() => setActiveProfileMode('velocity')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeProfileMode === 'velocity'
                  ? 'bg-emerald-500 text-white shadow-sm'
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
              <YAxis yAxisId="elev" stroke="#38bdf8" tick={{ fontSize: 11 }} unit=" m" domain={['auto', 'auto']} />
              <YAxis yAxisId="flow" orientation="right" stroke="#10b981" tick={{ fontSize: 11 }} unit=" m³/s" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                labelFormatter={(v) => `Distance along stream: ${v} km`}
              />
              <Legend verticalAlign="top" height={36} />
              <Area
                yAxisId="elev"
                type="monotone"
                dataKey="elevation_m"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#terrainGradient)"
                name="Terrain Bed Elevation (m)"
              />
              <Line
                yAxisId="flow"
                type="monotone"
                dataKey="flow_m3s"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#10b981' }}
                name="Accumulated Flow Discharge (m³/s)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel Stations Callout Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-cyan-400 font-bold block mb-1">Station 1: High Ridge Crest (0 - 3 km)</span>
            <p className="text-slate-300">
              Steep 26.5° bedrock headwater. Water accelerates rapidly down bare gullies; requires contour bunds and ridge tree planting to arrest velocity.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-emerald-400 font-bold block mb-1">Station 6: Tributary Confluence (6 - 8 km)</span>
            <p className="text-slate-300">
              Order 2 stream merger. Discharge doubles to 2.65 m³/s; ideal reach for Large Woody Debris flow deflectors and rock-ramp fishways.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-amber-400 font-bold block mb-1">Station 11: River Basin Outlet (10 - 12 km)</span>
            <p className="text-slate-300">
              Broad alluvial floodplain. Stream slope flattens to 2.5°; reconnection with riparian wetlands dissipates storm flood surges.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Whitebox Engine Card + 30-Day Rainfall Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 30-Day Rainfall Series Recharts (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <CloudRain className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Live 30-Day Observed Daily Rainfall</h2>
                <p className="text-xs text-slate-400">Streamed via Open-Meteo ECMWF API for exact coordinates</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Total: {f.rainfall_30d_mm} mm
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

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Peak Monsoon Storm: <strong className="text-rose-400">{f.monsoon_storm_p95} mm/day</strong></span>
            <span>Rainfall Anomaly: <strong className="text-cyan-400">+{f.rainfall_anomaly_pct}% above normal</strong></span>
            <span>Drainage Density: <strong className="text-emerald-400">{f.drainage_density} km/km²</strong></span>
          </div>
        </div>

        {/* Right Column: Whitebox GIS & Land Cover Distribution */}
        <div className="space-y-6">
          {/* Whitebox & Rasterio Analysis Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Whitebox & Rasterio GIS Engine</h2>
                <p className="text-xs text-slate-400">D8 Hydrological Routing & Topographic Indices</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-semibold">D8 Steepest Descent Slope</span>
                  <span className="text-cyan-400 font-mono font-bold">{f.slope_deg}°</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Vectors direct storm flow across cells along maximum elevation drop.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-semibold">Topographic Wetness Index (TWI)</span>
                  <span className="text-emerald-400 font-mono font-bold">7.85</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Identifies natural groundwater saturation and wetland sponge zones.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-300 font-semibold">Stream Power Index (SPI)</span>
                  <span className="text-amber-400 font-mono font-bold">42.8</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Quantifies erosion energy in steep ravine channels during storms.
                </p>
              </div>
            </div>
          </div>

          {/* Land Cover Proportions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2.5 mb-4">
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
                  <span className="text-amber-400 font-bold">{f.bare_soil_pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${f.bare_soil_pct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Tree Canopy & Forests</span>
                  <span className="text-emerald-400 font-bold">{f.plant_cover_pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${f.plant_cover_pct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Agricultural Cropland</span>
                  <span className="text-sky-400 font-bold">{Math.round(Math.max(10, 100 - f.bare_soil_pct - f.plant_cover_pct))}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.round(Math.max(10, 100 - f.bare_soil_pct - f.plant_cover_pct))}%` }} />
                </div>
              </div>
            </div>

            {/* TreeSHAP Top Aggravating Drivers */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                Key AI Priority Drivers (TreeSHAP)
              </h3>
              <div className="space-y-2">
                {(activeArea?.shap_drivers || []).slice(0, 3).map((d, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-300 font-medium">{d.label}</span>
                    <span className={`font-bold ${d.is_aggravating ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {d.impact_pts > 0 ? `+${d.impact_pts}` : d.impact_pts} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/reforest')}
              className="w-full mt-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              Continue to Tab 4: Forest & Trees
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
