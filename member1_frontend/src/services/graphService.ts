import { apiRequest } from './apiClient';
import { NetworkGraphData, HiddenPathResult, CommunityDetectionResult } from '../types/graph';

export async function fetchGraphData(caseId: string = 'CASE-2025-M3-DATASET') {
  return apiRequest<NetworkGraphData>(`/graph?case_id=${encodeURIComponent(caseId)}`, { method: 'GET' });
}

export async function fetchHiddenPaths(startEntityId: string, targetEntityId: string, caseId: string = 'CASE-2025-M3-DATASET') {
  return apiRequest<HiddenPathResult>(
    `/graph/hidden-path?source=${encodeURIComponent(startEntityId)}&target=${encodeURIComponent(targetEntityId)}&case_id=${encodeURIComponent(caseId)}`,
    { method: 'GET' }
  );
}

export async function fetchCommunities(caseId: string = 'CASE-2025-M3-DATASET') {
  return apiRequest<CommunityDetectionResult[]>(
    `/graph/communities?case_id=${encodeURIComponent(caseId)}`,
    { method: 'GET' }
  );
}
