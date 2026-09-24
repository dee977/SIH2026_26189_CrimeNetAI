"""
Member 4 — AI / NLP / OCR / Entity Resolution / Evidence-Grounded RAG Package
for CrimeNet AI (SIH26189).
"""

from .assistant import EvidenceGroundedRAGAssistant, QueryIntent, classify_query_intent
from .contracts import (
    UNAVAILABLE,
    AssistantResponse,
    AuthorizationContext,
    AuthorizationViolationError,
    DocumentType,
    EntityMatchCandidate,
    EntityType,
    ExplainabilityTrace,
    ExtractedEntity,
    ExtractedRelationship,
    GraphDataProvider,
    GraphRelationshipType,
    M3GraphPayloadContract,
    M5AnalyticsContext,
    MatchingMethod,
    OCRLanguage,
    OCRResult,
    ResolutionDecisionRecord,
    StructuredExtractionOutput,
    TextVerificationRecord,
    VerificationAction,
)
from .entity_resolution import (
    EntityResolver,
    EntityVerificationManager,
    double_metaphone,
    soundex,
)
from .explainability import (
    ExplainableAIBuilder,
    RiskScorePolicyViolationError,
    validate_no_risk_score,
)
from .nlp import (
    ForensicEntityExtractor,
    ForensicRelationshipExtractor,
    NLPPipeline,
    transliterate_devanagari_to_latin,
)
from .ocr import DocumentPreprocessor, OCRPipeline
from .service import CrimeNetAINLPService

__all__ = [
    "UNAVAILABLE",
    "AssistantResponse",
    "AuthorizationContext",
    "AuthorizationViolationError",
    "CrimeNetAINLPService",
    "DocumentPreprocessor",
    "DocumentType",
    "EntityMatchCandidate",
    "EntityResolver",
    "EntityType",
    "EntityVerificationManager",
    "EvidenceGroundedRAGAssistant",
    "ExplainabilityTrace",
    "ExplainableAIBuilder",
    "ExtractedEntity",
    "ExtractedRelationship",
    "ForensicEntityExtractor",
    "ForensicRelationshipExtractor",
    "GraphDataProvider",
    "GraphRelationshipType",
    "M3GraphPayloadContract",
    "M5AnalyticsContext",
    "MatchingMethod",
    "NLPPipeline",
    "OCRLanguage",
    "OCRPipeline",
    "OCRResult",
    "QueryIntent",
    "ResolutionDecisionRecord",
    "RiskScorePolicyViolationError",
    "StructuredExtractionOutput",
    "TextVerificationRecord",
    "VerificationAction",
    "classify_query_intent",
    "double_metaphone",
    "soundex",
    "transliterate_devanagari_to_latin",
    "validate_no_risk_score",
]
