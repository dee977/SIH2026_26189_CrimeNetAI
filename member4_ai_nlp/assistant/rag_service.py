"""
Evidence-Grounded AI Investigation Assistant (RAG Service) for Member 4.

Connects AI retrieval to:
- Structured data (`StructuredExtractionOutput`)
- Neo4j graph (via M3 `GraphDataProvider` contract + local graph projection)
- Source documents (`OCRResult` / ingested text)
- Evidence metadata
- Case context

Strict Requirements:
1. Respects user authorization supplied through M6/backend (`AuthorizationContext`). Never bypasses authorization.
2. Every answer exposes:
   - Answer
   - Supporting Source
   - Supporting Evidence
   - Relevant Entities
   - Graph Path (where applicable)
   - Confidence/Context
   - Case references
3. Never returns unsupported claims, never fabricates a relationship, never invents evidence,
   never hides source information, never provides final legal conclusions, and never outputs risk_score.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Union

import numpy as np

from ..contracts.integration_contracts import (
    AuthorizationContext,
    AuthorizationViolationError,
    GraphDataProvider,
    M5AnalyticsContext,
)
from ..contracts.schemas import (
    UNAVAILABLE,
    AssistantResponse,
    ExplainabilityTrace,
    ExtractedEntity,
    ExtractedRelationship,
    GraphRelationshipType,
    OCRResult,
    StructuredExtractionOutput,
)
from ..explainability.explainer import validate_no_risk_score
from ..nlp.multilingual import transliterate_devanagari_to_latin
from .query_engine import QueryIntent, classify_query_intent, find_evidence_graph_path


class EvidenceGroundedRAGAssistant:
    """
    Evidence-grounded RAG service for CrimeNet AI (Member 4).
    Answers investigative queries strictly from authorized evidence and graph structures.
    """

    def __init__(
        self,
        graph_provider: Optional[GraphDataProvider] = None,
        m5_analytics_context: Optional[M5AnalyticsContext] = None,
    ) -> None:
        self.graph_provider = graph_provider
        self.m5_analytics_context = m5_analytics_context
        self._extractions: List[StructuredExtractionOutput] = []
        self._documents: Dict[str, OCRResult] = {}
        self._evidence_metadata: Dict[str, Dict[str, Any]] = {}

    def index_extraction(
        self,
        extraction: StructuredExtractionOutput,
        ocr_result: Optional[OCRResult] = None,
        evidence_metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Index a document's structured NLP output, source OCR document, and evidence metadata
        into the RAG knowledge base.
        """
        self._extractions.append(extraction)
        if ocr_result is not None:
            self._documents[ocr_result.document_id] = ocr_result
        if evidence_metadata and extraction.evidence_id != UNAVAILABLE:
            self._evidence_metadata[extraction.evidence_id] = evidence_metadata

    def _get_authorized_slice(
        self, auth_context: Optional[AuthorizationContext]
    ) -> List[StructuredExtractionOutput]:
        """
        Enforce M6 AuthorizationContext.
        Raises AuthorizationViolationError if `auth_context` is missing or unauthenticated.
        Filters indexed records strictly to authorized cases, evidence IDs, and documents.
        """
        if auth_context is None or not auth_context.is_authenticated or not auth_context.user_id:
            raise AuthorizationViolationError(
                "M6 AuthorizationContext is required and must be authenticated. "
                "M4 AI Assistant never bypasses user authorization."
            )

        authorized: List[StructuredExtractionOutput] = []
        for ext in self._extractions:
            if auth_context.can_access_document(
                case_id=ext.case_id,
                document_id=ext.document_id,
                evidence_id=ext.evidence_id,
            ):
                authorized.append(ext)
        return authorized

    def ask(
        self,
        query: str,
        auth_context: AuthorizationContext,
        case_filter: Optional[str] = None,
    ) -> AssistantResponse:
        """
        Execute an evidence-grounded RAG query against authorized structured data,
        source documents, evidence metadata, and graph paths.
        """
        authorized_extractions = self._get_authorized_slice(auth_context)
        if case_filter:
            if not auth_context.can_access_case(case_filter):
                raise AuthorizationViolationError(
                    f"User '{auth_context.user_id}' is not authorized to access case '{case_filter}'."
                )
            authorized_extractions = [
                e for e in authorized_extractions if e.case_id == case_filter
            ]

        intent = classify_query_intent(query)

        # Guardrail: Refuse final legal conclusions or criminal risk scoring requests
        if intent == QueryIntent.LEGAL_CONCLUSION_GUARDRAIL:
            response = AssistantResponse(
                query=query,
                answer=(
                    "GUARDRAIL REFUSAL: CrimeNet AI Assistant provides strictly evidence-grounded "
                    "factual and relational findings from authorized investigation records. "
                    "It does NOT generate final legal conclusions, determinations of guilt, "
                    "criminal probabilities, or risk scores."
                ),
                supporting_source=[],
                supporting_evidence=[],
                relevant_entities=[],
                graph_path=UNAVAILABLE,
                confidence_context={
                    "retrieval_confidence": UNAVAILABLE,
                    "intent": intent,
                    "reasoning": "Refused request for final legal conclusion / risk classification per M4 guardrails.",
                },
                case_references=[],
                explainability_traces=[],
                authorization_verified=True,
            )
            validate_no_risk_score(response.to_dict())
            return response

        # Flatten authorized entities and relationships
        all_entities: List[ExtractedEntity] = []
        all_relationships: List[ExtractedRelationship] = []
        for ext in authorized_extractions:
            all_entities.extend(ext.entities)
            all_relationships.extend(ext.relationships)

        if not all_entities and not all_relationships:
            return AssistantResponse(
                query=query,
                answer=(
                    "No authorized evidence records match the current case/authorization scope. "
                    "No unsupported claims or unverified relationships can be returned."
                ),
                supporting_source=[],
                supporting_evidence=[],
                relevant_entities=[],
                graph_path=UNAVAILABLE,
                confidence_context={
                    "retrieval_confidence": UNAVAILABLE,
                    "intent": intent,
                    "authorized_documents_searched": len(authorized_extractions),
                },
                case_references=[],
                explainability_traces=[],
                authorization_verified=True,
            )

        # Match query tokens to relevant entities
        q_norm = transliterate_devanagari_to_latin(query).lower()
        matched_entities: List[ExtractedEntity] = []
        for ent in all_entities:
            ent_norm = transliterate_devanagari_to_latin(ent.normalized_value).lower()
            raw_low = ent.value.lower()
            if (ent_norm and ent_norm in q_norm) or (raw_low and raw_low in query.lower()):
                matched_entities.append(ent)

        # Route by specialized investigative question intent
        if intent == QueryIntent.ENTITY_TO_FIR_CONNECTION:
            return self._handle_entity_to_fir(
                query, intent, matched_entities, all_entities, all_relationships, auth_context
            )
        if intent == QueryIntent.COMMUNICATION_PATH:
            return self._handle_path_query(
                query,
                intent,
                matched_entities,
                all_relationships,
                allowed_types={
                    GraphRelationshipType.COMMUNICATED_WITH.value,
                    GraphRelationshipType.USES_PHONE.value,
                },
                label="Communication Path",
            )
        if intent == QueryIntent.TRANSACTION_PATH:
            return self._handle_path_query(
                query,
                intent,
                matched_entities,
                all_relationships,
                allowed_types={
                    GraphRelationshipType.TRANSFERRED_FUNDS_TO.value,
                    GraphRelationshipType.HOLDS_ACCOUNT.value,
                },
                label="Financial Transaction Path",
            )
        if intent in (QueryIntent.TEMPORAL_BEFORE, QueryIntent.TEMPORAL_AFTER):
            return self._handle_temporal_query(
                query, intent, matched_entities, all_entities, all_relationships
            )
        if intent == QueryIntent.EVIDENCE_SUPPORT:
            return self._handle_evidence_support_query(
                query, intent, matched_entities, all_relationships
            )
        if intent == QueryIntent.SOURCE_MENTIONS:
            return self._handle_source_mentions_query(
                query, intent, matched_entities, all_entities, all_relationships
            )

        # Default: ENTITY_RELATIONSHIPS or GENERAL_EVIDENCE_LOOKUP
        return self._handle_entity_relationships_query(
            query, intent, matched_entities, all_entities, all_relationships
        )

    def _build_response(
        self,
        query: str,
        intent: str,
        answer: str,
        entities: List[ExtractedEntity],
        relationships: List[ExtractedRelationship],
        graph_path: Union[List[Dict[str, Any]], str],
    ) -> AssistantResponse:
        sources_map: Dict[str, Dict[str, Any]] = {}
        evidence_map: Dict[str, Dict[str, Any]] = {}
        cases_set: Set[str] = set()
        confidences: List[float] = []
        traces: List[ExplainabilityTrace] = []

        for ent in entities:
            confidences.append(ent.confidence)
            if ent.case_id != UNAVAILABLE:
                cases_set.add(ent.case_id)
            sources_map[ent.document_id] = {
                "document_id": ent.document_id,
                "source": ent.source,
                "case_id": ent.case_id,
                "timestamp": ent.timestamp,
            }
            if ent.evidence_id != UNAVAILABLE:
                evidence_map[ent.evidence_id] = {
                    "evidence_id": ent.evidence_id,
                    "document_id": ent.document_id,
                    "case_id": ent.case_id,
                    "metadata": self._evidence_metadata.get(ent.evidence_id, {}),
                }
            if ent.explanation:
                traces.append(ent.explanation)

        for rel in relationships:
            confidences.append(rel.confidence)
            if rel.case != UNAVAILABLE:
                cases_set.add(rel.case)
            sources_map[rel.source] = {
                "document_id": rel.source,
                "source": rel.source,
                "case_id": rel.case,
                "timestamp": rel.timestamp,
                "snippet": rel.evidence_snippet,
            }
            if rel.evidence != UNAVAILABLE:
                evidence_map[rel.evidence] = {
                    "evidence_id": rel.evidence,
                    "document_id": rel.source,
                    "case_id": rel.case,
                    "snippet": rel.evidence_snippet,
                    "metadata": self._evidence_metadata.get(rel.evidence, {}),
                }
            if rel.explanation:
                traces.append(rel.explanation)

        avg_conf: Union[float, str] = (
            round(float(np.mean(confidences)), 4) if confidences else UNAVAILABLE
        )

        rel_entity_dicts = [
            {
                "entity_id": e.entity_id,
                "entity_type": e.entity_type,
                "value": e.value,
                "normalized_value": e.normalized_value,
                "confidence": e.confidence,
                "document_id": e.document_id,
                "evidence_id": e.evidence_id,
            }
            for e in entities
        ]

        resp = AssistantResponse(
            query=query,
            answer=answer,
            supporting_source=list(sources_map.values()),
            supporting_evidence=list(evidence_map.values()),
            relevant_entities=rel_entity_dicts,
            graph_path=graph_path if graph_path else UNAVAILABLE,
            confidence_context={
                "retrieval_confidence": avg_conf,
                "intent_classified": intent,
                "supporting_relationship_count": len(relationships),
                "supporting_entity_count": len(entities),
                "evidence_grounded": True,
            },
            case_references=sorted(cases_set) if cases_set else [UNAVAILABLE],
            explainability_traces=traces,
            authorization_verified=True,
        )
        validate_no_risk_score(resp.to_dict())
        return resp

    def _handle_entity_to_fir(
        self,
        query: str,
        intent: str,
        matched_entities: List[ExtractedEntity],
        all_entities: List[ExtractedEntity],
        all_relationships: List[ExtractedRelationship],
        auth_context: AuthorizationContext,
    ) -> AssistantResponse:
        firs = [e for e in matched_entities if e.entity_type == "FIR Number"] or [
            e for e in all_entities if e.entity_type == "FIR Number"
        ]
        subjects = [e for e in matched_entities if e.entity_type != "FIR Number"] or [
            e for e in all_entities if e.entity_type == "Person"
        ]

        start_val = subjects[0].normalized_value if subjects else ""
        target_val = firs[0].normalized_value if firs else ""

        path = find_evidence_graph_path(all_relationships, start_val, target_val)
        if not path and self.graph_provider is not None and start_val and target_val:
            path = self.graph_provider.find_shortest_path(
                start_val, target_val, auth_context.authorized_case_ids
            )

        relevant_rels = [
            r
            for r in all_relationships
            if (start_val.lower() in r.source_entity_value.lower() or start_val.lower() in r.target_entity_value.lower())
            or (target_val and (target_val.lower() in r.source_entity_value.lower() or target_val.lower() in r.target_entity_value.lower()))
        ]

        if path:
            hops_desc = " -> ".join(
                f"{step['source_node']} -[{step['relationship']} (src: {step['supporting_source']}, ev: {step['evidence_id']})]-> {step['target_node']}"
                for step in path
            )
            answer = (
                f"Evidence-grounded connection found between '{start_val}' and '{target_val}': "
                f"{hops_desc}."
            )
        elif relevant_rels:
            rel_desc = "; ".join(
                f"{r.source_entity_value} -[{r.relationship}]-> {r.target_entity_value} (source: {r.source}, evidence: {r.evidence})"
                for r in relevant_rels[:5]
            )
            answer = f"Direct and contextual records linking '{start_val}' and '{target_val}': {rel_desc}."
            path = [
                {
                    "source_node": r.source_entity_value,
                    "relationship": r.relationship,
                    "target_node": r.target_entity_value,
                    "supporting_source": r.source,
                    "evidence_id": r.evidence,
                    "case_id": r.case,
                    "timestamp": r.timestamp,
                    "confidence": r.confidence,
                }
                for r in relevant_rels
            ]
        else:
            answer = (
                f"No verified connection between '{start_val or 'requested entity'}' and "
                f"'{target_val or 'requested FIR'}' was found in authorized evidence."
            )

        return self._build_response(
            query, intent, answer, subjects + firs, relevant_rels, path if path else UNAVAILABLE
        )

    def _handle_path_query(
        self,
        query: str,
        intent: str,
        matched_entities: List[ExtractedEntity],
        all_relationships: List[ExtractedRelationship],
        allowed_types: Set[str],
        label: str,
    ) -> AssistantResponse:
        start_val = matched_entities[0].normalized_value if matched_entities else ""
        target_val = matched_entities[1].normalized_value if len(matched_entities) > 1 else None

        path = find_evidence_graph_path(
            all_relationships, start_val, target_val, allowed_rel_types=allowed_types
        )
        matching_rels = [r for r in all_relationships if r.relationship in allowed_types]
        if not path and matching_rels:
            path = [
                {
                    "source_node": r.source_entity_value,
                    "relationship": r.relationship,
                    "target_node": r.target_entity_value,
                    "supporting_source": r.source,
                    "evidence_id": r.evidence,
                    "case_id": r.case,
                    "timestamp": r.timestamp,
                    "confidence": r.confidence,
                }
                for r in matching_rels
            ]

        if path:
            desc = " | ".join(
                f"{p['source_node']} -[{p['relationship']}]-> {p['target_node']} "
                f"(source={p['supporting_source']}, evidence={p['evidence_id']}, ts={p['timestamp']})"
                for p in path
            )
            answer = f"{label} identified from authorized records: {desc}."
        else:
            answer = f"No verified {label.lower()} was found in the authorized case records."

        return self._build_response(
            query, intent, answer, matched_entities, matching_rels, path if path else UNAVAILABLE
        )

    def _handle_temporal_query(
        self,
        query: str,
        intent: str,
        matched_entities: List[ExtractedEntity],
        all_entities: List[ExtractedEntity],
        all_relationships: List[ExtractedRelationship],
    ) -> AssistantResponse:
        dated_rels = [r for r in all_relationships if r.timestamp != UNAVAILABLE]
        dated_rels.sort(key=lambda r: r.timestamp)

        pivot_ts = None
        for ent in matched_entities:
            if ent.timestamp != UNAVAILABLE:
                pivot_ts = ent.timestamp
                break
        if not pivot_ts and dated_rels:
            pivot_ts = dated_rels[len(dated_rels) // 2].timestamp

        if intent == QueryIntent.TEMPORAL_BEFORE and pivot_ts:
            selected = [r for r in dated_rels if r.timestamp <= pivot_ts]
            direction_word = f"on or before timestamp {pivot_ts}"
        elif intent == QueryIntent.TEMPORAL_AFTER and pivot_ts:
            selected = [r for r in dated_rels if r.timestamp >= pivot_ts]
            direction_word = f"on or after timestamp {pivot_ts}"
        else:
            selected = dated_rels
            direction_word = "across the recorded timeline"

        if selected:
            events_summary = "; ".join(
                f"[{r.timestamp}] {r.source_entity_value} -[{r.relationship}]-> {r.target_entity_value} "
                f"(source: {r.source}, evidence: {r.evidence})"
                for r in selected
            )
            answer = f"Chronological evidence findings {direction_word}: {events_summary}."
            path = [
                {
                    "timestamp": r.timestamp,
                    "source_node": r.source_entity_value,
                    "relationship": r.relationship,
                    "target_node": r.target_entity_value,
                    "supporting_source": r.source,
                    "evidence_id": r.evidence,
                }
                for r in selected
            ]
        else:
            answer = "No timestamped events matching the temporal query were found in authorized evidence."
            path = UNAVAILABLE  # type: ignore

        return self._build_response(
            query, intent, answer, matched_entities or all_entities[:5], selected, path
        )

    def _handle_evidence_support_query(
        self,
        query: str,
        intent: str,
        matched_entities: List[ExtractedEntity],
        all_relationships: List[ExtractedRelationship],
    ) -> AssistantResponse:
        matched_names = {e.normalized_value.lower() for e in matched_entities}
        if matched_names:
            relevant_rels = [
                r
                for r in all_relationships
                if r.source_entity_value.lower() in matched_names
                or r.target_entity_value.lower() in matched_names
            ]
        else:
            relevant_rels = all_relationships

        if relevant_rels:
            citations = "; ".join(
                f"({r.source_entity_value} -[{r.relationship}]-> {r.target_entity_value}) is supported by "
                f"Source='{r.source}', Evidence ID='{r.evidence}', Case='{r.case}', "
                f"Timestamp='{r.timestamp}', Confidence={r.confidence:.2f}, Snippet=\"{r.evidence_snippet}\""
                for r in relevant_rels
            )
            answer = f"Supporting evidence and provenance for the queried relationship(s): {citations}."
            path = [
                {
                    "source_node": r.source_entity_value,
                    "relationship": r.relationship,
                    "target_node": r.target_entity_value,
                    "supporting_source": r.source,
                    "evidence_id": r.evidence,
                    "confidence": r.confidence,
                }
                for r in relevant_rels
            ]
        else:
            answer = "No supporting evidence records were found for the queried relationship."
            path = UNAVAILABLE  # type: ignore

        return self._build_response(
            query, intent, answer, matched_entities, relevant_rels, path
        )

    def _handle_source_mentions_query(
        self,
        query: str,
        intent: str,
        matched_entities: List[ExtractedEntity],
        all_entities: List[ExtractedEntity],
        all_relationships: List[ExtractedRelationship],
    ) -> AssistantResponse:
        targets = matched_entities if matched_entities else [e for e in all_entities if e.entity_type == "Person"]
        target_names = {t.normalized_value.lower() for t in targets}

        mentions = [
            e for e in all_entities if e.normalized_value.lower() in target_names
        ]
        rel_mentions = [
            r
            for r in all_relationships
            if r.source_entity_value.lower() in target_names
            or r.target_entity_value.lower() in target_names
        ]

        if mentions:
            doc_summary = "; ".join(
                f"Document '{m.document_id}' (Source: {m.source}, Case: {m.case_id}, Evidence: {m.evidence_id}, Confidence: {m.confidence:.2f})"
                for m in mentions
            )
            answer = f"The queried entity is mentioned in the following authorized sources: {doc_summary}."
        else:
            answer = "No authorized source documents mention the requested entity."

        return self._build_response(
            query, intent, answer, mentions, rel_mentions, UNAVAILABLE
        )

    def _handle_entity_relationships_query(
        self,
        query: str,
        intent: str,
        matched_entities: List[ExtractedEntity],
        all_entities: List[ExtractedEntity],
        all_relationships: List[ExtractedRelationship],
    ) -> AssistantResponse:
        target_names = {e.normalized_value.lower() for e in matched_entities}
        if target_names:
            rels = [
                r
                for r in all_relationships
                if r.source_entity_value.lower() in target_names
                or r.target_entity_value.lower() in target_names
            ]
        else:
            rels = all_relationships

        if rels:
            rel_list = "; ".join(
                f"{r.source_entity_value} -[{r.relationship}]-> {r.target_entity_value} "
                f"(Source: {r.source}, Evidence: {r.evidence}, Timestamp: {r.timestamp}, Confidence: {r.confidence:.2f})"
                for r in rels
            )
            answer = f"Extracted evidence-backed relationships: {rel_list}."
            path = [
                {
                    "source_node": r.source_entity_value,
                    "relationship": r.relationship,
                    "target_node": r.target_entity_value,
                    "supporting_source": r.source,
                    "evidence_id": r.evidence,
                    "case_id": r.case,
                    "timestamp": r.timestamp,
                    "confidence": r.confidence,
                }
                for r in rels
            ]
        else:
            answer = "No verified relationships were found for the queried entity in authorized records."
            path = UNAVAILABLE  # type: ignore

        return self._build_response(
            query,
            intent,
            answer,
            matched_entities if matched_entities else all_entities[:6],
            rels,
            path,
        )
