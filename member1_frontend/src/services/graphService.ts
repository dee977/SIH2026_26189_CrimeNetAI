import { apiRequest } from './apiClient';
import { NetworkGraphData, HiddenPathResult, CommunityDetectionResult } from '../types/graph';
import { 
  GRAPH_NODES, 
  GRAPH_EDGES, 
  SYNTHETIC_HIDDEN_PATH, 
  SYNTHETIC_COMMUNITIES 
} from '../data/syntheticData';

export async function fetchGraphData(caseId: string = 'CASE-2024-MH-092') {
  const fallback: NetworkGraphData = {
    nodes: GRAPH_NODES,
    edges: GRAPH_EDGES,
    summary: {
      totalNodes: GRAPH_NODES.length,
      totalEdges: GRAPH_EDGES.length,
      density: 0.18,
      connectedComponentsCount: 1,
      dominantCommunityId: 1
    }
  };

  return apiRequest<NetworkGraphData>(`/graph?case_id=${caseId}`, { method: 'GET' }, fallback);
}

export async function fetchHiddenPaths(startEntityId: string, targetEntityId: string) {
  return apiRequest<HiddenPathResult>(
    `/graph/hidden-path?source=${startEntityId}&target=${targetEntityId}`,
    { method: 'GET' },
    SYNTHETIC_HIDDEN_PATH
  );
}

export async function fetchCommunities(caseId: string = 'CASE-2024-MH-092') {
  return apiRequest<CommunityDetectionResult[]>(
    `/graph/communities?case_id=${caseId}`,
    { method: 'GET' },
    SYNTHETIC_COMMUNITIES
  );
}
