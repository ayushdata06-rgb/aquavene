import React from 'react';
import { HelpCircle, TrendingUp, TrendingDown } from 'lucide-react';

export interface SHAPItem {
  feature: string;
  value: number;
  direction: 'up' | 'down';
  description?: string;
}

export interface SHAPWaterfallProps {
  shapValues: SHAPItem[];
  title?: string;
  className?: string;
}

const friendlyFeatureNames: Record<string, string> = {
  bare_soil_pct: 'Bare Soil & Canopy Absence',
  mean_slope_deg: 'Terrain Steepness / Slope',
  rainfall_intensity_idf: 'Extreme Rainfall Intensity (IDF)',
  drainage_density: 'Drainage Density Index',
  elevation_range_m: 'Elevation Relief Range',
  flow_accumulation_p95: 'D8 Flow Concentration (P95)',
  forest_cover_pct: 'Native Forest Cover',
  crop_land_pct: 'Agricultural Cropland',
  imperviousness_pct: 'Impervious Surface %',
  soil_erodibility_k: 'Soil Erodibility (USLE K)',
  sediment_delivery_ratio: 'Sediment Delivery Ratio',
  stream_power_index: 'Stream Power Index',
};

export const SHAPWaterfall: React.FC<SHAPWaterfallProps> = ({
  shapValues,
  title = 'TreeSHAP Feature Attribution (Urgency Drivers)',
  className = '',
}) => {
  if (!shapValues || shapValues.length === 0) {
    return (
      <div className={`p-4 rounded-xl bg-hydro-card border border-hydro-border text-center text-xs text-slate-400 ${className}`}>
        No feature attribution data available. Run AOI scan to compute exact Shapley game-theoretic contributions.
      </div>
    );
  }

  // Find max absolute value to scale bars relative to 100%
  const maxAbs = Math.max(...shapValues.map((s) => Math.abs(s.value)), 1.0);

  return (
    <div className={`p-4 rounded-xl bg-hydro-card border border-hydro-border ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-aqua-400" />
          {title}
        </h4>
        <span className="text-[10px] text-slate-400 font-mono">Additive Efficiency: ∑SHAP = ΔPVI</span>
      </div>

      <div className="space-y-2.5">
        {shapValues.map((item, idx) => {
          const absVal = Math.abs(item.value);
          const barPct = Math.min(100, Math.round((absVal / maxAbs) * 100));
          const isUp = item.direction === 'up' || item.value > 0;
          const displayName = friendlyFeatureNames[item.feature] || item.feature;

          return (
            <div key={item.feature || idx} className="text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300 font-medium truncate max-w-[200px]" title={item.description || displayName}>
                  {displayName}
                </span>
                <span className={`font-mono font-semibold ${isUp ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isUp ? `+${absVal.toFixed(1)} pts` : `-${absVal.toFixed(1)} pts`}
                </span>
              </div>

              {/* Dual Directional Bar */}
              <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden flex">
                {/* Center marker line */}
                <div className="w-1/2 flex justify-end">
                  {!isUp && (
                    <div
                      className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-l-full transition-all duration-700 ease-out"
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>
                <div className="w-[1px] bg-slate-600 h-full" />
                <div className="w-1/2 flex justify-start">
                  {isUp && (
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-r-full transition-all duration-700 ease-out"
                      style={{ width: `${barPct}%` }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-hydro-border/60 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center text-emerald-400 gap-1">
          <TrendingDown className="w-3 h-3" /> Left: Mitigating / Lowers PVI
        </span>
        <span className="flex items-center text-rose-400 gap-1">
          Right: Aggravating / Elevates PVI <TrendingUp className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};

