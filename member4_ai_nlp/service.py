"""
Unified Member 4 Service Facade (`CrimeNetAINLPService`) for M2 Backend Integration.

Provides a single contract-compliant Python interface for:
1. OCR & Document Processing (FIR PDF, Scanned Docs, Images, Hindi/English/Mixed, Deskew + Binarization + Adaptive Thresholding)
2. Investigator OCR Text Inspection & Verification
3. NLP & 12-Category NER + Graph-Compatible Relationship Extraction (`StructuredExtractionOutput`)
4. Cross-Source Entity Resolution (Double Metaphone, Soundex, String Similarity, Semantic Similarity, Context Matching)
5. Human-in-the-Loop Entity Verification (`Accept Match`, `Reject Match`, `Keep Separate`) preserving original source records
6. Evidence-Grounded AI Investigation Assistant (RAG) with strict M6 `AuthorizationContext` enforcement and Explainable AI.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

import numpy as np

from .assistant.rag_service import EvidenceGroundedRAGAssistant
from .contracts.integration_contracts import (
    AuthorizationContext,
    GraphDataProvider,
    M3GraphPayloadContract,
    M5AnalyticsContext,
)
from .contracts.schemas import (
    AssistantResponse,
    EntityMatchCandidate,
    ExtractedEntity,
    OCRLanguage,
    OCRResult,
    ResolutionDecisionRecord,
    StructuredExtractionOutput,
)
from .entity_resolution.resolver import EntityResolver
from .entity_resolution.verification import EntityVerificationManager
from .explainability.explainer import validate_no_risk_score
from .nlp.pipeline import NLPPipeline
from .ocr.ocr_pipeline import OCRPipeline


class CrimeNetAINLPService:
    """
    Contract-driven AI/NLP/OCR/Entity Resolution facade owned exclusively by Member 4.
    Does NOT implement FastAPI routers, Neo4j drivers, PageRank/Louvain, RBAC, or SHA-256.
    """

    def __init__(
        self,
        graph_provider: Optional[GraphDataProvider] = None,
        m5_analytics_context: Optional[M5AnalyticsContext] = None,
    ) -> None:
        self.ocr_pipeline = OCRPipeline()
        self.nlp_pipeline = NLPPipeline()
        self.entity_resolver = EntityResolver()
        self.verification_manager = EntityVerificationManager()
        self.rag_assistant = EvidenceGroundedRAGAssistant(
            graph_provider=graph_provider,
            m5_analytics_context=m5_analytics_context,
        )

    def ingest_and_extract_document(
        self,
        content: Union[str, bytes, np.ndarray],
        document_id: Optional[str] = None,
        document_type: Optional[str] = None,
        language: Optional[Union[OCRLanguage, str]] = None,
        case_id: Optional[str] = None,
        evidence_id: Optional[str] = None,
        source_name: str = "investigation_document",
        evidence_metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        End-to-end document ingestion pipeline:
        1. Runs OCR & OpenCV preprocessing (Deskew, Binarization, Adaptive Thresholding)
        2. Runs Multilingual NER & Relationship Extraction
        3. Produces M3 Graph Contract payload
        4. Indexes into Evidence-Grounded RAG Assistant
        """
        ocr_result: OCRResult = self.ocr_pipeline.process_document(
            content=content,
            document_id=document_id,
            document_type=document_type,
            language=language,
            case_id=case_id,
            evidence_id=evidence_id,
            source_name=source_name,
        )

        structured_output: StructuredExtractionOutput = self.nlp_pipeline.process_ocr_result(
            ocr_result
        )
        m3_graph_payload: M3GraphPayloadContract = self.nlp_pipeline.to_m3_graph_contract(
            structured_output
        )

        self.rag_assistant.index_extraction(
            extraction=structured_output,
            ocr_result=ocr_result,
            evidence_metadata=evidence_metadata,
        )

        result_bundle = {
            "ocr_result": ocr_result.to_dict(),
            "structured_extraction": structured_output.to_dict(),
            "m3_graph_contract": m3_graph_payload.to_dict(),
        }
        validate_no_risk_score(result_bundle)
        return result_bundle

    def verify_ocr_text(
        self,
        ocr_result: OCRResult,
        inspector_id: str,
        verified_text: Optional[str] = None,
        notes: str = "",
    ) -> OCRResult:
        """Investigator inspection & verification of OCR text without destroying original text."""
        return self.ocr_pipeline.inspect_and_verify_text(
            ocr_result=ocr_result,
            inspector_id=inspector_id,
            verified_text=verified_text,
            notes=notes,
        )

    def resolve_entities(
        self, entities: List[Union[ExtractedEntity, Dict[str, Any]]]
    ) -> List[EntityMatchCandidate]:
        """
        Detect duplicate entities, spelling variations, aliases, phonetic matches,
        semantic matches, and cross-source matches without silent merging.
        """
        candidates = self.entity_resolver.find_matches(entities)
        self.verification_manager.register_candidates(candidates)
        return candidates

    def verify_entity_match(
        self,
        candidate: EntityMatchCandidate,
        action: str,
        reviewer_id: str,
        notes: str = "",
    ) -> ResolutionDecisionRecord:
        """
        Apply investigator decision (`Accept Match`, `Reject Match`, `Keep Separate`)
        while preserving immutable original source records.
        """
        return self.verification_manager.apply_human_decision(
            candidate=candidate,
            action=action,
            reviewer_id=reviewer_id,
            notes=notes,
        )

    def ask_investigation_assistant(
        self,
        query: str,
        auth_context: AuthorizationContext,
        case_filter: Optional[str] = None,
    ) -> AssistantResponse:
        """
        Answer investigative questions using RAG grounded strictly in authorized evidence.
        """
        return self.rag_assistant.ask(
            query=query,
            auth_context=auth_context,
            case_filter=case_filter,
        )
