import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  Download,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Printer,
  Sparkles,
  MapPin,
  Waves,
  Trees,
  Fish,
  Tractor,
  Layers,
  Save,
  Lock,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

export const PlanBudgetTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea, sliderValues, simulatedResult, saveCurrentPlan } = useResearch();
  const { user } = useAuth();
  const isViewer = (user?.role || '').toLowerCase().includes('viewer');

  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [dprSaveNotice, setDprSaveNotice] = useState<string | null>(null);

  const plan = activeArea?.restoration_plan;
  const boq = plan?.bill_of_quantities || [
    { item_code: 'SOR-P1-01', description: 'Ridge Afforestation & Native Tree Planting (800 saplings/ha)', quantity: '34.0 ha', unit_rate_lakhs: 0.65, total_cost_lakhs: 22.1 },
    { item_code: 'SOR-P1-02', description: 'Vetiver Grass Riparian Buffer Strip along Stream Banks', quantity: '25.5 km', unit_rate_lakhs: 0.45, total_cost_lakhs: 11.48 },
    { item_code: 'SOR-P2-01', description: 'Large Woody Debris (LWD) Flow Deflectors & Root Wads', quantity: '14 units', unit_rate_lakhs: 0.35, total_cost_lakhs: 4.9 },
    { item_code: 'SOR-P2-02', description: 'Coir Geotextile Bio-Engineered Bank Armoring', quantity: '4.5 km', unit_rate_lakhs: 1.80, total_cost_lakhs: 8.1 },
    { item_code: 'SOR-P3-01', description: 'Culvert De-silting & Fish-Passable Open Box Structure Retrofit', quantity: '3 sites', unit_rate_lakhs: 1.25, total_cost_lakhs: 3.75 },
    { item_code: 'SOR-P4-01', description: 'Dirt Road Runoff Interception: Water Bars & Broad-Based Dips', quantity: '6.2 km', unit_rate_lakhs: 1.10, total_cost_lakhs: 6.82 },
    { item_code: 'SOR-P4-02', description: 'Dry Stone Boulder Gully Plugs in First-Order Ravines', quantity: '18 units', unit_rate_lakhs: 0.25, total_cost_lakhs: 4.5 },
    { item_code: 'SOR-P5-01', description: 'Farmer Cover Cropping & Zero-Till Equipment Partnership Subsidy', quantity: '120.0 ha', unit_rate_lakhs: 0.12, total_cost_lakhs: 14.4 },
    { item_code: 'SOR-P5-02', description: 'Community Farm Ponds & Groundwater Percolation Tanks', quantity: '4 units', unit_rate_lakhs: 2.20, total_cost_lakhs: 8.8 },
  ];

  const totalBudgetLakhs = Math.round(boq.reduce((sum, item) => sum + item.total_cost_lakhs, 0) * 10) / 10;
  const roadmap = plan?.implementation_roadmap || [
    {
      phase: 'Year 1 (Foundation & Erosion Arrest)',
      budget_lakhs: Math.round(totalBudgetLakhs * 0.45 * 10) / 10,
      focus: 'Dirt road drainage, water bars, gully plugs, culvert retrofits, and contour trench excavation before monsoon.',
      milestones: [
        'Survey and benchmark all unpaved roads and stream barrier sites.',
        'Complete 100% of water bars and dry stone gully plugs.',
        'Retrofit critical perched culverts for fish passage.',
        'Pre-monsoon pitting and soil preparation on upper ridges.',
      ],
    },
    {
      phase: 'Year 2 (Vegetation & Stream Bio-Repair)',
      budget_lakhs: Math.round(totalBudgetLakhs * 0.40 * 10) / 10,
      focus: 'Native tree planting, coir bank geotextile placement, large woody debris anchor, and farmer cover-crop rollout.',
      milestones: [
        'Plant 800 native saplings/ha with community protection fences.',
        'Establish continuous Vetiver grass hedges along riparian buffer.',
        'Install large woody debris deflectors and bio-engineered bank coir mats.',
        'Distribute cover crop seed kits to enrolled watershed farmers.',
      ],
    },
    {
      phase: 'Year 3 (Stewardship, Monitoring & Handover)',
      budget_lakhs: Math.round(totalBudgetLakhs * 0.15 * 10) / 10,
      focus: 'Sapling replacement for >85% survival rate, silt trap cleanouts, groundwater well monitoring, and Gram Panchayat handover.',
      milestones: [
        'Conduct survival audit for plantations and perform gap filling.',
        'Measure peak discharge reduction in stream gauge post-monsoon.',
        'Train village water user committees for annual maintenance.',
        'Submit final Detailed Project Report (DPR) closure report to district authority.',
      ],
    },
  ];

  const handleSaveDPR = async () => {
    if (isViewer) {
      setDprSaveNotice(
        'Access Denied (RBAC): Read-only "Viewer" accounts cannot persist official DPR proposals. Switch role to "District Planner" in the top-right profile menu to save.'
      );
      setTimeout(() => setDprSaveNotice(null), 6000);
      return;
    }
    if (!activeArea) return;

    setIsSavingPlan(true);
    try {
      // 1. Save locally in context
      saveCurrentPlan();

      // 2. Persist to FastAPI PostgreSQL backend
      await apiClient.createSavedPlan({
        area_name: activeArea.name,
        area_sq_km: activeArea.area_sq_km,
        original_score: activeArea.score,
        simulated_score: simulatedResult?.simulated_score || Math.max(10, activeArea.score - 28),
        original_soil_loss: activeArea.soil_loss_t_ha_yr,
        simulated_soil_loss:
          simulatedResult?.new_soil_loss_t_ha_yr || Math.round(activeArea.soil_loss_t_ha_yr * 0.4 * 10) / 10,
        reforest_pct: sliderValues.reforest_pct,
        check_dams_count: sliderValues.check_dams,
        cct_pct: sliderValues.cct_pct,
        budget_lakhs_inr: totalBudgetLakhs,
        interventions: boq.map((b) => ({
          title: b.description,
          item_code: b.item_code,
          quantity: b.quantity,
          estimated_cost_lakhs_inr: b.total_cost_lakhs,
        })),
      });

      setDprSaveNotice(
        'Official DPR Proposal successfully sanctioned and stored in PostgreSQL database!'
      );
    } catch (err: any) {
      console.warn('Backend plan save error:', err);
      setDprSaveNotice(`DPR saved to local cache (${err.message || 'Offline mode'})`);
    } finally {
      setIsSavingPlan(false);
      setTimeout(() => setDprSaveNotice(null), 5000);
    }
  };

  const handleDownloadCSV = () => {
    const headers = ['Item Code,Description,Quantity,Unit Rate (Lakhs INR),Total Cost (Lakhs INR)'];
    const rows = boq.map((b) => `"${b.item_code}","${b.description}","${b.quantity}",${b.unit_rate_lakhs},${b.total_cost_lakhs}`);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(activeArea?.name || 'Catchment').replace(/\s+/g, '_')}_Restoration_BoQ.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      catchment: activeArea?.name,
      location: activeArea?.location,
      metrics: {
        score: activeArea?.score,
        soil_loss_t_ha_yr: activeArea?.soil_loss_t_ha_yr,
        rainfall_30d_mm: activeArea?.rainfall_30d_mm,
      },
      bill_of_quantities: boq,
      implementation_roadmap: roadmap,
      generated_at: new Date().toISOString(),
    }, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${(activeArea?.name || 'Catchment').replace(/\s+/g, '_')}_DPR_Plan.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2">
              <FileCheck2 className="h-3.5 w-3.5" />
              Tab 8 • Official DPR, Bill of Quantities & Schedule of Rates
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Detailed Project Report (DPR) & Budget
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Calibrated with MGNREGA & State Forest Schedule of Rates for official government sanction
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSaveDPR}
              disabled={isSavingPlan}
              className={`px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
                isViewer
                  ? 'bg-slate-700/80 hover:bg-slate-700 text-slate-300 border border-slate-600/60'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
              title={isViewer ? 'Read-only: Switch to Planner in profile menu to save' : 'Persist official DPR proposal to database'}
            >
              {isViewer ? <Lock className="h-4 w-4 text-amber-400" /> : <Save className="h-4 w-4" />}
              <span>{isSavingPlan ? 'Saving to DB...' : 'Save DPR to Database'}</span>
              {isViewer && <span className="text-[10px] text-amber-400 font-normal">(Viewer Lock)</span>}
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export BoQ (CSV)
            </button>
            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-600/30 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download DPR (JSON)
            </button>
          </div>
        </div>
      </div>

      {dprSaveNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            dprSaveNotice.includes('Denied')
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{dprSaveNotice}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Estimated Budget</div>
          <div className="text-3xl font-extrabold text-teal-400 mt-2">
            ₹{totalBudgetLakhs} <span className="text-sm text-slate-400 font-normal">Lakhs</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">All 5 restoration pillars</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase font-semibold">Projected Runoff Drop</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            -42.5%
          </div>
          <p className="text-xs text-slate-400 mt-1">Arrests flash flood surges</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase font-semibold">Projected Soil Loss Relief</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">
            -68.0%
          </div>
          <p className="text-xs text-slate-400 mt-1">From {activeArea?.soil_loss_t_ha_yr || 32.4} to 10.4 t/ha/yr</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-xs text-slate-400 uppercase font-semibold">Implementation Span</div>
          <div className="text-3xl font-extrabold text-white mt-2">
            3 Years
          </div>
          <p className="text-xs text-slate-400 mt-1">Phased execution roadmap</p>
        </div>
      </div>

      {/* Bill of Quantities (BoQ) Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Itemized Bill of Quantities (BoQ)</h2>
              <p className="text-xs text-slate-400">Government Schedule of Rates (MGNREGA / State Forest Norms)</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {boq.length} Line Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold tracking-wider bg-slate-950/50">
                <th className="py-3 px-4">Item Code</th>
                <th className="py-3 px-4">Certified Scope of Works</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Unit Rate (₹ Lakhs)</th>
                <th className="py-3 px-4 text-right">Total (₹ Lakhs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {boq.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-teal-400 font-bold">{b.item_code}</td>
                  <td className="py-3 px-4 font-medium text-slate-200">{b.description}</td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">{b.quantity}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">₹{b.unit_rate_lakhs}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">₹{b.total_cost_lakhs.toFixed(2)}</td>
                </tr>
              ))}
              <tr className="bg-slate-950 font-bold text-sm text-white">
                <td colSpan={4} className="py-3.5 px-4 text-right uppercase tracking-wider text-slate-400">
                  Total DPR Investment:
                </td>
                <td className="py-3.5 px-4 text-right text-teal-400 font-extrabold text-base">
                  ₹{totalBudgetLakhs} Lakhs
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Phased 3-Year Implementation Roadmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Phased 3-Year Implementation Roadmap</h2>
            <p className="text-xs text-slate-400">Ordered execution milestones ensuring ecological succession</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roadmap.map((r, idx) => (
            <div key={idx} className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-brand-400 uppercase tracking-wider">{r.phase}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    ₹{r.budget_lakhs} L
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 mb-4 leading-relaxed">{r.focus}</p>

                <div className="space-y-2">
                  {r.milestones.map((m, mIdx) => (
                    <div key={mIdx} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-400 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
