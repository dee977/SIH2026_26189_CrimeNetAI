"""
Cross-Member Integration Contracts for Member 4 (AI/NLP/OCR/ER).

- M1 (Frontend): Receives structured inspection, NER, ER candidate, and RAG citations payloads.
- M2 (Backend): Orchestrates M4 pure-Python services without M4 implementing FastAPI servers.
- M3 (Graph/Neo4j): Supplies graph nodes/edges/paths via GraphDataProvider protocol without M4 implementing Neo4j importers.
- M5 (Graph Analytics): Supplies optional centrality/community context when required without M4 implementing PageRank/Louvain.
- M6 (Security/Authorization): Supplies AuthorizationContext; M4 strictly enforces this boundary and never bypasses it.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Dict, List, Optional, Protocol, Set

from .schemas import UNAVAILABLE


@dataclass
class AuthorizationContext:
    """
    Authorization context supplied by M6 / M2 Backend.
    M4 consumes this context to filter documents, entities, graph nodes/edges, and evidence.
    M4 never bypasses authorization.
    """

    user_id: str
    role: str
    authorized_case_ids: Set[str] = field(default_factory=set)
    authorized_evidence_ids: Optional[Set[str]] = None  # None means all evidence within authorized cases
    authorized_document_ids: Optional[Set[str]] = None
    allow_cross_case_resolution: bool = False
    is_authenticated: bool = True

    def can_access_case(self, case_id: str) -> bool:
        if not self.is_authenticated or not self.user_id:
            return False
        if not case_id or case_id == UNAVAILABLE:
            # Unassigned case records require explicit wildcard "*" or cross-case access
            return "*" in self.authorized_case_ids or self.allow_cross_case_resolution
        if "*" in self.authorized_case_ids:
            return True
        return case_id in self.authorized_case_ids

    def can_access_evidence(self, case_id: str, evidence_id: str) -> bool:
        if not self.can_access_case(case_id):
            return False
        if self.authorized_evidence_ids is None or "*" in self.authorized_evidence_ids:
            return True
        if evidence_id == UNAVAILABLE:
            return True
        return evidence_id in self.authorized_evidence_ids

    def can_access_document(self, case_id: str, document_id: str, evidence_id: str = UNAVAILABLE) -> bool:
        if not self.can_access_evidence(case_id, evidence_id):
            return False
        if self.authorized_document_ids is None or "*" in self.authorized_document_ids:
            return True
        return document_id in self.authorized_document_ids


class AuthorizationViolationError(PermissionError):
    """Raised when an AI/RAG or extraction request attempts to bypass M6 authorization."""


class GraphDataProvider(Protocol):
    """
    M3 Graph Data Provider Contract.
    Implemented by M3 / M2 adapter to allow M4's RAG Investigation Assistant
    to query Neo4j graph structures without M4 implementing Neo4j drivers or importers.
    """

    def get_entity_neighborhood(
        self, entity_id_or_name: str, authorized_cases: Set[str]
    ) -> List[Dict[str, Any]]:
        ...

    def find_shortest_path(
        self,
        source_id_or_name: str,
        target_id_or_name: str,
        authorized_cases: Set[str],
        relationship_filter: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        ...


@dataclass
class M3GraphPayloadContract:
    """
    Standardized graph-ready payload produced by M4 for M3's Neo4j importer.
    M4 never imports directly into Neo4j; it emits this contract to M2/M3.
    """

    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    document_id: str
    case_id: str = UNAVAILABLE
    evidence_id: str = UNAVAILABLE

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class M5AnalyticsContext:
    """
    Optional read-only graph analytics context supplied by M5 when required.
    M4 never computes PageRank, Louvain, or anomaly scores itself.
    """

    community_assignments: Dict[str, str] = field(default_factory=dict)
    structural_bridge_entities: List[str] = field(default_factory=list)
    temporal_burst_timestamps: List[str] = field(default_factory=list)
