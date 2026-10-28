import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Map,
  ListOrdered,
  Waves,
  Sliders,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';

const TABS = [
  {
    step: 1,
    id: 'map',
    name: 'Map',
    subtitle: 'Choose Your Area',
    path: '/map',
    icon: Map,
    color: 'text-emerald-400',
  },
  {
    step: 2,
    id: 'rankings',
    name: 'Rankings',
    subtitle: 'See How Urgent',
    path: '/rankings',
    icon: ListOrdered,
    color: 'text-amber-400',
  },
  {
    step: 3,
    id: 'hydrology',
    name: 'Hydrology',
    subtitle: 'Understand Water Flow',
    path: '/hydrology',
    icon: Waves,
    color: 'text-cyan-400',
  },
  {
    step: 4,
    id: 'simulator',
    name: 'Simulator',
    subtitle: 'Plan Works & Test Ideas',
    path: '/simulator',
    icon: Sliders,
    color: 'text-purple-400',
  },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAreaSelected } = useResearch();

  return (
    <aside
      className={`bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 transition-all duration-300 relative z-30 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="p-3 space-y-4">
        {/* Toggle Button */}
        <div className="flex items-center justify-between px-2 pt-1">
          {!collapsed && (
            <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              Guided 4 Steps
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

        {/* 4 Core Navigation Items */}
        <nav className="space-y-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                title={collapsed ? `${tab.step}. ${tab.name} (${tab.subtitle})` : undefined}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-xs font-semibold transition-all group ${
                    collapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`
                }
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-slate-800 text-[9px] font-bold text-slate-300 flex items-center justify-center border border-slate-700">
                    {tab.step}
                  </span>
                </div>

                {!collapsed && (
                  <div className="truncate">
                    <span className="block font-bold text-white text-xs leading-none">
                      {tab.name}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 leading-none">
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
            <span>Screening Advisory</span>
          </div>
          <p className="text-slate-400 leading-relaxed text-[10px]">
            Decision-support screening model. Not a substitute for on-ground civil engineering field surveys.
          </p>
        </div>
      )}
    </aside>
  );
};
