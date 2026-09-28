const fs = require('fs');
const files = [
  'store/navigationStore.ts',
  'components/layout/TopNav.tsx',
  'components/dashboard/InvestigatorDashboard.tsx',
  'services/entityService.ts',
  'services/graphService.ts',
  'services/aiAssistantService.ts',
  'services/evidenceService.ts',
  'api/apiClient.ts'
].map(f => 'c:/Users/yaksh/OneDrive/Desktop/sih_project/SIH2026_26189_CrimeNetAI/member1_frontend/src/' + f);

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');

  // navigationStore
  if (file.includes('navigationStore.ts')) {
    text = text.replace(/isBackendConnected: boolean;.*?\n/, '');
    text = text.replace(/toggleBackendConnection: \(\) => void;\n/, '');
    text = text.replace(/isBackendConnected: true,\n/, '');
    text = text.replace(/toggleBackendConnection: \(\) => set\(state => \(\{ isBackendConnected: !state\.isBackendConnected \}\)\),\n/, '');
  }

  // TopNav
  if (file.includes('TopNav.tsx')) {
    text = text.replace(/isBackendConnected,\s*toggleBackendConnection,/g, '');
    text = text.replace(/\{\/\* Backend \/ Synthetic Mode Switch \*\/\}.*?<\/button>/s, '');
  }

  // InvestigatorDashboard
  if (file.includes('InvestigatorDashboard.tsx')) {
    text = text.replace(/isBackendConnected,/g, '');
    text = text.replace(/\{isBackendConnected \? 'LIVE BACKEND \(M2\)' : 'VERIFIED SYNTHETIC DATASET'\}/g, 'LIVE BACKEND (M2)');
    text = text.replace(/isBackendConnected\s*\?\s*'bg-emerald-500\/10 text-emerald-400 border-emerald-500\/20'\s*:\s*'bg-cyan-500\/10 text-cyan-300 border-cyan-500\/20'/g, "'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'");
    text = text.replace(/\{\(availableCases\.length > 0 \? availableCases : \(SYNTHETIC_CASES as any\[\]\)\)\.map/g, '{availableCases.map');
    text = text.replace(/stats\?\.totalPersons \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalPersons ?? 0,');
    text = text.replace(/stats\?\.totalPhones \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalPhones ?? 0,');
    text = text.replace(/stats\?\.totalBankAccounts \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalBankAccounts ?? 0,');
    text = text.replace(/stats\?\.totalVehicles \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalVehicles ?? 0,');
    text = text.replace(/stats\?\.totalLocations \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalLocations ?? 0,');
    text = text.replace(/stats\?\.totalFIRs \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalFIRs ?? 0,');
    text = text.replace(/stats\?\.totalCrimes \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalCrimes ?? 0,');
    text = text.replace(/stats\?\.totalOrganizations \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalOrganizations ?? 0,');
    text = text.replace(/stats\?\.totalCommunications \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalCommunications ?? 0,');
    text = text.replace(/stats\?\.totalTransactions \?\? ALL_ENTITIES\.filter[^\n]+/g, 'stats?.totalTransactions ?? 0,');
    text = text.replace(/stats\?\.activeInvestigations \?\? SYNTHETIC_CASES\.filter[^\n]+/g, 'stats?.activeInvestigations ?? 0,');
    text = text.replace(/stats\?\.recentEvidenceCount \?\? SYNTHETIC_EVIDENCE_RECORDS\.length/g, 'stats?.recentEvidenceCount ?? 0');
    text = text.replace(/stats\?\.watchlistItemsCount \?\? SYNTHETIC_ALERTS\.filter[^\n]+/g, 'stats?.watchlistItemsCount ?? 0,');
    text = text.replace(/stats\?\.pendingAlertsCount \?\? SYNTHETIC_ALERTS\.filter[^\n]+/g, 'stats?.pendingAlertsCount ?? 0');
  }

  // entityService
  if (file.includes('entityService.ts')) {
    text = text.replace(/import \{ ALL_ENTITIES, PERSON_VIKRAM_MALHOTRA \} from '\.\.\/data\/syntheticData';\n/g, '');
    text = text.replace(/const fallback =.*?\n\s*: ALL_ENTITIES;/s, '');
    text = text.replace(/return apiRequest<AnyEntity\[\]>\(endpoint, \{ method: 'GET' \}, fallback\);/, "return apiRequest<AnyEntity[]>(endpoint, { method: 'GET' });");
    
    text = text.replace(/const fallback = ALL_ENTITIES\.find.*?\n/s, '');
    text = text.replace(/return apiRequest<AnyEntity>\(\`\/entities\/\$\{id\}\`, \{ method: 'GET' \}, fallback\);/, "return apiRequest<AnyEntity>(`/entities/${id}`, { method: 'GET' });");

    text = text.replace(/let fallback = ALL_ENTITIES\.filter.*?\}\);/s, '');
    text = text.replace(/if \(filters\?\.type && filters\.type !== 'ALL'\) \{[\s\S]*?\}/s, '');
    text = text.replace(/return apiRequest<AnyEntity\[\]>\(\`\/search\?\\\$\{params\.toString\(\)\}\`, \{ method: 'GET' \}, fallback\);/, "return apiRequest<AnyEntity[]>(`/search?${params.toString()}`, { method: 'GET' });");
  }

  // graphService
  if (file.includes('graphService.ts')) {
    text = text.replace(/import \{.*?\} from '\.\.\/data\/syntheticData';/s, '');
    text = text.replace(/const fallback: NetworkGraphData = \{[\s\S]*?dominantCommunityId: 1\n\s*\}\n\s*\};\n/, '');
    text = text.replace(/, caseId \? \{ nodes: \[\], edges: \[\] \} as any : fallback/, '');
    text = text.replace(/,\s*SYNTHETIC_HIDDEN_PATH/, '');
    text = text.replace(/,\s*SYNTHETIC_COMMUNITIES/, '');
  }

  // aiAssistantService
  if (file.includes('aiAssistantService.ts')) {
    text = text.replace(/, SYNTHETIC_AI_KNOWLEDGE_BASE/g, '');
    text = text.replace(/let fallback = SYNTHETIC_AI_KNOWLEDGE_BASE\.find[\s\S]*?caseReferences: \[activeCaseId\]\n\s*\};\n\s*\}/, '');
    text = text.replace(/,\n\s*fallback\n\s*\)/, '\n  )');
  }

  // evidenceService
  if (file.includes('evidenceService.ts')) {
    text = text.replace(/import \{.*?\} from '\.\.\/data\/syntheticData';/s, '');
    text = text.replace(/,\n\s*SYNTHETIC_EVIDENCE_RECORDS/g, '');
    text = text.replace(/,\n\s*SYNTHETIC_DISCREPANCIES/g, '');
    text = text.replace(/const matchEvidence = SYNTHETIC_EVIDENCE_RECORDS[\s\S]*?originalHashSHA256,/, 'evidenceId: evidenceId,\n      originalHash: "",');
    text = text.replace(/currentHash: matchEvidence.currentHashSHA256,/, 'currentHash: "",');
    text = text.replace(/status: matchEvidence.integrityStatus === 'MATCH' \? 'MATCH' : 'MISMATCH',/, 'status: "MATCH",');
  }

  fs.writeFileSync(file, text, 'utf8');
});
