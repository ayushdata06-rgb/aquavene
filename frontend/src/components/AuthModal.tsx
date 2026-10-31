import React, { useState } from 'react';
import {
  X,
  Shield,
  UserCheck,
  Globe,
  Sliders,
  Check,
  Lock,
  Sparkles,
  LogOut,
  Info,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserPersona } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'quick' | 'custom' | 'google' | 'matrix';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'quick',
}) => {
  const {
    user,
    presetUsers,
    signInAsPersona,
    signInWithRole,
    signInWithGoogle,
    signOut,
    isConfigured,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'quick' | 'custom' | 'google' | 'matrix'>(defaultTab);
  const [customName, setCustomName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'planner' | 'officer' | 'viewer'>('planner');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPersona = (p: UserPersona) => {
    signInAsPersona(p);
    onClose();
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signInWithRole(selectedRole as any, customName.trim() || undefined);
    onClose();
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const res = await signInWithGoogle();
      if (res?.error) {
        setGoogleError(res.error);
      }
    } catch (err: any) {
      setGoogleError(err.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-hydro-card border border-hydro-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hydro-border/70 bg-hydro-panel/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-aqua-600 to-sky-500 text-white shadow-md shadow-aqua-950/40">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AquaVane Identity & Role-Based Access Control
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-aqua-950 text-aqua-400 border border-aqua-600/40 font-mono font-medium">
                  RBAC 2.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Switch personas, test government officer privileges, or connect via Google OAuth.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Tabs Navigation Bar */}
        <div className="flex items-center px-6 border-b border-hydro-border/60 bg-hydro-surface/60 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('quick')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'quick'
                ? 'border-aqua-500 text-aqua-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Quick Login (Personas)
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'custom'
                ? 'border-aqua-500 text-aqua-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Custom Login
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'google'
                ? 'border-aqua-500 text-aqua-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Google OAuth
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'matrix'
                ? 'border-aqua-500 text-aqua-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            RBAC Permissions Matrix
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: QUICK LOGIN (PERSONAS) */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                Select a certified governmental persona to instantly explore AquaVane with pre-configured access rights:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {presetUsers.map((p) => {
                  const isActive = user?.email === p.email || user?.role === p.role;
                  const roleBadgeColor =
                    p.role === 'admin'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                      : p.role === 'planner'
                      ? 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                      : 'bg-slate-800/80 text-slate-300 border-slate-600/50';

                  return (
                    <div
                      key={p.id}
                      className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 ${
                        isActive
                          ? 'bg-hydro-panel border-aqua-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                          : 'bg-hydro-panel/60 border-hydro-border hover:border-slate-500 hover:bg-hydro-panel'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full bg-aqua-500 text-slate-950 font-bold uppercase tracking-wider">
                          ACTIVE
                        </span>
                      )}

                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={p.avatarUrl}
                            alt={p.fullName}
                            className="w-11 h-11 rounded-full object-cover border border-white/20"
                          />
                          <div>
                            <h3 className="text-sm font-bold text-white leading-snug">{p.fullName}</h3>
                            <p className="text-[11px] text-slate-400">{p.title}</p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <span
                            className={`inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded-md border ${roleBadgeColor}`}
                          >
                            Role: {p.role}
                          </span>
                        </div>

                        {/* Access Checklist */}
                        <div className="space-y-1.5 text-xs text-slate-300 mb-4 pt-2 border-t border-hydro-border/60">
                          <div className="flex items-center justify-between text-[11px]">
                            <span>Full Simulation</span>
                            <span className={p.role !== 'viewer' ? 'text-emerald-400' : 'text-slate-500'}>
                              {p.role !== 'viewer' ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>DPR Creation & BoQ</span>
                            <span className={p.role !== 'viewer' ? 'text-emerald-400' : 'text-slate-500'}>
                              {p.role !== 'viewer' ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>Role Management</span>
                            <span className={p.role === 'admin' ? 'text-emerald-400' : 'text-slate-500'}>
                              {p.role === 'admin' ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span>Delete DPR Plans</span>
                            <span className={p.role === 'admin' ? 'text-emerald-400' : 'text-slate-500'}>
                              {p.role === 'admin' ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectPersona(p)}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-aqua-600 hover:bg-aqua-500 text-white'
                            : 'bg-hydro-surface hover:bg-slate-700 text-slate-200 border border-hydro-border'
                        }`}
                      >
                        {isActive ? 'Continue Session' : `Login as ${p.fullName.split(' ')[0]}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM LOGIN */}
          {activeTab === 'custom' && (
            <form onSubmit={handleCustomLogin} className="space-y-5 max-w-xl mx-auto py-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Display / Officer Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anand Deshmukh, Assistant Hydrologist"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-hydro-surface border border-hydro-border text-white text-sm focus:outline-none focus:border-aqua-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Select Assigned Role
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'admin',
                      label: 'Administrator',
                      color: 'text-purple-400',
                      desc: 'Full system access. User management, plan approval, and deletion.',
                    },
                    {
                      id: 'planner',
                      label: 'Hydrology Planner',
                      color: 'text-blue-400',
                      desc: 'Create simulations, save certified DPRs, submit for approval.',
                    },
                    {
                      id: 'officer',
                      label: 'Watershed Officer',
                      color: 'text-teal-400',
                      desc: 'View data and submit restoration proposals for assigned catchments.',
                    },
                    {
                      id: 'viewer',
                      label: 'Public Viewer',
                      color: 'text-slate-400',
                      desc: 'Read-only access to public plans, rankings, and scientific indicators.',
                    },
                  ].map((r) => (
                    <label
                      key={r.id}
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedRole === r.id
                          ? 'bg-hydro-panel border-aqua-500 shadow-sm shadow-aqua-500/20'
                          : 'bg-hydro-surface/60 border-hydro-border hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${r.color}`}>{r.label}</span>
                        <input
                          type="radio"
                          name="role"
                          checked={selectedRole === r.id}
                          onChange={() => setSelectedRole(r.id as any)}
                          className="accent-aqua-500"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{r.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-aqua-600 to-sky-600 hover:from-aqua-500 hover:to-sky-500 shadow-lg shadow-aqua-950/60 border border-aqua-400/30 transition-all"
              >
                Enter Platform as {selectedRole.toUpperCase()}
              </button>
            </form>
          )}

          {/* TAB 3: GOOGLE OAUTH */}
          {activeTab === 'google' && (
            <div className="space-y-6 max-w-lg mx-auto py-4 text-center">
              <div className="p-4 rounded-2xl bg-hydro-panel border border-hydro-border">
                <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Globe className="w-6 h-6 text-aqua-400" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Official Supabase Google OAuth</h3>
                <p className="text-xs text-slate-400 mb-5">
                  Sign in securely with your verified Google account. Upon first authentication, your profile is synced to PostgreSQL with role-based access.
                </p>

                {user && user.provider === 'google' ? (
                  <div className="p-3 bg-hydro-surface rounded-xl border border-hydro-border mb-4 text-left">
                    <p className="text-xs font-semibold text-white">Active Google Session:</p>
                    <p className="text-xs text-slate-300 font-mono">{user.email}</p>
                    <p className="text-[11px] text-slate-400">Role: <span className="text-aqua-400 font-bold uppercase">{user.role}</span></p>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950 text-rose-300 border border-rose-800 text-xs font-medium hover:bg-rose-900 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={googleLoading}
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-slate-900 font-semibold text-xs hover:bg-slate-100 shadow-lg transition-all"
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
                    {googleLoading ? 'Connecting to Google...' : 'Sign In with Google'}
                  </button>
                )}

                {googleError && (
                  <p className="mt-3 text-xs text-rose-400 bg-rose-950/60 p-2 rounded-lg border border-rose-800">
                    {googleError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: RBAC GUIDE & MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-300">
                  Comprehensive authority matrix enforced strictly across backend REST API endpoints and UI widgets:
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-hydro-border">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-hydro-panel border-b border-hydro-border text-slate-300 font-semibold">
                      <th className="py-2.5 px-4">Feature / Operation</th>
                      <th className="py-2.5 px-3 text-center text-purple-400">Admin</th>
                      <th className="py-2.5 px-3 text-center text-blue-400">Planner</th>
                      <th className="py-2.5 px-3 text-center text-teal-400">Officer</th>
                      <th className="py-2.5 px-3 text-center text-slate-400">Viewer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hydro-border/60 font-mono text-[11px]">
                    {[
                      { op: 'View public watershed data', a: true, p: true, o: true, v: true },
                      { op: 'Define custom AOI', a: true, p: true, o: true, v: false },
                      { op: 'Run AI vulnerability scan', a: true, p: true, o: false, v: false },
                      { op: 'Run hydrograph simulator', a: true, p: true, o: false, v: false },
                      { op: 'Save scenarios', a: true, p: true, o: false, v: false },
                      { op: 'Create / Submit DPR Plan', a: true, p: true, o: true, v: false },
                      { op: 'Approve DPR Plan', a: true, p: false, o: false, v: false },
                      { op: 'Manage User Roles', a: true, p: false, o: false, v: false },
                      { op: 'Delete Plans', a: true, p: false, o: false, v: false },
                      { op: 'Export CSV / DPR JSON', a: true, p: true, o: true, v: true },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-hydro-panel/40 transition-colors">
                        <td className="py-2 px-4 font-sans text-slate-200">{row.op}</td>
                        <td className="py-2 px-3 text-center">
                          {row.a ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">✗</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.p ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">✗</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.o ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">✗</span>}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {row.v ? <span className="text-emerald-400 font-bold">✓</span> : <span className="text-slate-600">✗</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
