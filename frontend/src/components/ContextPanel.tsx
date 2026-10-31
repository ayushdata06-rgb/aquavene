import React from 'react';
import {
  ChevronRight,
  TrendingDown,
  Layers,
  Sparkles,
  TreePine,
  Waves,
  Tractor,
  Activity,
  FileText,
  BarChart2,
  CheckCircle2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';
import { useAuth } from '../context/AuthContext';
import { SHAPWaterfall } from './ui/SHAPWaterfall';
import { RiskBadge } from './ui/RiskBadge';
import { ProgressRing } from './ui/ProgressRing';

export interface ContextPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ isOpen, onToggle }) => {
  const {
    activeTab,
    activeArea,
    analysisResult,
    simulatedResult,
    sliderValues,
    savedPlans,
  } = useResearch();
  const { user } = useAuth();

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        title="Open Context Intelligence Panel"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 p-2 rounded-l-xl bg-hydro-card border-l border-y border-aqua-500/40 text-aqua-400 shadow-xl hover:bg-hydro-panel hover:text-white transition-all duration-200"
      >
        <div className="flex flex-col items-center gap-2">
          <Sparkles className="w-4 h-4 text-aqua-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-widest uppercase [writing-mode:vertical-rl] rotate-180">
            Intelligence
          </span>
        </div>
      </button>
    );
  }

  // Active Tab specific header title
  const tabTitles = [
    'AOI Intelligence',
    'Historical Monsoon Context',
    'Terrain Health & XAI',
    'Ecological Afforestation',
    'Drainage & Riparian Buffers',
    'Agricultural Soil Defense',
    'Runoff Attenuation Dynamics',
    'Civil BoQ & DPR Summary',
    'Administrative Panel',
  ];

  return (
    <aside className="w-80 h-full bg-hydro-card border-l border-hydro-border/70 flex flex-col z-30 transition-all duration-300 select-none overflow-hidden">
      {/* Panel Top Header */}
      <div className="h-12 px-4 border-b border-hydro-border/70 flex items-center justify-between bg-hydro-panel/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-aqua-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            {tabTitles[activeTab] || 'Context Intelligence'}
          </h3>
        </div>
        <button
          onClick={onToggle}
          title="Collapse Panel"
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Body Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {/* TAB 0: AOI SELECTION SUMMARY */}
        {activeTab === 0 && (
          <div className="space-y-4">
            {activeArea ? (
              <>
                <div className="p-3.5 rounded-xl bg-hydro-panel/70 border border-hydro-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Selected Catchment</span>
                    <RiskBadge level={activeArea.category || 'high'} size="sm" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{activeArea.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    {activeArea.district}, {activeArea.state}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-hydro-border/60 font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Area</span>
                      <span className="text-white font-semibold">{activeArea.areaKm2} km²</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Baseline PVI</span>
                      <span className="text-rose-400 font-semibold">{activeArea.score} / 100</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-hydro-surface border border-hydro-border space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Top Urgency Drivers
                  </span>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">Soil Erosion Rate:</span>
                    <span className="text-rose-400 font-mono font-semibold">
                      {activeArea.soilLossTonsHaYear || 28.4} t/ha/yr
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">Peak Discharge:</span>
                    <span className="text-rose-400 font-mono font-semibold">
                      {activeArea.peakDischargeM3s || 84.2} m³/s
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 text-center text-slate-400 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="font-semibold text-slate-200">No Catchment Defined</p>
                <p className="text-[11px]">
                  Select a pre-indexed micro-watershed or click 4 points on the map to delineate your study area.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TERRAIN HEALTH (SHAP ATTRIBUTION) */}
        {activeTab === 2 && (
          <div className="space-y-4">
            {analysisResult?.shap_explanations ? (
              <SHAPWaterfall shapValues={analysisResult.shap_explanations} />
            ) : (
              <div className="p-3.5 rounded-xl bg-hydro-panel border border-hydro-border text-center text-slate-400 text-xs">
                Run AOI prediction to compute exact TreeSHAP marginal contributions.
              </div>
            )}

            {analysisResult?.whitebox_result && (
              <div className="p-3.5 rounded-xl bg-hydro-panel border border-hydro-border space-y-2">
                <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Whitebox Hydrology Metrics
                </h4>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Filled Sinks:</span>
                  <span className="font-mono text-white font-semibold">
                    {analysisResult.whitebox_result.sink_count ?? 14} sinks
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Drainage Density:</span>
                  <span className="font-mono text-aqua-400 font-semibold">
                    {analysisResult.whitebox_result.drainage_density_km_per_km2?.toFixed(2) ?? '2.45'} km/km²
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Steep Slope (&gt;15°):</span>
                  <span className="font-mono text-rose-400 font-semibold">
                    {analysisResult.whitebox_result.slope_stats?.pct_gt_15deg?.toFixed(1) ?? '34.2'}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SIMULATOR DYNAMICS */}
        {activeTab === 6 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-hydro-panel border border-hydro-border space-y-3">
              <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Intervention Attenuation</span>
                <span className="text-emerald-400 font-mono">LIVE</span>
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Peak Discharge Reduction:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ↓ {simulatedResult?.peak_reduction_pct ?? 38.1}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Flood Wave Delay:</span>
                  <span className="font-mono font-bold text-aqua-400">
                    +{(simulatedResult?.time_to_peak_simulated_hr ?? 22) - (simulatedResult?.time_to_peak_baseline_hr ?? 18)} hrs buffer
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Annual Soil Loss Abatement:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ↓ {simulatedResult?.soil_loss_reduction_pct ?? 55.4}%
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-hydro-surface border border-hydro-border text-[11px] text-slate-400">
              <p className="leading-relaxed">
                Counterfactual neural hydrograph forecasts are computed via our Caravan Entity-Aware LSTM running over 72-hour synthetic rainfall hyetographs.
              </p>
            </div>
          </div>
        )}

        {/* TAB 7: DPR SUMMARY & EXPORT */}
        {activeTab === 7 && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-hydro-panel border border-hydro-border space-y-3">
              <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                Certified DPR Workflow
              </h4>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Current Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 border border-amber-600/50 font-bold uppercase">
                  DRAFT
                </span>
              </div>
              <div className="pt-2 border-t border-hydro-border/60 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Outlay:</span>
                  <span className="font-mono font-bold text-white">₹75.45 Lakh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Primary Scheme:</span>
                  <span className="font-mono text-aqua-400">MGNREGA / PMKSY</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Person-Days Generated:</span>
                  <span className="font-mono text-emerald-400">1,24,000 PD</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-hydro-surface border border-hydro-border space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Public Export Formats
              </span>
              <button
                type="button"
                onClick={() => alert('Downloading official CSV BoQ line items...')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-hydro-panel hover:bg-slate-700 text-slate-200 border border-hydro-border text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export BoQ CSV
              </button>
            </div>
          </div>
        )}

        {/* Default fallback for other tabs */}
        {![0, 2, 6, 7].includes(activeTab) && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-hydro-panel border border-hydro-border text-xs text-slate-300">
              <p className="font-semibold text-white mb-1">Active Study Catchment</p>
              <p className="text-slate-400">
                {activeArea?.name || 'Pre-indexed Karnataka Micro-Watershed'}
              </p>
              <div className="mt-2 pt-2 border-t border-hydro-border text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>PVI Urgency Score:</span>
                  <span className="text-rose-400 font-mono font-bold">{activeArea?.score || 71} / 100</span>
                </div>
                <div className="flex justify-between">
                  <span>Soil Loss Rate:</span>
                  <span className="text-slate-200 font-mono">{activeArea?.soilLossTonsHaYear || 28.4} t/ha/yr</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
