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
  isBackendConnected: boolean; // toggle between live M2 API & synthetic/demo fallback
  
  // Actions
  setView: (view: AppView) => void;
  selectEntity: (entityId: string | null) => void;
  selectCase: (caseId: string) => void;
  selectEvidence: (evidenceId: string) => void;
  setGlobalSearchQuery: (query: string) => void;
  toggleBackendConnection: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentView: 'dashboard',
  selectedEntityId: null,
  selectedCaseId: null,
  selectedEvidenceId: null,
  globalSearchQuery: '',
  isBackendConnected: true,

  setView: (view) => set({ currentView: view }),
  selectEntity: (entityId) => set((state) => ({ 
    selectedEntityId: entityId, 
    currentView: entityId ? 'entity' : state.currentView 
  })),
  selectCase: (caseId) => set({ selectedCaseId: caseId, currentView: 'case-workspace', selectedEntityId: null }),
  selectEvidence: (evidenceId) => set({ selectedEvidenceId: evidenceId, currentView: 'evidence' }),
  setGlobalSearchQuery: (query) => set({ globalSearchQuery: query, currentView: 'search' }),
  toggleBackendConnection: () => set(state => ({ isBackendConnected: !state.isBackendConnected }))
}));
