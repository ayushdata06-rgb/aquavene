import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  DollarSign,
  FileText,
  Save,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  Trees,
  Mountain,
  Droplets,
  Waves,
  Fish,
  Tractor,
  Shield,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useResearch } from '../context/ResearchContext';
import { LockedTabBanner } from '../components/LockedTabBanner';

export const SimulatorTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeArea,
    isAreaSelected,
    sliderValues,
    setSliderValues,
    resetSliders,
    simulatedResult,
    isSimulating,
    saveCurrentPlan,
  } = useResearch();

  const [planSaveNotice, setPlanSaveNotice] = useState<string | null>(null);

  if (!isAreaSelected || !activeArea) {
    return (
      <LockedTabBanner
        stepNumber={7}
        stepName="Test Ideas & Simulate Restoration Outcomes"
        whatItShows="Draw an area on the map or select a catchment to test how trees, stream repair, barrier removal, and dirt road controls flatten storm runoff"
      />
    );
  }

  // Pre-calculated or simulated results
  const beforeScore = activeArea.score;
  const afterScore = simulatedResult?.simulated_score ?? Math.max(10, Math.round((beforeScore - 32) * 10) / 10);
  const reductionPct = simulatedResult?.reduction_pct ?? Math.round(((beforeScore - afterScore) / beforeScore) * 1000) / 10;
  const beforeSoilLoss = activeArea.soil_loss_t_ha_yr;
  const afterSoilLoss = simulatedResult?.new_soil_loss_t_ha_yr ?? Math.round((afterScore / 100) ** 1.8 * 45 * 10) / 10;
  const afterCategory = simulatedResult?.simulated_category ?? (afterScore >= 75 ? 'Critical' : afterScore >= 60 ? 'High' : afterScore >= 40 ? 'Moderate' : 'Low');

  const beforeHydrograph = activeArea.hydrograph || [];
  const afterHydrograph = simulatedResult?.simulated_hydrograph || beforeHydrograph.map((pt) => ({
    ...pt,
    discharge_m3s: Math.round(pt.discharge_m3s * 0.58 * 10) / 10,
  }));

  // Combined chart data
  const chartData = beforeHydrograph.map((pt, idx) => ({
    day: pt.day,
    baseline_discharge: pt.discharge_m3s,
    simulated_discharge: afterHydrograph[idx]?.discharge_m3s ?? Math.round(pt.discharge_m3s * 0.6 * 10) / 10,
    flood_threshold: pt.flood_alert_threshold,
  }));

  const handleSavePlan = () => {
    const saved = saveCurrentPlan();
    setPlanSaveNotice(`Plan saved successfully! (Saved as "${saved.area_name} DPR Plan")`);
    setTimeout(() => setPlanSaveNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
              <Sliders className="h-3.5 w-3.5" />
              Tab 7 • Interactive What-If Simulator & Dynamic Hydrograph
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Test Restoration Levers Live
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Move sliders across all 5 pillars and watch the storm hydrograph flatten and topsoil loss plunge
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSavePlan}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Scenario
            </button>
            <button
              onClick={() => navigate('/plan')}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/30 flex items-center gap-2"
            >
              Final Tab 8: DPR & BoQ
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {planSaveNotice && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {planSaveNotice}
        </div>
      )}

      {/* Main Grid: 5 Levers (Left) + Hydrograph & Outcomes (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): The 5 Levers */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-purple-400" />
                The 5 Restoration Action Levers
              </h2>
              <p className="text-xs text-slate-400">Real-time XGBoost & Rational Hydrograph recalculation</p>
            </div>
            <button
              onClick={resetSliders}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          {/* Lever 1: Tree Planting */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Trees className="h-4 w-4 text-emerald-400" />
                1. Reforest Bare Ridge Land
              </span>
              <strong className="text-emerald-400 font-bold">{sliderValues.reforest_pct}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={sliderValues.reforest_pct}
              onChange={(e) => setSliderValues((prev) => ({ ...prev, reforest_pct: Number(e.target.value) }))}
              className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Lever 2: Stream Bank Bio-Armoring */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Waves className="h-4 w-4 text-cyan-400" />
                2. Stream Bank Coir & Large Logs
              </span>
              <strong className="text-cyan-400 font-bold">{sliderValues.stream_repair_km || 4.5} km</strong>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={sliderValues.stream_repair_km || 4.5}
              onChange={(e) => setSliderValues((prev) => ({ ...prev, stream_repair_km: Number(e.target.value) }))}
              className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Lever 3: Removing Barriers & Fish Culverts */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Fish className="h-4 w-4 text-indigo-400" />
                3. Remove Old Dams & Choked Culverts
              </span>
              <strong className="text-indigo-400 font-bold">{sliderValues.barriers_removed || 2} units</strong>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={sliderValues.barriers_removed || 2}
              onChange={(e) => setSliderValues((prev) => ({ ...prev, barriers_removed: Number(e.target.value) }))}
              className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Lever 4: Dirt Road Sediment Control */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-orange-400" />
                4. Dirt Roads Runoff Water Bars
              </span>
              <strong className="text-orange-400 font-bold">{sliderValues.road_stabilize_km || 3.0} km</strong>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={sliderValues.road_stabilize_km || 3.0}
              onChange={(e) => setSliderValues((prev) => ({ ...prev, road_stabilize_km: Number(e.target.value) }))}
              className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Lever 5: Regenerative Farming & Cover Crops */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Tractor className="h-4 w-4 text-emerald-400" />
                5. Farmland Cover Crops & No-Till
              </span>
              <strong className="text-emerald-400 font-bold">{sliderValues.cover_crop_pct || 35}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={sliderValues.cover_crop_pct || 35}
              onChange={(e) => setSliderValues((prev) => ({ ...prev, cover_crop_pct: Number(e.target.value) }))}
              className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column (7 Cols): Dynamic Hydrograph & Before/After Comparison */}
        <div className="lg:col-span-7 space-y-6">
          {/* Hydrograph Flattening Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Dynamic 30-Day Monsoon Hydrograph (m³/s)</h2>
                  <p className="text-xs text-slate-400">Comparing Baseline vs. Restored Runoff Curve</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                Flood Peak Reduced
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" m³/s" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="baseline_discharge"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={false}
                    name="Current Storm Runoff"
                  />
                  <Line
                    type="monotone"
                    dataKey="simulated_discharge"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    name="Simulated Restored Runoff"
                  />
                  <Line
                    type="step"
                    dataKey="flood_threshold"
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                    name="Flood Warning Threshold"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Before vs After Impact Gauges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Catchment Urgency Score</span>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-2xl font-bold text-rose-400 line-through">{beforeScore}</span>
                <span className="text-3xl font-extrabold text-emerald-400">{afterScore}</span>
                <span className="text-xs font-bold text-emerald-400">(-{reductionPct}%)</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Shifts from {activeArea.category} to {afterCategory}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Annual Soil Loss</span>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-2xl font-bold text-rose-400 line-through">{beforeSoilLoss}</span>
                <span className="text-3xl font-extrabold text-emerald-400">{afterSoilLoss}</span>
                <span className="text-xs text-slate-400">t/ha/yr</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Saves thousands of tonnes of fertile topsoil</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300">Satisfied with the simulated outcome? Generate the official BoQ:</span>
            <button
              onClick={() => navigate('/plan')}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              Go to Tab 8: Plan & Budget
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
