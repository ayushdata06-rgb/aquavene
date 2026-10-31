import React, { useState, useRef, useEffect } from 'react';
import {
  Waves,
  ChevronDown,
  Shield,
  Bell,
  LogOut,
  Sparkles,
  MapPin,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useResearch } from '../context/ResearchContext';
import { AuthModal } from './AuthModal';
import { apiClient } from '../api/client';
import { DataResolutionModal } from './DataResolutionModal';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { activeArea } = useResearch();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'quick' | 'custom' | 'google' | 'matrix'>('quick');
  const [syncStatus, setSyncStatus] = useState<'live' | 'degraded' | 'offline'>('live');
  const [isResolutionModalOpen, setIsResolutionModalOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Periodic health check for sync indicator
  useEffect(() => {
    const checkSync = async () => {
      try {
        const h = await apiClient.getHealth();
        if (h?.status === 'ok' || h?.status === 'healthy') {
          setSyncStatus('live');
        } else {
          setSyncStatus('degraded');
        }
      } catch {
        setSyncStatus('offline');
      }
    };
    checkSync();
    const interval = setInterval(checkSync, 20000);
    return () => clearInterval(interval);
  }, []);

  const roleStyles = {
    admin: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
    planner: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
    officer: 'bg-teal-950/80 text-teal-300 border-teal-500/50',
    viewer: 'bg-slate-800/80 text-slate-300 border-slate-600/50',
  }[user?.role || 'viewer'];

  return (
    <>
      <header className="h-14 bg-hydro-surface/95 backdrop-blur border-b border-hydro-border/80 px-4 flex items-center justify-between z-40 select-none">
        {/* Left: Brand & Version */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-aqua-600 to-sky-500 text-white shadow-md shadow-aqua-950/50">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white font-display">
                Aqua<span className="text-aqua-400">Vane</span>
              </span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-hydro-panel border border-hydro-border text-slate-400 font-mono">
                v2.0
              </span>
            </div>
          </div>
        </div>

        {/* Center: AOI Status Pill */}
        <div className="hidden sm:flex items-center">
          {activeArea ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-hydro-card border border-aqua-500/50 shadow-[0_0_12px_rgba(6,182,212,0.2)] animate-pulse text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white font-semibold truncate max-w-[180px]">
                {activeArea.name}
              </span>
              <span className="text-slate-400 font-mono">
                ({activeArea.areaKm2} km² • {activeArea.district || 'Study AOI'})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-hydro-card border border-amber-500/40 text-xs font-medium text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>No AOI Defined — Define 4-point polygon or pick catchment</span>
            </div>
          )}
        </div>

        {/* Right: Sync indicator, Role Pill, User Profile */}
        <div className="flex items-center gap-3">
          {/* Data Provenance & Uncertainty Pill */}
          <button
            onClick={() => setIsResolutionModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-hydro-panel hover:bg-hydro-card border border-hydro-border hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-cyan-300 transition-all shadow-sm"
            title="Inspect DEM grid resolution, sensor accuracy, and confidence intervals"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Data Provenance</span>
          </button>

          {/* Backend Sync Indicator */}
          <div
            title={`Backend sync: ${syncStatus.toUpperCase()}`}
            className="flex items-center gap-1.5 text-xs text-slate-400 cursor-help"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'live'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : syncStatus === 'degraded'
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-[11px] font-mono hidden md:inline capitalize">{syncStatus}</span>
          </div>

          {/* Role Badge */}
          <span
            className={`text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${roleStyles}`}
          >
            {user?.role || 'viewer'}
          </span>

          {/* User Avatar & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-hydro-panel border border-transparent hover:border-hydro-border transition-all"
            >
              <img
                src={
                  user?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
                }
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover border border-white/20"
              />
              <span className="text-xs font-medium text-slate-200 hidden lg:inline truncate max-w-[120px]">
                {user?.display_name || user?.full_name || 'Dr. Aarav Sharma'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-hydro-card border border-hydro-border shadow-2xl py-2 z-50 text-xs text-slate-200 animate-fade-up">
                <div className="px-3 py-2 border-b border-hydro-border/60">
                  <p className="font-semibold text-white truncate">
                    {user?.display_name || user?.full_name || 'AquaVane User'}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{user?.email || 'viewer@aquavane.gov'}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setModalTab('quick');
                      setIsModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-hydro-panel flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <Shield className="w-4 h-4 text-aqua-400" /> Switch Role / Persona
                  </button>
                  <button
                    onClick={() => {
                      setModalTab('matrix');
                      setIsModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-hydro-panel flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" /> RBAC Permissions Matrix
                  </button>
                </div>

                <div className="pt-1 border-t border-hydro-border/60">
                  <button
                    onClick={() => {
                      signOut();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-rose-950/60 text-rose-300 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Reset Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultTab={modalTab}
      />

      <DataResolutionModal
        isOpen={isResolutionModalOpen}
        onClose={() => setIsResolutionModalOpen(false)}
      />
    </>
  );
};
