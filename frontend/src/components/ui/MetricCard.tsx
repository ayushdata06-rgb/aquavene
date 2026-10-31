import React, { useEffect, useState } from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string | number;
  deltaDirection?: 'up' | 'down' | 'neutral';
  icon?: LucideIcon;
  color?: 'aqua' | 'green' | 'amber' | 'red';
  loading?: boolean;
  tooltip?: string;
  className?: string;
}

const colorStyles = {
  aqua: {
    border: 'border-l-aqua-500',
    iconBg: 'bg-aqua-950/60 text-aqua-400',
    glow: 'hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]',
  },
  green: {
    border: 'border-l-emerald-500',
    iconBg: 'bg-emerald-950/60 text-emerald-400',
    glow: 'hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]',
  },
  amber: {
    border: 'border-l-amber-500',
    iconBg: 'bg-amber-950/60 text-amber-400',
    glow: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  },
  red: {
    border: 'border-l-rose-500',
    iconBg: 'bg-rose-950/60 text-rose-400',
    glow: 'hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  delta,
  deltaDirection,
  icon: Icon,
  color = 'aqua',
  loading = false,
  tooltip,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<string | number>(value);
  const styles = colorStyles[color] || colorStyles.aqua;

  // Simple number count-up animation if value is numeric
  useEffect(() => {
    if (typeof value === 'number') {
      const start = 0;
      const end = value;
      const duration = 800;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOut;

        setDisplayValue(Number.isInteger(end) ? Math.round(current) : Number(current.toFixed(1)));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(value);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  if (loading) {
    return (
      <div className={`bg-hydro-card border border-hydro-border rounded-xl p-4 shimmer animate-pulse ${className}`}>
        <div className="h-4 bg-slate-700/50 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-slate-700/50 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-700/30 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div
      title={tooltip}
      className={`relative bg-hydro-card/90 backdrop-blur border border-hydro-border/70 border-l-4 ${styles.border} rounded-xl p-4 transition-all duration-300 ${styles.glow} ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${styles.iconBg} border border-white/5`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">{displayValue}</span>
        {unit && <span className="text-xs text-slate-400 font-medium">{unit}</span>}
      </div>

      {delta !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {deltaDirection === 'up' && (
            <span className="flex items-center text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {delta}
            </span>
          )}
          {deltaDirection === 'down' && (
            <span className="flex items-center text-rose-400 font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              {delta}
            </span>
          )}
          {deltaDirection === 'neutral' && (
            <span className="flex items-center text-slate-400 font-medium">
              <Minus className="w-3.5 h-3.5 mr-0.5" />
              {delta}
            </span>
          )}
          <span className="text-slate-500 ml-1">vs baseline</span>
        </div>
      )}
    </div>
  );
};

