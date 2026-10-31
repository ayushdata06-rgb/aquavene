import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

export interface HydroPoint {
  hour: number;
  discharge: number;
}

export interface HydrographChartProps {
  baseline: HydroPoint[] | { hour: number; baseline_discharge?: number; discharge?: number }[];
  restored: HydroPoint[] | { hour: number; simulated_discharge?: number; discharge?: number }[];
  threshold?: number;
  timeOfPeak?: number;
  height?: number;
  className?: string;
}

export const HydrographChart: React.FC<HydrographChartProps> = ({
  baseline = [],
  restored = [],
  threshold = 48,
  height = 280,
  className = '',
}) => {
  // Merge baseline and restored data series by hour
  const chartData = React.useMemo(() => {
    const hours = Math.max(baseline.length, restored.length, 36);
    const data: any[] = [];

    for (let h = 0; h < hours; h++) {
      const bObj: any = baseline[h] || {};
      const rObj: any = restored[h] || {};

      const baseVal =
        typeof bObj.baseline_discharge === 'number'
          ? bObj.baseline_discharge
          : typeof bObj.discharge === 'number'
          ? bObj.discharge
          : 0;

      const restVal =
        typeof rObj.simulated_discharge === 'number'
          ? rObj.simulated_discharge
          : typeof rObj.discharge === 'number'
          ? rObj.discharge
          : typeof bObj.simulated_discharge === 'number'
          ? bObj.simulated_discharge
          : baseVal * 0.65;

      data.push({
        hour: `H${h}`,
        hourNum: h,
        baseline: Number(baseVal.toFixed(1)),
        restored: Number(restVal.toFixed(1)),
        reductionPct:
          baseVal > 0 ? Math.round(((baseVal - restVal) / baseVal) * 100) : 0,
      });
    }
    return data;
  }, [baseline, restored]);

  // Find peak values
  const peakBaseline = Math.max(...chartData.map((d) => d.baseline), 1);
  const peakRestored = Math.max(...chartData.map((d) => d.restored), 1);

  return (
    <div className={`p-4 rounded-xl bg-hydro-card border border-hydro-border ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Hydrological Storm Runoff Hydrograph
          </h4>
          <p className="text-[11px] text-slate-400">
            Copernicus ERA5 72-Hour Monsoon Cloudburst Event Simulation (m³/s)
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500/80 border border-rose-400" />
            <span className="text-slate-300">Baseline ({peakBaseline} m³/s)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-aqua-500/80 border border-aqua-400" />
            <span className="text-slate-300">Restored ({peakRestored} m³/s)</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="baselineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="restoredGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5a" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval={4}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              unit=" m³"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const bVal = payload[0]?.value;
                  const rVal = payload[1]?.value;
                  const diff = typeof bVal === 'number' && typeof rVal === 'number' ? bVal - rVal : 0;
                  const pct = bVal ? Math.round((diff / (bVal as number)) * 100) : 0;

                  return (
                    <div className="bg-hydro-panel border border-hydro-border p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
                      <p className="font-sans font-semibold text-slate-200 border-b border-hydro-border pb-1">
                        Timeline: {label}
                      </p>
                      <p className="text-rose-400 flex justify-between gap-4">
                        <span>Baseline Discharge:</span>
                        <span className="font-bold">{bVal} m³/s</span>
                      </p>
                      <p className="text-aqua-400 flex justify-between gap-4">
                        <span>Post-Intervention:</span>
                        <span className="font-bold">{rVal} m³/s</span>
                      </p>
                      {pct > 0 && (
                        <p className="text-emerald-400 pt-1 border-t border-hydro-border flex justify-between gap-4 font-semibold">
                          <span>Peak Attenuation:</span>
                          <span>↓ {pct}% (-{diff.toFixed(1)} m³/s)</span>
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            {threshold && (
              <ReferenceLine
                y={threshold}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: `Bankfull: ${threshold} m³/s`,
                  fill: '#f59e0b',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="baseline"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#baselineGradient)"
              name="Baseline Runoff"
            />
            <Area
              type="monotone"
              dataKey="restored"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#restoredGradient)"
              name="Restored Runoff"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

