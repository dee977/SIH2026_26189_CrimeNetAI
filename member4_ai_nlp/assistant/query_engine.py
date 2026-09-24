"""
Investigative Query Intent Classifier & Graph/Timeline Path Engine for Member 4 RAG Assistant.

Supports all 8 core investigative question archetypes:
1. How is Person A connected to FIR-10234? (ENTITY_TO_FIR_CONNECTION)
2. What relationships does Person A have? (ENTITY_RELATIONSHIPS)
3. What happened before an event? (TEMPORAL_BEFORE)
4. What happened after an event? (TEMPORAL_AFTER)
5. Which evidence supports this relationship? (EVIDENCE_SUPPORT)
6. Which sources mention this person? (SOURCE_MENTIONS)
7. What communications connect these entities? (COMMUNICATION_PATH)
8. What transaction path exists? (TRANSACTION_PATH)
"""

from __future__ import annotations

from collections import deque
import re
from typing import Any, Dict, List, Optional, Set, Tuple

from ..contracts.schemas import (
    UNAVAILABLE,
    ExtractedEntity,
    ExtractedRelationship,
    GraphRelationshipType,
)
from ..nlp.multilingual import transliterate_devanagari_to_latin


class QueryIntent:
    ENTITY_TO_FIR_CONNECTION = "ENTITY_TO_FIR_CONNECTION"
    ENTITY_RELATIONSHIPS = "ENTITY_RELATIONSHIPS"
    TEMPORAL_BEFORE = "TEMPORAL_BEFORE"
    TEMPORAL_AFTER = "TEMPORAL_AFTER"
    EVIDENCE_SUPPORT = "EVIDENCE_SUPPORT"
    SOURCE_MENTIONS = "SOURCE_MENTIONS"
    COMMUNICATION_PATH = "COMMUNICATION_PATH"
    TRANSACTION_PATH = "TRANSACTION_PATH"
    LEGAL_CONCLUSION_GUARDRAIL = "LEGAL_CONCLUSION_GUARDRAIL"
    GENERAL_EVIDENCE_LOOKUP = "GENERAL_EVIDENCE_LOOKUP"


LEGAL_CONCLUSION_TRIGGERS = re.compile(
    r"\b(is\s+.*\s+guilty|declare\s+.*\s+guilty|convict|sentence\s+to\s+prison|"
    r"final\s+verdict|is\s+.*\s+a\s+criminal|criminal\s+probability|risk\s+score)\b",
    re.IGNORECASE,
)


def classify_query_intent(query: str) -> str:
    """Classify an investigator's natural-language question into a deterministic RAG intent."""
    q = (query or "").strip()
    if LEGAL_CONCLUSION_TRIGGERS.search(q):
        return QueryIntent.LEGAL_CONCLUSION_GUARDRAIL

    q_low = q.lower()
    if "transaction" in q_low or "transfer" in q_low or "money" in q_low or "funds" in q_low or "account" in q_low:
        return QueryIntent.TRANSACTION_PATH
    if "communication" in q_low or "call" in q_low or "cdr" in q_low or "phone" in q_low or "contact" in q_low:
        return QueryIntent.COMMUNICATION_PATH
    if "before" in q_low or "prior to" in q_low or "preceding" in q_low:
        return QueryIntent.TEMPORAL_BEFORE
    if "after" in q_low or "following" in q_low or "subsequent to" in q_low:
        return QueryIntent.TEMPORAL_AFTER
    if ("which evidence" in q_low or "what evidence" in q_low or "supports this relationship" in q_low or "evidence support" in q_low):
        return QueryIntent.EVIDENCE_SUPPORT
    if "which sources" in q_low or "what sources" in q_low or "mention" in q_low or "where is" in q_low:
        return QueryIntent.SOURCE_MENTIONS
    if "fir" in q_low and ("connect" in q_low or "how is" in q_low or "linked" in q_low):
        return QueryIntent.ENTITY_TO_FIR_CONNECTION
    if "relationship" in q_low or "connected" in q_low or "connections" in q_low or "associates" in q_low:
        return QueryIntent.ENTITY_RELATIONSHIPS
    return QueryIntent.GENERAL_EVIDENCE_LOOKUP


