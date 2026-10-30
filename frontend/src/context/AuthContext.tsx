import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { apiClient, setAuthToken } from '../api/client';
import { AuthStatus, AuthUser, UserPersona } from '../types';

export const PRESET_USERS: UserPersona[] = [
  {
    id: 'persona-planner',
    fullName: 'Dr. Aarav Sharma',
    email: 'aarav.sharma@aquavane.gov.in',
    role: 'planner',
    title: 'District Watershed & Hydrology Planner',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
    description: 'Can simulate counterfactual hydrographs, test 5 restoration levers, save certified DPR proposals, and export BoQs.',
  },
  {
    id: 'persona-admin',
    fullName: 'Priya Patel, IAS',
    email: 'priya.patel@collectorate.gov.in',
    role: 'admin',
    title: 'District Collector & Super Administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
    description: 'Universal authority: save, modify, delete DPRs, elevate user RBAC roles, and manage system database.',
  },
  {
    id: 'persona-viewer',
    fullName: 'Ramesh Kumar',
    email: 'ramesh.farmer@grampanchayat.local',
    role: 'viewer',
    title: 'Gram Panchayat Citizen & Field Observer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
    description: 'Read-only transparency access: can inspect live hydrology maps and erosion indices, but cannot mutate or persist plans.',
  },
];

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  token: string | null;
  isLoading: boolean;
  isConfigured: boolean;
  authStatus: AuthStatus | null;
  presetUsers: UserPersona[];
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  signInDemo: (role?: string) => void;
  signInAsPersona: (persona: UserPersona) => void;
  signInWithRole: (role: 'admin' | 'planner' | 'viewer', customName?: string) => void;
  switchRoleDemo: (role: 'admin' | 'planner' | 'viewer') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);

  // Initialize and listen to Supabase Auth State
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // 1. Fetch Backend Auth status
      try {
        const status = await apiClient.getAuthStatus();
        if (isMounted) setAuthStatus(status);
      } catch {
        // Fallback default
      }

      // 2. Initialize Supabase Session if client is configured
      if (supabase && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase getSession error:', error.message);
          } else if (data.session) {
            handleSession(data.session);
          }
        } catch (err) {
          console.warn('Failed to get Supabase session:', err);
        }

        // Listen for OAuth redirects and auth events
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, currentSession) => {
          if (isMounted) {
            handleSession(currentSession);
          }
        });

        if (isMounted) setIsLoading(false);
        return () => subscription.unsubscribe();
      } else {
        // Check if demo user was saved in localStorage
        const savedDemo = localStorage.getItem('aquavane_demo_user');
        if (savedDemo && isMounted) {
          try {
            const parsed = JSON.parse(savedDemo);
            setUser(parsed);
          } catch {}
        }
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSession = (currentSession: Session | null) => {
    setSession(currentSession);
    const accessToken = currentSession?.access_token || null;
    setTokenState(accessToken);
    setAuthToken(accessToken);

    if (currentSession?.user) {
      const u = currentSession.user;
      const meta = u.user_metadata || {};
      const initialRole = meta.role || u.app_metadata?.role || 'planner';
      const mappedUser: AuthUser = {
        id: u.id,
        email: u.email,
        fullName: meta.full_name || meta.name || (u.email ? u.email.split('@')[0] : 'Watershed Planner'),
        avatarUrl: meta.avatar_url || meta.picture || undefined,
        role: initialRole,
        provider: u.app_metadata?.provider || 'google',
        isAuthenticated: true,
      };
      setUser(mappedUser);

      // Proactively sync profile with FastAPI PostgreSQL backend to adopt authoritative DB role
      apiClient.syncUserProfile().then((dbUser) => {
        if (dbUser && dbUser.role) {
          setUser((prev) => (prev ? { ...prev, role: dbUser.role } : null));
        }
      }).catch((err) => {
        console.warn('Profile sync failed:', err);
      });
    } else {
      setUser(null);
    }
  };

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (!supabase || !isSupabaseConfigured) {
      return {
        error:
          'Supabase environment variables are missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your frontend/.env file.',
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to initialize Google OAuth.' };
    }
  };

  const signOut = async () => {
    if (supabase && isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('aquavane_demo_user');
    setUser(null);
    setSession(null);
    setTokenState(null);
    setAuthToken(null);
  };

  const signInDemo = (role: string = 'planner') => {
    const defaultPersona = PRESET_USERS.find((p) => p.role === role) || PRESET_USERS[0];
    const demoUser: AuthUser = {
      id: 'demo-user-session',
      email: defaultPersona.email,
      fullName: defaultPersona.fullName,
      avatarUrl: defaultPersona.avatarUrl,
      role: defaultPersona.role,
      provider: 'demo',
      isAuthenticated: true,
    };
    localStorage.setItem('aquavane_demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const signInAsPersona = (persona: UserPersona) => {
    const personaUser: AuthUser = {
      id: persona.id,
      email: persona.email,
      fullName: persona.fullName,
      avatarUrl: persona.avatarUrl,
      role: persona.role,
      provider: 'persona',
      isAuthenticated: true,
    };
    localStorage.setItem('aquavane_demo_user', JSON.stringify(personaUser));
    setUser(personaUser);
  };

  const signInWithRole = (role: 'admin' | 'planner' | 'viewer', customName?: string) => {
    const defaultPersona = PRESET_USERS.find((p) => p.role === role) || PRESET_USERS[0];
    const newUser: AuthUser = {
      id: `custom-role-${role}`,
      email: `${role}.operator@aquavane.gov.in`,
      fullName: customName || defaultPersona.fullName,
      avatarUrl: defaultPersona.avatarUrl,
      role,
      provider: 'role_select',
      isAuthenticated: true,
    };
    localStorage.setItem('aquavane_demo_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const switchRoleDemo = (role: 'admin' | 'planner' | 'viewer') => {
    setUser((prev) => {
      const defaultPersona = PRESET_USERS.find((p) => p.role === role) || PRESET_USERS[0];
      if (!prev) {
        const newUser: AuthUser = {
          id: defaultPersona.id,
          email: defaultPersona.email,
          fullName: defaultPersona.fullName,
          avatarUrl: defaultPersona.avatarUrl,
          role,
          provider: 'demo',
          isAuthenticated: true,
        };
        localStorage.setItem('aquavane_demo_user', JSON.stringify(newUser));
        return newUser;
      }
      const updated: AuthUser = { ...prev, role };
      localStorage.setItem('aquavane_demo_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        isLoading,
        isConfigured: isSupabaseConfigured,
        authStatus,
        presetUsers: PRESET_USERS,
        signInWithGoogle,
        signOut,
        signInDemo,
        signInAsPersona,
        signInWithRole,
        switchRoleDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
