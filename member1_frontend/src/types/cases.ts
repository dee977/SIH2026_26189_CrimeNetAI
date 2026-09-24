export interface CaseDossier {
  id: string;
  caseNumber: string; // e.g. CASE-2024-MH-092
  title: string;
  description: string;
  leadInvestigator: string;
  assignedTeam: string[];
  status: 'Active' | 'Under Review' | 'Charge Sheeted' | 'Archived';
  priority: 'High' | 'Medium' | 'Critical';
  openedDate: string;
  lastUpdated: string;
  policeStation: string;
  jurisdiction: string;
  entityCount: number;
  evidenceCount: number;
  alertCount: number;
  associatedFIRs: string[];
  accessClassification: 'RESTRICTED' | 'CONFIDENTIAL' | 'TOP SECRET';
  auditHistory: {
    timestamp: string;
    officer: string;
    action: string;
    details: string;
  }[];
}