def find_evidence_graph_path(
    relationships: List[ExtractedRelationship],
    start_query: str,
    target_query: Optional[str] = None,
    allowed_rel_types: Optional[Set[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Breadth-First Search over evidence-backed relationships to reconstruct a multi-hop
    graph path (e.g., Person A -> Phone -> Phone -> FIR-10234, or Bank Account A -> Account B).
    Every hop includes its supporting source, evidence ID, timestamp, and confidence.
    """
    filtered_rels = [
        r
        for r in relationships
        if (allowed_rel_types is None or r.relationship in allowed_rel_types)
    ]
    if not filtered_rels:
        return []

    start_norm = transliterate_devanagari_to_latin(start_query).lower().strip()
    target_norm = transliterate_devanagari_to_latin(target_query).lower().strip() if target_query else None

    # Build adjacency list indexed by normalized entity value
    adj: Dict[str, List[Tuple[str, ExtractedRelationship, str]]] = {}
    all_nodes: Set[str] = set()
    for rel in filtered_rels:
        u = rel.source_entity_value.strip()
        v = rel.target_entity_value.strip()
        u_low = transliterate_devanagari_to_latin(u).lower()
        v_low = transliterate_devanagari_to_latin(v).lower()
        all_nodes.add(u_low)
        all_nodes.add(v_low)
        adj.setdefault(u_low, []).append((v_low, rel, "FORWARD"))
        adj.setdefault(v_low, []).append((u_low, rel, "REVERSE"))

    # Match start and target nodes by substring/normalized equivalence
    start_candidates = [n for n in all_nodes if start_norm in n or n in start_norm] if start_norm else list(all_nodes)
    if not start_candidates:
        return []

    if target_norm:
        target_candidates = {n for n in all_nodes if target_norm in n or n in target_norm}
    else:
        target_candidates = set()

    # If no specific target is requested (e.g., "What transaction path exists?"), return all edges matching filter
    if not target_candidates:
        path_steps: List[Dict[str, Any]] = []
        for rel in filtered_rels:
            u_low = transliterate_devanagari_to_latin(rel.source_entity_value).lower()
            v_low = transliterate_devanagari_to_latin(rel.target_entity_value).lower()
            if not start_norm or (start_norm in u_low or start_norm in v_low):
                path_steps.append(
                    {
                        "source_node": rel.source_entity_value,
                        "relationship": rel.relationship,
                        "target_node": rel.target_entity_value,
                        "supporting_source": rel.source,
                        "evidence_id": rel.evidence,
                        "case_id": rel.case,
                        "timestamp": rel.timestamp,
                        "confidence": rel.confidence,
                    }
                )
        return path_steps

    # BFS shortest path from start_candidates to target_candidates
    queue: deque[Tuple[str, List[Dict[str, Any]]]] = deque(
        (sc, []) for sc in start_candidates
    )
    visited: Set[str] = set(start_candidates)

    while queue:
        curr, path = queue.popleft()
        if curr in target_candidates and path:
            return path
        for neighbor, rel, direction in adj.get(curr, []):
            if neighbor not in visited:
                visited.add(neighbor)
                step = {
                    "source_node": rel.source_entity_value if direction == "FORWARD" else rel.target_entity_value,
                    "relationship": rel.relationship,
                    "target_node": rel.target_entity_value if direction == "FORWARD" else rel.source_entity_value,
                    "direction": direction,
                    "supporting_source": rel.source,
                    "evidence_id": rel.evidence,
                    "case_id": rel.case,
                    "timestamp": rel.timestamp,
                    "confidence": rel.confidence,
                }
                queue.append((neighbor, path + [step]))

    return []
