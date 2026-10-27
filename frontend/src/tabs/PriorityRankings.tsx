import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { PriorityScore, PriorityCategory } from '../types';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  ExternalLink,
  Info,
  ChevronLeft,
  ChevronRight,
  Calculator,
} from 'lucide-react';

export const PriorityRankings: React.FC = () => {
  const [rankings, setRankings] = useState<PriorityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof PriorityScore | 'erosion' | 'runoff'>('rank_position');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRankings() {
      try {
        const data = await api.getRankings();
        setRankings(data);
      } catch (err) {
        console.error('Failed to load rankings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRankings();
  }, []);

  const handleSort = (field: keyof PriorityScore | 'erosion' | 'runoff') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank_position');
    }
  };

  const filteredRankings = rankings
    .filter((item) => {
      const matchSearch =
        item.watershed_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.watershed_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.basin_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        categoryFilter === 'all' || item.priority_category === categoryFilter;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      let valA: any = a[sortField as keyof PriorityScore];
      let valB: any = b[sortField as keyof PriorityScore];

      if (sortField === 'erosion') {
        valA = a.indicator_breakdown.erosion_potential;
        valB = b.indicator_breakdown.erosion_potential;
      } else if (sortField === 'runoff') {
        valA = a.indicator_breakdown.runoff_potential;
        valB = b.indicator_breakdown.runoff_potential;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredRankings.length / pageSize) || 1;
  const paginatedRankings = filteredRankings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (loading) {
    return <LoadingSkeleton rows={10} />;
  }

  const categoryBadgeClass = (cat: PriorityCategory) => {
    switch (cat) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'Moderate':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'Low':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Priority Rankings
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Transparent, multi-criteria ranked evaluation for micro-watershed intervention
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={api.getExportRankingsCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Formula Explanation Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-aqua-400">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-white block">Active Scoring Model (Baseline v1.0)</span>
            <span className="text-slate-400 font-mono text-[11px]">
              Priority P = (0.20 × E) + (0.25 × R) + (0.15 × L) + (0.20 × W) + (0.20 × D)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-slate-400">
          <Info className="h-3.5 w-3.5 text-slate-500" />
          <span>All indicators normalized to 0–100 scale</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by code, name, district, state..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] font-medium pr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Priority:
          </span>
          {(['all', 'Critical', 'High', 'Moderate', 'Low'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategoryFilter(cat);
                setCurrentPage(1);
              }}
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

      {/* Rankings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                <th
                  onClick={() => handleSort('rank_position')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center space-x-1">
                    <span>Rank</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Watershed Code & Name</th>
                <th className="py-3.5 px-4">Location</th>
                <th
                  onClick={() => handleSort('overall_score')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white text-right"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Score (0-100)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Category</th>
                <th
                  onClick={() => handleSort('erosion')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white text-center"
                >
                  Erosion (E)
                </th>
                <th
                  onClick={() => handleSort('runoff')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white text-center"
                >
                  Runoff (R)
                </th>
                <th className="py-3.5 px-4 text-center">Degradation (L)</th>
                <th className="py-3.5 px-4 text-center">Rainfall (W)</th>
                <th className="py-3.5 px-4 text-center">Exposure (D)</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {paginatedRankings.map((ws) => (
                <tr
                  key={ws.id}
                  onClick={() => navigate(`/explorer?id=${ws.watershed_id}`)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-white">
                    <span className="h-6 w-6 rounded-md bg-slate-800 inline-flex items-center justify-center text-xs">
                      #{ws.rank_position}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{ws.watershed_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{ws.watershed_code}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    <div>{ws.district}, {ws.state}</div>
                    <div className="text-[10px] text-slate-500">{ws.basin_name}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-base text-white">
                    {ws.overall_score}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${categoryBadgeClass(
                        ws.priority_category
                      )}`}
                    >
                      {ws.priority_category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {ws.indicator_breakdown.erosion_potential}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {ws.indicator_breakdown.runoff_potential}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {ws.indicator_breakdown.landcover_degradation}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {ws.indicator_breakdown.rainfall_pressure}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {ws.indicator_breakdown.downstream_exposure}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/explorer?id=${ws.watershed_id}`);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                      title="Inspect in Explorer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredRankings.length)} of{' '}
            {filteredRankings.length} watersheds
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-medium text-white px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
