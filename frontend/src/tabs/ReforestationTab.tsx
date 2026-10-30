import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trees,
  Leaf,
  ShieldCheck,
  ThermometerSnowflake,
  Filter,
  ArrowRight,
  CheckCircle2,
  Sliders,
  DollarSign,
  Mountain,
  Droplets,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';

export const ReforestationTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea, sliderValues, setSliderValues } = useResearch();

  const [bufferWidthMeters, setBufferWidthMeters] = useState<number>(20);
  const p1 = activeArea?.restoration_plan?.pillar1_reforestation;

  // Real-time calculations based on slider
  const reforestPct = sliderValues.reforest_pct;
  const areaHa = Math.round(((activeArea?.area_sq_km || 42.5) * (reforestPct / 100) * 8.0) * 10) / 10;
  const saplingsCount = Math.round(areaHa * 800);
  const sedimentFilteredPct = Math.min(85, Math.round(35 + bufferWidthMeters * 1.5 + reforestPct * 0.25));
  const tempCoolingDegC = (1.5 + (bufferWidthMeters / 15.0)).toFixed(1);
  const estCostLakhs = Math.round((areaHa * 0.65 + (bufferWidthMeters * 0.08)) * 10) / 10;

  const speciesList = p1?.recommended_species || [
    { name: 'Jamun (Syzygium cumini)', role: 'Dense deep taproot for stream bank binding and aquatic shade' },
    { name: 'Arjun (Terminalia arjuna)', role: 'Water-cooling riparian tree, absorbs heavy seasonal streamflow' },
    { name: 'Bamboo (Bambusa bambos)', role: 'High-tensile fibrous root shield against riverbank collapse' },
    { name: 'Vetiver Grass (Chrysopogon zizanioides)', role: 'Dense contour hedge arresting 90% of topsoil runoff' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <Trees className="h-3.5 w-3.5" />
              Tab 4 • Pillar 1: Reforestation & Vegetative Buffers
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Native Vegetation & Riparian Buffers
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Plant native trees, grasses, and shrubs to hold soil, filter pollutants, and cool stream temperatures
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/streams')}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
            >
              Next: Streams & Fish
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Levers & Real-Time Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Designers (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Slider 1: Ridge Reforestation Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Trees className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Hillside & Ridge Reforestation Target</h2>
                  <p className="text-xs text-slate-400">Convert exposed bare soil into multi-tier indigenous canopy</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                {reforestPct}% Reforested
              </span>
            </div>

            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={reforestPct}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, reforest_pct: Number(e.target.value) }))}
                className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0% (Current Baseline)</span>
                <span>50% (Recommended)</span>
                <span>100% (Full Canopy Shield)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Target Area</div>
                <div className="text-lg font-extrabold text-white mt-0.5">{areaHa} ha</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Saplings Required</div>
                <div className="text-lg font-extrabold text-emerald-400 mt-0.5">{saplingsCount.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">MGNREGA Budget</div>
                <div className="text-lg font-extrabold text-white mt-0.5">₹{estCostLakhs} L</div>
              </div>
            </div>
          </div>

          {/* Slider 2: Riparian Buffer Width */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <Droplets className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Riparian Stream Buffer Width</h2>
                  <p className="text-xs text-slate-400">Continuous vegetative corridor along both stream banks</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-sky-400 bg-sky-500/10 px-3 py-1 rounded-lg border border-sky-500/20">
                {bufferWidthMeters} Meters Buffer
              </span>
            </div>

            <div className="space-y-4">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={bufferWidthMeters}
                onChange={(e) => setBufferWidthMeters(Number(e.target.value))}
                className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>5m (Minimal)</span>
                <span>20m (Forest Standard)</span>
                <span>50m (Optimal Wetland Buffer)</span>
              </div>
            </div>

            {/* Impact Badges */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <ThermometerSnowflake className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Water Cooling Effect</div>
                  <div className="text-base font-bold text-white">-{tempCoolingDegC}°C stream cooling</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Farm Silt & Pesticide Filter</div>
                  <div className="text-base font-bold text-emerald-400">{sedimentFilteredPct}% intercepted</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Native Tree & Shrub Species Selector */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Recommended Native Species</h2>
                <p className="text-xs text-slate-400">Tailored to regional agro-climate</p>
              </div>
            </div>

            <div className="space-y-3">
              {speciesList.map((sp: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    {sp.name}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed pl-6">
                    {sp.role}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800">
              <button
                onClick={() => navigate('/streams')}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                Proceed to Tab 5: Streams & Fish
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

