export type UserRole = 
  | 'System Administrator'
  | 'Senior Authority'
  | 'Senior Investigator'
  | 'Investigator'
  | 'Analyst / Viewer';

export type UserStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface UserPermission {
  id: string;
  name: string;
  description: string;
  module: 'cases' | 'graph' | 'evidence' | 'timeline' | 'ai' | 'admin' | 'authority' | 'export';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  officerId: string;
  organization: string; // Police Unit/Agency
  requestedRole: UserRole;
  grantedRole?: UserRole;
  status: UserStatus;
  permissions: string[];
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface RegistrationRequest {
  userName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  employeeId: string;
  organization: string;
  requestedRole: UserRole;
}

export interface AuthSession {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isPendingApproval: boolean;
  expiresAt: number | null;
}
