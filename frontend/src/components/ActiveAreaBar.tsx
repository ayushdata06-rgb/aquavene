import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  Info,
  Waves,
} from 'lucide-react';
import { useResearch } from '../context/ResearchContext';

export const ActiveAreaBar: React.FC = () => {
  const {
    activeArea,
    isAreaSelected,
    loadSampleArea,
    loadPresetCatchment,
    clearActiveArea,
    setShowOnboarding,
    setShowGlossary,
  } = useResearch();

  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const steps = [
    { number: 1, label: 'Map', path: '/map' },
    { number: 2, label: 'History', path: '/history' },
    { number: 3, label: 'Terrain', path: '/terrain' },
    { number: 4, label: 'Forest', path: '/reforest' },
    { number: 5, label: 'Streams', path: '/streams' },
    { number: 6, label: 'Farms & Roads', path: '/land-roads' },
    { number: 7, label: 'Simulator', path: '/simulator' },
    { number: 8, label: 'Plan & Budget', path: '/plan' },
  ];

  const currentStepIdx = steps.findIndex((s) => s.path === location.pathname);

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Moderate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Low':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md z-30 select-none">
      {/* 8-Step Guided Progress */}
      <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {steps.map((step, idx) => {
          const isActive = location.pathname === step.path;
          const isDone = isAreaSelected && currentStepIdx > idx;

          return (
            <React.Fragment key={step.path}>
              <button
                onClick={() => navigate(step.path)}
                className={`flex items-center space-x-1 px-2 py-1 rounded-lg font-medium transition-all whitespace-nowrap text-[11px] ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 font-bold'
                    : isDone
                    ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={`Step ${step.number}: ${step.label}`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-white text-emerald-700' : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {isDone ? '✓' : step.number}
                </span>
                <span>{step.label}</span>
              </button>
              {idx < steps.length - 1 && <ChevronRight className="w-3 h-3 text-slate-700 shrink-0" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active Area Summary & Controls */}
      <div className="flex items-center space-x-2 shrink-0">
        {activeArea ? (
          <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-white truncate max-w-[130px] sm:max-w-[180px]" title={activeArea.name}>
                {activeArea.location?.locality || activeArea.name}
              </span>
              <span className="text-cyan-300 font-medium text-[11px]">
                ({activeArea.location?.river_basin ? activeArea.location.river_basin.split(' ')[0] : 'Basin'})
              </span>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeStyle(activeArea.category)}`}
            >
              {activeArea.category}
            </span>

            <button
              onClick={() => navigate('/map')}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium pl-1"
            >
              Change Area
            </button>

            <button
              onClick={() => setShowConfirmReset(true)}
              className="text-slate-400 hover:text-rose-400 p-1"
              title="Start over with a new area"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] hidden lg:inline-flex">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Choose a Basin:</span>
            </span>
            <button
              onClick={() => loadPresetCatchment('kali')}
              className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
            >
              🌿 Kali (KA)
            </button>
            <button
              onClick={() => loadPresetCatchment('bhagirathi')}
              className="px-2 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
            >
              🏔️ Bhagirathi (UK)
            </button>
            <button
              onClick={() => loadPresetCatchment('narmada')}
              className="px-2 py-0.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
            >
              🌊 Narmada (MP)
            </button>
          </div>
        )}

        {/* Glossary & Tour Help Buttons */}
        <button
          onClick={() => setShowGlossary(true)}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1"
          title="Glossary & Terms"
        >
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline text-[11px]">Glossary</span>
        </button>

        <button
          onClick={() => setShowOnboarding(true)}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          title="Guided Tour"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
        </button>
      </div>

      {/* Confirmation Dialog for Start Over */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              Start over with a new area?
            </h3>
            <p className="text-xs text-slate-300">
              This will clear the current study area and let you pick or draw a fresh location on the map.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearActiveArea();
                  setShowConfirmReset(false);
                  navigate('/map');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-md shadow-rose-600/30"
              >
                Yes, Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
