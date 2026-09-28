import { apiRequest } from './apiClient';
import { GroundedAIResponse } from '../data/syntheticData';

export async function askGroundedAssistant(query: string, caseId?: string) {
  const targetCase = caseId || 'CASE-2025-M3-DATASET';
  return apiRequest<GroundedAIResponse>(
    '/assistant/query',
    {
      method: 'POST',
      body: JSON.stringify({ 
        query,
        question: query,
        case_id: targetCase,
        caseId: targetCase
      })
    }
  );
}

