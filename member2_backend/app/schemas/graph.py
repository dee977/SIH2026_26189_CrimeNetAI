from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    source: str = 'M3_GRAPH_DATA'
    caseId: Optional[str] = None
    evidenceId: Optional[str] = None
    confidence: Optional[float] = 0.95

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationshipType: str
    properties: Dict[str, Any] = Field(default_factory=dict)
    timestamp: Optional[str] = None
    sourceDoc: Optional[str] = None
    caseId: Optional[str] = None
    evidenceId: Optional[str] = None
    confidence: Optional[float] = 0.90

class GraphDataResponse(BaseModel):
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)
    totalNodes: int = 0
    totalEdges: int = 0

class NeighborhoodExpansionRequest(BaseModel):
    nodeId: str
    hops: int = Field(default=1, ge=1, le=5)
    relationshipTypes: Optional[List[str]] = None
    entityTypes: Optional[List[str]] = None
    fromDate: Optional[str] = None
    toDate: Optional[str] = None
    caseId: Optional[str] = None

class RelationshipRetrievalRequest(BaseModel):
    sourceNodeId: str
    targetNodeId: Optional[str] = None
    relationshipTypes: Optional[List[str]] = None
    caseId: Optional[str] = None

class SubgraphRetrievalRequest(BaseModel):
    nodeIds: List[str]
    includeInterconnections: bool = True
    caseId: Optional[str] = None

class ShortestPathRequest(BaseModel):
    sourceNodeId: str
    targetNodeId: str
    maxDepth: int = Field(default=10, ge=1, le=20)
    allowedRelationshipTypes: Optional[List[str]] = None

class MultiHopSearchRequest(BaseModel):
    startNodeId: str
    targetNodeType: str
    maxHops: int = Field(default=6, ge=1, le=10)
    filters: Optional[Dict[str, Any]] = None

class GraphFilterRequest(BaseModel):
    entityTypes: Optional[List[str]] = None
    relationshipTypes: Optional[List[str]] = None
    sources: Optional[List[str]] = None
    fromDate: Optional[str] = None
    toDate: Optional[str] = None
    caseId: Optional[str] = None
    minConfidence: Optional[float] = 0.0
