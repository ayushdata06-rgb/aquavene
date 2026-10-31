import React, { useEffect, useState } from 'react';
import { Activity, Database, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useResearch } from '../context/ResearchContext';
import { apiClient } from '../api/client';

export const StatusBar: React.FC = () => {
  const { user } = useAuth();
  const { jobStatus, processingJobId } = useResearch();
  const [apiOnline, setApiOnline] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>('Just now');

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await apiClient.getHealth();
        if (isMounted) {
          setApiOnline(res?.status === 'ok' || res?.status === 'healthy');
          setLastChecked(new Date().toLocaleTimeString());
        }
      } catch {
        if (isMounted) setApiOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <footer className="h-7 bg-hydro-surface border-t border-hydro-border/70 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-30">
      {/* Left: Backend & DB Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              apiOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300">
            API: {apiOnline ? 'FastAPI 0.115 (Healthy)' : 'Backend Disconnected'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 border-l border-hydro-border/70 pl-4">
          <Database className="w-3 h-3 text-aqua-400" />
          <span>PostgreSQL 15 + PostGIS (Spatial Engine)</span>
        </div>
      </div>

      {/* Center: Background Processing Job Indicator */}
      {jobStatus === 'running' && (
        <div className="flex items-center gap-2 text-aqua-400 font-semibold animate-pulse">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Processing Whitebox & ML Pipeline...</span>
        </div>
      )}

      {/* Right: Role & Sync Metadata */}
      <div className="flex items-center gap-4">
        <span className="hidden md:inline">Synced: {lastChecked}</span>
        <div className="flex items-center gap-1.5 border-l border-hydro-border/70 pl-4">
          <span>Active RBAC:</span>
          <span className="text-aqua-400 font-bold uppercase">{user?.role || 'viewer'}</span>
        </div>
      </div>
    </footer>
  );
};

