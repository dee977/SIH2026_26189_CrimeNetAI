import { create } from 'zustand';
import { UserProfile, UserRole, UserStatus, RegistrationRequest } from '../types/auth';

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

const DEFAULT_INVESTIGATOR: UserProfile = {
  id: 'USR-7729',
  name: 'Inspector Vikramaditya Rao',
  email: 'v.rao@cid.police.gov.in',
  phone: '+91-98200-11223',
  officerId: 'LEO-7729',
  organization: 'Special Crime Branch, CID Maharashtra',
  requestedRole: 'Senior Investigator',
  grantedRole: 'Senior Investigator',
  status: 'APPROVED',
  permissions: ['cases', 'graph', 'evidence', 'timeline', 'ai', 'export', 'alerts', 'gis', 'search'],
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
  token: 'mock-jwt-token-m6-contract',
  isAuthenticated: true,
  isPendingApproval: false,
  isSessionExpired: false,
  pendingRegistration: null,
  pendingOfficers: INITIAL_PENDING_OFFICERS,

  login: (emailOrPhone, role = 'Senior Investigator') => {
    const updatedUser: UserProfile = {
      ...DEFAULT_INVESTIGATOR,
      email: emailOrPhone.includes('@') ? emailOrPhone : 'v.rao@cid.police.gov.in',
      phone: !emailOrPhone.includes('@') ? emailOrPhone : '+91-98200-11223',
      requestedRole: role,
      grantedRole: role,
      permissions: getPermissionsForRole(role)
    };
    set({
      user: updatedUser,
      token: 'jwt-auth-session-valid',
      isAuthenticated: true,
      isPendingApproval: false,
      isSessionExpired: false
    });
  },

  logout: () => {
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

  switchRole: (role: UserRole) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          grantedRole: role,
          permissions: getPermissionsForRole(role)
        }
      });
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

function getPermissionsForRole(role: UserRole): string[] {
  switch (role) {
    case 'System Administrator':
      return ['cases', 'graph', 'evidence', 'timeline', 'ai', 'export', 'alerts', 'gis', 'search', 'admin', 'authority'];
    case 'Senior Authority':
      return ['cases', 'graph', 'evidence', 'timeline', 'ai', 'export', 'alerts', 'gis', 'search', 'authority'];
    case 'Senior Investigator':
      return ['cases', 'graph', 'evidence', 'timeline', 'ai', 'export', 'alerts', 'gis', 'search'];
    case 'Investigator':
      return ['cases', 'graph', 'evidence', 'timeline', 'ai', 'alerts', 'gis', 'search'];
    case 'Analyst / Viewer':
      return ['graph', 'timeline', 'gis', 'search'];
    default:
      return ['search'];
  }
}
