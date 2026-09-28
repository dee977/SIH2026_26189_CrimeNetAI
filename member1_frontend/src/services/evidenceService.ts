import { apiRequest } from './apiClient';
import { EvidenceRecord, CrossVerificationDiscrepancy } from '../types/evidence';

export async function fetchEvidenceList(caseId: string) {
  const targetCase = caseId || 'CASE-2025-M3-DATASET';
  const res = await apiRequest<any>(
    `/evidence?case_id=${targetCase}`,
    { method: 'GET' }
  );
  if (res.success && res.data) {
    const list = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data.items) ? res.data.items : []);
    return { ...res, data: list as EvidenceRecord[] };
  }
  return { ...res, data: [] as EvidenceRecord[] };
}

export async function verifyEvidenceSHA256(evidenceId: string) {
  return apiRequest<{
    evidenceId: string;
    originalHash: string;
    currentHash: string;
    storedHash?: string;
    calculatedHash?: string;
    status: 'MATCH' | 'MISMATCH';
    isMatch?: boolean;
    verifiedAt: string;
    verificationTimestamp?: string;
    bsaCertificateId?: string;
  }>(
    `/evidence/${evidenceId}/verify-hash`,
    { method: 'POST' }
  );
}

export async function fetchDiscrepancies(caseId: string) {
  const targetCase = caseId || 'CASE-2025-M3-DATASET';
  const res = await apiRequest<any>(
    `/verification/discrepancies?case_id=${targetCase}`,
    { method: 'GET' }
  );
  if (res.success && res.data) {
    const list = Array.isArray(res.data)
      ? res.data
      : (Array.isArray(res.data.items) ? res.data.items : []);
    return { ...res, data: list as CrossVerificationDiscrepancy[] };
  }
  return { ...res, data: [] as CrossVerificationDiscrepancy[] };
}

