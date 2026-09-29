/**
 * CrimeNet AI - Single Source of Truth for Statutory RBAC Permissions
 * SIH2026 - SIH26189
 */

export type UserRole = 'ADMIN' | 'INVESTIGATOR' | 'ANALYST' | 'AUDITOR';

export interface StatutoryPermissions {
  'dashboard:read': boolean;
  'case:write': boolean;
  'graph:read': boolean;
  'analytics:read': boolean;
  'timeline:read': boolean;
  'evidence:write': boolean;
  'verification:read': boolean;
  'report:generate': boolean;
  'audit:read': boolean;
  'admin:write': boolean;
}

/**
 * Exact Statutory Permission Matrix
 */
export const STATUTORY_RBAC_MATRIX: Record<UserRole, StatutoryPermissions> = {
  ADMIN: {
    'dashboard:read': true,
    'case:write': true,
    'graph:read': true,
    'analytics:read': true,
    'timeline:read': true,
    'evidence:write': true,
    'verification:read': true,
    'report:generate': true,
    'audit:read': true,
    'admin:write': true,
  },
  INVESTIGATOR: {
    'dashboard:read': true,
    'case:write': true,
    'graph:read': true,
    'analytics:read': true,
    'timeline:read': true,
    'evidence:write': true,
    'verification:read': true,
    'report:generate': true,
    'audit:read': false,
    'admin:write': false,
  },
  ANALYST: {
    'dashboard:read': true,
    'case:write': false,
    'graph:read': true,
    'analytics:read': true,
    'timeline:read': true,
    'evidence:write': false,
    'verification:read': true,
    'report:generate': true,
    'audit:read': false,
    'admin:write': false,
  },
  AUDITOR: {
    'dashboard:read': true,
    'case:write': false,
    'graph:read': false,
    'analytics:read': false,
    'timeline:read': true,
    'evidence:write': false,
    'verification:read': true,
    'report:generate': true,
    'audit:read': true,
    'admin:write': false,
  },
};

/**
 * AppView to Required Statutory Permission Mapping
 */
export const VIEW_REQUIRED_PERMISSIONS: Record<string, keyof StatutoryPermissions> = {
  'dashboard': 'dashboard:read',
  'search': 'dashboard:read',
  'cases': 'dashboard:read',
  'case-workspace': 'dashboard:read',
  'entity': 'dashboard:read',
  'graph': 'graph:read',
  'hidden-discovery': 'graph:read',
  'analytics': 'analytics:read',
  'community': 'analytics:read',
  'timeline': 'timeline:read',
  'gis': 'graph:read',
  'verification': 'verification:read',
  'evidence': 'verification:read',
  'reports': 'report:generate',
  'admin': 'admin:write',
  'authority': 'admin:write',
  'ingestion': 'evidence:write',
  'watchlist': 'dashboard:read',
  'alerts': 'dashboard:read',
  'assistant': 'dashboard:read',
};

/**
 * Normalize and validate role string
 */
export function normalizeRole(role?: string | null): UserRole {
  if (!role) return 'INVESTIGATOR';
  const upper = role.toUpperCase();
  if (upper === 'ADMIN' || upper.includes('ADMIN')) return 'ADMIN';
  if (upper === 'ANALYST') return 'ANALYST';
  if (upper === 'AUDITOR') return 'AUDITOR';
  return 'INVESTIGATOR';
}

/**
 * Check if a role possesses a specific permission
 */
export function hasPermission(role: string | undefined | null, permission: keyof StatutoryPermissions | string): boolean {
  const normRole = normalizeRole(role);
  if (normRole === 'ADMIN') return true;
  
  const permissions = STATUTORY_RBAC_MATRIX[normRole];
  if (!permissions) return false;
  
  if (permission in permissions) {
    return permissions[permission as keyof StatutoryPermissions];
  }
  return false;
}

/**
 * Check if a role can access a specific application view
 */
export function canAccessView(role: string | undefined | null, view: string): boolean {
  const normRole = normalizeRole(role);
  if (normRole === 'ADMIN') return true;
  
  const reqPermission = VIEW_REQUIRED_PERMISSIONS[view];
  if (!reqPermission) return true;
  
  return hasPermission(normRole, reqPermission);
}

/**
 * Role display metadata
 */
export const ROLE_CONFIGS: Record<UserRole, { label: string; badgeClass: string; description: string }> = {
  ADMIN: {
    label: 'ADMIN',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Full supervisory authority & system administration'
  },
  INVESTIGATOR: {
    label: 'INVESTIGATOR',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    description: 'Case investigation lead & digital evidence ingestion'
  },
  ANALYST: {
    label: 'ANALYST',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Network graph intelligence & community clustering'
  },
  AUDITOR: {
    label: 'AUDITOR',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Statutory compliance & Merkle audit ledger review'
  }
};
