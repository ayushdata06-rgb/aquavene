import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 mb-6 border-b border-hydro-border/70 ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-aqua-950 to-hydro-panel border border-aqua-500/30 text-aqua-400 shadow-md shadow-aqua-950/40">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-white font-display">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
};

