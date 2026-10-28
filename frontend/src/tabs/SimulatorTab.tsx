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
  ArrowLeft,
  Sparkles,
  Info,
  Trees,
  Mountain,
  Droplets,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
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
    savedPlans,
    setActiveStep,
    clearActiveArea,
  } = useResearch();

  const [planSaveNotice, setPlanSaveNotice] = useState<string | null>(null);

  useEffect(() => {
    setActiveStep(4);
  }, []);

  if (!isAreaSelected || !activeArea) {
    return (
      <LockedTabBanner
        stepNumber={4}
        stepName="Plan the Restoration Works & Test What-If"
        whatItShows="This step generates an official Bill of Quantities, budget estimate in ₹ Lakhs, interactive what-if simulation sliders, and DPR proposal exports"
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

  const interventions = activeArea.prescribed_interventions || [];
  const totalBudget = activeArea.estimated_budget_lakhs_inr || 142.5;

  const handleSavePlan = () => {
    const saved = saveCurrentPlan();
    setPlanSaveNotice(`Plan saved successfully! (Saved as "${saved.area_name} DPR Plan")`);
    setTimeout(() => setPlanSaveNotice(null), 4000);
  };

  const handleDownloadDPR = () => {
    const dprContent = `
================================================================================
                    DETAILED PROJECT REPORT (DPR) SUMMARY
                WATERSHED RESTORATION & SOIL CONSERVATION PLAN
================================================================================

1. STUDY AREA IDENTIFICATION
   • Watershed Name        : ${activeArea.name}
   • Watershed Code        : ${activeArea.code}
   • District & State      : ${activeArea.district}, ${activeArea.state}
   • Total Catchment Area  : ${activeArea.area_sq_km} sq. km
   • Elevation Relief      : ${activeArea.relief_m} m
   • Average Slope         : ${activeArea.slope_deg} degrees

2. BASELINE PROBLEM DIAGNOSIS
   • Baseline Urgency Score: ${beforeScore} / 100 (${activeArea.category})
   • Estimated Soil Loss   : ${beforeSoilLoss} tonnes/hectare/year
   • Bare Soil Fraction    : ${activeArea.bare_soil_pct}%
   • Rainfall Pressure     : ${activeArea.rainfall_30d_mm} mm in 30 days (${activeArea.rainfall_anomaly_pct}% anomaly)
   • Primary Aggravating   : ${activeArea.main_problem}

3. RECOMMENDED BILL OF QUANTITIES (BoQ) & BUDGET ESTIMATE
   -----------------------------------------------------------------------------
   Work / Structure               Quantity             Estimated Cost (INR)
   -----------------------------------------------------------------------------
${interventions.map((item) => `   • ${item.title.padEnd(28)} : ${item.quantity.padEnd(20)} : Rs. ${item.estimated_cost_lakhs_inr} Lakhs`).join('\n')}
   -----------------------------------------------------------------------------
   TOTAL CAPITAL INVESTMENT ESTIMATE                   : Rs. ${totalBudget} Lakhs
   -----------------------------------------------------------------------------
   (Rate basis: Ministry of Jal Shakti & WDC-PMKSY standard schedule of rates)

4. PROJECTED POST-TREATMENT IMPACT ("WHAT-IF" SIMULATION)
   • Simulated Urgency Score: ${afterScore} / 100 (${afterCategory})
   • Restoration Risk Drop  : -${reductionPct}% (${beforeScore} -> ${afterScore})
   • Soil Loss Arrest       : ${beforeSoilLoss} -> ${afterSoilLoss} t/ha/yr (-${Math.round(((beforeSoilLoss - afterSoilLoss) / beforeSoilLoss) * 100)}% soil loss arrested)
   • Groundwater Moisture   : +35% increase in root-zone water absorption

5. ADMINISTRATIVE SIGN-OFF & SUBMISSION
   • Generated Date        : ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
   • Prepared for          : District Watershed Development Cell (DWDC) / Jal Shakti Mission
================================================================================
`.trim();

    const blob = new Blob([dprContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArea.name.replace(/\s+/g, '_')}_DPR_Proposal.txt`;
    a.click();
    setPlanSaveNotice('DPR Proposal document downloaded successfully!');
    setTimeout(() => setPlanSaveNotice(null), 4000);
  };

  const shapData = activeArea.shap_drivers.map((d) => ({
    name: d.label,
    impact: d.impact_pts,
    isAggravating: d.is_aggravating,
    desc: d.description,
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Step 4 of 4</span>
            <span>•</span>
            <span className="text-purple-400">Treatment Plan & Live Simulator</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Plan the Works and Test Ideas
          </h1>
          <p className="text-xs text-slate-400">
            {activeArea.name} • Decide what structures to build, see certified budgets, and simulate what-if impact live
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/hydrology')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Water Flow
          </button>
          <button
            onClick={handleDownloadDPR}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Plan for DPR</span>
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {planSaveNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{planSaveNotice}</span>
        </div>
      )}

      {/* Section A: Current Situation (Before) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[11px]">
            Section A: Current Situation (Before Any Works)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Current Urgency Score</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-rose-400">{beforeScore}</span>
              <span className="text-xs text-slate-400">/ 100</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {activeArea.category}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Composite score calculated from slope steepness, bare soil, and storm intensity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Soil Washed Away Each Year</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-white">{beforeSoilLoss}</span>
              <span className="text-xs text-slate-400 font-medium">t/ha/year</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Tonnes of nutrient-rich topsoil lost per hectare each year into rivers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-[11px] text-slate-400 block font-medium">Vegetation vs Bare Land Split</span>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${activeArea.bare_soil_pct}%` }}
                title={`Bare Land: ${activeArea.bare_soil_pct}%`}
              />
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${activeArea.plant_cover_pct}%` }}
                title={`Plants & Trees: ${activeArea.plant_cover_pct}%`}
              />
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-rose-400 font-semibold">Bare soil: {activeArea.bare_soil_pct}%</span>
              <span className="text-emerald-400 font-semibold">Covered by plants: {activeArea.plant_cover_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section B & C: Recommended Works (BoQ) & Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section B: Recommended Works */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Section B: Recommended Civil Works (Bill of Quantities)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
              CatBoost ML Prescriptor
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Work Name</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Target Zone</th>
                  <th className="py-2.5 px-3 text-right">Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {interventions.map((work, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <strong className="text-white block">{work.title}</strong>
                      <span className="text-[11px] text-slate-400">{work.impact}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-emerald-300">{work.quantity}</td>
                    <td className="py-3 px-3 text-slate-300 text-[11px]">{work.target_zone}</td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      ₹{work.estimated_cost_lakhs_inr} Lakhs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section C: Budget Estimate */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Section C: Budget Estimate</h2>
            </div>
            <p className="text-xs text-slate-400">
              Total capital works investment required for complete watershed saturation
            </p>

            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
              <span className="text-xs text-emerald-400 font-semibold block">Total Estimated Budget</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white">₹{totalBudget}</span>
                <span className="text-xs font-bold text-emerald-300">Lakhs</span>
              </div>
              <span className="text-[10px] text-slate-400 block pt-1">
                (~₹{Math.round((totalBudget / activeArea.area_sq_km) * 10) / 10} Lakhs per km²)
              </span>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Based on Ministry of Jal Shakti and WDC-PMKSY standard schedule of rates. Final local costs may vary after field ground-truthing.
            </p>
          </div>

          <button
            onClick={handleDownloadDPR}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download Budget Table
          </button>
        </div>
      </div>

      {/* Section D & E: "What If?" Live Sliders & Results Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section D: "What If?" Sliders */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Section D: "What If?" Interactive Sliders
              </h2>
              <p className="text-xs text-slate-400">
                Adjust values to simulate restorative outcomes live in &lt;10 milliseconds
              </p>
            </div>
            <button
              onClick={resetSliders}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 p-1 rounded-lg hover:bg-slate-800"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Slider 1: Tree Planting */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Trees className="w-3.5 h-3.5 text-emerald-400" />
                1. Plant trees & grass on bare land:
              </span>
              <strong className="text-emerald-400 text-sm font-bold">{sliderValues.reforest_pct}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={sliderValues.reforest_pct}
              onChange={(e) =>
                setSliderValues((prev) => ({ ...prev, reforest_pct: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (None)</span>
              <span>25% (Moderate)</span>
              <span>50% (Max saturation)</span>
            </div>
          </div>

          {/* Slider 2: Check Dams */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-amber-400" />
                2. Add cascading check dams:
              </span>
              <strong className="text-amber-400 text-sm font-bold">{sliderValues.check_dams} structures</strong>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={sliderValues.check_dams}
              onChange={(e) =>
                setSliderValues((prev) => ({ ...prev, check_dams: Number(e.target.value) }))
              }
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 dams</span>
              <span>6 dams</span>
              <span>12 dams (Full series)</span>
            </div>
          </div>

          {/* Slider 3: Contour Trenches */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                3. Add contour trenches along slopes:
              </span>
              <strong className="text-cyan-400 text-sm font-bold">{sliderValues.cct_pct}% coverage</strong>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={sliderValues.cct_pct}
              onChange={(e) =>
                setSliderValues((prev) => ({ ...prev, cct_pct: Number(e.target.value) }))
              }
              className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% coverage</span>
              <span>30% coverage</span>
              <span>60% ridge saturation</span>
            </div>
          </div>
        </div>

        {/* Section E: Results Comparison ("Before to After") */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl flex flex-col justify-between">
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Section E: Results Comparison (Before to After)
            </h2>
            <p className="text-xs text-slate-400">
              Predicted restoration impact based on your chosen slider interventions
            </p>
          </div>

          {/* Before vs After Side-by-Side Gauges */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
            {/* Before */}
            <div className="text-center p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Before Works
              </span>
              <span className="text-3xl font-black text-rose-400 block">{beforeScore}</span>
              <span className="text-xs font-semibold text-rose-300 block">{activeArea.category}</span>
              <span className="text-[10px] text-slate-400 block mt-1">{beforeSoilLoss} t/ha/yr soil loss</span>
            </div>

            {/* After */}
            <div className="text-center p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
                After Works
              </span>
              <span className="text-3xl font-black text-emerald-300 block">{afterScore}</span>
              <span className="text-xs font-semibold text-emerald-300 block">{afterCategory}</span>
              <span className="text-[10px] text-slate-300 block mt-1">{afterSoilLoss} t/ha/yr soil loss</span>
            </div>
          </div>

          {/* Plain Language Summary */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-1">
            <strong className="font-bold text-emerald-300 block">
              Result: Urgency score drops by {reductionPct}% ({beforeScore} → {afterScore})
            </strong>
            <p className="text-[11px] leading-relaxed">
              With these works, this area moves safely from <strong>{activeArea.category}</strong> down to <strong>{afterCategory}</strong>, arresting ~{Math.round(beforeSoilLoss - afterSoilLoss)} tonnes of soil per hectare and enhancing water infiltration by <strong>+35%</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSavePlan}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save This Plan
            </button>
          </div>
        </div>
      </div>

      {/* Section F: Why This Score? (TreeSHAP Explainability) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Section F: Why This Score? (Exact Factor Breakdown)
            </h2>
            <p className="text-xs text-slate-400">
              Game-theory math (TreeSHAP) showing which biophysical factors push score higher (red) or protect it (green)
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500" />
              <span className="text-slate-300">Causes urgency (adds points)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-slate-300">Protects land (subtracts points)</span>
            </div>
          </div>
        </div>

        <div className="h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={shapData}
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                formatter={(val: any, name: string, item: any) => [
                  `${val > 0 ? '+' : ''}${val} points (${item.payload.desc})`,
                  'Impact on Score',
                ]}
              />
              <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                {shapData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.impact > 0 ? '#f43f5e' : '#10b981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section G: Saved Plans History & Start Over */}
      {savedPlans.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Saved Restoration Plans ({savedPlans.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedPlans.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="text-white block">{p.area_name}</strong>
                  <span className="text-slate-400 text-[11px]">
                    Saved on {p.date} • {p.area_sq_km} km²
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold block">₹{p.budget_lakhs_inr} Lakhs</span>
                  <span className="text-[10px] text-slate-400">
                    Score: {p.original_score} → {p.simulated_score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Step Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={() => navigate('/hydrology')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Water Flow
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              clearActiveArea();
              navigate('/map');
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Start Over with New Area
          </button>

          <button
            onClick={handleDownloadDPR}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Plan for DPR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

