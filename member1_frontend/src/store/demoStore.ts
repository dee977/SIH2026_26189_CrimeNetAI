import { create } from 'zustand';

export interface DemoStep {
  stepNumber: number;
  id: string;
  title: string;
  storyStage: string;
  description: string;
  targetView: string;
  entityId?: string;
  actionHint: string;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    id: 'demo-login',
    title: '1. Secure Login & Persona Authentication',
    storyStage: 'LOGIN',
    description: 'Investigator logs into the CrimeNet AI terminal with officer credentials.',
    targetView: 'login',
    actionHint: 'Click "Login as Senior Investigator" or enter test credentials.'
  },
  {
    stepNumber: 2,
    id: 'demo-dashboard',
    title: '2. Investigator Command Center',
    storyStage: 'AUTHORIZED INVESTIGATOR',
    description: 'Review active cases, real-time alerts, and cross-jurisdictional intelligence feeds.',
    targetView: 'dashboard',
    actionHint: 'Inspect the 12 live operational indicators and active watchlist alerts.'
  },
  {
    stepNumber: 3,
    id: 'demo-search-person-a',
    title: '3. Global Search: Target Person A',
    storyStage: 'SEARCH PERSON A',
    description: 'Query database for Vikram Malhotra (Logistics Operator).',
    targetView: 'search',
    entityId: 'ENT-PERS-001',
    actionHint: 'Search for "Vikram" across all 11 entity types.'
  },
  {
    stepNumber: 4,
    id: 'demo-person-profile',
    title: '4. Entity Explorer: Person Profile',
    storyStage: 'OPEN PROFILE',
    description: 'Inspect Vikram Malhotra\'s dossier, phones, accounts, vehicles, and FIR references (strictly no risk scores).',
    targetView: 'entity',
    entityId: 'ENT-PERS-001',
    actionHint: 'Review linked identifiers and analytical findings.'
  },
  {
    stepNumber: 5,
    id: 'demo-graph-view',
    title: '5. Network Graph Visualization (Cytoscape)',
    storyStage: 'OPEN GRAPH',
    description: 'Explore the interactive network of Vikram Malhotra and connected nodes.',
    targetView: 'graph',
    entityId: 'ENT-PERS-001',
    actionHint: 'Click nodes to inspect degree centrality, PageRank, and relationships.'
  },
  {
    stepNumber: 6,
    id: 'demo-hidden-discovery',
    title: '6. Hidden Relationship Discovery (Multi-Hop)',
    storyStage: 'DISCOVER INDIRECT RELATIONSHIP',
    description: 'Uncover the 6-hop indirect path: Vikram → Phone → Rajesh → Bank → TXN → BlueSea.',
    targetView: 'hidden-discovery',
    actionHint: 'Observe factual intermediaries and supporting evidence chain.'
  },
  {
    stepNumber: 7,
    id: 'demo-timeline-view',
    title: '7. Temporal Timeline & Burst Analysis',
    storyStage: 'OPEN TIMELINE',
    description: 'Inspect chronological sequence of phone calls and fund movements on August 14.',
    targetView: 'timeline',
    actionHint: 'Observe the 01:04 AM call followed by the 01:18 AM transaction.'
  },
  {
    stepNumber: 8,
    id: 'demo-check-transaction',
    title: '8. Transaction Analysis: TXN-90214',
    storyStage: 'CHECK TRANSACTION',
    description: 'Analyze the ₹15,00,000 NEFT relay debit executed right before container arrival.',
    targetView: 'entity',
    entityId: 'ENT-TXN-001',
    actionHint: 'Review banking audit trail and source account details.'
  },
  {
    stepNumber: 9,
    id: 'demo-gis-location',
    title: '9. GIS Tactical Map: Nhava Sheva Yard 4B',
    storyStage: 'CHECK LOCATION',
    description: 'Map crime scene, cell tower coverage sector, and suspect GPS pings.',
    targetView: 'gis',
    actionHint: 'Toggle cell tower radius and verify spatial correlation.'
  },
  {
    stepNumber: 10,
    id: 'demo-ai-assistant',
    title: '10. Grounded AI Assistant (Fact-Checked)',
    storyStage: 'ASK AI ASSISTANT',
    description: 'Query CrimeNet AI for network synthesis with mandatory source citations.',
    targetView: 'assistant',
    actionHint: 'Click suggested prompt: "How is Vikram Malhotra connected to BlueSea Logistics?"'
  },
  {
    stepNumber: 11,
    id: 'demo-evidence-profile',
    title: '11. Evidence Chain of Custody Profile',
    storyStage: 'OPEN SUPPORTING EVIDENCE',
    description: 'Inspect mobile forensic image EVD-2024-0812 and legal seizure documentation.',
    targetView: 'evidence',
    entityId: 'EVD-2024-0812',
    actionHint: 'View BSA Section 63 digital evidence certificate and custody timestamps.'
  },
  {
    stepNumber: 12,
    id: 'demo-sha256-verify',
    title: '12. Cryptographic SHA-256 Verification',
    storyStage: 'VERIFY SHA-256',
    description: 'Verify original vs current hash to guarantee evidentiary tamper-proof integrity.',
    targetView: 'evidence',
    entityId: 'EVD-2024-0812',
    actionHint: 'Observe the MATCH indicator on EVD-001 and contrast with the MISMATCH alert on EVD-003.'
  },
  {
    stepNumber: 13,
    id: 'demo-generate-report',
    title: '13. Comprehensive Case Report Export',
    storyStage: 'GENERATE REPORT',
    description: 'Compile case overview, network findings, verified evidence, and audit logs into formal dossier.',
    targetView: 'reports',
    actionHint: 'Review executive summary and dispatch export request to backend.'
  }
];

interface DemoState {
  isDemoActive: boolean;
  currentStepIndex: number;
  steps: DemoStep[];
  toggleDemoMode: (active?: boolean) => void;
  nextStep: () => DemoStep;
  prevStep: () => DemoStep;
  jumpToStep: (index: number) => DemoStep;
  getCurrentStep: () => DemoStep;
}

export const useDemoStore = create<DemoState>((set, get) => ({
  isDemoActive: false,
  currentStepIndex: 0,
  steps: DEMO_STEPS,

  toggleDemoMode: (active) => {
    set(state => ({
      isDemoActive: active !== undefined ? active : !state.isDemoActive,
      currentStepIndex: 0
    }));
  },

  nextStep: () => {
    const { currentStepIndex, steps } = get();
    const nextIdx = Math.min(currentStepIndex + 1, steps.length - 1);
    set({ currentStepIndex: nextIdx, isDemoActive: true });
    return steps[nextIdx];
  },

  prevStep: () => {
    const { currentStepIndex, steps } = get();
    const prevIdx = Math.max(currentStepIndex - 1, 0);
    set({ currentStepIndex: prevIdx });
    return steps[prevIdx];
  },

  jumpToStep: (index: number) => {
    const { steps } = get();
    const validIdx = Math.max(0, Math.min(index, steps.length - 1));
    set({ currentStepIndex: validIdx, isDemoActive: true });
    return steps[validIdx];
  },

  getCurrentStep: () => {
    const { currentStepIndex, steps } = get();
    return steps[currentStepIndex];
  }
}));
