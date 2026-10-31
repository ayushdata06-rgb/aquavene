import React from 'react';
import { LucideIcon, Lock, Loader2 } from 'lucide-react';

export interface RBACButtonProps {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  requiredRoles: string[];
  currentRole: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RBACButton: React.FC<RBACButtonProps> = ({
  label,
  icon: Icon,
  onClick,
  requiredRoles,
  currentRole,
  variant = 'primary',
  loading = false,
  disabled = false,
  title,
  className = '',
  size = 'md',
}) => {
  const isAuthorized = requiredRoles.includes((currentRole || 'viewer').toLowerCase());

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5 font-semibold',
  }[size];

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-aqua-600 to-sky-600 hover:from-aqua-500 hover:to-sky-500 text-white shadow-lg shadow-aqua-950/50 border border-aqua-400/30',
    secondary:
      'bg-hydro-panel hover:bg-slate-700/80 text-slate-200 border border-hydro-border',
    danger:
      'bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white shadow-lg shadow-rose-950/50 border border-rose-500/30',
    outline:
      'bg-transparent hover:bg-white/5 text-aqua-400 border border-aqua-500/40 hover:border-aqua-400',
  }[variant];

  const handleClick = (e: React.MouseEvent) => {
    if (!isAuthorized) {
      e.preventDefault();
      alert(`Access Restricted: This action requires one of the following roles: [${requiredRoles.join(', ')}]. Your active role is '${currentRole}'.`);
      return;
    }
    if (disabled || loading) return;
    onClick?.();
  };

  if (!isAuthorized) {
    const requiredStr = requiredRoles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(' or ');
    return (
      <button
        type="button"
        title={title || `Requires: ${requiredStr}`}
        onClick={handleClick}
        className={`inline-flex items-center justify-center rounded-lg font-medium opacity-50 bg-slate-800/80 text-slate-400 border border-slate-700/60 cursor-not-allowed ${sizeClasses} ${className}`}
      >
        <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      title={title}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-[0.98] ${variantClasses} ${sizeClasses} ${
        disabled || loading ? 'opacity-60 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-1" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      <span>{label}</span>
    </button>
  );
};
