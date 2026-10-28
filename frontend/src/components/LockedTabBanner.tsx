import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Sparkles, Compass, ShieldAlert, ArrowRight } from 'lucide-react';
import { useResearch } from '../context/ResearchContext';

interface LockedTabBannerProps {
  stepName: string;
  stepNumber: number;
  whatItShows: string;
}

export const LockedTabBanner: React.FC<LockedTabBannerProps> = ({
  stepName,
  stepNumber,
  whatItShows,
}) => {
  const navigate = useNavigate();
  const { loadSampleArea } = useResearch();

  return (
    <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
        <MapPin className="w-8 h-8 animate-bounce" />
      </div>

      <div className="space-y-2">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700">
          Step {stepNumber}: {stepName}
        </span>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Pick an area on the map first to unlock this step
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          {whatItShows}. Once you choose or draw a location on the map, this tab will automatically calculate everything for that area.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 text-left space-y-2">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-cyan-400" />
          Two easy ways to begin:
        </div>
        <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-300">
          <li>
            <strong>Draw 4 points on the map:</strong> Click any 4 corners to set a custom project boundary.
          </li>
          <li>
            <strong>Click an example village:</strong> Instantly loads real test catchment data to see how the tool works.
          </li>
        </ol>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('/map')}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5"
        >
          <MapPin className="w-4 h-4" />
          Go to Map (Step 1)
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => {
            loadSampleArea();
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          Try Example Village
        </button>
      </div>
    </div>
  );
};

