import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  UserCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  KeyRound,
  LogIn,
  LogOut,
  Info,
  Sliders,
  FileText,
  Activity,
  Database,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role, UserPersona } from '../types';

export const AuthTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    authStatus,
    presetUsers,
    signInAsPersona,
    signInWithRole,
    signOut,
    signInWithGoogle,
    isLoading,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'personas' | 'credentials' | 'matrix'>('personas');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginMessage, setLoginMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setLoginMessage({ type: 'error', text: 'Please enter a valid official email address.' });
      return;
    }

    // Role inference from email domain/pattern for administrative testing
    let assignedRole: Role = 'viewer';
    if (emailInput.includes('admin') || emailInput.includes('collector')) assignedRole = 'admin';
    else if (emailInput.includes('planner') || emailInput.includes('hydro')) assignedRole = 'planner';
    else if (emailInput.includes('officer') || emailInput.includes('field')) assignedRole = 'officer';

    signInWithRole(assignedRole as any, emailInput.split('@')[0]);
    setLoginMessage({
      type: 'success',
      text: `Successfully authenticated as ${emailInput} with role "${assignedRole.toUpperCase()}".`,
    });
    setTimeout(() => setLoginMessage(null), 4000);
  };

  const currentRole = user?.role || 'viewer';

  const roleDescriptions: Record<string, { title: string; color: string; border: string; bg: string }> = {
    admin: {
      title: 'Universal Administrator',
      color: 'text-purple-400',
      border: 'border-purple-500/50',
      bg: 'bg-purple-500/10',
    },
    planner: {
      title: 'State Hydrologist & Planner',
      color: 'text-cyan-400',
      border: 'border-cyan-500/50',
      bg: 'bg-cyan-500/10',
    },
    officer: {
      title: 'District Watershed Officer',
      color: 'text-teal-400',
      border: 'border-teal-500/50',
      bg: 'bg-teal-500/10',
    },
    viewer: {
      title: 'Public Researcher & Citizen',
      color: 'text-slate-300',
      border: 'border-slate-600/50',
      bg: 'bg-slate-700/20',
    },
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans select-none">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Shield className="h-3.5 w-3.5" />
              Role-Based Access Control (RBAC) & Onboarding Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              User Identity & Security Onboarding
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select your administrative persona or sign in to configure simulation permissions and DPR certification
            </p>
          </div>

          {/* Active Session Status Pill */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
                {(user?.display_name || user?.role || 'U')[0].toUpperCase()}
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Session</span>
                <strong className="text-white font-medium block truncate max-w-[140px]">
                  {user?.display_name || user?.fullName || 'Guest Observer'}
                </strong>
                <span
                  className={`inline-block font-mono text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                    roleDescriptions[currentRole]?.color || 'text-slate-300'
                  }`}
                >
                  Role: {currentRole}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/map')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <span>Go to Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {loginMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 ${
            loginMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {loginMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{loginMessage.text}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('personas')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'personas'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>1. Quick Persona Selection (Recommended)</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'matrix'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>2. RBAC Permissions Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'credentials'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>3. Enterprise / Google OAuth</span>
        </button>
      </div>

      {/* TAB 1: Persona Decision & Onboarding */}
      {activeTab === 'personas' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <h3 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Choose Your Onboarding Persona</span>
            </h3>
            <p className="text-slate-400">
              Select an official government role below to experience AquaVane from that perspective. Switching personas immediately modifies your active JWT signature and unlocks corresponding modeling capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presetUsers.map((persona) => {
              const isSelected = user?.role === persona.role;
              const roleMeta = roleDescriptions[persona.role] || roleDescriptions.viewer;

              return (
                <div
                  key={persona.id}
                  onClick={() => signInAsPersona(persona)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-cyan-500 shadow-xl shadow-cyan-500/10 ring-2 ring-cyan-500'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.border}`}
                      >
                        {persona.role}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 pt-1">
                      <img
                        src={persona.avatarUrl}
                        alt={persona.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate">{persona.fullName}</h4>
                        <p className="text-[11px] text-cyan-400 font-medium truncate">{persona.title}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{persona.email}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-slate-800/80">
                      {persona.description}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      signInAsPersona(persona);
                    }}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ Currently Signed In' : 'Adopt This Persona'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RBAC Matrix */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Role-Based Access Control (RBAC) Hierarchy</h3>
              <p className="text-xs text-slate-400">Enforced strictly across backend API routes via HTTPBearer JWT inspection</p>
            </div>
            <span className="font-mono text-[10px] text-slate-400 uppercase">FastAPI 0.115 Security Deps</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Capability & Operation</th>
                  <th className="py-3 px-4 text-center">Viewer (Public)</th>
                  <th className="py-3 px-4 text-center">Officer (Field)</th>
                  <th className="py-3 px-4 text-center">Planner (State)</th>
                  <th className="py-3 px-4 text-center">Admin (Super)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Inspect Interactive Maps & D8 Hydrology Flow</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Read</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Read</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Read</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Full</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Draw 4-Corner Arbitrary Boundary & Ingest Live APIs</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Allowed</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Full</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Simulate Counterfactual Hydrographs & 5 Levers</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Live Preview</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Own Catchment</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ State-wide</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Full</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Persist & Certify Detailed Project Reports (DPR)</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-bold">✕ Locked</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Save (Draft)</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Certify & Save</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Full</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Delete / Archive Saved DPR Restoration Plans</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-bold">✕ Locked</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-bold">✕ Locked</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-bold">✕ Locked</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Authorize Delete</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-medium text-white">Elevate Roles & Manage PostgreSQL DB Migrations</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-bold">✕ Locked</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-bold">✕ Locked</td>
                  <td className="py-3 px-4 text-center text-rose-400 font-bold">✕ Locked</td>
                  <td className="py-3 px-4 text-center text-emerald-400 font-bold">✓ Super Admin</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Enterprise Supabase & Google OAuth */}
      {activeTab === 'credentials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Custom Credentials Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>Official Departmental Sign-In</span>
            </h3>
            <p className="text-xs text-slate-400">
              Sign in with your ministry or district credentials to adopt verified permissions.
            </p>

            <form onSubmit={handleCustomLogin} className="space-y-3 pt-2 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Official Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. yourname@jalshakti.gov.in"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium block">Department Access Key / Password</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to AquaVane</span>
              </button>
            </form>
          </div>

          {/* Supabase & OAuth Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between text-xs">
            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Supabase GoTrue & OAuth Gateway</span>
              </h3>
              <p className="text-slate-400 leading-relaxed">
                AquaVane utilizes Supabase PostgreSQL authentication with HS256 JWT tokens. You can authenticate directly with Google SSO or your hosted Supabase account.
              </p>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Auth Status:</span>
                  <span className="text-emerald-400 font-bold">
                    {authStatus?.auth_enabled ? 'Enforced' : 'Public Telemetry Enabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">JWT Algorithm:</span>
                  <span className="text-white">{authStatus?.jwt_algorithm || 'HS256'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Identity Provider:</span>
                  <span className="text-cyan-400">{authStatus?.provider || 'Supabase GoTrue'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <button
                onClick={() => signInWithGoogle()}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                <span>Sign In With Google OAuth</span>
              </button>

              <button
                onClick={() => signOut()}
                className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-850 text-rose-400 hover:text-rose-300 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Reset Active Session (Log Out)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
