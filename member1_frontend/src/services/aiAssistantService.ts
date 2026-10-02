import { apiRequest } from './apiClient';
import { GroundedAIResponse } from '../types/ai';

export async function askGroundedAssistant(query: string, caseId?: string) {
  const targetCase = caseId || '';
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

