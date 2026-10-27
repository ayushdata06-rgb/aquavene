import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { RainfallMonthly, Watershed } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  CloudRain,
  Calendar,
  AlertTriangle,
  Info,
  Droplets,
  TrendingUp,
  Filter,
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
} from 'recharts';

export const RainfallClimate: React.FC = () => {
  const [watersheds, setWatersheds] = useState<Watershed[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string>('ws-001');
  const [rainfallData, setRainfallData] = useState<RainfallMonthly[]>([]);
  const [aggregation, setAggregation] = useState<'monthly' | 'monsoon' | 'annual'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const ws = await api.getWatersheds();
        setWatersheds(ws);
        const data = await api.getRainfallMonthly(selectedWsId);
        setRainfallData(data);
      } catch (err) {
        console.error('Failed to load rainfall data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedWsId]);

  if (loading) {
    return <LoadingSkeleton rows={6} />;
  }

  const selectedWs = watersheds.find((w) => w.id === selectedWsId) || watersheds[0];
  const annualTotal = rainfallData.reduce((acc, curr) => acc + curr.precipitation_mm, 0);
  const monsoonTotal = rainfallData
    .filter((d) => ['Jun', 'Jul', 'Aug', 'Sep'].includes(d.month))
    .reduce((acc, curr) => acc + curr.precipitation_mm, 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Rainfall & Climate Analysis
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Copernicus ERA5-Land reanalysis precipitation inspection, accumulation semantics, and seasonal patterns
          </p>
        </div>

        {/* Watershed Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Watershed:</span>
          <select
            value={selectedWsId}
            onChange={(e) => setSelectedWsId(e.target.value)}
            className="text-xs bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-brand-500 font-medium"
          >
            {watersheds.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.watershed_code} - {ws.name} ({ws.state})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mandatory Technical Disclaimer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
        <div className="flex items-center space-x-2 font-semibold text-aqua-400">
          <Info className="h-4 w-4 shrink-0" />
          <span>ERA5-Land NetCDF Processing Specifications & Accumulation Semantics</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Precipitation data is sourced from Copernicus ERA5-Land reanalysis at ~9 km (0.1°) horizontal resolution.
          Raw values in ERA5-Land are delivered as liquid-equivalent depth in <strong>meters (m)</strong> and have been
          rigorously converted to <strong>millimeters (mm)</strong> (× 1000). Precipitation in ERA5-Land represents
          accumulated totals over forecasting time steps rather than instantaneous fluxes. Only periods present in the
          ingested NetCDF files are reported; no artificial interpolation across missing historical dates is performed.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase">
            <span>Mean Annual Total</span>
            <CloudRain className="h-4 w-4 text-brand-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{annualTotal}</span>
            <span className="text-xs text-slate-400 font-mono">mm / year</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Multi-year reanalysis baseline</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase">
            <span>Monsoon Precipitation (JJAS)</span>
            <Droplets className="h-4 w-4 text-aqua-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{monsoonTotal}</span>
            <span className="text-xs text-slate-400 font-mono">mm ({Math.round((monsoonTotal / annualTotal) * 100)}%)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">June - September Southwest Monsoon</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase">
            <span>Spatial Grid Cell Resolution</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">0.1° (~9 km)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">ECMWF Integrated Forecasting System</p>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <CloudRain className="h-4 w-4 text-aqua-400" />
            Monthly Hyetograph & Precipitation Anomaly ({selectedWs.name})
          </h3>

          <div className="flex items-center space-x-1.5 text-xs bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setAggregation('monthly')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                aggregation === 'monthly'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAggregation('monsoon')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                aggregation === 'monsoon'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monsoon Focus
            </button>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rainfallData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                unit=" mm"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#64748b"
                tick={{ fontSize: 10 }}
                unit=" mm"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                itemStyle={{ fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar
                yAxisId="left"
                dataKey="precipitation_mm"
                name="Monthly Precipitation (mm)"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="anomaly_mm"
                name="Historical Anomaly (mm)"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
