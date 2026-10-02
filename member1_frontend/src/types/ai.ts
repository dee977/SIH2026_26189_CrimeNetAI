export interface GroundedAIResponse {
  query: string;
  answer: string;
  relevantEntities: { id: string; label: string; type: string }[];
  graphPath: string[];
  sourceRecords: { source: string; documentRef: string; excerpt: string }[];
  supportingEvidence: { evidenceId: string; title: string; sha256: string; status: string }[];
  confidenceContext: string;
  caseReferences: string[];
}