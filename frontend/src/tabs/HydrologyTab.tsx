import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Waves,
  CloudRain,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  Info,
  Droplets,
  Mountain,
  Compass,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useResearch } from '../context/ResearchContext';
import { LockedTabBanner } from '../components/LockedTabBanner';

export const HydrologyTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea, isAreaSelected, setActiveStep } = useResearch();

  useEffect(() => {
    setActiveStep(3);
  }, []);

  if (!isAreaSelected || !activeArea) {
    return (
      <LockedTabBanner
        stepNumber={3}
        stepName="Understand the Water Flow"
        whatItShows="This step models 30-day monsoon rainfall against streamflow discharge, highlights flood risk days, and identifies natural groundwater recharge spots"
      />
    );
  }

  const hydrographData = activeArea.hydrograph || [];
  const floodLimit = hydrographData[0]?.flood_alert_threshold || Math.round(activeArea.area_sq_km * 1.2 * 10) / 10;
  const riskyDays = hydrographData.filter((d) => d.discharge_m3s > floodLimit);
  const peakDay = hydrographData.reduce(
    (max, d) => (d.discharge_m3s > max.discharge_m3s ? d : max),
    hydrographData[0] || { day: 'Day 18', discharge_m3s: 48.2, rainfall_mm: 85 }
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Step 3 of 4</span>
            <span>•</span>
            <span className="text-cyan-400">Hydrology & Flood Diagnostics</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            What Is the Water Doing?
          </h1>
          <p className="text-xs text-slate-400">
            {activeArea.name} ({activeArea.area_sq_km} km²) • Hills rise {activeArea.relief_m} m above the lowest valley point
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/rankings')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Priority
          </button>
          <button
            onClick={() => navigate('/simulator')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
          >
            <span>Plan the restoration works</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Key Numbers Row (3 Big Plain-Language Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: 30-Day Rain */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              Rain in Last 30 Days
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Copernicus ERA5
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-white">{activeArea.rainfall_30d_mm}</span>
            <span className="text-xs text-slate-400 font-medium">mm</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Total rainfall that fell across this catchment during the active monsoon screening period.
          </p>
        </div>

        {/* Card 2: Compared to Normal */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Compared to Normal Season
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeArea.rainfall_anomaly_pct >= 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {activeArea.rainfall_anomaly_pct >= 0 ? 'Heavy Season' : 'Below Normal'}
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-white">
              {activeArea.rainfall_anomaly_pct >= 0 ? `+${activeArea.rainfall_anomaly_pct}%` : `${activeArea.rainfall_anomaly_pct}%`}
            </span>
            <span className="text-xs text-slate-400 font-medium">vs 30-yr baseline</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {activeArea.rainfall_anomaly_pct >= 0
              ? `${activeArea.rainfall_anomaly_pct}% more storm rainfall than the 30-year historical average.`
              : `${Math.abs(activeArea.rainfall_anomaly_pct)}% less rainfall than normal, indicating drought pressure.`}
          </p>
        </div>

        {/* Card 3: Heaviest Storm */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Heaviest Storm Peak
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
              95th-Percentile
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-extrabold text-rose-400">{activeArea.monsoon_storm_p95}</span>
            <span className="text-xs text-slate-400 font-medium">mm in 24 hrs</span>
          </div>
          <p className="text-[11px] text-slate-400">
            A storm this intense occurs approximately once every 20 days during peak monsoon.
          </p>
        </div>
      </div>

      {/* Flood Alert Banner */}
      {riskyDays.length > 0 ? (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-xs font-bold text-rose-300 block">
              Warning: Stream flood limit exceeded on {riskyDays.length} day{riskyDays.length > 1 ? 's' : ''}
            </strong>
            <p className="text-xs text-rose-200/80 leading-relaxed">
              On <strong>{peakDay.day}</strong>, streamflow discharge peaked at <strong>{peakDay.discharge_m3s} m³/s</strong>, crossing the safe bankfull limit of {floodLimit} m³/s. Water spilled over banks into agricultural fields.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-xs font-bold text-emerald-300 block">
              Good news: The stream stayed within its safe flood limit this month
            </strong>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Peak storm discharge remained below {floodLimit} m³/s. Building check dams here will primarily focus on recharging groundwater wells rather than flash flood mitigation.
            </p>
          </div>
        </div>
      )}

      {/* 30-Day Monsoon Rain and Flow Chart */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Waves className="w-4 h-4 text-cyan-400" />
              30-Day Rain and Stream Flow Chart
            </h2>
            <p className="text-xs text-slate-400">
              Grey bars show daily rainfall (mm); the blue line tracks rushing stream discharge (m³/s)
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-600" />
              <span className="text-slate-300">Rain (mm)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-cyan-400" />
              <span className="text-slate-300">Water in stream (m³/s)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-rose-400" />
              <span className="text-rose-400">Flood limit</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={hydrographData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis
                yAxisId="left"
                stroke="#38bdf8"
                tick={{ fontSize: 10 }}
                label={{ value: 'Streamflow (m³/s)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 10 }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#94a3b8"
                tick={{ fontSize: 10 }}
                label={{ value: 'Rainfall (mm)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                formatter={(val: any, name: string) => [
                  `${val} ${name.includes('Rain') ? 'mm' : 'm³/s'}`,
                  name,
                ]}
              />
              <ReferenceLine
                yAxisId="left"
                y={floodLimit}
                stroke="#f43f5e"
                strokeDasharray="4 4"
                label={{ value: `Flood Limit (${floodLimit} m³/s)`, fill: '#f43f5e', fontSize: 10, position: 'top' }}
              />
              <Bar yAxisId="right" dataKey="rainfall_mm" name="Rain (mm)" fill="#334155" radius={[4, 4, 0, 0]} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="discharge_m3s"
                name="Water in stream (m³/s)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 2, fill: '#38bdf8' }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: Water-Collecting Spots (TWI) & Stream Size Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card A: Water-Collecting Spots (TWI Map) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Best Places to Store Groundwater</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Using Topographic Wetness Index (TWI) math, the computer finds natural depressions where valley slopes flatten and rainwater gathers into puddles instead of running away.
          </p>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Identified Low-Lying Pooling Zones:</span>
              <strong className="text-emerald-400 font-bold">3 High-Recharge Spots</strong>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  1
                </span>
                <div>
                  <strong className="text-white">Mid-Reach Farm Depression (North)</strong>
                  <p className="text-[11px] text-slate-400">
                    Gentle 4.2° slope. High soil absorption rate. Ideal for a <strong>Percolation Tank</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  2
                </span>
                <div>
                  <strong className="text-white">Stream Confluence Basin (East)</strong>
                  <p className="text-[11px] text-slate-400">
                    Two Order-2 streams merge here. Ideal for a <strong>Gabion Check Dam + Silt Trap</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0">
                  3
                </span>
                <div>
                  <strong className="text-white">Village Common Grazing Depression</strong>
                  <p className="text-[11px] text-slate-400">
                    Clayey soil layer. Holds water 4 months post-monsoon. Ideal for a <strong>Community Farm Pond</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card B: Stream Size Breakdown (Strahler Orders) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Stream Size Hierarchy & Civil Strategy</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Different sizes of streams require completely different engineering structures:
          </p>

          <div className="space-y-2.5">
            {/* Level 1 & 2 */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                    Levels 1 & 2
                  </span>
                  <strong className="text-xs text-white">Small Headwater Gullies</strong>
                </div>
                <p className="text-[11px] text-slate-400">
                  Fast torrential water. Recommended: <strong>Silt traps & contour trenches</strong> along ridges.
                </p>
              </div>
              <button
                onClick={() => navigate('/simulator')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0"
              >
                Plan here →
              </button>
            </div>

            {/* Level 3 & 4 */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                    Levels 3 & 4
                  </span>
                  <strong className="text-xs text-white">Medium Stream Channels</strong>
                </div>
                <p className="text-[11px] text-slate-400">
                  Carries heavy mud. Recommended: <strong>Cascading stone & masonry check dams</strong>.
                </p>
              </div>
              <button
                onClick={() => navigate('/simulator')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0"
              >
                Plan here →
              </button>
            </div>

            {/* Level 5 */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                    Level 5
                  </span>
                  <strong className="text-xs text-white">Main River Reaches</strong>
                </div>
                <p className="text-[11px] text-slate-400">
                  High volume flow. Recommended: <strong>Major barrage / flood control embankments</strong>.
                </p>
              </div>
              <button
                onClick={() => navigate('/simulator')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold shrink-0"
              >
                Plan here →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Step Forward Button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={() => navigate('/rankings')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Priority
        </button>

        <button
          onClick={() => navigate('/simulator')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
        >
          <span>Plan the restoration works</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

