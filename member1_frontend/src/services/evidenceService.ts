import { apiRequest } from './apiClient';
import { EvidenceRecord, CrossVerificationDiscrepancy } from '../types/evidence';

export async function fetchEvidenceList(caseId: string) {
  const targetCase = caseId || '';
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

export async function fetchEvidenceById(evidenceId: string) {
  return apiRequest<EvidenceRecord>(
    `/evidence/${encodeURIComponent(evidenceId)}`,
    { method: 'GET' }
  );
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
  const targetCase = caseId || '';
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

export interface EntitySourceDocument {
  id: string;
  evidenceId: string;
  documentId: string;
  fileName: string;
  title: string;
  fileType: string;
  category: string;
  description?: string;
  sha256Hash: string;
  uploadedAt?: string;
  uploader?: string;
  custodian?: string;
  bsaCertificateId?: string;
  fileSizeBytes?: number;
  storageUrl?: string;
  previewUrl?: string;
  relationship?: string;
  confidence?: number;
  caseId?: string;
  isFir?: boolean;
  firDetails?: Record<string, any>;
}

export async function fetchEntityDocuments(entityId: string, caseId?: string) {
  const query = caseId ? `?case_id=${encodeURIComponent(caseId)}` : '';
  return apiRequest<EntitySourceDocument[]>(
    `/entities/${encodeURIComponent(entityId)}/documents${query}`,
    { method: 'GET' }
  );
}

export async function downloadBsaSection63CertificatePdf(caseId: string, discrepancyId?: string, evidenceId?: string): Promise<Blob> {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('crimenet_auth_token') : null;

  const queryParams = new URLSearchParams();
  if (caseId) queryParams.set('caseId', caseId);
  if (discrepancyId) queryParams.set('discrepancyId', discrepancyId);
  if (evidenceId) queryParams.set('evidenceId', evidenceId);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');
  const baseClean = API_BASE_URL.replace(/\/+$/, '');
  const targetUrl = `${baseClean}/verification/certificate/pdf?${queryParams.toString()}`;

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to generate certificate PDF (${response.status})`);
  }

  return response.blob();
}


