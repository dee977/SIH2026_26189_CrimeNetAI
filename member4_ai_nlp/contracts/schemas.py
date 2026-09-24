"""
Core Schemas & Data Contracts for Member 4 (AI/NLP/OCR/Entity Resolution).

Strictly adheres to SIH26189 CrimeNet AI constraints:
- Never invents missing information (uses "unavailable" sentinel).
- Never implements risk_score, risk_label, criminal_probability, fake_threat_score,
  or automatic criminal classification.
- Preserves original source records across OCR inspection and Entity Resolution.
- Exposes Explainable AI provenance on every finding.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Union

UNAVAILABLE = "unavailable"


class DocumentType(str, Enum):
    PDF = "PDF"
    SCANNED_DOCUMENT = "Scanned Document"
    IMAGE = "Image"
    FIR = "FIR"
    POLICE_REPORT = "Police Report"
    CDR_TEXT = "CDR text"
    INVESTIGATION_DOCUMENT = "Investigation document"


class OCRLanguage(str, Enum):
    ENGLISH = "eng"
    HINDI = "hin"
    MIXED_HINDI_ENGLISH = "hin+eng"


class EntityType(str, Enum):
    PERSON = "Person"
    ORGANIZATION = "Organization"
    LOCATION = "Location"
    VEHICLE = "Vehicle"
    PHONE = "Phone"
    BANK_ACCOUNT = "Bank Account"
    FIR_NUMBER = "FIR Number"
    CRIME = "Crime"
    DATE = "Date"
    EVENT = "Event"
    RELATIONSHIP = "Relationship"
    CRIME_TYPE = "Crime Type"


class GraphRelationshipType(str, Enum):
    """Graph-compatible relationship types mapped for M3 Neo4j schema."""

    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    COMMUNICATED_WITH = "COMMUNICATED_WITH"
    TRANSFERRED_FUNDS_TO = "TRANSFERRED_FUNDS_TO"
    NAMED_IN_FIR = "NAMED_IN_FIR"
    OWNS_VEHICLE = "OWNS_VEHICLE"
    USES_PHONE = "USES_PHONE"
    HOLDS_ACCOUNT = "HOLDS_ACCOUNT"
    LOCATED_AT = "LOCATED_AT"
    OCCURRED_AT = "OCCURRED_AT"
    PARTICIPATED_IN_EVENT = "PARTICIPATED_IN_EVENT"
    INVOLVED_IN_CRIME = "INVOLVED_IN_CRIME"
    MEMBER_OF = "MEMBER_OF"
    ALIAS_OF = "ALIAS_OF"


class MatchingMethod(str, Enum):
    DOUBLE_METAPHONE = "Double Metaphone"
    SOUNDEX = "Soundex"
    STRING_SIMILARITY = "String Similarity"
    SEMANTIC_SIMILARITY = "Semantic Similarity"
    CONTEXT_MATCHING = "Context Matching"
    EXACT_NORMALIZED = "Exact Normalized Match"
    TRANSLITERATION_PHONETIC = "Hindi-English Transliteration Phonetic"


class VerificationAction(str, Enum):
    PENDING = "Pending Verification"
    ACCEPT_MATCH = "Accept Match"
    REJECT_MATCH = "Reject Match"
    KEEP_SEPARATE = "Keep Separate"


@dataclass
class ExplainabilityTrace:
    """
    Explainable AI payload attached to every extracted entity, relationship,
    or entity resolution match candidate.
    """

    finding_type: str  # "entity_extraction" | "relationship_extraction" | "entity_resolution"
    reason: str  # Why an entity/relationship was extracted or why two records were matched
    supporting_source: str  # Document ID / source citation
    supporting_snippet: str = UNAVAILABLE
    supporting_timestamp: str = UNAVAILABLE
    confidence: Union[float, str] = UNAVAILABLE
    algorithm_or_model: str = UNAVAILABLE
    feature_breakdown: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class PageOCRSegment:
    """Per-page OCR result allowing investigator line/page inspection."""

    page_number: int
    extracted_text: str
    ocr_confidence: Union[float, str] = UNAVAILABLE
    preprocessing_applied: List[str] = field(default_factory=list)
    skew_angle_degrees: float = 0.0
    language_used: str = OCRLanguage.MIXED_HINDI_ENGLISH.value


@dataclass
class TextVerificationRecord:
    """
    Investigator inspection and verification record for OCR output.
    Preserves original OCR text without destroying source data.
    """

    verification_id: str
    document_id: str
    original_extracted_text: str
    verified_text: str
    inspector_id: str
    verified_at: str
    status: str  # "INSPECTED_APPROVED" | "INSPECTED_CORRECTED"
    notes: str = ""


@dataclass
class OCRResult:
    """
    Standardized output contract for the M4 OCR Pipeline.
    """

    document_id: str
    extracted_text: str
    ocr_confidence: Union[float, str]  # float in [0.0, 1.0] or "unavailable"
    document_metadata: Dict[str, Any]
    source_metadata: Dict[str, Any]
    case_id: str = UNAVAILABLE
    evidence_id: str = UNAVAILABLE
    pages: List[PageOCRSegment] = field(default_factory=list)
    verified_text: Optional[str] = None
    verification_history: List[TextVerificationRecord] = field(default_factory=list)

    def get_active_text(self) -> str:
        """Returns investigator-verified text if available, otherwise raw extracted text."""
        return self.verified_text if self.verified_text is not None else self.extracted_text

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ExtractedEntity:
    """
    Named Entity extracted by the M4 NLP pipeline.
    """

    entity_id: str
    entity_type: str  # Value from EntityType
    value: str
    normalized_value: str
    confidence: float
    document_id: str
    case_id: str = UNAVAILABLE
    evidence_id: str = UNAVAILABLE
    source: str = UNAVAILABLE
    timestamp: str = UNAVAILABLE
    start_char: int = -1
    end_char: int = -1
    language: str = "en"
    attributes: Dict[str, Any] = field(default_factory=dict)
    explanation: Optional[ExplainabilityTrace] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ExtractedRelationship:
    """
    Graph-compatible relationship extracted from documents.
    Preserves relationship, source, timestamp, case, evidence, confidence, and explainability.
    """

    relationship_id: str
    relationship: str  # Value from GraphRelationshipType
    source_entity_id: str
    source_entity_value: str
    source_entity_type: str
    target_entity_id: str
    target_entity_value: str
    target_entity_type: str
    source: str  # Document ID / source reference
    timestamp: str = UNAVAILABLE
    case: str = UNAVAILABLE
    evidence: str = UNAVAILABLE
    confidence: float = 0.0
    evidence_snippet: str = UNAVAILABLE
    attributes: Dict[str, Any] = field(default_factory=dict)
    explanation: Optional[ExplainabilityTrace] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class StructuredExtractionOutput:
    """
    Required structured NLP output contract.
    Contains entities, relationships, timestamps, sources, confidence,
    document ID, case ID, and evidence ID.
    Never invents missing information (uses "unavailable").
    """

    entities: List[ExtractedEntity]
    relationships: List[ExtractedRelationship]
    timestamps: List[str]
    sources: List[Dict[str, Any]]
    confidence: Union[float, str]
    document_id: str
    case_id: str = UNAVAILABLE
    evidence_id: str = UNAVAILABLE
    language_detected: str = UNAVAILABLE

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class EntityMatchCandidate:
    """
    Entity Resolution match output contract.
    Never silently merges uncertain entities; exposes full provenance for Human Verification.
    """

    match_id: str
    candidate_a: Dict[str, Any]
    candidate_b: Dict[str, Any]
    matching_fields: List[str]
    matching_method: List[str]
    confidence: float
    original_source_records: Dict[str, Dict[str, Any]]
    verification_status: str = VerificationAction.PENDING.value
    explanation: Optional[ExplainabilityTrace] = None
    resolution_metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ResolutionDecisionRecord:
    """
    Audit record for human-in-the-loop entity verification (Accept Match, Reject Match, Keep Separate).
    Guarantees original source records are preserved without destruction.
    """

    decision_id: str
    match_id: str
    action: str  # Accept Match | Reject Match | Keep Separate
    reviewer_id: str
    decided_at: str
    canonical_entity_id: Optional[str]
    candidate_a_original_record: Dict[str, Any]
    candidate_b_original_record: Dict[str, Any]
    source_records_preserved: bool = True
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class AssistantResponse:
    """
    Evidence-grounded AI Investigation Assistant output contract.
    Exposes Answer, Supporting Source, Supporting Evidence, Relevant Entities,
    Graph Path, Confidence/Context, and Case references.
    """

    query: str
    answer: str
    supporting_source: List[Dict[str, Any]]
    supporting_evidence: List[Dict[str, Any]]
    relevant_entities: List[Dict[str, Any]]
    graph_path: Union[List[Dict[str, Any]], str]
    confidence_context: Dict[str, Any]
    case_references: List[str]
    explainability_traces: List[ExplainabilityTrace] = field(default_factory=list)
    authorization_verified: bool = False
    legal_disclaimer: str = (
        "ANALYTICAL FINDING ONLY: This output is generated from evidence-grounded "
        "records for investigative assistance and does NOT constitute a final legal "
        "conclusion, criminal classification, or determination of guilt."
    )

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
