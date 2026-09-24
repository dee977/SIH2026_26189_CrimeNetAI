export interface EvidenceRecord {
  id: string;
  evidenceCode: string; // e.g. EVD-2024-0812
  title: string;
  category: 'Digital Forensic Image' | 'CDR Dump' | 'Bank Statement' | 'Seized Physical Item' | 'CCTV Footage' | 'FIR Copy';
  caseId: string;
  caseTitle: string;
  seizureDate: string;
  seizingOfficer: string;
  custodian: string;
  fileSizeBytes: number;
  originalHashSHA256: string;
  currentHashSHA256: string;
  integrityStatus: 'MATCH' | 'MISMATCH' | 'PENDING_VERIFICATION';
  lastVerifiedAt: string;
  verifiedBy: string;
  chainOfCustody: {
    timestamp: string;
    action: string;
    officer: string;
    notes: string;
  }[];
  bsaSection63Certificate: {
    certificateId: string;
    issuer: string;
    hashAlgorithm: 'SHA-256';
    signedAt: string;
    status: 'VALID' | 'REVOKED';
  };
  associatedEntities: {
    entityId: string;
    entityType: string;
    label: string;
  }[];
  description: string;
}

export interface CrossVerificationDiscrepancy {
  id: string;
  caseId: string;
  title: string;
  status: 'DATA DISCREPANCY DETECTED' | 'VERIFIED_CONSISTENT' | 'UNDER_REVIEW';
  conflictingField: string;
  sourceA: {
    sourceName: string;
    documentRef: string;
    timestamp: string;
    recordedValue: string;
    excerpt: string;
  };
  sourceB: {
    sourceName: string;
    documentRef: string;
    timestamp: string;
    recordedValue: string;
    excerpt: string;
  };
  analyticalNotes: string;
  investigatorActions: string[];
}
