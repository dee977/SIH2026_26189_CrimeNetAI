import { apiRequest } from './apiClient';
import { GroundedAIResponse, SYNTHETIC_AI_KNOWLEDGE_BASE } from '../data/syntheticData';

export async function askGroundedAssistant(query: string, caseId: string = 'CASE-2024-MH-092') {
  const qNorm = query.toLowerCase();

  // Find best match in knowledge base
  let fallback = SYNTHETIC_AI_KNOWLEDGE_BASE.find(item => 
    qNorm.includes('vikram') || qNorm.includes('bluesea') || qNorm.includes('8841')
  );

  if (qNorm.includes('discrepancy') || qNorm.includes('alibi') || qNorm.includes('contradiction')) {
    fallback = SYNTHETIC_AI_KNOWLEDGE_BASE[1];
  }

  // If completely unrelated query not supported by current evidence
  if (!fallback) {
    fallback = {
      query,
      answer: 'UNSUPPORTED BY EVIDENCE: No corroborating documentary, telecom, or banking records were found in the current case repository for this inquiry. As an investigator-support system, CrimeNet AI will not generate speculative assertions without factual evidentiary backing.',
      relevantEntities: [],
      graphPath: [],
      sourceRecords: [],
      supportingEvidence: [],
      confidenceContext: 'Zero Corroboration: Query references entities not currently linked in active case evidence.',
      caseReferences: [caseId]
    };
  }

  return apiRequest<GroundedAIResponse>(
    '/assistant/query',
    {
      method: 'POST',
      body: JSON.stringify({ query, case_id: caseId })
    },
    fallback
  );
}
