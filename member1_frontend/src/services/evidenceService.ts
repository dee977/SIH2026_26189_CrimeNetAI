import { apiRequest } from './apiClient';
import { EvidenceRecord, CrossVerificationDiscrepancy } from '../types/evidence';
import { SYNTHETIC_EVIDENCE_RECORDS, SYNTHETIC_DISCREPANCIES } from '../data/syntheticData';

export async function fetchEvidenceList(caseId: string = 'CASE-2024-MH-092') {
  return apiRequest<EvidenceRecord[]>(
    `/evidence?case_id=${caseId}`,
    { method: 'GET' },
    SYNTHETIC_EVIDENCE_RECORDS
  );
}

export async function verifyEvidenceSHA256(evidenceId: string) {
  const matchEvidence = SYNTHETIC_EVIDENCE_RECORDS.find(e => e.id === evidenceId) || SYNTHETIC_EVIDENCE_RECORDS[0];
  
  return apiRequest<{
    evidenceId: string;
    originalHash: string;
    currentHash: string;
    status: 'MATCH' | 'MISMATCH';
    verifiedAt: string;
  }>(
    `/evidence/${evidenceId}/verify-hash`,
    { method: 'POST' },
    {
      evidenceId: matchEvidence.id,
      originalHash: matchEvidence.originalHashSHA256,
      currentHash: matchEvidence.currentHashSHA256,
      status: matchEvidence.integrityStatus === 'MATCH' ? 'MATCH' : 'MISMATCH',
      verifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    }
  );
}

export async function fetchDiscrepancies(caseId: string = 'CASE-2024-MH-092') {
  return apiRequest<CrossVerificationDiscrepancy[]>(
    `/verification/discrepancies?case_id=${caseId}`,
    { method: 'GET' },
    SYNTHETIC_DISCREPANCIES
  );
}
