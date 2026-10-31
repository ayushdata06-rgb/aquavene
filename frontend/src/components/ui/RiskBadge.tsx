import React from 'react';

export interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical' | string;
  animated?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const levelConfig: Record<string, { label: string; badgeClass: string; dotClass: string }> = {
  low: {
    label: 'Low Vulnerability',
    badgeClass: 'bg-emerald-950/70 border-emerald-800/60 text-emerald-300',
    dotClass: 'bg-emerald-400',
  },
  medium: {
    label: 'Medium Risk',
    badgeClass: 'bg-amber-950/70 border-amber-800/60 text-amber-300',
    dotClass: 'bg-amber-400',
  },
  moderate: {
    label: 'Moderate Risk',
    badgeClass: 'bg-amber-950/70 border-amber-800/60 text-amber-300',
    dotClass: 'bg-amber-400',
  },
  high: {
    label: 'High Urgency',
    badgeClass: 'bg-orange-950/70 border-orange-800/60 text-orange-300',
    dotClass: 'bg-orange-400',
  },
  critical: {
    label: 'Critical Restoration Priority',
    badgeClass: 'bg-rose-950/80 border-rose-600/70 text-rose-200 shadow-[0_0_12px_rgba(239,68,68,0.3)]',
    dotClass: 'bg-rose-500 animate-ping',
  },
};

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  animated = true,
  className = '',
  size = 'md',
}) => {
  const normLevel = (level || 'medium').toLowerCase();
  const config = levelConfig[normLevel] || levelConfig.medium;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  const isCritical = normLevel === 'critical';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.badgeClass} ${sizeClasses} ${
        isCritical && animated ? 'animate-risk-pulse' : ''
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {isCritical && animated && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotClass}`}></span>
      </span>
      <span>{config.label}</span>
    </span>
  );
};

