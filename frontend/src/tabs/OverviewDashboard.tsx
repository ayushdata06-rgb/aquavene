import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardSummary, Watershed } from '../types';
import { StatCard } from '../components/StatCard';
import { MapComponent } from '../components/MapComponent';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  AlertTriangle,
  Database,
  Calendar,
  Activity,
  ArrowRight,
  CheckCircle2,
  PieChart as PieIcon,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const OverviewDashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [watersheds, setWatersheds] = useState<Watershed[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [sumData, wsData] = await Promise.all([
          api.getDashboardSummary(),
          api.getWatersheds(),
        ]);
        setSummary(sumData);
        setWatersheds(wsData);
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !summary) {
    return <LoadingSkeleton rows={6} />;
  }

  const categoryData = [
    { name: 'Critical', count: summary.priority_distribution.critical, color: '#ef4444' },
    { name: 'High', count: summary.priority_distribution.high, color: '#f97316' },
    { name: 'Moderate', count: summary.priority_distribution.moderate, color: '#eab308' },
    { name: 'Low', count: summary.priority_distribution.low, color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Scope */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Overview Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Macro-level summary of watershed prioritization and screening diagnostics
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Calendar className="h-3.5 w-3.5 text-aqua-400" />
          <span>Last Run: {summary.last_processing_date}</span>
        </div>
      </div>

      {/* Warning / Advisory Alerts */}
      {summary.warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-xs text-amber-300 space-y-1">
          <div className="flex items-center space-x-2 font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Coverage & Methodological Notices</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-2 text-amber-200/80">
            {summary.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Evaluated Watersheds"
          value={summary.total_watersheds}
          subtitle="Micro-catchments analyzed"
          icon={Compass}
          badge={{ text: 'PostGIS Indexed', variant: 'info' }}
        />
        <StatCard
          title="Critical Restoration Need"
          value={summary.priority_distribution.critical}
          subtitle="Priority Score ≥ 75.0"
          icon={AlertTriangle}
          badge={{ text: 'Urgent Action', variant: 'danger' }}
        />
        <StatCard
          title="High Priority Need"
          value={summary.priority_distribution.high}
          subtitle="Priority Score 60.0 - 74.9"
          icon={Activity}
          badge={{ text: 'Investigation', variant: 'warning' }}
        />
        <StatCard
          title="GIS Datasets Ingested"
          value={summary.datasets_count}
          subtitle="SRTM, ERA5, WorldCover, WRIS"
          icon={Database}
          badge={{ text: 'Verified', variant: 'success' }}
        />
      </div>

      {/* Interactive Map & Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-400" />
              Micro-Watershed Geographic Distribution
            </h3>
            <button
              onClick={() => navigate('/explorer')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
            >
              Open Full Explorer <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <MapComponent
            watersheds={watersheds}
            onSelectWatershed={(id) => navigate(`/explorer?id=${id}`)}
            height="440px"
          />
        </div>

        {/* Priority Distribution Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
              <PieIcon className="h-4 w-4 text-aqua-400" />
              Priority Distribution
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="text-slate-300">{cat.name} Priority</span>
                  </div>
                  <span className="font-bold text-white">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-500">
            Formula: P = 0.20E + 0.25R + 0.15L + 0.20W + 0.20D
          </div>
        </div>
      </div>

      {/* Top 5 Ranked Watersheds & Processing Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Watersheds */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-400" />
              Top 5 Priority Watersheds
            </h3>
            <button
              onClick={() => navigate('/rankings')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
            >
              View All Rankings <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {summary.top_watersheds.map((ws) => (
              <div
                key={ws.id}
                onClick={() => navigate(`/explorer?id=${ws.watershed_id}`)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all"
              >
                <div className="flex items-center space-x-3">
                  <span className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                    #{ws.rank_position}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{ws.watershed_name}</h4>
                    <p className="text-[11px] text-slate-400">
                      {ws.watershed_code} • {ws.district}, {ws.state}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-sm font-bold text-white">{ws.overall_score}</span>
                    <span className="text-[10px] block font-semibold text-rose-400">
                      {ws.priority_category}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Processing Pipeline Jobs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-aqua-400" />
              Recent Geospatial Processing Jobs
            </h3>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1 transition-colors"
            >
              Job History <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-3">
            {summary.recent_jobs.map((job) => (
              <div
                key={job.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{job.job_type}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium capitalize">
                    {job.status}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all"
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Started: {new Date(job.started_at).toLocaleTimeString()}</span>
                  <span>100% Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
