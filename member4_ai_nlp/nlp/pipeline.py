"""
End-to-End NLP Extraction Pipeline for Member 4.

Coordinates:
- Multilingual normalization & language detection
- 12-Category Named Entity Recognition (`ForensicEntityExtractor`)
- Graph-compatible Relationship Extraction (`ForensicRelationshipExtractor`)
- Produces `StructuredExtractionOutput` (never inventing missing fields; marks missing as `"unavailable"`)
- Emits `M3GraphPayloadContract` for M3 Neo4j ingestion without implementing Neo4j importers.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

import numpy as np

from ..contracts.integration_contracts import M3GraphPayloadContract
from ..contracts.schemas import (
    UNAVAILABLE,
    EntityType,
    OCRResult,
    StructuredExtractionOutput,
)
from ..explainability.explainer import validate_no_risk_score
from .entity_extractor import ForensicEntityExtractor
from .multilingual import detect_text_language
from .relationship_extractor import ForensicRelationshipExtractor


class NLPPipeline:
    """
    Main NLP service for Member 4.
    Accepts raw text or `OCRResult` and returns `StructuredExtractionOutput`.
    """

    def __init__(
        self,
        entity_extractor: Optional[ForensicEntityExtractor] = None,
        relationship_extractor: Optional[ForensicRelationshipExtractor] = None,
    ) -> None:
        self.entity_extractor = entity_extractor or ForensicEntityExtractor()
        self.relationship_extractor = relationship_extractor or ForensicRelationshipExtractor()

    def process_text(
        self,
        text: str,
        document_id: Optional[str] = None,
        case_id: Optional[str] = None,
        evidence_id: Optional[str] = None,
        source_metadata: Optional[Dict[str, Any]] = None,
    ) -> StructuredExtractionOutput:
        """
        Extract entities, relationships, timestamps, and provenance from text.
        Strictly marks unavailable fields as `"unavailable"`.
        """
        resolved_doc_id = document_id if document_id else UNAVAILABLE
        resolved_case_id = case_id if case_id else UNAVAILABLE
        resolved_evidence_id = evidence_id if evidence_id else UNAVAILABLE
        src_name = (
            str(source_metadata.get("source_name"))
            if source_metadata and source_metadata.get("source_name")
            else resolved_doc_id
        )

        entities = self.entity_extractor.extract_entities(
            text=text,
            document_id=resolved_doc_id,
            case_id=resolved_case_id,
            evidence_id=resolved_evidence_id,
            source_name=src_name,
        )

        relationships = self.relationship_extractor.extract_relationships(
            text=text,
            entities=entities,
            document_id=resolved_doc_id,
            case_id=resolved_case_id,
            evidence_id=resolved_evidence_id,
            source_name=src_name,
        )

        timestamps = sorted(
            {
                e.normalized_value
                for e in entities
                if e.entity_type == EntityType.DATE.value and e.normalized_value != UNAVAILABLE
            }
        )
        if not timestamps:
            timestamps = [UNAVAILABLE]

        all_confidences: List[float] = [e.confidence for e in entities] + [
            r.confidence for r in relationships
        ]
        overall_confidence: Union[float, str] = (
            round(float(np.mean(all_confidences)), 4) if all_confidences else UNAVAILABLE
        )

        sources_list: List[Dict[str, Any]] = [
            {
                "document_id": resolved_doc_id,
                "case_id": resolved_case_id,
                "evidence_id": resolved_evidence_id,
                "source_name": src_name,
                "metadata": source_metadata or {"status": UNAVAILABLE},
            }
        ]

        output = StructuredExtractionOutput(
            entities=entities,
            relationships=relationships,
            timestamps=timestamps,
            sources=sources_list,
            confidence=overall_confidence,
            document_id=resolved_doc_id,
            case_id=resolved_case_id,
            evidence_id=resolved_evidence_id,
            language_detected=detect_text_language(text),
        )
        validate_no_risk_score(output.to_dict())
        return output

    def process_ocr_result(self, ocr_result: OCRResult) -> StructuredExtractionOutput:
        """
        Run NLP extraction over an `OCRResult`, automatically preferring investigator-verified text
        when available while preserving source metadata.
        """
        active_text = ocr_result.get_active_text()
        merged_meta = {
            **ocr_result.source_metadata,
            "ocr_confidence": ocr_result.ocr_confidence,
            "document_type": ocr_result.document_metadata.get("document_type", UNAVAILABLE),
            "inspector_verification_status": ocr_result.document_metadata.get(
                "inspector_verification_status", UNAVAILABLE
            ),
        }
        return self.process_text(
            text=active_text,
            document_id=ocr_result.document_id,
            case_id=ocr_result.case_id,
            evidence_id=ocr_result.evidence_id,
            source_metadata=merged_meta,
        )

    @staticmethod
    def to_m3_graph_contract(output: StructuredExtractionOutput) -> M3GraphPayloadContract:
        """
        Convert `StructuredExtractionOutput` into `M3GraphPayloadContract` (nodes + edges)
        for Member 3's Neo4j service.
        """
        nodes: List[Dict[str, Any]] = []
        for ent in output.entities:
            nodes.append(
                {
                    "node_id": ent.entity_id,
                    "label": ent.entity_type,
                    "value": ent.value,
                    "normalized_value": ent.normalized_value,
                    "confidence": ent.confidence,
                    "document_id": ent.document_id,
                    "case_id": ent.case_id,
                    "evidence_id": ent.evidence_id,
                    "timestamp": ent.timestamp,
                    "attributes": ent.attributes,
                }
            )

        edges: List[Dict[str, Any]] = []
        for rel in output.relationships:
            edges.append(
                {
                    "edge_id": rel.relationship_id,
                    "type": rel.relationship,
                    "source_node_id": rel.source_entity_id,
                    "target_node_id": rel.target_entity_id,
                    "source": rel.source,
                    "timestamp": rel.timestamp,
                    "case": rel.case,
                    "evidence": rel.evidence,
                    "confidence": rel.confidence,
                    "evidence_snippet": rel.evidence_snippet,
                }
            )

        return M3GraphPayloadContract(
            nodes=nodes,
            edges=edges,
            document_id=output.document_id,
            case_id=output.case_id,
            evidence_id=output.evidence_id,
        )
