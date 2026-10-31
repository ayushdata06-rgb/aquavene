import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MapPin,
  History,
  Mountain,
  Trees,
  Waves,
  Tractor,
  Activity,
  FileText,
  Shield,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';
import { useAuth } from '../context/AuthContext';

export const TABS = [
  {
    step: 0,
    id: 'map',
    name: 'AOI Selection',
    path: '/map',
    icon: MapPin,
  },
  {
    step: 1,
    id: 'history',
    name: 'Water History',
    path: '/history',
    icon: History,
  },
  {
    step: 2,
    id: 'terrain',
    name: 'Terrain Health',
    path: '/terrain',
    icon: Mountain,
  },
  {
    step: 3,
    id: 'reforest',
    name: 'Reforestation',
    path: '/reforest',
    icon: Trees,
  },
  {
    step: 4,
    id: 'streams',
    name: 'Streams & Wetlands',
    path: '/streams',
    icon: Waves,
  },
  {
    step: 5,
    id: 'farms',
    name: 'Farms & Roads',
    path: '/farms',
    icon: Tractor,
  },
  {
    step: 6,
    id: 'simulator',
    name: 'Simulator',
    path: '/simulator',
    icon: Activity,
  },
  {
    step: 7,
    id: 'budget',
    name: 'DPR & Budget',
    path: '/budget',
    icon: FileText,
  },
];

export const Sidebar: React.FC = () => {
  const { activeArea, setActiveTab } = useResearch();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-60 bg-hydro-card border-r border-hydro-border/70 flex flex-col justify-between select-none z-20">
      {/* Tab Navigation List */}
      <div className="py-4 space-y-1 px-3">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
          Hydrological Workflow
        </div>

        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isLocked = tab.step > 0 && !activeArea;

          return (
            <NavLink
              key={tab.id}
              to={isLocked ? '#' : tab.path}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault();
                  alert('Define an Area of Interest (AOI) on the map first to unlock this hydrological analysis module.');
                  return;
                }
                setActiveTab(tab.step);
              }}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isLocked
                    ? 'opacity-40 text-slate-500 hover:bg-transparent cursor-not-allowed'
                    : isActive
                    ? 'bg-hydro-panel border-l-4 border-aqua-500 text-white font-semibold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-hydro-panel/60 border-l-4 border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isLocked ? 'text-slate-500' : 'text-aqua-400'}`} />
                <span>{tab.name}</span>
              </div>

              {isLocked ? (
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              ) : activeArea && tab.step > 0 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-80" />
              ) : null}
            </NavLink>
          );
        })}

        {/* Administrator Tab */}
        {isAdmin && (
          <div className="pt-3 border-t border-hydro-border/60">
            <NavLink
              to="/admin"
              onClick={() => setActiveTab(8)}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-purple-950/80 border-l-4 border-purple-500 text-purple-200 font-semibold'
                    : 'text-purple-300 hover:text-white hover:bg-purple-950/40 border-l-4 border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>Admin Panel</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-mono">
                ROOT
              </span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Sidebar Bottom: User & Role Quick Card */}
      <div className="p-3 border-t border-hydro-border/60 bg-hydro-surface/40">
        <div className="p-2.5 rounded-xl bg-hydro-panel/80 border border-hydro-border flex items-center gap-2.5">
          <img
            src={
              user?.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
            }
            alt="User"
            className="w-8 h-8 rounded-full object-cover border border-white/20"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {user?.display_name || user?.full_name || 'Dr. Aarav Sharma'}
            </p>
            <p className="text-[10px] font-mono text-aqua-400 uppercase tracking-wide truncate">
              {user?.role || 'viewer'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
