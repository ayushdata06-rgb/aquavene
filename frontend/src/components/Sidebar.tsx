import React, { useState } from 'react';
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
  BarChart3,
  UserCheck,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';
import { useAuth } from '../context/AuthContext';
import { ProfileModal } from './ProfileModal';

export const TABS = [
  {
    step: 0,
    id: 'rankings',
    name: 'Ranked Watersheds',
    path: '/rankings',
    icon: BarChart3,
  },
  {
    step: 1,
    id: 'map',
    name: 'Geospatial Map (AOI)',
    path: '/map',
    icon: MapPin,
  },
  {
    step: 2,
    id: 'history',
    name: 'Water History',
    path: '/history',
    icon: History,
  },
  {
    step: 3,
    id: 'terrain',
    name: 'Terrain Health',
    path: '/terrain',
    icon: Mountain,
  },
  {
    step: 4,
    id: 'reforest',
    name: 'Reforestation',
    path: '/reforest',
    icon: Trees,
  },
  {
    step: 5,
    id: 'streams',
    name: 'Streams & Wetlands',
    path: '/streams',
    icon: Waves,
  },
  {
    step: 6,
    id: 'farms',
    name: 'Farms & Roads',
    path: '/farms',
    icon: Tractor,
  },
  {
    step: 7,
    id: 'simulator',
    name: 'Policy & Simulation',
    path: '/simulator',
    icon: Activity,
  },
  {
    step: 8,
    id: 'budget',
    name: 'DPR & Budget',
    path: '/budget',
    icon: FileText,
  },
];

export const Sidebar: React.FC = () => {
  const { activeArea, setActiveTab } = useResearch();
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
      <aside className="w-60 bg-hydro-card border-r border-hydro-border/70 flex flex-col justify-between select-none z-20">
        {/* Tab Navigation List */}
        <div className="py-4 space-y-1 px-3">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Hydrological Workflow
          </div>

          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isLocked = !['rankings', 'map'].includes(tab.id) && !activeArea;

            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                onClick={() => {
                  setActiveTab(tab.step);
                }}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isLocked
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-hydro-panel/40 border-l-4 border-transparent'
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
        </div>

        {/* Sidebar Bottom: User & Role Quick Card */}
        <div className="p-3 border-t border-hydro-border/60 bg-hydro-surface/40">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-full text-left p-2.5 rounded-xl bg-hydro-panel/80 hover:bg-hydro-panel border border-hydro-border hover:border-cyan-500/50 flex items-center gap-2.5 transition-all group"
            title="Click to open Profile & Team RBAC panel"
          >
            <img
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
              }
              alt="User"
              className="w-8 h-8 rounded-full object-cover border border-white/20 group-hover:scale-105 transition-transform"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-tight group-hover:text-cyan-300">
                {user?.display_name || user?.full_name || 'Dr. Aarav Sharma'}
              </p>
              <p className="text-[10px] font-mono text-aqua-400 uppercase tracking-wide truncate">
                {user?.role || 'viewer'} • Profile
              </p>
            </div>
            <UserCheck className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
          </button>
        </div>
      </aside>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </>
  );
};
