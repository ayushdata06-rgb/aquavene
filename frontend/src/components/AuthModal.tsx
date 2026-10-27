import React from 'react';
import { X, Key, Shield, Sparkles, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { isConfigured, signInWithGoogle, signInDemo } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-white space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-aqua-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Google OAuth & JWT Authorization
              </h2>
              <p className="text-xs text-slate-400">
                Supabase Identity Provider & Bearer Token Authentication
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

        {/* Status card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
              <Key className="h-4 w-4 text-aqua-400" />
              Supabase Configuration Status
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                isConfigured
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {isConfigured ? 'Ready for Google OAuth' : 'Setup Required in .env'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            AquaVane validates JWT tokens issued by Supabase when users authenticate via Google.
            To connect to your live Supabase project, specify your project credentials in the frontend and backend environment files.
          </p>

          {!isConfigured && (
            <div className="space-y-2 bg-slate-900 border border-slate-800/80 rounded-lg p-3 text-xs font-mono text-slate-300">
              <div className="text-[11px] text-slate-400 font-sans mb-1 font-semibold">
                Required in <code className="text-aqua-400 font-mono">frontend/.env</code>:
              </div>
              <div className="text-slate-400 select-all">
                VITE_SUPABASE_URL=https://your-project.supabase.co
              </div>
              <div className="text-slate-400 select-all">
                VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Real Google OAuth */}
          <button
            onClick={async () => {
              const res = await signInWithGoogle();
              if (res.error) {
                // If not configured, modal already shows info
              } else {
                onClose();
              }
            }}
            disabled={!isConfigured}
            className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold transition shadow-lg ${
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
            Sign in with Google OAuth
          </button>

          {/* Instant Demo Login */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-slate-500 uppercase tracking-widest">
              or instant evaluation
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          <button
            onClick={() => {
              signInDemo('Lead Hydrologist / Planner');
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-brand-600/30 hover:bg-brand-600/40 text-brand-300 border border-brand-500/40 transition"
          >
            <Sparkles className="h-4 w-4 text-aqua-400" />
            Continue with Demo Planner Account
          </button>
        </div>
      </div>
    </div>
  );
};
