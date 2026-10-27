import React, { useState, useRef, useEffect } from 'react';
import {
  Waves,
  ShieldCheck,
  Database,
  RefreshCw,
  Compass,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh, isRefreshing }) => {
  const { user, isConfigured, signInWithGoogle, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAuthClick = async () => {
    if (!isConfigured) {
      setIsModalOpen(true);
    } else {
      const res = await signInWithGoogle();
      if (res.error) {
        setIsModalOpen(true);
      }
    }
  };

  return (
    <>
      <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-aqua-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold">
            <Waves className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                AquaVane
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-medium border border-brand-500/30">
                  Decision Support
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Micro-Watershed Restoration & Hydrological Prioritisation Platform
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Baseline Formula Info */}
          <div className="hidden xl:flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-slate-300">
            <Compass className="h-3.5 w-3.5 text-aqua-400" />
            <span className="font-mono text-slate-400">P = 0.20E + 0.25R + 0.15L + 0.20W + 0.20D</span>
          </div>

          {/* Database Status */}
          <div className="hidden sm:flex items-center space-x-2 text-xs bg-brand-950/40 border border-brand-800/50 px-2.5 py-1.5 rounded-lg text-brand-300">
            <Database className="h-3.5 w-3.5 text-brand-400" />
            <span className="hidden md:inline">PostGIS / Whitebox</span>
            <span className="h-2 w-2 rounded-full bg-brand-400 animate-pulse"></span>
          </div>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Refresh dashboard metrics"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-aqua-400' : ''}`} />
            </button>
          )}

          {/* Authentication User Widget */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <div>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1.5 rounded-xl transition text-left"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName || 'User'}
                      className="h-7 w-7 rounded-lg object-cover ring-1 ring-aqua-500/30"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-brand-600 to-aqua-400 flex items-center justify-center text-xs font-bold text-white uppercase">
                      {user.fullName ? user.fullName[0] : user.email ? user.email[0] : 'U'}
                    </div>
                  )}

                  <div className="hidden md:block">
                    <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                      {user.fullName || user.email?.split('@')[0]}
                    </div>
                    <div className="text-[10px] text-aqua-400 flex items-center gap-1 font-medium capitalize">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      {user.role}
                    </div>
                  </div>

                  <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-fade-in text-white space-y-3">
                    <div className="px-2 py-1 border-b border-slate-800/80 pb-3">
                      <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] bg-brand-950/60 text-brand-300 border border-brand-800/50 px-2 py-0.5 rounded-full w-fit">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        Google OAuth Verified
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex items-center justify-between px-2 py-1 text-[11px]">
                        <span className="text-slate-400">Authorization</span>
                        <span className="font-mono text-aqua-400 text-[10px]">JWT (HS256)</span>
                      </div>
                      <div className="flex items-center justify-between px-2 py-1 text-[11px]">
                        <span className="text-slate-400">Assigned Role</span>
                        <span className="font-medium text-slate-200 capitalize">{user.role}</span>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2">
                      <button
                        onClick={async () => {
                          setIsDropdownOpen(false);
                          await signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleAuthClick}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 shadow-md shadow-white/5 transition"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Setup / Fallback Modal */}
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
