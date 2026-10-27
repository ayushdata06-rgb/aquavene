import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Watershed, WatershedIndicator, PriorityCategory } from '../types';
import { MapComponent } from '../components/MapComponent';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  Search,
  Filter,
  Layers,
  MapPin,
  Compass,
  BarChart2,
  AlertCircle,
  Download,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const WatershedExplorer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [watersheds, setWatersheds] = useState<Watershed[]>([]);
  const [selectedId, setSelectedId] = useState<string>(searchParams.get('id') || 'ws-001');
  const [indicators, setIndicators] = useState<WatershedIndicator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getWatersheds();
        setWatersheds(data);
        const urlId = searchParams.get('id');
        if (urlId && data.some((w) => w.id === urlId)) {
          setSelectedId(urlId);
        } else if (data.length > 0) {
          setSelectedId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load watersheds:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  useEffect(() => {
    async function loadIndicators() {
      if (!selectedId) return;
      try {
        const indData = await api.getWatershedIndicators(selectedId);
        setIndicators(indData);
      } catch (err) {
        console.error('Failed to load indicators:', err);
      }
    }
    loadIndicators();
  }, [selectedId]);

  const handleSelectWatershed = (id: string) => {
    setSelectedId(id);
    setSearchParams({ id });
  };

  const filteredWatersheds = watersheds.filter((ws) => {
    const matchesSearch =
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.watershed_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.basin_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || ws.priority_category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const selectedWatershed = watersheds.find((w) => w.id === selectedId) || watersheds[0];

  if (loading) {
    return <LoadingSkeleton rows={5} />;
  }

  const indicatorChartData = indicators.map((ind) => ({
    name: ind.name.replace(' Potential', '').replace(' Pressure', '').replace(' Exposure', ''),
    score: ind.normalized_score ?? 0,
    unit: ind.unit,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Watershed Explorer
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Geospatial micro-watershed inspection, multi-criteria layers, and diagnostic metrics
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, name, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-56"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400 ml-1.5" />
            {(['all', 'Critical', 'High', 'Moderate', 'Low'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  categoryFilter === cat
                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Selected Watershed Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map */}
        <div className="lg:col-span-2 space-y-3">
          <MapComponent
            watersheds={filteredWatersheds}
            selectedWatershedId={selectedId}
            onSelectWatershed={handleSelectWatershed}
            height="560px"
          />

          {/* List Carousel / Horizontal Scroller */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center space-x-3 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0 pl-2">
              Showing ({filteredWatersheds.length}):
            </span>
            {filteredWatersheds.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSelectWatershed(ws.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all border ${
                  ws.id === selectedId
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {ws.watershed_code} ({ws.priority_category})
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Selected Watershed Card */}
        {selectedWatershed && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-brand-400">
                    {selectedWatershed.watershed_code}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {selectedWatershed.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    {selectedWatershed.district}, {selectedWatershed.state} • {selectedWatershed.basin_name}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                      selectedWatershed.priority_category === 'Critical'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : selectedWatershed.priority_category === 'High'
                        ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                        : selectedWatershed.priority_category === 'Moderate'
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {selectedWatershed.priority_category}
                  </span>
                  <p className="text-xl font-black text-white mt-1">
                    {selectedWatershed.overall_score}
                    <span className="text-xs font-normal text-slate-400"> / 100</span>
                  </p>
                </div>
              </div>

              {/* Geographic Attributes */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Catchment Area</span>
                  <span className="font-bold text-slate-200">{selectedWatershed.area_sq_km} km²</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase">Current Rank</span>
                  <span className="font-bold text-slate-200">#{selectedWatershed.rank_position} of {watersheds.length}</span>
                </div>
              </div>

              {/* Indicator Contribution Breakdown */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BarChart2 className="h-3.5 w-3.5 text-aqua-400" />
                  Screening Indicators (0-100)
                </h4>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={indicatorChartData} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={95}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                        itemStyle={{ color: '#38bdf8', fontSize: '11px' }}
                      />
                      <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                        {indicatorChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.score >= 75
                                ? '#ef4444'
                                : entry.score >= 60
                                ? '#f97316'
                                : entry.score >= 40
                                ? '#eab308'
                                : '#10b981'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Uncertainty Notes & Provenance */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] space-y-1.5">
                <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
                  <Info className="h-3.5 w-3.5 text-aqua-400" />
                  <span>Provenance & Confidence</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Calculated using SRTM 30m DEM slope, Copernicus ERA5-Land precipitation, and ESA WorldCover 2021.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Method: Weighted Sum v1.0</span>
              <a
                href={api.getExportRankingsCsvUrl()}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Export Data
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
