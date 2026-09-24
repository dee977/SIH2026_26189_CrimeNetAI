import { apiRequest } from './apiClient';
import { AnyEntity, EntityType } from '../types/entities';
import { ALL_ENTITIES, PERSON_VIKRAM_MALHOTRA } from '../data/syntheticData';

export async function fetchEntities(typeFilter?: EntityType) {
  const fallback = typeFilter 
    ? ALL_ENTITIES.filter(e => e.type === typeFilter)
    : ALL_ENTITIES;

  const endpoint = typeFilter ? `/entities?type=${typeFilter}` : '/entities';
  return apiRequest<AnyEntity[]>(endpoint, { method: 'GET' }, fallback);
}

export async function fetchEntityById(id: string) {
  const fallback = ALL_ENTITIES.find(e => e.id === id) || PERSON_VIKRAM_MALHOTRA;
  return apiRequest<AnyEntity>(`/entities/${id}`, { method: 'GET' }, fallback);
}

export async function searchEntities(query: string, filters?: { type?: string; location?: string }) {
  const qLower = query.toLowerCase();
  let fallback = ALL_ENTITIES.filter(e => {
    const matchLabel = e.label.toLowerCase().includes(qLower);
    const matchId = e.id.toLowerCase().includes(qLower);
    const matchSource = e.source.toLowerCase().includes(qLower);
    
    // Check aliases if Person
    const matchAlias = e.type === 'Person' && (e as any).aliases?.some((a: string) => a.toLowerCase().includes(qLower));

    return matchLabel || matchId || matchSource || matchAlias;
  });

  if (filters?.type && filters.type !== 'ALL') {
    fallback = fallback.filter(e => e.type === filters.type);
  }

  return apiRequest<AnyEntity[]>(`/search?q=${encodeURIComponent(query)}`, { method: 'GET' }, fallback);
}
