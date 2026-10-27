import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  ListOrdered,
  BarChart3,
  CloudRain,
  Mountain,
  Sliders,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const TABS = [
  { id: 'overview', name: 'Overview Dashboard', path: '/', icon: LayoutDashboard },
  { id: 'explorer', name: 'Watershed Explorer', path: '/explorer', icon: Map },
  { id: 'rankings', name: 'Priority Rankings', path: '/rankings', icon: ListOrdered },
  { id: 'indicators', name: 'Indicator Analysis', path: '/indicators', icon: BarChart3 },
  { id: 'rainfall', name: 'Rainfall & Climate', path: '/rainfall', icon: CloudRain },
  { id: 'terrain', name: 'Terrain & Land Cover', path: '/terrain', icon: Mountain },
  { id: 'scenarios', name: 'Scenario Simulator', path: '/scenarios', icon: Sliders },
  { id: 'reports', name: 'Data & Reports', path: '/reports', icon: FileText },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
            Restoration Modules
          </p>
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  end={tab.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-600/20 to-aqua-600/10 text-brand-400 border border-brand-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Advisory Notice Box */}
      <div className="p-4 m-4 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs space-y-2">
        <div className="flex items-center space-x-1.5 text-amber-400 font-medium">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Screening Advisory</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          Decision-support prioritization system. Not a substitute for engineering field surveys or hydrological gauge calibration.
        </p>
      </div>
    </aside>
  );
};
