import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Map,
  BookOpen,
  Mountain,
  Trees,
  Fish,
  Tractor,
  Sliders,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';

export const TABS = [
  {
    step: 1,
    id: 'map',
    name: '1. Map & Draw',
    subtitle: 'Locate & Draw AOI',
    path: '/map',
    icon: Map,
    color: 'text-emerald-400',
  },
  {
    step: 2,
    id: 'history',
    name: '2. History & News',
    subtitle: 'Catchment Memory',
    path: '/history',
    icon: BookOpen,
    color: 'text-amber-400',
  },
  {
    step: 3,
    id: 'terrain',
    name: '3. Terrain & Health',
    subtitle: 'Slopes & 30d Rain',
    path: '/terrain',
    icon: Mountain,
    color: 'text-sky-400',
  },
  {
    step: 4,
    id: 'reforest',
    name: '4. Forest & Trees',
    subtitle: 'Pillar 1: Native Cover',
    path: '/reforest',
    icon: Trees,
    color: 'text-emerald-400',
  },
  {
    step: 5,
    id: 'streams',
    name: '5. Streams & Fish',
    subtitle: 'Pillars 2 & 3: Bio-Repair',
    path: '/streams',
    icon: Fish,
    color: 'text-cyan-400',
  },
  {
    step: 6,
    id: 'land-roads',
    name: '6. Farms & Roads',
    subtitle: 'Pillars 4 & 5: Silt Arrest',
    path: '/land-roads',
    icon: Tractor,
    color: 'text-orange-400',
  },
  {
    step: 7,
    id: 'simulator',
    name: '7. Simulator',
    subtitle: 'Test 5 Levers Live',
    path: '/simulator',
    icon: Sliders,
    color: 'text-purple-400',
  },
  {
    step: 8,
    id: 'plan',
    name: '8. Plan & Budget',
    subtitle: 'Official BoQ & DPR',
    path: '/plan',
    icon: FileCheck2,
    color: 'text-teal-400',
  },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAreaSelected } = useResearch();

  return (
    <aside
      className={`bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 relative z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="p-3 space-y-3 overflow-y-auto scrollbar-none flex-1">
        {/* Toggle Button */}
        <div className="flex items-center justify-between px-2 pt-1">
          {!collapsed && (
            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              8-Step Restoration Tool
            </p>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* 8 Navigation Tabs */}
        <nav className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                title={collapsed ? `${tab.name} (${tab.subtitle})` : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-xs font-semibold transition-all group ${
                    collapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2'
                  } ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`
                }
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon className={`h-4 w-4 ${tab.color}`} />
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-slate-800 text-[9px] font-bold text-slate-300 flex items-center justify-center border border-slate-700">
                    {tab.step}
                  </span>
                </div>

                {!collapsed && (
                  <div className="truncate">
                    <span className="block font-bold text-white text-xs leading-none">
                      {tab.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-none truncate">
                      {tab.subtitle}
                    </span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Advisory Notice Box */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-1.5">
          <div className="flex items-center space-x-1.5 text-amber-400 font-medium text-[11px]">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Schedule of Rates</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[10px]">
            Calibrated with MGNREGA norms & live Open-Meteo telemetry.
          </p>
        </div>
      )}
    </aside>
  );
};
