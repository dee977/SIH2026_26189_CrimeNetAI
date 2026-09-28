import { apiRequest } from './apiClient';
import { AnyEntity, EntityType } from '../types/entities';

export async function fetchEntities(caseId: string, typeFilter?: EntityType | string) {
  const endpoint = `/entities?case_id=${encodeURIComponent(caseId)}${typeFilter && typeFilter !== 'ALL' ? `&type=${typeFilter}` : ''}`;
  return apiRequest<AnyEntity[]>(endpoint, { method: 'GET' });
}

export async function fetchEntityById(id: string, caseId: string) {
  return apiRequest<AnyEntity>(`/entities/${encodeURIComponent(id)}?case_id=${encodeURIComponent(caseId)}`, { method: 'GET' });
}

export async function searchEntities(query: string, caseId: string, filters?: { type?: string; location?: string }) {
  const payload = {
    query: query,
    filters: {
      entityTypes: filters?.type && filters.type !== 'ALL' ? [filters.type] : undefined,
      location: filters?.location,
      caseId: caseId
    },
    limit: 50,
    offset: 0
  };

  return apiRequest<any>(`/search`, { 
    method: 'POST',
    body: JSON.stringify(payload)
  }).then(res => {
    // The backend returns { success, data: { results: [] } }
    if (res.success && res.data && res.data.results) {
      // Map SearchResultItem to AnyEntity structure
      const mapped = res.data.results.map((r: any) => ({
        id: r.entityId,
        type: r.entityType,
        label: r.name,
        source: r.source,
        caseIds: [r.caseReference].filter(Boolean),
        firstObserved: r.metadata?.firstObserved || undefined,
        metadata: r.metadata || {}
      }));
      return { success: true, data: mapped };
    }
    return { success: false, data: [] };
  });
}
