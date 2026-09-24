import { EntityType } from './entities';

export interface GraphNode {
  id: string;
  label: string;
  entityType: EntityType;
  entityId: string;
  degree?: number;
  // M5 Analytics results consumed via API
  analytics?: {
    degreeCentrality: number;
    betweennessCentrality: number;
    pagerank: number;
    communityId: number;
    isBridge: boolean;
    clusteringCoefficient: number;
    analyticalLeadNote?: string; // strictly an analytical lead note, NOT criminal label
  };
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: string;
  sourceDocument?: string;
  evidenceId?: string;
  timestamp?: string;
  confidence: number; // 0 to 1
  transactionAmount?: number;
  callDuration?: number;
  isMultiHopHighlight?: boolean;
}

export interface NetworkGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  summary: {
    totalNodes: number;
    totalEdges: number;
    density: number;
    connectedComponentsCount: number;
    dominantCommunityId: number;
  };
}

export interface HiddenPathSegment {
  fromNode: GraphNode;
  toNode: GraphNode;
  edge: GraphEdge;
}

export interface HiddenPathResult {
  pathId: string;
  pathLength: number;
  startEntity: { id: string; name: string; type: EntityType };
  targetEntity: { id: string; name: string; type: EntityType };
  nodes: GraphNode[];
  edges: GraphEdge[];
  explanation: string; // Factual path explanation
  supportingEvidenceIds: string[];
}

export interface CommunityDetectionResult {
  communityId: number;
  label: string;
  size: number;
  memberEntityIds: string[];
  dominantEntityTypes: EntityType[];
  interCommunityConnections: number;
  centralHubEntityId: string;
  analyticalSummary: string;
}
