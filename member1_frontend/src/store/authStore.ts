import { create } from 'zustand';
import { UserProfile, UserRole } from '../types/auth';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  
  // Actions
  setSession: (token: string | null, user: UserProfile | null) => void;
  logout: () => void;
  triggerSessionExpiry: () => void;
  switchRole: (role: UserRole) => void;
  login: (emailOrPhone: string, role?: UserRole) => void;
  restoreSession: () => void;
  pendingOfficers: UserProfile[];
  approveOfficer: (officerId: string, grantedRole: UserRole, permissions: string[]) => void;
  rejectOfficer: (officerId: string) => void;
  suspendOfficer: (officerId: string) => void;
  reactivateOfficer: (officerId: string) => void;
}

export function getPermissionsForRole(role: UserRole): string[] {
  switch (role) {
    case 'ADMIN':
      return [
        'dashboard:read', 'case:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read',
        'evidence:read', 'evidence:write', 'ingest:upload', 'report:generate', 'alert:read', 'alert:manage',
        'watchlist:read', 'watchlist:manage', 'gis:read', 'ai:read', 'admin:read', 'admin:write', 'audit:read',
        'verification:read'
      ];
    case 'INVESTIGATOR':
      return [
        'dashboard:read', 'case:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read',
        'evidence:read', 'evidence:write', 'ingest:upload', 'report:generate', 'alert:read', 'alert:manage',
        'watchlist:read', 'watchlist:manage', 'gis:read', 'ai:read', 'verification:read'
      ];
    case 'ANALYST':
      return [
        'dashboard:read', 'case:read', 'graph:read', 'analytics:read', 'timeline:read', 'evidence:read',
        'report:generate', 'watchlist:read', 'gis:read', 'ai:read'
      ];
    case 'AUDITOR':
      return [
        'dashboard:read', 'case:read', 'graph:read', 'analytics:read', 'timeline:read', 'evidence:read',
        'report:generate', 'alert:read', 'audit:read', 'verification:read'
      ];
    default:
      return ['dashboard:read'];
  }
}

const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem('crimenet_auth_token') : null;
let initialUser: UserProfile | null = null;
try {
  const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('crimenet_user_profile') : null;
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    if (parsed && parsed.status !== 'PENDING') {
      initialUser = parsed;
    } else {
      localStorage.removeItem('crimenet_auth_token');
      localStorage.removeItem('crimenet_user_profile');
      localStorage.removeItem('crimenet_active_role');
    }
  }
} catch (_) {}

export const useAuthStore = create<AuthState>((set) => ({
  user: initialUser,
  token: initialUser ? initialToken : null,
  isAuthenticated: !!initialToken && !!initialUser && initialUser.status !== 'PENDING',
  isSessionExpired: false,
  pendingOfficers: [],

  setSession: (token, user) => {
    if (token && user && user.status !== 'PENDING') {
      try { 
        localStorage.setItem('crimenet_auth_token', token); 
        localStorage.setItem('crimenet_user_profile', JSON.stringify(user));
      } catch (_) {}
      set({
        token,
        user,
        isAuthenticated: true
      });
    } else {
      try { 
        localStorage.removeItem('crimenet_auth_token'); 
        localStorage.removeItem('crimenet_user_profile');
        localStorage.removeItem('crimenet_active_role');
      } catch (_) {}
      set({
        token: null,
        user: null,
        isAuthenticated: false
      });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    try {
      localStorage.removeItem('crimenet_auth_token');
      localStorage.removeItem('crimenet_user_profile');
      localStorage.removeItem('crimenet_active_role');
      localStorage.removeItem('auth-store');
    } catch (_) {}
    set({ user: null, token: null, isAuthenticated: false });
  },

  triggerSessionExpiry: () => {
    supabase.auth.signOut();
    set({ isSessionExpired: true, isAuthenticated: false, token: null, user: null });
  },

  // Roles are assigned by the backend profile. A local role switch must never
  // change client-side authorization state.
  switchRole: () => {},

  login: (emailOrPhone, role) => {},
  restoreSession: () => {},
  approveOfficer: (officerId, grantedRole, permissions) => {},
  rejectOfficer: (officerId) => {},
  suspendOfficer: (officerId) => {},
  reactivateOfficer: (officerId) => {}
}));
