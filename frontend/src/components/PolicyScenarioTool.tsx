import React, { useState, useMemo } from 'react';
import {
  Scale,
  Sliders,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Droplets,
  Mountain,
  Trees,
  CloudRain,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { ActiveArea } from '../types';

interface PolicyScenarioToolProps {
  area: ActiveArea | null;
}

interface PolicyPreset {
  id: string;
  name: string;
  description: string;
  weights: {
    erosion: number;
    runoff: number;
    landcover: number;
    rainfall: number;
    exposure: number;
  };
}

const POLICY_PRESETS: PolicyPreset[] = [
  {
    id: 'baseline',
    name: '1. Standard Baseline (PVI Balance)',
    description: 'National standard balanced weighting across all 5 physical and socio-ecological indicators.',
    weights: { erosion: 20, runoff: 25, landcover: 15, rainfall: 20, exposure: 20 },
  },
  {
    id: 'erosion_focus',
    name: '2. Severe Soil Loss & Sedimentation',
    description: 'Prioritizes steep hillside topsoil bleed, gully incisions, and reservoir siltation prevention.',
    weights: { erosion: 45, runoff: 15, landcover: 20, rainfall: 10, exposure: 10 },
  },
  {
    id: 'flood_mitigation',
    name: '3. Flash Flood Risk & Peak Runoff',
    description: 'Focuses heavily on high-velocity storm runoff attenuation, stream incising, and retention basins.',
    weights: { erosion: 10, runoff: 45, landcover: 10, rainfall: 25, exposure: 10 },
  },
  {
    id: 'settlement_protection',
    name: '4. Downstream Habitation Protection',
    description: 'Maximal weight on human settlement exposure, culvert flood choke points, and bridge washouts.',
    weights: { erosion: 10, runoff: 15, landcover: 10, rainfall: 15, exposure: 50 },
  },
  {
    id: 'forest_biodiversity',
    name: '5. Forest Canopy & Ecosystem Health',
    description: 'Targeted at wildlife corridor fragmentation, bare soil revegetation, and riparian buffer widths.',
    weights: { erosion: 15, runoff: 15, landcover: 45, rainfall: 15, exposure: 10 },
  },
];

export const PolicyScenarioTool: React.FC<PolicyScenarioToolProps> = ({ area }) => {
  const [activePreset, setActivePreset] = useState<string>('baseline');
  const [customWeights, setCustomWeights] = useState({
    erosion: 20,
    runoff: 25,
    landcover: 15,
    rainfall: 20,
    exposure: 20,
  });

  const currentWeights = useMemo(() => {
    if (activePreset === 'custom') return customWeights;
    const found = POLICY_PRESETS.find((p) => p.id === activePreset);
    return found ? found.weights : POLICY_PRESETS[0].weights;
  }, [activePreset, customWeights]);

  const weightSum = currentWeights.erosion + currentWeights.runoff + currentWeights.landcover + currentWeights.rainfall + currentWeights.exposure;

  // Compute normalized scores for the active area
  const slopeDeg = area?.slope_deg || 16.5;
  const rain30d = area?.rainfall_30d_mm || 280.0;
  const soilLoss = area?.soil_loss_t_ha_yr || 24.5;
  const bareSoil = area?.bare_soil_pct || 28.0;
  const drainage = area?.drainage_density || 2.1;

  const normErosion = Math.min(100, Math.round((soilLoss / 45.0) * 100));
  const normRunoff = Math.min(100, Math.round((slopeDeg / 35.0) * 100));
  const normLand = Math.min(100, Math.round((bareSoil / 60.0) * 100));
  const normRain = Math.min(100, Math.round((rain30d / 450.0) * 100));
  const normExposure = Math.min(100, Math.round((drainage / 3.2) * 100));

  // Baseline Score calculation (20, 25, 15, 20, 20)
  const baselineScore = area?.score || Math.round((normErosion * 0.20 + normRunoff * 0.25 + normLand * 0.15 + normRain * 0.20 + normExposure * 0.20) * 10) / 10;

  // Alternate Policy Score calculation
  const altScore = Math.round(
    ((normErosion * currentWeights.erosion +
      normRunoff * currentWeights.runoff +
      normLand * currentWeights.landcover +
      normRain * currentWeights.rainfall +
      normExposure * currentWeights.exposure) /
      Math.max(1, weightSum)) *
      10
  ) / 10;

  const scoreDelta = Math.round((altScore - baselineScore) * 10) / 10;

  const getPriorityCategory = (score: number) => {
    if (score >= 75) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Moderate';
    return 'Low';
  };

  const baselineCategory = getPriorityCategory(baselineScore);
  const altCategory = getPriorityCategory(altScore);

  const handleCustomChange = (key: keyof typeof customWeights, val: number) => {
    setActivePreset('custom');
    setCustomWeights((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleResetToBaseline = () => {
    setActivePreset('baseline');
    setCustomWeights({ erosion: 20, runoff: 25, landcover: 15, rainfall: 20, exposure: 20 });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              Ecological Policy Weights Sensitivity Simulator
            </h2>
            <p className="text-xs text-slate-400">
              Test how alternate governance priorities shift priority scores, urgency categories, and funding allocation
            </p>
          </div>
        </div>

        <button
          onClick={handleResetToBaseline}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Baseline</span>
        </button>
      </div>

      {/* Side-by-Side Outcome Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
        {/* Baseline Standard */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Baseline Standard Policy
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{baselineScore.toFixed(1)}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {baselineCategory} Priority
          </span>
          <p className="text-[11px] text-slate-400 pt-1">Equal 20-25% balanced weights across terrain and socio-economics.</p>
        </div>

        {/* Alternate Policy Outcome */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 space-y-1">
          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block">
            Simulated Policy Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300">{altScore.toFixed(1)}</span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
            altCategory === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
            altCategory === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
            'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {altCategory} Priority
          </span>
          <p className="text-[11px] text-slate-300 pt-1">
            Calculated under current policy configuration ({activePreset.replace(/_/g, ' ')}).
          </p>
        </div>

        {/* Net Delta Impact */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Policy Sensitivity Delta
            </span>
            <div className="flex items-center gap-2 mt-1">
              {scoreDelta >= 0 ? (
                <TrendingUp className="w-5 h-5 text-rose-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-emerald-400" />
              )}
              <span className={`text-xl font-black ${scoreDelta >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {scoreDelta >= 0 ? `+${scoreDelta.toFixed(1)}` : scoreDelta.toFixed(1)} pts
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            {scoreDelta > 3.0
              ? 'Significant escalation: Site becomes high urgency under this policy focus.'
              : scoreDelta < -3.0
              ? 'Priority de-escalation: Site ranks lower when prioritizing these specific criteria.'
              : 'Neutral sensitivity: Site priority remains stable across this policy weight shift.'}
          </p>
        </div>
      </div>

      {/* Preset Buttons Grid */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Select Standard Ecological Policy Scenario
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {POLICY_PRESETS.map((p) => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePreset(p.id)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-400/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <strong className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                    {p.name}
                  </strong>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Sliders for Custom Weights */}
      <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">Fine-Tune Policy Weights (Total: {weightSum}%)</h3>
          </div>
          {weightSum !== 100 && (
            <span className="text-[11px] px-2 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Weights sum to {weightSum}% (Normalized to 100%)
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Erosion */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-cyan-400" />
                Soil Erosion Potential Weight
              </span>
              <strong className="text-cyan-400 font-mono">{currentWeights.erosion}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={currentWeights.erosion}
              onChange={(e) => handleCustomChange('erosion', Number(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Current site observed: {soilLoss} t/ha/yr</span>
          </div>

          {/* Runoff */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                Storm Runoff Potential Weight
              </span>
              <strong className="text-sky-400 font-mono">{currentWeights.runoff}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={currentWeights.runoff}
              onChange={(e) => handleCustomChange('runoff', Number(e.target.value))}
              className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Current site observed: {slopeDeg}° mean slope</span>
          </div>

          {/* Landcover */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                Land Degradation / Bare Soil Weight
              </span>
              <strong className="text-emerald-400 font-mono">{currentWeights.landcover}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={currentWeights.landcover}
              onChange={(e) => handleCustomChange('landcover', Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Current site observed: {bareSoil}% bare ground</span>
          </div>

          {/* Rainfall */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                Rainfall & Monsoon Pressure Weight
              </span>
              <strong className="text-blue-400 font-mono">{currentWeights.rainfall}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={currentWeights.rainfall}
              onChange={(e) => handleCustomChange('rainfall', Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Current site observed: {rain30d} mm precipitation</span>
          </div>

          {/* Downstream Exposure */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-900 border border-slate-800 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Downstream Habitation & Infrastructure Exposure Weight
              </span>
              <strong className="text-amber-400 font-mono">{currentWeights.exposure}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={currentWeights.exposure}
              onChange={(e) => handleCustomChange('exposure', Number(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block">Current site observed: {drainage} km/km² drainage density</span>
          </div>
        </div>
      </div>
    </div>
  );
};
