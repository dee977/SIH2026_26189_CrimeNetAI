import { create } from 'zustand';
import { UserProfile, UserRole, UserStatus, RegistrationRequest } from '../types/auth';
import { apiRequest } from '../services/apiClient';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isPendingApproval: boolean;
  isSessionExpired: boolean;
  pendingRegistration: RegistrationRequest | null;
  pendingOfficers: UserProfile[]; // for Authority Dashboard to review!
  
  // Actions
  login: (emailOrPhone: string, role?: UserRole) => void;
  logout: () => void;
  register: (req: RegistrationRequest) => void;
  clearPendingApproval: () => void;
  triggerSessionExpiry: () => void;
  restoreSession: () => void;
  switchRole: (role: UserRole) => void;
  approveOfficer: (officerId: string, grantedRole: UserRole, permissions: string[]) => void;
  rejectOfficer: (officerId: string) => void;
  suspendOfficer: (officerId: string) => void;
  reactivateOfficer: (officerId: string) => void;
}

export function getPermissionsForRole(role: UserRole): string[] {
  switch (role) {
    case 'System Administrator':
      return [
        'cases', 'graph', 'evidence', 'timeline', 'ai', 'export', 'alerts', 'gis', 'search',
        'admin', 'authority', 'community', 'analytics', 'verification', 'watchlist', 'reports',
        'admin:manage', 'authority:manage', 'authority:approve'
      ];
    case 'Senior Authority':
      return [
        'cases', 'graph', 'evidence', 'timeline', 'ai', 'export', 'alerts', 'gis', 'search',
        'authority', 'community', 'analytics', 'verification', 'watchlist', 'reports',
        'authority:approve'
      ];
    case 'Senior Investigator':
      return [
        'cases', 'graph', 'evidence', 'timeline', 'ai', 'export', 'alerts', 'gis', 'search',
        'community', 'analytics', 'verification', 'watchlist', 'reports'
      ];
    case 'Investigator':
      return ['cases', 'graph', 'evidence', 'timeline', 'ai', 'alerts', 'gis', 'search'];
    case 'Analyst / Viewer':
      return ['graph', 'timeline', 'gis', 'search'];
    default:
      return ['search'];
  }
}

const getInitialRole = (): UserRole => {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('crimenet_active_role');
    if (saved && ['System Administrator', 'Senior Authority', 'Senior Investigator', 'Investigator', 'Analyst / Viewer'].includes(saved)) {
      return saved as UserRole;
    }
  }
  return 'Senior Investigator';
};

const initialRole = getInitialRole();

const DEFAULT_INVESTIGATOR: UserProfile = {
  id: 'USR-7729',
  name: 'Inspector Vikramaditya Rao',
  email: 'v.rao@cid.police.gov.in',
  phone: '+91-98200-11223',
  officerId: 'LEO-7729',
  organization: 'Special Crime Branch, CID Maharashtra',
  requestedRole: initialRole,
  grantedRole: initialRole,
  status: 'APPROVED',
  permissions: getPermissionsForRole(initialRole),
  createdAt: '2024-01-15',
  lastLogin: '2024-08-25 08:30:00'
};

const INITIAL_PENDING_OFFICERS: UserProfile[] = [
  {
    id: 'USR-REQ-101',
    name: 'Sub-Inspector Ananya Deshmukh',
    email: 'ananya.d@mumbaipolice.gov.in',
    phone: '+91-98199-55441',
    officerId: 'LEO-9182',
    organization: 'Cyber Crime Unit, Navi Mumbai',
    requestedRole: 'Investigator',
    status: 'PENDING_APPROVAL',
    permissions: [],
    createdAt: '2024-08-24 14:10:00'
  },
  {
    id: 'USR-REQ-102',
    name: 'DySP Rajeshwar Verma',
    email: 'r.verma@cid.police.gov.in',
    phone: '+91-94250-99881',
    officerId: 'LEO-4012',
    organization: 'Economic Offences Wing, Pune',
    requestedRole: 'Senior Authority',
    status: 'PENDING_APPROVAL',
    permissions: [],
    createdAt: '2024-08-23 11:20:00'
  },
  {
    id: 'USR-REQ-103',
    name: 'Analyst Rohan Mehta',
    email: 'r.mehta@forensic.gov.in',
    phone: '+91-99881-22334',
    officerId: 'ANL-3301',
    organization: 'State Digital Forensic Lab',
    requestedRole: 'Analyst / Viewer',
    status: 'PENDING_APPROVAL',
    permissions: [],
    createdAt: '2024-08-24 09:45:00'
  }
];

