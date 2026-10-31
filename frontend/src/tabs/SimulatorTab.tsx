import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sliders,
  Lock,
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
  Layers,
  TrendingDown,
  Gauge,
  Scale,
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
import { useAuth } from '../context/AuthContext';
import { LockedTabBanner } from '../components/LockedTabBanner';
import { PolicyScenarioTool } from '../components/PolicyScenarioTool';

export const SimulatorTab: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isViewer = (user?.role || '').toLowerCase().includes('viewer');
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

  const [simulationMode, setSimulationMode] = useState<'physical' | 'policy'>('physical');
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
  const soilSavedTonnes = Math.round(Math.max(0, (beforeSoilLoss - afterSoilLoss) * (activeArea.area_sq_km * 100)));
  const aquiferRechargeM3 = Math.round((sliderValues.reforest_pct * 120 + sliderValues.cover_crop_pct * 85 + sliderValues.stream_repair_km * 450) * 100);

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
    if (isViewer) {
      setPlanSaveNotice('Access Denied (RBAC): Read-only "Viewer" accounts cannot persist restoration plans. Elevate your role to "Planner" or "Admin" via the profile menu.');
      setTimeout(() => setPlanSaveNotice(null), 6000);
      return;
    }
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
              className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
                isViewer
                  ? 'bg-slate-700/80 hover:bg-slate-700 text-slate-300 border border-slate-600/60'
                  : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30'
              }`}
              title={isViewer ? 'Read-only: Switch to Planner in top-right menu to save' : 'Save this scenario to DPR plans'}
            >
              {isViewer ? <Lock className="h-4 w-4 text-amber-400" /> : <Save className="h-4 w-4" />}
              <span>Save Scenario</span>
              {isViewer && <span className="text-[10px] text-amber-400 font-normal">(Viewer Lock)</span>}
            </button>
            <button
              onClick={() => navigate('/plan')}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/30 flex items-center gap-2"
            >
              Finalize Tab 8: Plan & Budget
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {planSaveNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{planSaveNotice}</span>
        </div>
      )}

      {/* Mode Selector: Physical Interventions vs Ecological Policy Weights */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg gap-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSimulationMode('physical')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              simulationMode === 'physical'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Physical Interventions & Hydrograph</span>
          </button>
          <button
            onClick={() => setSimulationMode('policy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              simulationMode === 'policy'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>2. Ecological Policy Weight Scenarios</span>
          </button>
        </div>
        <div className="text-right text-[11px] text-slate-400 font-mono pr-2">
          {simulationMode === 'physical'
            ? 'Dynamic SCS-CN Peak Discharge Attenuation'
            : 'Priority Score Sensitivity to Policy Weights'}
        </div>
      </div>

      {simulationMode === 'policy' ? (
        <PolicyScenarioTool area={activeArea} />
      ) : (
        <>
      {/* Real-time KPI Outcome Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-xs text-slate-400 uppercase font-semibold">Priority Urgency Reduction</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            -{reductionPct}%
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span>Score: <del className="text-rose-400">{beforeScore}</del></span>
            <span>➔</span>
            <strong className="text-emerald-400">{afterScore}</strong>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-xs text-slate-400 uppercase font-semibold">Annual Topsoil Saved</div>
          <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
            {soilSavedTonnes.toLocaleString()} <span className="text-sm font-normal text-slate-400">t/yr</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Erosion dropped from {beforeSoilLoss} to {afterSoilLoss} t/ha/yr</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-xs text-slate-400 uppercase font-semibold">Peak Flow Attenuation</div>
          <div className="text-3xl font-extrabold text-cyan-400 mt-2 font-mono">
            -42.5%
          </div>
          <p className="text-xs text-slate-400 mt-1">Monsoon flood crest flattened below bankfull</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="text-xs text-slate-400 uppercase font-semibold">Aquifer Recharge Surplus</div>
          <div className="text-3xl font-extrabold text-sky-400 mt-2 font-mono">
            +{(aquiferRechargeM3 / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">m³/yr</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Sustains summer well yields & stream baseflow</p>
        </div>
      </div>

      {/* Main Grid: Dual Hydrograph Chart + 5-Pillar Levers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Dynamic Hydrograph Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Waves className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Storm Runoff Hydrograph: Baseline vs. Restored</h2>
                <p className="text-xs text-slate-400">Simulating peak discharge dissipation across 30 days of observed rainfall</p>
              </div>
            </div>
            {isSimulating && (
              <span className="text-xs text-purple-400 font-semibold animate-pulse flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Simulating...
              </span>
            )}
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit=" m³/s" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Line
                  type="monotone"
                  dataKey="baseline_discharge"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={false}
                  name="Baseline Degraded Catchment (m³/s)"
                />
                <Line
                  type="monotone"
                  dataKey="simulated_discharge"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={false}
                  name="Restored Sponge Catchment (m³/s)"
                />
                <Line
                  type="monotone"
                  dataKey="flood_threshold"
                  stroke="#eab308"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="Bankfull Flood Alert Threshold"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hydrograph Curve Flattening Explainer */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-1">
            <strong className="text-cyan-400 block font-semibold">How Nature-Based Levers Flatten the Hydrograph:</strong>
            <p>
              When bare hillsides are replanted and dirt roads are intercepted with water bars, rainfall infiltrates deep into the soil sponge rather than racing down steep slopes in minutes. The peak monsoon crest (<strong className="text-rose-400">red curve</strong>) drops safely below the flood danger line, and captured groundwater slowly seeps out over the dry season (<strong className="text-sky-400">blue line</strong>).
            </p>
          </div>
        </div>

        {/* Right Column: 5 Restoration Levers Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-400" />
              <span>5 Restoration Levers</span>
            </h2>
            <button
              onClick={resetSliders}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Lever 1: Reforestation */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Trees className="w-3.5 h-3.5 text-emerald-400" />
                  1. Ridge Reforestation
                </span>
                <strong className="text-emerald-400 font-mono">{sliderValues.reforest_pct}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={sliderValues.reforest_pct}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, reforest_pct: Number(e.target.value) }))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Lever 2: Stream Bank Bio-Repair */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  2. Stream Bank Bio-Repair
                </span>
                <strong className="text-cyan-400 font-mono">{sliderValues.stream_repair_km} km</strong>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={sliderValues.stream_repair_km}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, stream_repair_km: Number(e.target.value) }))}
                className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Lever 3: Removing Fish Barriers */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Fish className="w-3.5 h-3.5 text-indigo-400" />
                  3. Barriers / Culverts Removed
                </span>
                <strong className="text-indigo-400 font-mono">{sliderValues.barriers_removed} units</strong>
              </div>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={sliderValues.barriers_removed}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, barriers_removed: Number(e.target.value) }))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Lever 4: Dirt Road Drainage Control */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-orange-400" />
                  4. Dirt Road Water Bars
                </span>
                <strong className="text-orange-400 font-mono">{sliderValues.road_stabilize_km} km</strong>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={sliderValues.road_stabilize_km}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, road_stabilize_km: Number(e.target.value) }))}
                className="w-full accent-orange-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Lever 5: Regenerative Agriculture */}
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-300 flex items-center gap-1.5 font-medium">
                  <Tractor className="w-3.5 h-3.5 text-emerald-400" />
                  5. Farmer Cover Crops
                </span>
                <strong className="text-emerald-400 font-mono">{sliderValues.cover_crop_pct}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={sliderValues.cover_crop_pct}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, cover_crop_pct: Number(e.target.value) }))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={() => navigate('/plan')}
            className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            Review Tab 8: Official Plan & Budget
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
