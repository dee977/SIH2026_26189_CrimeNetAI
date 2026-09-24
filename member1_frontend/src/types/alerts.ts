export type AlertCategory = 
  | 'Watchlist Match'
  | 'Anomaly Detected'
  | 'Cross-source Contradiction'
  | 'New Relationship'
  | 'Evidence Integrity Mismatch'
  | 'New Communication Pattern'
  | 'Unusual Transaction Pattern'
  | 'New Relevant Case Connection';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFORMATIONAL';

export interface AlertItem {
  id: string;
  caseId?: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  explanation: string;
  source: string;
  sourceRecordId?: string;
  timestamp: string;
  isReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  linkedEntities: {
    id: string;
    label: string;
    type: string;
  }[];
  history: {
    timestamp: string;
    action: string;
    performedBy: string;
  }[];
}

export interface WatchlistEntry {
  id: string;
  entryType: 'Person' | 'Phone' | 'BankAccount' | 'Alias' | 'Organization';
  value: string;
  targetName?: string;
  reasonForMonitoring: string;
  addedByOfficer: string;
  addedAt: string;
  caseReference: string;
  matchCount: number;
  lastMatchedAt?: string;
  status: 'ACTIVE' | 'ARCHIVED';
}
