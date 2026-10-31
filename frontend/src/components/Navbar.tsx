import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useResearch } from '../context/ResearchContext';
import { AuthModal } from './AuthModal';
import { ProfileModal } from './ProfileModal';
import { apiClient } from '../api/client';
import { DataResolutionModal } from './DataResolutionModal';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeArea } = useResearch();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'role' | 'team' | 'tasks' | 'submit_report'>('role');
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

        {/* Right: Profile Icon Only */}
        <div className="flex items-center">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1 rounded-full hover:bg-hydro-panel border border-transparent hover:border-hydro-border transition-all focus:outline-none flex items-center group"
              title={`${user?.display_name || user?.full_name || 'User Profile'} (${(user?.role || 'viewer').toUpperCase()})`}
            >
              <img
                src={
                  user?.avatar_url ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'
                }
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border-2 border-slate-700 group-hover:border-aqua-400 transition-colors shadow-sm"
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-hydro-card border border-hydro-border shadow-2xl py-2.5 z-50 text-xs text-slate-200 animate-fade-up">
                <div className="px-4 py-2 border-b border-hydro-border/60">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white truncate text-sm">
                      {user?.display_name || user?.full_name || 'Dr. Aarav Sharma'}
                    </p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-hydro-panel border border-hydro-border text-aqua-400 font-semibold uppercase">
                      {user?.role || 'viewer'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                    {user?.email || 'viewer@aquavane.gov'}
                  </p>
                </div>

                <div className="py-1 px-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setProfileModalTab('role');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-hydro-panel flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Profile, Roles & Access Control</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setProfileModalTab(user?.role === 'admin' ? 'team' : 'tasks');
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-hydro-panel flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
                  >
                    <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>{user?.role === 'admin' ? 'Team & Region Assignments' : 'My Assigned Research Tasks'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsResolutionModalOpen(true);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-hydro-panel flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Data Provenance & Uncertainty</span>
                  </button>
                </div>

                <div className="pt-1.5 px-2 border-t border-hydro-border/60">
                  <button
                    onClick={() => {
                      signOut();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-950/60 text-rose-300 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Reset Session / Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        defaultTab={profileModalTab}
      />

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
