from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class SupportingEntity(BaseModel):
    entityId: str
    entityType: str
    name: str
    roleInFinding: str

class SupportingEvidence(BaseModel):
    evidenceId: str
    evidenceNumber: str
    docType: str
    sha256Hash: str
    relevanceDescription: str

class SupportingGraphPath(BaseModel):
    pathDescription: str
    hops: List[str] = Field(default_factory=list)

class AIQuestionRequest(BaseModel):
    question: Optional[str] = Field(default=None, description='Investigator question')
    query: Optional[str] = None
    questionType: Optional[str] = Field(default='natural_language')
    caseId: Optional[str] = None
    case_id: Optional[str] = None
    focusEntityIds: Optional[List[str]] = Field(default_factory=list)
    conversationHistory: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class AIQuestionResponse(BaseModel):
    question: str
    query: Optional[str] = None
    answer: str
    supportingEntities: List[SupportingEntity] = Field(default_factory=list)
    relevantEntities: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    source: str = 'M4_GROUNDED_AI_ENGINE'
    supportingEvidence: List[SupportingEvidence] = Field(default_factory=list)
    graphPath: Optional[Any] = None
    sourceRecords: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    confidenceContext: str = 'High confidence grounded in verified FIR, CDR, and Bank records'
    caseReferences: List[str] = Field(default_factory=list)
    hasHallucinationFlag: bool = False
