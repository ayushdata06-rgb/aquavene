import React, { useState } from 'react';
import {
  X,
  Key,
  Shield,
  Sparkles,
  CheckCircle,
  Users,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserPersona } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'google' | 'personas' | 'roles';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'personas' }) => {
  const {
    isConfigured,
    signInWithGoogle,
    presetUsers,
    signInAsPersona,
    signInWithRole,
    user,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'personas' | 'roles' | 'google'>(defaultTab);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'planner' | 'viewer'>('planner');
  const [customName, setCustomName] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectRole = (role: 'admin' | 'planner' | 'viewer') => {
    signInWithRole(role, customName.trim() || undefined);
    onClose();
  };

  const handleSelectPersona = (persona: UserPersona) => {
    signInAsPersona(persona);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-white space-y-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-aqua-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Authentication & Role Access Control
              </h2>
              <p className="text-xs text-slate-400">
                Switch between active personas, custom RBAC tiers, or Google Sign-In
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('personas')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'personas'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Switch Persona</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'roles'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Choose Role</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 ${
              activeTab === 'google'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
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
            <span>Google OAuth</span>
          </button>
        </div>

        {/* Tab 1: Multi-User Personas */}
        {activeTab === 'personas' && (
          <div className="space-y-3.5 overflow-y-auto pr-1">
            <p className="text-xs text-slate-400">
              Select one of the government or community profiles to evaluate how AquaVane adapts permissions, reports, and controls:
            </p>

            <div className="space-y-3">
              {presetUsers.map((persona) => {
                const isCurrent = user?.email === persona.email;
                const isPlanner = persona.role === 'planner';
                const isAdmin = persona.role === 'admin';

                return (
                  <div
                    key={persona.id}
                    onClick={() => handleSelectPersona(persona)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      isCurrent
                        ? 'bg-brand-950/40 border-brand-500/60 ring-1 ring-brand-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={persona.avatarUrl}
                        alt={persona.fullName}
                        className="h-12 w-12 rounded-xl object-cover ring-2 ring-slate-700 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-white">{persona.fullName}</h3>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border capitalize ${
                              isAdmin
                                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                : isPlanner
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                            }`}
                          >
                            {persona.role}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-brand-400 font-bold bg-brand-500/10 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium mt-0.5">{persona.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-sm">
                          {persona.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shrink-0 flex items-center gap-1 border border-slate-700 transition"
                    >
                      <span>Switch</span>
                      <ChevronRight className="h-3.5 w-3.5 text-aqua-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Choose Role in Frontend */}
        {activeTab === 'roles' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <p className="text-xs text-slate-400">
              Pick the specific RBAC tier you want to assume when exploring AquaVane:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Planner Card */}
              <div
                onClick={() => setSelectedRole('planner')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  selectedRole === 'planner'
                    ? 'bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    {selectedRole === 'planner' && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white">District Planner</h4>
                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">Simulation & DPR Author</p>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Test 5 levers live, flatten hydrographs, save certified DPR proposals, and export BoQs.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-300 font-mono">
                  Full Save & Run
                </div>
              </div>

              {/* Admin Card */}
              <div
                onClick={() => setSelectedRole('admin')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  selectedRole === 'admin'
                    ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                      <Shield className="h-5 w-5" />
                    </div>
                    {selectedRole === 'admin' && (
                      <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse"></span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white">Super Admin</h4>
                  <p className="text-[10px] text-rose-400 font-semibold mt-0.5">Universal Governance</p>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Elevate roles, delete DPR proposals, access raw PostGIS layers, and manage system database.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-rose-300 font-mono">
                  Universal Override
                </div>
              </div>

              {/* Viewer Card */}
              <div
                onClick={() => setSelectedRole('viewer')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                  selectedRole === 'viewer'
                    ? 'bg-amber-950/30 border-amber-500/60 ring-1 ring-amber-500/40 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                      <Eye className="h-5 w-5" />
                    </div>
                    {selectedRole === 'viewer' && (
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white">Public Viewer</h4>
                  <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Read-Only Observer</p>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Inspect telemetry, stream slopes, and landcover. Mutation & scenario saving are locked.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-amber-300 font-mono">
                  Read-Only Mode
                </div>
              </div>
            </div>

            {/* Custom display name input */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-slate-300">
                Custom Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. S. Narayanan (Field Officer)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSelectRole(selectedRole)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-aqua-400" />
              <span>Enter AquaVane as {selectedRole.toUpperCase()}</span>
            </button>
          </div>
        )}

        {/* Tab 3: Google Cloud & Supabase OAuth */}
        {activeTab === 'google' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <Key className="h-4 w-4 text-aqua-400" />
                  Supabase Client Status
                </span>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium border ${
                    isConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {isConfigured ? 'Connected to Supabase' : 'Keys Needed in .env'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                AquaVane authenticates with Google via your Supabase project. Supabase acts as the OAuth broker and signs an HS256 JWT bearer token validated by the FastAPI backend.
              </p>
            </div>

            {/* Google OAuth Login Button */}
            <button
              type="button"
              onClick={async () => {
                const res = await signInWithGoogle();
                if (!res.error) onClose();
              }}
              disabled={!isConfigured}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs font-bold transition shadow-lg ${
                isConfigured
                  ? 'bg-white hover:bg-slate-100 text-slate-900 shadow-white/10 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Authenticate with Google Cloud OAuth</span>
            </button>

            {/* Step-by-step summary alert */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-aqua-400" />
                Quick Setup Checklist:
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-400">
                <li>Create OAuth 2.0 Web Client in Google Cloud Console</li>
                <li>Add Supabase Callback URL in Authorized redirect URIs</li>
                <li>Paste Client ID & Secret in Supabase &gt; Auth &gt; Providers &gt; Google</li>
                <li>Click the button above to login directly with your Google account</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
