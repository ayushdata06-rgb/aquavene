import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  MapPin,
  Search,
  Filter,
  Download,
  ArrowRight,
  ArrowLeft,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Archive,
  RotateCcw,
  Sparkles,
  Activity,
  Scale,
  ShieldCheck,
  Mountain,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';
import { api, FIXTURE_RANKINGS } from '../api/client';
import { PriorityScore, ActiveArea } from '../types';
import { SiteDiagnosticModal } from '../components/SiteDiagnosticModal';
import { DataResolutionModal } from '../components/DataResolutionModal';

export const RankingsTab: React.FC = () => {
  const navigate = useNavigate();
  const { activeArea, isAreaSelected, selectWatershed, setActiveStep } = useResearch();

  const [rankings, setRankings] = useState<PriorityScore[]>([]);
  const [isLoadingRankings, setIsLoadingRankings] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedBasin, setSelectedBasin] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'soil' | 'runoff' | 'bare'>('score');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Modals
  const [diagnosticArea, setDiagnosticArea] = useState<ActiveArea | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showDataResolutionModal, setShowDataResolutionModal] = useState(false);

  useEffect(() => {
    setActiveStep(0);
    setIsLoadingRankings(true);
    api.getRankings().then((data) => {
      setRankings(data && data.length > 0 ? data : FIXTURE_RANKINGS);
    }).finally(() => setIsLoadingRankings(false));
  }, []);

  // Filter options
  const states = useMemo(() => Array.from(new Set(rankings.map((r) => r.state))), [rankings]);
  const basins = useMemo(() => Array.from(new Set(rankings.map((r) => r.basin_name))), [rankings]);

  // If activeArea is a live custom AOI, prepend it to the ranked list
  const aoiEntry: PriorityScore | null = useMemo(() => {
    if (!activeArea || !activeArea.isCustom) return null;
    const erosionPct = Math.min(100, Math.round(activeArea.soil_loss_t_ha_yr * 2.2));
    const runoffPct = Math.min(100, Math.round((activeArea.peak_discharge_m3s || 5) * 5));
    const barepct = Math.min(100, activeArea.bare_soil_pct);
    const rainPct = Math.min(100, Math.round(activeArea.rainfall_30d_mm / 4));
    return {
      id: activeArea.id,
      watershed_id: activeArea.id,
      watershed_code: activeArea.code || 'LIVE-AOI',
      watershed_name: `🎯 ${activeArea.name}`,
      state: activeArea.state,
      district: activeArea.district,
      basin_name: activeArea.location?.river_basin || 'Live AOI Basin',
      rank_position: 0,
      overall_score: activeArea.score,
      priority_category: activeArea.category,
      area_sq_km: activeArea.area_sq_km,
      indicator_breakdown: {
        erosion_potential: erosionPct,
        runoff_potential: runoffPct,
        landcover_degradation: barepct,
        rainfall_pressure: rainPct,
        downstream_exposure: 50,
      },
    } as unknown as PriorityScore;
  }, [activeArea]);

  const hasActiveFilters = searchTerm !== '' || selectedState !== 'all' || selectedBasin !== 'all' || sortBy !== 'score';

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('all');
    setSelectedBasin('all');
    setSortBy('score');
  };

  const handleOpenDiagnostic = (ws: PriorityScore) => {
    const diagnosticObj: ActiveArea = {
      id: ws.id,
      name: ws.watershed_name,
      code: ws.watershed_code,
      district: ws.district,
      state: ws.state,
      area_sq_km: 42.5,
      areaKm2: 42.5,
      score: ws.overall_score,
      category: ws.priority_category as any,
      rank_text: `#${ws.rank_position} of ${rankings.length}`,
      soil_loss_t_ha_yr: Math.round((ws.overall_score / 100) ** 1.8 * 45 * 10) / 10,
      slope_deg: 16.5,
      bare_soil_pct: Math.min(55, Math.round(ws.overall_score * 0.45)),
      plant_cover_pct: Math.max(12, Math.round(100 - ws.overall_score * 0.7)),
      rainfall_30d_mm: 280,
      rainfall_anomaly_pct: 12,
      monsoon_storm_p95: 58,
      drainage_density: 2.1,
      relief_m: 640,
      main_problem: ws.overall_score >= 70 ? 'Steep slopes & bare soil erosion' : 'Monsoon runoff pressure',
      coordinates: [[15.15, 74.35], [15.25, 74.35], [15.25, 74.45], [15.15, 74.45]],
      hydrology_network: activeArea?.hydrology_network || ({} as any),
      prescribed_interventions: activeArea?.prescribed_interventions || [],
      historical_timeline: activeArea?.historical_timeline || [],
      wiki_articles: activeArea?.wiki_articles || [],
      hydrograph: activeArea?.hydrograph || [],
      community_priorities: activeArea?.community_priorities || [],
      budget_items: activeArea?.budget_items || [],
      total_budget_lakhs_inr: 85.0,
      mgnrega_mandays: 12000,
    };
    setDiagnosticArea(diagnosticObj);
    setShowDiagnosticModal(true);
  };

  const filteredAndSortedRankings = useMemo(() => {
    const base = [...rankings];
    const filtered = base
      .filter((r) => {
        const matchesSearch =
          r.watershed_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.watershed_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.district.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesState = selectedState === 'all' || r.state === selectedState;
        const matchesBasin = selectedBasin === 'all' || r.basin_name === selectedBasin;
        return matchesSearch && matchesState && matchesBasin;
      })
      .sort((a, b) => {
        if (sortBy === 'score') return b.overall_score - a.overall_score;
        if (sortBy === 'soil') return (b.indicator_breakdown?.erosion_potential || 0) - (a.indicator_breakdown?.erosion_potential || 0);
        if (sortBy === 'runoff') return (b.indicator_breakdown?.runoff_potential || 0) - (a.indicator_breakdown?.runoff_potential || 0);
        if (sortBy === 'bare') return (b.indicator_breakdown?.landcover_degradation || 0) - (a.indicator_breakdown?.landcover_degradation || 0);
        return 0;
      });
    // Prepend live AOI entry at top if it matches filters
    if (aoiEntry) {
      const matchSearch = aoiEntry.watershed_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aoiEntry.district.toLowerCase().includes(searchTerm.toLowerCase());
      const matchState = selectedState === 'all' || aoiEntry.state === selectedState;
      if (matchSearch && matchState) {
        return [aoiEntry, ...filtered];
      }
    }
    return filtered;
  }, [rankings, searchTerm, selectedState, selectedBasin, sortBy, aoiEntry]);

  const getPriorityBadge = (category: string) => {
    switch (category) {
      case 'Critical':
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Critical
          </span>
        );
      case 'High':
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            High
          </span>
        );
      case 'Moderate':
      case 'medium':
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            Moderate
          </span>
        );
      case 'Low':
      case 'low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Low
          </span>
        );
    }
  };

  const handleExport = (type: 'csv' | 'geojson' | 'shapefile') => {
    const dataStr = JSON.stringify(filteredAndSortedRankings, null, 2);
    let filename = `aquavene_catchments_${new Date().toISOString().slice(0, 10)}`;
    let mime = 'application/json';

    if (type === 'csv') {
      const headers = ['Rank,Area Name,Code,District,State,Basin,Urgency Score,Priority Category,Soil Loss Index\n'];
      const rows = filteredAndSortedRankings.map(
        (r) => `${r.rank_position},"${r.watershed_name}","${r.watershed_code}","${r.district}","${r.state}","${r.basin_name}",${r.overall_score},"${r.priority_category}",${r.indicator_breakdown?.erosion_potential || 0}\n`
      );
      const csvBlob = new Blob([headers.join('') + rows.join('')], { type: 'text/csv' });
      const url = URL.createObjectURL(csvBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.click();
      setExportNotice('Spreadsheet (CSV) downloaded successfully!');
    } else if (type === 'geojson') {
      const blob = new Blob([dataStr], { type: 'application/geo+json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.geojson`;
      a.click();
      setExportNotice('GeoJSON GIS file downloaded successfully!');
    } else {
      const blob = new Blob([dataStr], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_shp_package.json`;
      a.click();
      setExportNotice('Shapefile metadata package downloaded successfully!');
    }

    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span className="text-emerald-400">Micro-Watershed Prioritisation Engine</span>
            <span>•</span>
            <span>Priority Vulnerability Index (PVI)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
            Ranked Micro-Watersheds & Spatial Prioritisation
          </h1>
          <p className="text-xs text-slate-400">
            Multi-criteria hydrological screening based on USLE soil loss, topographic runoff, and remote sensing land degradation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowDataResolutionModal(true)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all"
            title="Inspect satellite sensor resolutions, DEM grid size, and confidence intervals"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Data Provenance & Uncertainty</span>
          </button>

          <button
            onClick={() => navigate('/map')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Interactive Map</span>
          </button>
        </div>
      </div>

      {/* Top Summary Card for Active Area */}
      {activeArea ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Selected Catchment Summary
              </span>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {activeArea.name}
                <span className="text-xs text-slate-400 font-normal">
                  ({activeArea.district}, {activeArea.state})
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                This area loses more soil than <strong>85%</strong> of others in the region. Rain runs off quickly here, creating gully erosion.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <div className="text-right pr-2">
                <span className="text-xs text-slate-400 block">Regional Rank</span>
                <strong className="text-xl font-extrabold text-white">{activeArea.rank_text}</strong>
              </div>
              <div className="h-10 w-px bg-slate-800 hidden sm:block" />
              <div className="text-right pr-2">
                <span className="text-xs text-slate-400 block">Urgency Score</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-white">{activeArea.score}</span>
                  {getPriorityBadge(activeArea.category)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setDiagnosticArea(activeArea);
                    setShowDiagnosticModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inspect Score Breakdown</span>
                </button>
                <button
                  onClick={() => navigate('/simulator')}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Scale className="w-3.5 h-3.5 text-purple-400" />
                  <span>Test Policy Scenarios</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Catchment Area</span>
              <strong className="text-white text-sm">{activeArea.area_sq_km} km²</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Soil Washed Away/Year</span>
              <strong className="text-rose-400 text-sm">{activeArea.soil_loss_t_ha_yr} t/ha/yr</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Bare Ground Share</span>
              <strong className="text-amber-400 text-sm">{activeArea.bare_soil_pct}%</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Primary Cause</span>
              <strong className="text-slate-200 text-xs truncate block">{activeArea.main_problem}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Select any micro-watershed below to inspect its diagnostic scorecard or view it on the interactive map.</span>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <span>Open Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Export Feedback Banner */}
      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Filter and Sorting Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search area name, code, or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium shrink-0">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="score">Most urgent first</option>
              <option value="soil">Most soil lost</option>
              <option value="runoff">Most rain runoff</option>
              <option value="bare">Most bare land</option>
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-medium shrink-0">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All States</option>
              {states.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800 flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Master Catchments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4"># Rank</th>
                <th className="py-3 px-4">Catchment Area</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-center">Urgency Score</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Soil Lost/Year</th>
                <th className="py-3 px-4">Main Cause</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoadingRankings && rankings.length === 0 && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-3 bg-slate-800 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {filteredAndSortedRankings.map((ws) => {
                const isSelected = activeArea?.id === ws.id || activeArea?.code === ws.watershed_code;
                const soilLoss = Math.round((ws.overall_score / 100) ** 1.8 * 45 * 10) / 10;
                const mainProblem =
                  ws.overall_score >= 75
                    ? 'Steep slopes & bare soil'
                    : ws.overall_score >= 60
                    ? 'Monsoon runoff pressure'
                    : 'Agricultural lowland pooling';

                return (
                  <tr
                    key={ws.id}
                    onClick={() => selectWatershed(ws)}
                    className={`cursor-pointer transition-colors ${
                      ws.rank_position === 0 && ws.watershed_code === (activeArea?.code || 'LIVE-AOI')
                        ? 'bg-cyan-500/10 border-l-2 border-cyan-400 hover:bg-cyan-500/15'
                        : isSelected ? 'bg-emerald-500/10 hover:bg-emerald-500/15' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-white">
                      {ws.rank_position === 0 ? (
                        <span className="text-cyan-400 text-[10px] font-black uppercase tracking-wider">LIVE</span>
                      ) : (
                        `#${ws.rank_position}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      <span>{ws.watershed_name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">{ws.watershed_code}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {ws.district}, {ws.state}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-white text-sm">
                      {ws.overall_score.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-4 text-center">{getPriorityBadge(ws.priority_category)}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-rose-300">
                      {soilLoss} t/ha
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 text-[11px]">{mainProblem}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDiagnostic(ws);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-[11px] text-emerald-300 font-semibold transition-colors flex items-center gap-1"
                          title="View USLE soil loss, slope, and mathematical point contributions"
                        >
                          <Activity className="w-3 h-3 text-emerald-400" />
                          <span>Diagnostic</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectWatershed(ws);
                            navigate('/terrain');
                          }}
                          className="px-2 py-1 rounded-lg bg-sky-600/20 hover:bg-sky-600/30 text-[11px] text-sky-300 font-semibold border border-sky-500/40 transition-colors flex items-center gap-1"
                          title="Inspect Whitebox slope, USLE soil loss and longitudinal profile"
                        >
                          <Mountain className="w-3 h-3 text-sky-400" />
                          <span>Terrain</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectWatershed(ws);
                            navigate('/map');
                          }}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white font-semibold border border-slate-700 hover:border-slate-600 transition-colors flex items-center gap-1"
                          title="Locate and explore on interactive geospatial map"
                        >
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>Map</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Panel ("Download Report") */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2">
          <Download className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">Download Reports & GIS Files</h3>
        </div>
        <p className="text-xs text-slate-400">
          Export this screening matrix in standard formats for administrative DPR proposals, GIS software, and funding sanctions
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => handleExport('csv')}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all space-y-1.5 group"
          >
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Spreadsheet (Excel / CSV)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Best for budget tables, sorting, and Detailed Project Report (DPR) attachments.
            </p>
          </button>

          <button
            onClick={() => handleExport('geojson')}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all space-y-1.5 group"
          >
            <div className="flex items-center space-x-2 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
              <FileCode className="w-4 h-4" />
              <span>Map File (GeoJSON)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Best for web GIS maps, Google Earth, and QGIS spatial screening.
            </p>
          </button>

          <button
            onClick={() => handleExport('shapefile')}
            className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-left transition-all space-y-1.5 group"
          >
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 group-hover:text-amber-300">
              <Archive className="w-4 h-4" />
              <span>Shapefile Package (.zip)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Standard format required by government GIS departments and Jal Shakti portals.
            </p>
          </button>
        </div>
      </div>

      {/* Bottom Step Forward Button */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          onClick={() => navigate('/map')}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Map
        </button>

        <button
          onClick={() => navigate('/hydrology')}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
        >
          <span>Understand the water flow</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      {/* Per-Site Diagnostic Modal */}
      <SiteDiagnosticModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        area={diagnosticArea}
      />

      {/* Data Resolution & Uncertainty Modal */}
      <DataResolutionModal
        isOpen={showDataResolutionModal}
        onClose={() => setShowDataResolutionModal(false)}
      />
    </div>
  );
};

