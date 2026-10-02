import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

export interface CaseItem {
  caseId: string;
  caseNumber: string;
  title: string;
  description: string;
  assignedInvestigator: string;
  assignedTeam: string;
  status: string;
  priority: string;
  jurisdiction: string;
  policeStation: string;
  caseType: string;
  entityCount: number;
  relationshipCount: number;
  evidenceCount: number;
  reportCount: number;
  alertCount: number;
  noteCount: number;
  teamCount: number;
  importCount: number;
  timelineEventCount: number;
  closedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaseMember {
  email: string;
  role: string;
  addedAt: string | null;
}

export interface CaseNote {
  noteId: string;
  caseId: string;
  content: string;
  authorEmail: string;
  authorName: string;
  isPinned: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

interface CaseState {
  cases: CaseItem[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchPromise: Promise<void> | null;
  
  // Actions
  fetchCases: () => Promise<void>;
  createCase: (data: Record<string, any>) => Promise<CaseItem | null>;
  updateCase: (caseId: string, data: Record<string, any>) => Promise<CaseItem | null>;
  closeCase: (caseId: string, reason: string) => Promise<boolean>;
  archiveCase: (caseId: string) => Promise<boolean>;
  reactivateCase: (caseId: string) => Promise<boolean>;
  
  // Members
  fetchMembers: (caseId: string) => Promise<CaseMember[]>;
  addMember: (caseId: string, email: string, role: string) => Promise<boolean>;
  removeMember: (caseId: string, email: string) => Promise<boolean>;
  
  // Notes
  fetchNotes: (caseId: string) => Promise<CaseNote[]>;
  createNote: (caseId: string, content: string, isPinned?: boolean) => Promise<CaseNote | null>;
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  fetchPromise: null,

  fetchCases: async () => {
    const state = get();
    const now = Date.now();
    if (state.lastFetchedAt && now - state.lastFetchedAt < 5000 && state.cases.length > 0) return;
    
    if (state.fetchPromise) {
      return state.fetchPromise;
    }

    const promise = (async () => {
      set({ isLoading: true, error: null });
      try {
        const res = await apiClient.get<any>('/cases?pageSize=100');
      if (res.success && (res.data || (res as any).items)) {
          const rawData = res.data || res;
          const items = Array.isArray(rawData) ? rawData : (rawData.items || []);
        const mapped: CaseItem[] = items.map((c: any) => ({
          caseId: c.caseId,
          caseNumber: c.caseNumber || c.caseId,
          title: c.title || 'Investigation Case',
          description: c.description || '',
          assignedInvestigator: c.assignedInvestigator || '',
          assignedTeam: c.assignedTeam || '',
          status: c.status || 'active',
          priority: c.priority || 'high',
          jurisdiction: c.jurisdiction || '',
          policeStation: c.policeStation || '',
          caseType: c.caseType || '',
          entityCount: c.entityCount || 0,
          relationshipCount: c.relationshipCount || 0,
          evidenceCount: c.evidenceCount || 0,
          reportCount: c.reportCount || 0,
          alertCount: c.alertCount || 0,
          noteCount: c.noteCount || 0,
          teamCount: c.teamCount || 0,
          importCount: c.importCount || 0,
          timelineEventCount: c.timelineEventCount || 0,
          closedAt: c.closedAt || null,
          archivedAt: c.archivedAt || null,
          createdAt: c.createdAt || '',
          updatedAt: c.updatedAt || '',
        }));
        set({ cases: mapped, isLoading: false, lastFetchedAt: now, fetchPromise: null });
      } else {
        set({ isLoading: false, error: res.error || 'Failed to load cases', fetchPromise: null });
      }
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Network error', fetchPromise: null });
    }
  })();
  set({ fetchPromise: promise });
  return promise;
  },

  createCase: async (data) => {
    try {
      const res = await apiClient.post<any>('/cases', data);
      if (res.success && res.data) {
        const newCase: CaseItem = {
          caseId: res.data.caseId,
          caseNumber: res.data.caseNumber || res.data.caseId,
          title: res.data.title || data.title,
          description: res.data.description || data.description || '',
          assignedInvestigator: res.data.assignedInvestigator || data.assignedInvestigator || '',
          assignedTeam: res.data.assignedTeam || data.assignedTeam || '',
          status: res.data.status || 'active',
          priority: res.data.priority || data.priority || 'high',
          jurisdiction: res.data.jurisdiction || data.jurisdiction || '',
          policeStation: res.data.policeStation || data.policeStation || '',
          caseType: res.data.caseType || data.caseType || '',
          entityCount: res.data.entityCount || 0,
          relationshipCount: res.data.relationshipCount || 0,
          evidenceCount: res.data.evidenceCount || 0,
          reportCount: res.data.reportCount || 0,
          alertCount: res.data.alertCount || 0,
          noteCount: res.data.noteCount || 0,
          teamCount: res.data.teamCount || 0,
          importCount: res.data.importCount || 0,
          timelineEventCount: res.data.timelineEventCount || 0,
          closedAt: null,
          archivedAt: null,
          createdAt: res.data.createdAt || new Date().toISOString(),
          updatedAt: res.data.updatedAt || new Date().toISOString(),
        };
        set(state => ({ cases: [newCase, ...state.cases], lastFetchedAt: null }));
        return newCase;
      }
      return null;
    } catch { return null; }
  },

  updateCase: async (caseId, data) => {
    try {
      const res = await apiClient.put<any>(`/cases/${caseId}`, data);
      if (res.success && res.data) {
        set(state => ({
          cases: state.cases.map(c => c.caseId === caseId ? { ...c, ...res.data, caseId } : c),
          lastFetchedAt: null
        }));
        // Re-fetch to get accurate data
        get().fetchCases();
        return res.data;
      }
      return null;
    } catch { return null; }
  },

  closeCase: async (caseId, reason) => {
    try {
      const res = await apiClient.post<any>(`/cases/${caseId}/close`, { reason });
      if (res.success) {
        set(state => ({
          cases: state.cases.map(c => c.caseId === caseId ? { ...c, status: 'closed' } : c),
          lastFetchedAt: null
        }));
        return true;
      }
      return false;
    } catch { return false; }
  },

  archiveCase: async (caseId) => {
    try {
      const res = await apiClient.post<any>(`/cases/${caseId}/archive`);
      if (res.success) {
        set(state => ({
          cases: state.cases.map(c => c.caseId === caseId ? { ...c, status: 'archived' } : c),
          lastFetchedAt: null
        }));
        return true;
      }
      return false;
    } catch { return false; }
  },

  reactivateCase: async (caseId) => {
    try {
      const res = await apiClient.post<any>(`/cases/${caseId}/reactivate`);
      if (res.success) {
        set(state => ({
          cases: state.cases.map(c => c.caseId === caseId ? { ...c, status: 'active' } : c),
          lastFetchedAt: null
        }));
        return true;
      }
      return false;
    } catch { return false; }
  },

  fetchMembers: async (caseId) => {
    try {
      const res = await apiClient.get<any>(`/cases/${caseId}/members`);
      if (res.success && Array.isArray(res.data)) {
        return res.data as CaseMember[];
      }
      return [];
    } catch { return []; }
  },

  addMember: async (caseId, email, role) => {
    try {
      const res = await apiClient.post<any>(`/cases/${caseId}/members`, { email, role });
      return res.success;
    } catch { return false; }
  },

  removeMember: async (caseId, email) => {
    try {
      const res = await apiClient.delete<any>(`/cases/${caseId}/members/${encodeURIComponent(email)}`);
      return res.success;
    } catch { return false; }
  },

  fetchNotes: async (caseId) => {
    try {
      const res = await apiClient.get<any>(`/cases/${caseId}/notes`);
      if (res.success && Array.isArray(res.data)) {
        return res.data as CaseNote[];
      }
      return [];
    } catch { return []; }
  },

  createNote: async (caseId, content, isPinned = false) => {
    try {
      const res = await apiClient.post<any>(`/cases/${caseId}/notes`, { content, isPinned });
      if (res.success && res.data) {
        return res.data as CaseNote;
      }
      return null;
    } catch { return null; }
  },
}));
