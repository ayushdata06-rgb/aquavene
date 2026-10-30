import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tractor,
  Shield,
  Sprout,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  RotateCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';

export const FarmsRoadsTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea, sliderValues, setSliderValues } = useResearch();

  const p4 = activeArea?.restoration_plan?.pillar4_erosion_roads;
  const p5 = activeArea?.restoration_plan?.pillar5_regenerative_farming;

  const roadKm = sliderValues.road_stabilize_km || 3.0;
  const coverCropPct = sliderValues.cover_crop_pct || 35;

  // Real-time calculations
  const waterBarsCount = Math.round(roadKm * 6);
  const enrolledHa = Math.round(((activeArea?.area_sq_km || 42.5) * 0.38 * (coverCropPct / 100) * 15.0) * 10) / 10;
  const pondsCount = Math.max(1, Math.min(8, Math.round((activeArea?.area_sq_km || 42.5) * 0.12)));
  const sedimentArrestedTonnes = Math.round(roadKm * 280 + enrolledHa * 18);
  const totalCostLakhs = Math.round((roadKm * 1.10 + enrolledHa * 0.12 + pondsCount * 2.20) * 10) / 10;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-2">
              <Tractor className="h-3.5 w-3.5" />
              Tab 6 • Pillars 4 & 5: Dirt Roads & Better Land Management
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Erosion Control & Regenerative Farming
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Stop sediment bleed from unpaved dirt roads and work with farmers on cover crops and reduced tillage
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/simulator')}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
            >
              Test in Tab 7: Simulator
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Dirt Road Runoff Control + Regenerative Land Care */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Interactive Levers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lever 1: Dirt Road Sediment & Water Bars */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Dirt Road Runoff Interception (Water Bars & Dips)</h2>
                  <p className="text-xs text-slate-400">Eject storm water from unpaved tracks into grass filter strips before it hits streams</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20">
                {roadKm} km Road Fixed
              </span>
            </div>

            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={roadKm}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, road_stabilize_km: Number(e.target.value) }))}
                className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0 km (Active Silt Bleed)</span>
                <span>5 km (Key Ridge Tracks)</span>
                <span>15 km (Full Catchment Road Network)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Water Bars Installed</div>
                <div className="text-lg font-extrabold text-white mt-0.5">{waterBarsCount} units</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Gully Plugs Erected</div>
                <div className="text-lg font-extrabold text-orange-400 mt-0.5">{Math.round(roadKm * 2)} plugs</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">MGNREGA Rate</div>
                <div className="text-lg font-extrabold text-white mt-0.5">₹{(roadKm * 1.10).toFixed(1)} L</div>
              </div>
            </div>
          </div>

          {/* Lever 2: Regenerative Agriculture & Cover Crops */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Sprout className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Farmer Partnerships: Cover Crops & Conservation Tillage</h2>
                  <p className="text-xs text-slate-400">Enroll farmers in zero-till and legume cover crops to eliminate chemical sheetwash</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                {coverCropPct}% Farms Enrolled
              </span>
            </div>

            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={coverCropPct}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, cover_crop_pct: Number(e.target.value) }))}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0% (Conventional Tillage)</span>
                <span>50% (High Adoption)</span>
                <span>100% (100% Regenerative Basin)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Participating Farmland</div>
                <div className="text-lg font-extrabold text-white mt-0.5">{enrolledHa} Hectares</div>
                <div className="text-xs text-emerald-400 mt-1">Sunnhemp & Cowpea nitrogen-fixing rotation</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Agricultural Topsoil Held</div>
                <div className="text-lg font-extrabold text-emerald-400 mt-0.5">~{sedimentArrestedTonnes} Tonnes/yr</div>
                <div className="text-xs text-slate-400 mt-1">Eliminates field baking and crusting</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Community Farm Ponds & DPR Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <RotateCw className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Community Percolation Tanks</h2>
                <p className="text-xs text-slate-400">Harvest surplus runoff in depressions</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs text-slate-400">Planned Percolation Tanks</div>
              <div className="text-2xl font-extrabold text-teal-400">{pondsCount} Units</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Excavated in mid-reach farm depressions (TWI &gt; 7.0). Stores 1,500 m³ of rainwater per unit, supporting winter rabi supplemental irrigation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mt-4 space-y-2">
              <div className="text-xs text-slate-400">Total Pillars 4 & 5 Investment</div>
              <div className="text-2xl font-extrabold text-white">₹{totalCostLakhs} Lakhs</div>
              <div className="text-[11px] text-slate-500">Government subsidies + MGNREGA road works</div>
            </div>

            <button
              onClick={() => navigate('/simulator')}
              className="w-full mt-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              Test Live Impact in Simulator
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

