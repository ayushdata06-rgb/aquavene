import React from 'react';
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
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useResearch } from '../context/ResearchContext';

export const TerrainHealthTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea } = useResearch();

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
            <p className="text-sm text-slate-400 mt-1">
              Live DEM elevations, ESA WorldCover land use, and 30-day precipitation series
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reforest')}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
            >
              Start Pillar 1: Forest & Trees
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
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
          <p className="text-xs text-slate-400 mt-1">XGBoost Multidimensional Index</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Annual Soil Loss</span>
            <span className="text-[11px] text-rose-400 font-semibold">Exceeds limit</span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {f.soil_loss_t_ha_yr} <span className="text-sm text-slate-500 font-normal">t/ha/yr</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Tolerable baseline is &lt; 10 t/ha/yr</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Average Hill Slope</span>
            <Mountain className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2">
            {f.slope_deg}°
          </div>
          <p className="text-xs text-slate-400 mt-1">Relief span: {f.relief_m}m</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
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

      {/* Main Grid: Rainfall Chart + Land Cover + TreeSHAP Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 30-Day Rainfall Series Recharts */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
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
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
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
        </div>

        {/* Right Column: Land Cover Composition & Slope Profile */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Trees className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Land Cover Proportions</h2>
                <p className="text-xs text-slate-400">ESA WorldCover 10m Distribution</p>
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
              className="w-full mt-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
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