export const useAuthStore = create<AuthState>((set, get) => ({
  user: DEFAULT_INVESTIGATOR,
  token: `mock-jwt-role:${initialRole.replace(/ /g, '_')}`,
  isAuthenticated: true,
  isPendingApproval: false,
  isSessionExpired: false,
  pendingRegistration: null,
  pendingOfficers: INITIAL_PENDING_OFFICERS,

  login: async (emailOrPhone, role = 'Senior Investigator') => {
    const mockToken = `mock-jwt-role:${role.replace(/ /g, '_')}`;
    localStorage.setItem('crimenet_auth_token', mockToken);
    localStorage.setItem('crimenet_active_role', role);
    const rolePerms = getPermissionsForRole(role);
    const updatedUser: UserProfile = {
      ...DEFAULT_INVESTIGATOR,
      email: emailOrPhone.includes('@') ? emailOrPhone : 'v.rao@cid.police.gov.in',
      phone: !emailOrPhone.includes('@') ? emailOrPhone : '+91-98200-11223',
      requestedRole: role,
      grantedRole: role,
      permissions: rolePerms
    };
    set({
      user: updatedUser,
      token: mockToken,
      isAuthenticated: true,
      isPendingApproval: false,
      isSessionExpired: false
    });

    try {
      const response = await apiRequest<any>('/auth/me');
      const bData = response.data?.data || response.data;
      if (response.success && bData) {
        set(state => {
          const cur = state.user || updatedUser;
          return {
            user: {
              ...cur,
              id: bData.userId || bData.id || cur.id,
              name: bData.fullName || bData.name || cur.name,
              email: bData.email || cur.email,
              officerId: bData.badgeNumber || bData.officerId || cur.officerId,
              organization: bData.agencyUnit || bData.organization || cur.organization,
              grantedRole: (bData.grantedRole as UserRole) || role,
              requestedRole: role,
              permissions: Array.from(new Set([...rolePerms, ...(bData.permissions || [])]))
            }
          };
        });
      }
    } catch (e) {
      console.warn('Backend unavailable, using fallback profile', e);
    }
  },

  logout: () => {
    localStorage.removeItem('crimenet_auth_token');
    localStorage.removeItem('crimenet_active_role');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isPendingApproval: false,
      isSessionExpired: false
    });
  },

  register: (req: RegistrationRequest) => {
    // Under M6 RBAC Rules:
    // Requested Role != Granted Role != Actual Permissions
    // Do NOT automatically grant role in frontend!
    const newOfficerReq: UserProfile = {
      id: `USR-REQ-${Date.now().toString().slice(-4)}`,
      name: req.userName,
      email: req.email,
      phone: req.phoneNumber,
      officerId: req.employeeId,
      organization: req.organization,
      requestedRole: req.requestedRole,
      status: 'PENDING_APPROVAL',
      permissions: [],
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    set(state => ({
      pendingRegistration: req,
      isPendingApproval: true,
      pendingOfficers: [newOfficerReq, ...state.pendingOfficers]
    }));
  },

  clearPendingApproval: () => {
    set({ isPendingApproval: false, pendingRegistration: null });
  },

  triggerSessionExpiry: () => {
    set({ isSessionExpired: true });
  },

  restoreSession: () => {
    set({ isSessionExpired: false });
  },

  switchRole: async (role: UserRole) => {
    const currentUser = get().user;
    if (currentUser) {
      const mockToken = `mock-jwt-role:${role.replace(/ /g, '_')}`;
      localStorage.setItem('crimenet_auth_token', mockToken);
      localStorage.setItem('crimenet_active_role', role);
      const rolePerms = getPermissionsForRole(role);
      set({
        token: mockToken,
        user: {
          ...currentUser,
          grantedRole: role,
          requestedRole: role,
          permissions: rolePerms
        }
      });

      try {
        const response = await apiRequest<any>('/auth/me');
        const bData = response.data?.data || response.data;
        if (response.success && bData) {
          set(state => {
            const cur = state.user || currentUser;
            return {
              user: {
                ...cur,
                id: bData.userId || bData.id || cur.id,
                name: bData.fullName || bData.name || cur.name,
                email: bData.email || cur.email,
                officerId: bData.badgeNumber || bData.officerId || cur.officerId,
                organization: bData.agencyUnit || bData.organization || cur.organization,
                grantedRole: (bData.grantedRole as UserRole) || role,
                requestedRole: role,
                permissions: Array.from(new Set([...rolePerms, ...(bData.permissions || [])]))
              }
            };
          });
        }
      } catch (e) {
        // ignore
      }
    }
  },

  approveOfficer: (officerId, grantedRole, permissions) => {
    set(state => ({
      pendingOfficers: state.pendingOfficers.map(o => 
        o.id === officerId 
          ? { ...o, status: 'APPROVED', grantedRole, permissions }
          : o
      )
    }));
  },

  rejectOfficer: (officerId) => {
    set(state => ({
      pendingOfficers: state.pendingOfficers.map(o => 
        o.id === officerId ? { ...o, status: 'REJECTED' } : o
      )
    }));
  },

  suspendOfficer: (officerId) => {
    set(state => ({
      pendingOfficers: state.pendingOfficers.map(o => 
        o.id === officerId ? { ...o, status: 'SUSPENDED' } : o
      )
    }));
  },

  reactivateOfficer: (officerId) => {
    set(state => ({
      pendingOfficers: state.pendingOfficers.map(o => 
        o.id === officerId ? { ...o, status: 'APPROVED' } : o
      )
    }));
  }
}));
