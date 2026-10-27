import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Watershed, WatershedIndicator } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  BarChart3,
  Compass,
  Droplets,
  Layers,
  CloudRain,
  Users,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export const IndicatorAnalysis: React.FC = () => {
  const [watersheds, setWatersheds] = useState<Watershed[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<string>('ws-001');
  const [indicators, setIndicators] = useState<WatershedIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const ws = await api.getWatersheds();
        setWatersheds(ws);
        if (ws.length > 0) setSelectedWsId(ws[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchInd() {
      if (!selectedWsId) return;
      try {
        const data = await api.getWatershedIndicators(selectedWsId);
        setIndicators(data);
      } catch (e) {
        console.error(e);
      }
    }
    fetchInd();
  }, [selectedWsId]);

  if (loading) {
    return <LoadingSkeleton rows={8} />;
  }

  const selectedWs = watersheds.find((w) => w.id === selectedWsId) || watersheds[0];

  const radarData = indicators.map((ind) => ({
    indicator: ind.name.replace(' Potential', '').replace(' Pressure', '').replace(' Exposure', ''),
    score: ind.normalized_score ?? 0,
    fullMark: 100,
  }));

  const indicatorCards = [
    {
      code: 'erosion_potential',
      title: 'Erosion Potential (E)',
      icon: Compass,
      weight: '20% (w₁ = 0.20)',
      dataset: 'USGS SRTM 30m DEM + WorldCover Bare Soil',
      rawUnit: 'Slope-bare index (0-45°)',
      method: 'Screening slope-cover heuristic (NOT a calibrated USLE model).',
      uncertainty: 'Does not model rainfall kinetic energy or soil K-factor directly.',
    },
    {
      code: 'runoff_potential',
      title: 'Runoff Potential (R)',
      icon: Droplets,
      weight: '25% (w₂ = 0.25)',
      dataset: 'WhiteboxTools D8 Accumulation + SRTM Slope',
      rawUnit: 'Log-transformed upstream cells / slope',
      method: 'Hydrological flow accumulation coupled with drainage curvature.',
      uncertainty: 'Not direct discharge (m³/s); screening indicator of overland concentration.',
    },
    {
      code: 'landcover_degradation',
      title: 'Land-Cover Degradation (L)',
      icon: Layers,
      weight: '15% (w₃ = 0.15)',
      dataset: 'ESA WorldCover 10m (2021)',
      rawUnit: 'Fraction of degraded classes (0.0 - 1.0)',
      method: 'Zonal proportion of Class 50 (Built-up) and Class 60 (Bare / Sparse soil).',
      uncertainty: 'Single epoch (2021). Nearest-neighbor interpolation used.',
    },
    {
      code: 'rainfall_pressure',
      title: 'Rainfall Pressure (W)',
      icon: CloudRain,
      weight: '20% (w₄ = 0.20)',
      dataset: 'Copernicus ERA5-Land (~9 km grid)',
      rawUnit: 'mm / year precipitation',
      method: 'Aggregated monthly/annual total precipitation with verification of meter-to-mm units.',
      uncertainty: 'Grid reanalysis product; local convective storms may vary from station gauges.',
    },
    {
      code: 'downstream_exposure',
      title: 'Downstream Exposure (D)',
      icon: Users,
      weight: '20% (w₅ = 0.20)',
      dataset: 'High Resolution Settlement Layer (HRSL) + Census',
      rawUnit: 'Persons count in 10km buffer',
      method: 'Spatial join of downstream drainage buffer with gridded population count.',
      uncertainty: 'Exposure proxy; vulnerable infrastructure and flood barriers not captured.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Indicator Analysis & Diagnostics
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Transparent methodology, raw measurements, units, and uncertainty documentation for the 5 indicators
          </p>
        </div>

        {/* Watershed Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400 font-medium">Selected:</span>
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

      {/* Distinction Alert */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="h-4 w-4 text-aqua-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-white">Methodological Distinction:</strong> AquaVane distinguishes{' '}
          <span className="text-aqua-300">raw physical measurements</span> (such as mm of precipitation or degrees of terrain slope) from{' '}
          <span className="text-brand-300">derived normalized scores (0-100)</span> used for screening prioritization.
          Normalized scores are relative indicators for multi-criteria ranking, not physical engineering quantities.
        </p>
      </div>

      {/* Radar Profile & Indicator Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Profile */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-brand-400" />
              Indicator Profile Radar
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Normalized relative values across the 5 dimensions for {selectedWs.watershed_code}
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="indicator" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
                  <Radar
                    name={selectedWs.name}
                    dataKey="score"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    itemStyle={{ color: '#34d399', fontSize: '11px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-center">
            <span className="text-xs text-slate-400">
              Aggregated Priority Score:{' '}
              <strong className="text-white text-sm font-bold">{selectedWs.overall_score} / 100</strong>
            </span>
          </div>
        </div>

        {/* Breakdown Values Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-aqua-400" />
            Measured Values vs Normalized Scores ({selectedWs.name})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="py-2.5 px-3">Indicator</th>
                  <th className="py-2.5 px-3">Raw Value</th>
                  <th className="py-2.5 px-3">Units</th>
                  <th className="py-2.5 px-3 text-right">Normalized (0-100)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {indicators.map((ind) => (
                  <tr key={ind.indicator_code} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 font-semibold text-white">{ind.name}</td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-200">
                      {ind.raw_value ?? 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{ind.unit}</td>
                    <td className="py-3 px-3 text-right font-bold text-sm text-white">
                      {ind.normalized_score ?? 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 capitalize">
                        {ind.quality_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Methodology & Uncertainty Cards for all 5 indicators */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-brand-400" />
          Technical Specifications & Uncertainty Disclosures
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indicatorCards.map((card) => {
            const Icon = card.icon;
            const currentInd = indicators.find((i) => i.indicator_code === card.code);
            return (
              <div
                key={card.code}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-xl bg-slate-800 text-brand-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white">{card.title}</h4>
                    </div>
                    <span className="text-[11px] font-mono text-aqua-400 font-semibold">
                      {card.weight}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Primary Dataset</span>
                      <span className="text-slate-300 font-medium">{card.dataset}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Measurement Unit</span>
                      <span className="text-slate-300">{card.rawUnit}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block">Methodology</span>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{card.method}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-amber-400/90 font-medium block mb-0.5">Uncertainty Note:</span>
                  <p className="text-slate-400 leading-tight">
                    {currentInd?.uncertainty_note || card.uncertainty}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
