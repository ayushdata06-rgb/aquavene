import React from 'react';

export interface WatershedBadgeProps {
  code: string;
  name: string;
  district?: string;
  state?: string;
  riskLevel?: string;
  className?: string;
}

const dotColors: Record<string, string> = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  moderate: 'bg-amber-400',
  high: 'bg-orange-400',
  critical: 'bg-rose-500',
};

export const WatershedBadge: React.FC<WatershedBadgeProps> = ({
  code,
  name,
  district,
  state,
  riskLevel = 'medium',
  className = '',
}) => {
  const normRisk = (riskLevel || 'medium').toLowerCase();
  const dotColor = dotColors[normRisk] || dotColors.medium;

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-hydro-panel/90 border border-hydro-border text-xs ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotColor} flex-shrink-0`} />
      <span className="font-mono font-semibold text-aqua-400">{code}</span>
      <span className="text-slate-300 font-medium truncate max-w-[140px]">{name}</span>
      {(district || state) && (
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          ({[district, state].filter(Boolean).join(', ')})
        </span>
      )}
    </div>
  );
};

