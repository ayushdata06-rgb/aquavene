import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Newspaper,
  AlertTriangle,
  ExternalLink,
  Clock,
  Compass,
  Waves,
  ShieldAlert,
  CheckCircle2,
  Droplets,
  ArrowRight,
  MapPin,
  Calendar,
  CloudRain,
  Mountain,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';

export const HistoryTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea } = useResearch();

  const history = activeArea?.history;
  const location = activeArea?.location;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
              <BookOpen className="h-3.5 w-3.5" />
              Tab 2 • Catchment History & Regional Water Memory
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              {activeArea ? activeArea.name : 'Regional Catchment History'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                {location?.locality || activeArea?.district || 'Selected Region'}, {location?.state || activeArea?.state || 'India'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-cyan-300 font-medium">
                <Waves className="h-3.5 w-3.5" />
                {location?.river_basin || 'Peninsular River Basin'}
              </span>
              <span>•</span>
              <span className="text-slate-400">
                {activeArea?.area_sq_km || 42.5} km² ({Math.round((activeArea?.area_sq_km || 42.5) * 100)} Hectares)
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/terrain')}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
            >
              Examine Terrain & Health
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Climate & Monsoon Anomaly Alert */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
          <div className="p-3 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
            <CloudRain className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">30-Day Precipitation</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {activeArea?.rainfall_30d_mm || 360.0} mm
            </div>
            <div className="text-xs text-sky-300 mt-1 font-medium">
              {activeArea?.rainfall_anomaly_pct && activeArea.rainfall_anomaly_pct > 0 ? '+' : ''}
              {activeArea?.rainfall_anomaly_pct || 42}% vs 30-yr baseline
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Monsoon Storm Peak (P95)</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {activeArea?.monsoon_storm_p95 || 92.0} mm/day
            </div>
            <div className="text-xs text-amber-300 mt-1">High-velocity sheetwash risk</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Agro-Climatic Zone</div>
            <div className="text-lg font-bold text-white mt-0.5 truncate">
              {location?.agro_climatic_zone || 'Western Ghats & Coastal Plain'}
            </div>
            <div className="text-xs text-emerald-300 mt-1">Indigenous species adapted</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Real Wikipedia Articles + Water Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real Wikipedia Geographic Features (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Newspaper className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Live Wikipedia Water & Geographic Records</h2>
                  <p className="text-xs text-slate-400">Queried within 15 km of catchment centroid</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Live Open Knowledge
              </span>
            </div>

            {history?.nearby_water_features && history.nearby_water_features.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.nearby_water_features.map((art, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-sm text-white hover:text-amber-300 transition-colors">
                          {art.title}
                        </h3>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                          {art.distance_km} km away
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">Wikipedia Archive</span>
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold"
                      >
                        Read Article <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-sm">
                No nearby Wikipedia water records found for this coordinate. Querying sub-basin telemetry...
              </div>
            )}
          </div>

          {/* Historical Timeline of the Catchment */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Catchment Ecological Chronology</h2>
                <p className="text-xs text-slate-400">How water management shifted across generations</p>
              </div>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-800 space-y-6">
              {(history?.historical_timeline || [
                {
                  era: 'Pre-1980s',
                  title: 'Traditional Catchment Tank Systems',
                  detail: 'Interconnected village percolation tanks and field bunds maintained groundwater recharge throughout the basin.',
                },
                {
                  era: '1990s - 2005',
                  title: 'Deep Borewells & Hillside Clearing',
                  detail: 'Rapid mechanization and shift to commercial cash crops led to clearing of upper ridge vegetation and unpaved farm roads.',
                },
                {
                  era: '2010 - 2020',
                  title: 'Monsoon Extremes & Stream Bank Siltation',
                  detail: 'Increased frequency of intense short-duration rainfall caused severe stream bank erosion and reservoir siltation.',
                },
                {
                  era: 'Present Day',
                  title: 'Integrated Catchment Restoration Need',
                  detail: 'State watershed guidelines prioritize bio-engineering, barrier removal, and regenerative farming.',
                },
              ]).map((t, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-brand-500 border-2 border-slate-900 shadow-md" />
                  <div className="text-xs font-bold text-brand-400 uppercase tracking-wider">{t.era}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{t.title}</div>
                  <div className="text-xs text-slate-400 mt-1 leading-relaxed">{t.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Identified Water Challenges & Threats */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Identified Water Threats</h2>
                <p className="text-xs text-slate-400">Current ecological vulnerabilities</p>
              </div>
            </div>

            <div className="space-y-3.5">
              {(history?.water_challenges || [
                {
                  severity: 'Critical',
                  category: 'High-Velocity Slope Gully Erosion',
                  description: 'Steep escarpments face intense monsoon bursts causing rapid gully formation and high reservoir sediment loads.',
                },
                {
                  severity: 'High',
                  category: 'Agricultural Silt Bleed from Dirt Roads',
                  description: 'Unpaved farm access roads act as drainage trenches during storms, bleeding tons of silt into streams.',
                },
                {
                  severity: 'Medium',
                  category: 'Fish Migration Obstruction',
                  description: 'Unregulated small check dams and steep road culverts restrict seasonal upstream migration of endemic fish.',
                },
              ]).map((c, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${
                    c.severity === 'Critical'
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-200'
                      : c.severity === 'High Alert' || c.severity === 'High'
                      ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold uppercase tracking-wider">
                      {c.category}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        c.severity === 'Critical'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {c.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    {c.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Quick Next Step Pill */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-3">
                Ready to diagnose slopes, bare soil and rainfall?
              </div>
              <button
                onClick={() => navigate('/terrain')}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 flex items-center justify-center gap-2"
              >
                Go to Tab 3: Terrain & Health
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

