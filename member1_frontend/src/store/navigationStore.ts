import { create } from 'zustand';

export type AppView = 
  | 'landing'
  | 'about'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'dashboard'
  | 'search'
  | 'cases'
  | 'case-workspace'
  | 'entity'
  | 'graph'
  | 'hidden-discovery'
  | 'analytics'
  | 'community'
  | 'timeline'
  | 'gis'
  | 'verification'
  | 'evidence'
  | 'watchlist'
  | 'alerts'
  | 'assistant'
  | 'authority'
  | 'admin'
  | 'ingestion'
  | 'reports';

interface NavigationState {
  currentView: AppView;
  selectedEntityId: string | null;
  selectedCaseId: string | null;
  selectedEvidenceId: string | null;
  globalSearchQuery: string;
  isBackendConnected: boolean;
  isEvidenceUploadModalOpen: boolean;
  isSidebarCollapsed: boolean;
  
  // Actions
  setView: (view: AppView) => void;
  selectEntity: (entityId: string | null) => void;
  selectCase: (caseId: string) => void;
  openCase: (caseId: string) => void;
  selectEvidence: (evidenceId: string) => void;
  setGlobalSearchQuery: (query: string) => void;
  toggleBackendConnection: () => void;
  setEvidenceUploadModalOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'dashboard',
  selectedEntityId: null,
  selectedCaseId: typeof localStorage !== 'undefined' ? (localStorage.getItem('crimenet_selected_case_id') || 'CASE-2026-011') : 'CASE-2026-011',
  selectedEvidenceId: null,
  globalSearchQuery: '',
  isBackendConnected: true,
  isEvidenceUploadModalOpen: false,
  isSidebarCollapsed: typeof localStorage !== 'undefined' ? (localStorage.getItem('crimenet_sidebar_collapsed') === 'true') : false,

  setView: (view) => set({ currentView: view }),
  selectEntity: (entityId) => set((state) => ({ 
    selectedEntityId: entityId, 
    currentView: entityId ? 'entity' : state.currentView 
  })),
  selectCase: (caseId) => {
    try { localStorage.setItem('crimenet_selected_case_id', caseId); } catch (_) {}
    set({ selectedCaseId: caseId, selectedEntityId: null });
  },
  openCase: (caseId: string) => {
    try { localStorage.setItem('crimenet_selected_case_id', caseId); } catch (_) {}
    set({ selectedCaseId: caseId, currentView: 'case-workspace', selectedEntityId: null });
  },
  selectEvidence: (evidenceId) => set({ selectedEvidenceId: evidenceId, currentView: 'evidence' }),
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query, currentView: 'search' }),
  toggleBackendConnection: () => set(state => ({ isBackendConnected: !state.isBackendConnected })),
  setEvidenceUploadModalOpen: (isOpen) => set({ isEvidenceUploadModalOpen: isOpen }),
  toggleSidebar: () => set(state => {
    const next = !state.isSidebarCollapsed;
    try { localStorage.setItem('crimenet_sidebar_collapsed', String(next)); } catch (_) {}
    return { isSidebarCollapsed: next };
  }),
  setSidebarCollapsed: (collapsed: boolean) => {
    try { localStorage.setItem('crimenet_sidebar_collapsed', String(collapsed)); } catch (_) {}
    set({ isSidebarCollapsed: collapsed });
  }
}));
