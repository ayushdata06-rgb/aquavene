import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Waves,
  Fish,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  DollarSign,
  Maximize2,
  Anchor,
  Layers,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';
import { LockedTabBanner } from '../components/LockedTabBanner';

export const StreamsWetlandsTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea, sliderValues, setSliderValues } = useResearch();

  const [floodplainSetbackMeters, setFloodplainSetbackMeters] = useState<number>(30);
  const [crossSectionView, setCrossSectionView] = useState<'restored' | 'degraded'>('restored');

  if (!activeArea) {
    return (
      <LockedTabBanner
        stepNumber={5}
        stepName="Pillars 2 & 3: Streams, Wetlands & Fish Migration"
        whatItShows="Draw an AOI on the map or select a micro-watershed to model channel reconnection, large woody debris structures, and culvert fishway retrofits."
      />
    );
  }

  const p2 = activeArea.restoration_plan?.pillar2_stream_wetland;
  const p3 = activeArea.restoration_plan?.pillar3_barriers_fish;

  const streamRepairKm = sliderValues.stream_repair_km || 4.5;
  const barriersRemoved = sliderValues.barriers_removed || 2;

  // Real-time calculated impacts
  const lwdStructuresCount = Math.round(streamRepairKm * 3);
  const fishPassageScore = Math.min(95, Math.round(40 + barriersRemoved * 18 + streamRepairKm * 2.5));
  const unlockedHabitatKm = Math.round(barriersRemoved * 4.2 + streamRepairKm * 0.8);
  const floodDissipationM3 = Math.round(floodplainSetbackMeters * streamRepairKm * 450);
  const totalCostLakhs = Math.round((streamRepairKm * 1.80 + barriersRemoved * 1.25) * 10) / 10;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Waves className="h-3.5 w-3.5" />
              Tab 5 • Pillars 2 & 3: Streams, Wetlands & Fish Passage
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Stream & Wetland Repair & Free Fish Migration
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Reconnect floodplains, stabilize stream banks with large logs, and remove obsolete barriers for migratory fish
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/land-roads')}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-600/30 flex items-center gap-2"
            >
              Next: Farms & Roads
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Visual Channel Cross-Section Inspection Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Stream Bank Hydraulic Cross-Section</h2>
              <p className="text-xs text-slate-400">Comparing incised vertical erosion cut-banks vs. bioengineered stable banks</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCrossSectionView('degraded')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                crossSectionView === 'degraded'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Before: Incised Channel
            </button>
            <button
              onClick={() => setCrossSectionView('restored')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                crossSectionView === 'restored'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              After: Restored Bio-Bank
            </button>
          </div>
        </div>

        {crossSectionView === 'restored' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2">
              <div className="text-emerald-400 font-bold text-xs uppercase flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Gentle 2:1 Sloped Bank</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Re-graded stream banks lined with woven coconut coir geotextiles and live willow/jamun cuttings. Roots bind topsoil down into the water table.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
              <div className="text-cyan-400 font-bold text-xs uppercase flex items-center gap-1.5">
                <Anchor className="w-4 h-4" />
                <span>Large Woody Debris (LWD) Jams</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Felled logs and root-wads keyed into banks deflect high-velocity center flow, creating cool, deep resting pools for spawning fish during monsoons.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-sky-500/30 space-y-2">
              <div className="text-sky-400 font-bold text-xs uppercase flex items-center gap-1.5">
                <Waves className="w-4 h-4" />
                <span>Connected Riparian Floodplain</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Removing artificial berms allows high storm flows to spill into natural floodplain wetlands, filtering silt and reducing downstream flood peak by 42%.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-2">
              <div className="text-rose-400 font-bold text-xs uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Vertical Incised Cut-Banks</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Stormwater cuts deep trenches with vertical 90° banks. During heavy rains, chunks of farmland crumble directly into the river channel.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2">
              <div className="text-amber-400 font-bold text-xs uppercase flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>Warm, Unshaded Water</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Stripped stream corridors experience direct solar heating (+3.5°C), depleting dissolved oxygen and killing native fingerlings and macroinvertebrates.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-500/30 space-y-2">
              <div className="text-rose-400 font-bold text-xs uppercase flex items-center gap-1.5">
                <Waves className="w-4 h-4" />
                <span>Disconnected Floodplain</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                Channelized streams trap all flood velocity within the ditch, shooting torrents of mud and debris downstream into bridges and culverts.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Bio-Stabilization + Barrier Removal + Floodplain Reconnection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Levers & Bio-engineering */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lever 1: Bio-Engineered Bank Armoring & Large Woody Debris */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Anchor className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Stream Bank Armoring & Large Woody Debris (LWD)</h2>
                  <p className="text-xs text-slate-400">Anchor tree root wads and biodegradable coir logs to stop bank collapses</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                {streamRepairKm} km Stabilized
              </span>
            </div>

            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={streamRepairKm}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, stream_repair_km: Number(e.target.value) }))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0 km</span>
                <span>5 km (Recommended Reach)</span>
                <span>20 km (Full Main Stem)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Large Woody Structures</div>
                <div className="text-lg font-extrabold text-white mt-0.5">{lwdStructuresCount} log jams</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Coir Geotextile Needed</div>
                <div className="text-lg font-extrabold text-cyan-400 mt-0.5">{streamRepairKm} km</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400">Bank Erosion Arrest</div>
                <div className="text-lg font-extrabold text-emerald-400 mt-0.5">85% reduction</div>
              </div>
            </div>
          </div>

          {/* Lever 2: Barrier Removal & Culvert Retrofit */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Fish className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Removing Obsolete Dams & Blocked Culverts</h2>
                  <p className="text-xs text-slate-400">Decommission silted masonry weirs and replace pinched pipes with box culverts</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">
                {barriersRemoved} Barriers Removed
              </span>
            </div>

            <div className="space-y-4">
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={barriersRemoved}
                onChange={(e) => setSliderValues((prev) => ({ ...prev, barriers_removed: Number(e.target.value) }))}
                className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0 Barriers (Migratory Choke)</span>
                <span>3 Barriers (Key Crossings)</span>
                <span>8 Barriers (Complete River Reconnection)</span>
              </div>
            </div>

            {/* Fish Passage Health Gauge & Habitat Unlocked */}
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Fish Passage Connectivity Score</span>
                <span className="text-indigo-400 font-extrabold text-sm font-mono">{fishPassageScore} / 100</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${fishPassageScore}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>Upstream Habitat Unlocked:</span>
                <strong className="text-emerald-400 font-mono text-sm">{unlockedHabitatKm} km free-flowing river</strong>
              </div>
              <p className="text-xs text-slate-400">
                Benefited migratory species: {p3?.migratory_species_benefited || 'Golden Mahseer (Tor putitora), Snow Trout, and Deccan stream barbs'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Floodplain Reconnection Details */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Maximize2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Floodplain Setback Corridor</h2>
                <p className="text-xs text-slate-400">Seasonal high-flow buffer</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Setback Distance</span>
                  <span className="text-sky-400 font-bold">{floodplainSetbackMeters}m from bank</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={floodplainSetbackMeters}
                  onChange={(e) => setFloodplainSetbackMeters(Number(e.target.value))}
                  className="w-full accent-sky-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs text-slate-400">Temporary Flood Water Storage</div>
                <div className="text-xl font-extrabold text-white">~{floodDissipationM3.toLocaleString()} m³</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Allows peak monsoon bursts to gently inundate vegetated wetlands rather than rushing downstream into inhabited villages.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs text-slate-400">Total Stream Restoration Cost</div>
                <div className="text-2xl font-extrabold text-cyan-400">₹{totalCostLakhs} Lakhs</div>
                <div className="text-[11px] text-slate-500">Includes coir armor, root wads, and culvert excavation</div>
              </div>
            </div>

            <button
              onClick={() => navigate('/land-roads')}
              className="w-full mt-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              Continue to Tab 6: Farms & Roads
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
