"""
CrimeNet AI — Member 5: Graph Intelligence & Machine Learning
Models and Data Schemas

CRITICAL INTERPRETATION RULE:
No output must ever contain 'risk_score', 'risk_label', 'criminal = Yes',
or fake threat probability scores.
Use analytical terminology:
- Analytical Finding
- High-connectivity Entity
- Bridge/Intermediary Candidate
- Network Position
- Investigator Lead
- Anomaly Indicator
- Explanatory Signal
- Supporting Evidence
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class EvidenceReference(BaseModel):
    """Link back to underlying evidence source or document ledger."""
    evidence_id: str
    source_type: str = Field(..., description="e.g. FIR, CDR, BANK_STATEMENT, TOWER_LOG, VEHICLE_REGISTRY")
    document_ref: Optional[str] = None
    timestamp: Optional[str] = None
    extracted_snippet: Optional[str] = None


class GraphNode(BaseModel):
    """Graph Entity representing a person, phone, bank account, vehicle, location, or organization."""
    id: str
    name: str
    entity_type: str = Field(..., description="Person, PhoneNumber, BankAccount, Vehicle, Location, Organization, CrimeEvent")
    properties: Dict[str, Any] = Field(default_factory=dict)
    first_seen: Optional[str] = None
    last_seen: Optional[str] = None
    evidence_ids: List[str] = Field(default_factory=list)


class GraphEdge(BaseModel):
    """Relationship between two graph entities."""
    id: str
    source: str
    target: str
    relationship_type: str = Field(
        ...,
        description="CALLS, SENDS_FUNDS, ASSOCIATED_WITH, REGISTERED_TO, LOCATED_AT, OWNS, CO_ACCUSED"
    )
    timestamp: Optional[str] = None
    weight: float = 1.0
    properties: Dict[str, Any] = Field(default_factory=dict)
    evidence_ids: List[str] = Field(default_factory=list)


class NetworkData(BaseModel):
    """Standardized payload for network graph analysis received from M3 or constructed."""
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CentralityScore(BaseModel):
    """Centrality metrics for an individual entity."""
    entity_id: str
    entity_name: str
    entity_type: str
    degree_centrality: float = 0.0
    in_degree: int = 0
    out_degree: int = 0
    betweenness_centrality: float = 0.0
    pagerank: float = 0.0
    closeness_centrality: float = 0.0
    eigenvector_centrality: float = 0.0
    network_role: str = Field(
        ...,
        description="e.g. 'High-connectivity Entity', 'Bridge/Intermediary Candidate', 'Peripheral Node', 'Hub Node'"
    )
    investigator_lead: str
    supporting_evidence_ids: List[str] = Field(default_factory=list)


class NetworkMetrics(BaseModel):
    """Global topological metrics of the analyzed network."""
    total_nodes: int
    total_edges: int
    density: float
    is_connected: bool
    number_of_connected_components: int
    average_clustering_coefficient: float
    diameter: Optional[int] = None
    key_findings: List[str] = Field(default_factory=list)


class CommunityMember(BaseModel):
    entity_id: str
    entity_name: str
    entity_type: str
    network_role: Optional[str] = None


class Community(BaseModel):
    """Detected cluster or community in the network."""
    community_id: str
    label: str
    size: int
    members: List[CommunityMember]
    dominant_entity_types: Dict[str, int]
    inter_community_connections: Dict[str, int] = Field(
        default_factory=dict,
        description="Map of target_community_id -> count of cross-edges"
    )
    first_activity: Optional[str] = None
    last_activity: Optional[str] = None
    investigator_summary: str
    supporting_relationships: List[str] = Field(default_factory=list)


class PathStep(BaseModel):
    step_number: int
    from_entity_id: str
    from_entity_name: str
    from_entity_type: str
    relationship: str
    to_entity_id: str
    to_entity_name: str
    to_entity_type: str
    timestamp: Optional[str] = None
    evidence_ids: List[str] = Field(default_factory=list)


class MultiHopPath(BaseModel):
    """Discovered multi-hop path trace."""
    path_length: int
    hop_count: int
    source_entity: str
    target_entity: str
    steps: List[PathStep]
    human_readable_trace: str
    supporting_evidence: List[EvidenceReference] = Field(default_factory=list)


class IndirectConnection(BaseModel):
    """Hidden connection via shared intermediaries."""
    entity_a_id: str
    entity_a_name: str
    entity_b_id: str
    entity_b_name: str
    intermediary_id: str
    intermediary_name: str
    intermediary_type: str = Field(
        ...,
        description="e.g. Common Phone, Common Bank Account, Common Vehicle, Common Location, Common Organization"
    )
    relationship_a_to_intermediary: str
    relationship_b_to_intermediary: str
    analytical_finding: str
    investigator_lead: str
    supporting_evidence_ids: List[str] = Field(default_factory=list)


class AnomalyExplanation(BaseModel):
    """Explicit, explainable breakdown for every detected anomaly."""
    what_was_detected: str
    why_unusual: str
    contributing_records: List[str]
    time_period: str
    sources: List[str]
    supporting_relationships: List[str]
    supporting_evidence: List[EvidenceReference]


class AnomalyResult(BaseModel):
    """Analytical anomaly detected through rules or machine learning."""
    anomaly_id: str
    anomaly_type: str = Field(
        ...,
        description="e.g. SUDDEN_COMMUNICATION_BURST, CIRCULAR_TRANSACTION_LOOP, RAPID_TRANSACTION_SEQUENCE, UNUSUAL_CO_LOCATION, SUDDEN_NETWORK_FORMATION, CROSS_SOURCE_INCONSISTENCY"
    )
    detection_method: str = Field(..., description="RULE_BASED or ML_UNSUPERVISED")
    anomaly_indicator: str = Field(..., description="Categorical severity signal: HIGH_DEVIATION, MODERATE_DEVIATION, PATTERN_MATCH")
    involved_entities: List[str]
    explanation: AnomalyExplanation


class TemporalEvent(BaseModel):
    """Normalized temporal event for timeline and playback analysis."""
    event_id: str
    timestamp: str
    event_type: str = Field(..., description="COMMUNICATION, TRANSACTION, LOCATION_PING, CRIME_INCIDENT, ARREST")
    entity_source_id: str
    entity_target_id: Optional[str] = None
    description: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    evidence_ids: List[str] = Field(default_factory=list)


class TemporalBurst(BaseModel):
    """Identified activity spike or burst in a given time window."""
    time_window_start: str
    time_window_end: str
    event_count: int
    baseline_average: float
    deviation_factor: float
    participating_entities: List[str]
    dominant_event_type: str
    analytical_finding: str


class TemporalGraphSnapshot(BaseModel):
    """Network state at a discrete chronological interval for temporal playback."""
    timestamp: str
    step_index: int
    active_node_ids: List[str]
    newly_added_nodes: List[str]
    active_edge_ids: List[str]
    newly_added_edges: List[str]
    cumulative_node_count: int
    cumulative_edge_count: int
    summary_of_activity: str


class TemporalAnalysisResult(BaseModel):
    """Comprehensive temporal analysis output."""
    time_range_start: str
    time_range_end: str
    total_events: int
    timeline_by_type: Dict[str, int]
    bursts: List[TemporalBurst]
    before_after_crime_analysis: Optional[Dict[str, Any]] = None
    playback_snapshots: List[TemporalGraphSnapshot] = Field(default_factory=list)
    investigator_observations: List[str] = Field(default_factory=list)


class DiscrepancyClaim(BaseModel):
    source: str = Field(..., description="FIR, CDR, BANKING, TOWER_DUMP, WITNESS_STATEMENT")
    claim_description: str
    recorded_timestamp: Optional[str] = None
    location_or_value: Optional[str] = None
    document_ref: Optional[str] = None
    evidence_id: Optional[str] = None


class CrossVerificationResult(BaseModel):
    """Finding generated when multiple sources assert contradictory facts."""
    discrepancy_id: str
    entity_id: str
    entity_name: str
    discrepancy_type: str = Field(
        ...,
        description="LOCATION_MISMATCH, TIMESTAMP_MISMATCH, CONFLICTING_RELATIONSHIP, ALIBI_CONTRADICTION"
    )
    verification_state: str = "DATA DISCREPANCY DETECTED"
    claim_a: DiscrepancyClaim
    claim_b: DiscrepancyClaim
    difference_summary: str
    investigative_guidance: str = Field(
        ...,
        description="Guidance on reconciling the records without unilaterally claiming which record is true."
    )
    case_reference: Optional[str] = None


class NetworkAnalysisReport(BaseModel):
    """Integrated analytics report returned to M2."""
    analysis_timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    network_metrics: NetworkMetrics
    centrality_rankings: List[CentralityScore]
    top_intermediaries: List[CentralityScore]
    communities: List[Community]
    hidden_relationships: List[IndirectConnection]
    anomalies: List[AnomalyResult]
    discrepancies: List[CrossVerificationResult]
    temporal_summary: Optional[TemporalAnalysisResult] = None
    analytical_summary: List[str]
