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
  Droplets,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';
import { LockedTabBanner } from '../components/LockedTabBanner';

export const FarmsRoadsTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea, sliderValues, setSliderValues } = useResearch();

  if (!activeArea) {
    return (
      <LockedTabBanner
        stepNumber={6}
        stepName="Pillars 4 & 5: Dirt Roads & Better Land Management"
        whatItShows="Draw an AOI on the map or select a micro-watershed to compute dirt road sediment delivery, rolling dip water bars, and farm pond percolation volumes."
      />
    );
  }

  const p4 = activeArea.restoration_plan?.pillar4_erosion_roads;
  const p5 = activeArea.restoration_plan?.pillar5_regenerative_farming;

  const roadKm = sliderValues.road_stabilize_km || 3.0;
  const coverCropPct = sliderValues.cover_crop_pct || 35;

  // Real-time calculations
  const waterBarsCount = Math.round(roadKm * 6);
  const enrolledHa = Math.round((activeArea.area_sq_km * 0.38 * (coverCropPct / 100) * 15.0) * 10) / 10;
  const pondsCount = Math.max(1, Math.min(8, Math.round(activeArea.area_sq_km * 0.12)));
  const pondStorageCapacityM3 = pondsCount * 3500;
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
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/30 flex items-center gap-2"
            >
              Test in Tab 7: Simulator
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dirt Road Drainage & Farm Runoff Visualizer Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Unpaved Road Drainage Engineering</h2>
            <p className="text-xs text-slate-400">Transforming sediment-bleeding ruts into controlled water-shedding corridors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-orange-500/30 space-y-2">
            <div className="text-orange-400 font-bold uppercase flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              <span>Water Bars (30° Skewed Mounds)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Constructed soil-and-stone berms installed at 40m intervals across steep tracks divert concentrated runoff sideways into grass before it carves deep gullies.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
            <div className="text-amber-400 font-bold uppercase flex items-center gap-1.5">
              <RotateCw className="w-4 h-4" />
              <span>Broad-Based Dips</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Gentle 6m long dips in the road surface allow farm vehicles and tractors to pass comfortably while shedding sheetwash water into vegetated ditch turnouts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
            <div className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
              <Sprout className="w-4 h-4" />
              <span>Legume Cover Cropping</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Post-monsoon planting of Sunnhemp and Cowpea creates living root mats that bind agricultural soil, fix atmospheric nitrogen, and halt field nutrient runoff.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Dirt Road Runoff Control + Regenerative Land Care */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Interactive Levers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lever 1: Dirt Road Sediment & Water Bars */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
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
              <span className="text-sm font-extrabold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20 font-mono">
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
                <span>15 km (Full Catchment Network)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Water Bars & Turnouts</div>
                <div className="text-lg font-extrabold text-white mt-0.5">{waterBarsCount} units</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Sediment Kept from Streams</div>
                <div className="text-lg font-extrabold text-orange-400 mt-0.5">{Math.round(roadKm * 280)} tonnes/yr</div>
              </div>
            </div>
          </div>

          {/* Lever 2: Regenerative Cropland Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Sprout className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Farmer Regenerative Agriculture Partnership</h2>
                  <p className="text-xs text-slate-400">Subsidize cover crop seed kits, reduced tillage, and crop rotation</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 font-mono">
                {coverCropPct}% Enrolled
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
                <span>0% (Bare Post-Harvest)</span>
                <span>50% (Community Cluster)</span>
                <span>100% (Watershed-Wide)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Cropland Protected</div>
                <div className="text-lg font-extrabold text-emerald-400 mt-0.5">{enrolledHa} ha</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="text-xs text-slate-400">Soil Carbon Gain</div>
                <div className="text-lg font-extrabold text-white mt-0.5">+{((coverCropPct / 100) * 0.8).toFixed(2)}% SOC</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Community Farm Ponds & Cost Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Community Percolation Ponds</h2>
                <p className="text-xs text-slate-400">Groundwater recharge structures</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">Proposed Farm Ponds</div>
                <div className="text-2xl font-extrabold text-white">{pondsCount} Tanks</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Total storage capacity: <strong className="text-cyan-400">~{pondStorageCapacityM3.toLocaleString()} m³</strong> for livestock watering and unconfined aquifer recharge.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">Total Pillars 4 & 5 Investment</div>
                <div className="text-2xl font-extrabold text-orange-400">₹{totalCostLakhs} Lakhs</div>
                <div className="text-[11px] text-slate-500">Includes water bars, seed subsidies, and farm pond excavation</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/simulator')}
              className="w-full mt-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              Test Outcomes in Tab 7: Simulator
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
