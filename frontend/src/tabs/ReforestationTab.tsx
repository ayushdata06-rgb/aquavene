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
  Layers,
  Sparkles,
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
  const sedimentFilteredPct = Math.min(92, Math.round(35 + bufferWidthMeters * 1.6 + reforestPct * 0.22));
  const tempCoolingDegC = (1.2 + (bufferWidthMeters / 14.0)).toFixed(1);
  const carbonSequestrationTonnes = Math.round(areaHa * 4.8);
  const estCostLakhs = Math.round((areaHa * 0.65 + (bufferWidthMeters * 0.08)) * 10) / 10;

  const speciesList = p1?.recommended_species || [
    { name: 'Jamun (Syzygium cumini)', role: 'Dense deep taproot for stream bank binding and aquatic shade', root_depth: '4.5 m', canopy_spread: '12 m' },
    { name: 'Arjun (Terminalia arjuna)', role: 'Water-cooling riparian tree, absorbs heavy seasonal streamflow', root_depth: '5.2 m', canopy_spread: '15 m' },
    { name: 'Bamboo (Bambusa bambos)', role: 'High-tensile fibrous root shield against riverbank collapse', root_depth: '3.0 m', canopy_spread: '8 m' },
    { name: 'Vetiver Grass (Chrysopogon zizanioides)', role: 'Dense contour hedge arresting 90% of topsoil runoff', root_depth: '3.5 m', canopy_spread: '1.2 m' },
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
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
            >
              Next: Streams & Fish
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tier Vegetative Buffer Ecological Architecture */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">3-Tier Multi-Functional Vegetative Buffer Strip</h2>
            <p className="text-xs text-slate-400">Engineered vegetative filtration from upper crop fields to the river water surface</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>Zone 1: Stream Edge (0 - 10m)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20">Water Cooling</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Native hardwoods (Jamun, Arjun) provide continuous canopy shade, reducing midday water temperatures by <strong className="text-white">-{tempCoolingDegC}°C</strong> and preventing algae blooms.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-teal-500/30 space-y-2">
            <div className="flex items-center justify-between text-teal-400 font-bold">
              <span>Zone 2: Mid-Slope (10 - 25m)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20">Nutrient Filter</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Fibrous root shrubs and native Bamboo clumps take up excess agricultural nitrates and phosphates before chemical runoff touches the aquatic stream.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span>Zone 3: Field Margin (25 - 35m)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20">Sediment Trap</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Dense perennial Vetiver grass contour hedges slow field runoff velocities, physically dropping <strong className="text-white">{sedimentFilteredPct}%</strong> of silt in place.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Levers & Real-Time Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Designers (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Slider 1: Ridge Reforestation Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Trees className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Hillside & Ridge Afforestation Target</h2>
                  <p className="text-xs text-slate-400">Convert exposed bare soil into multi-tier indigenous canopy</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 font-mono">
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
                <span>0% (Bare & Eroding)</span>
                <span>50% (Balanced Agro-Forestry)</span>
                <span>100% (Full Canopy Armor)</span>
              </div>
            </div>

            {/* Calculated Physical Impacts */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Planting Area</div>
                <div className="text-lg font-extrabold text-white mt-0.5">{areaHa} ha</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Saplings Required</div>
                <div className="text-lg font-extrabold text-emerald-400 mt-0.5">{saplingsCount.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Carbon Sequestered</div>
                <div className="text-lg font-extrabold text-cyan-400 mt-0.5">{carbonSequestrationTonnes} t/yr</div>
              </div>
            </div>
          </div>

          {/* Slider 2: Riparian Buffer Strip Width */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                  <Filter className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Riparian Buffer Width Along Streams</h2>
                  <p className="text-xs text-slate-400">Linear meters of vegetative armor separating agricultural fields from waterways</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-lg border border-teal-500/20 font-mono">
                {bufferWidthMeters} Meters
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
                className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>5m (Minimal Grass Strip)</span>
                <span>25m (Recommended Standard)</span>
                <span>50m (Deep Forest Buffer)</span>
              </div>
            </div>

            {/* Microclimate & Filtration Impact Metrics */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                  <ThermometerSnowflake className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Water Cooling Effect</div>
                  <div className="text-lg font-bold text-white">-{tempCoolingDegC}°C</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Runoff Silt Filtered</div>
                  <div className="text-lg font-bold text-emerald-400">{sedimentFilteredPct}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Species Recommender & Budget Summary */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Indigenous Agro-Forestry Species</h2>
                <p className="text-xs text-slate-400">Adapted for {activeArea?.location?.agro_climatic_zone || 'Indian River Basins'}</p>
              </div>
            </div>

            <div className="space-y-3">
              {speciesList.map((sp: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-white block font-semibold">{sp.name}</strong>
                    {sp.root_depth && <span className="text-[10px] text-cyan-400 font-mono">Root: {sp.root_depth}</span>}
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{sp.role}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Estimated Afforestation Budget:</span>
                <strong className="text-white font-mono text-sm">₹{estCostLakhs} Lakhs</strong>
              </div>
              <p className="text-[11px] text-slate-500">
                Standard MGNREGA / State Forest Department Schedule of Rates (₹65,000 / ha).
              </p>
            </div>

            <button
              onClick={() => navigate('/streams')}
              className="w-full mt-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              Continue to Tab 5: Streams & Fish
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
