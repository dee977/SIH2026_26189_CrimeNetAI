export interface CaseDossier {
  caseId: string;
  caseNumber: string;
  title: string;
  description: string;
  assignedInvestigator: string;
  assignedTeam: string;
  status: string; // 'active', 'under_investigation', 'on_hold', 'closed', 'archived'
  priority: string;
  jurisdiction: string;
  policeStation: string;
  caseType?: string;
  closedAt?: string | null;
  archivedAt?: string | null;
  entityCount: number;
  relationshipCount?: number;
  evidenceCount: number;
  reportCount?: number;
  alertCount?: number;
  noteCount?: number;
  teamCount?: number;
  importCount?: number;
  timelineEventCount?: number;
  auditHistory?: any[];
  associatedFIRs?: string[];
  accessClassification?: string;
  createdAt?: string;
  updatedAt?: string;
}
