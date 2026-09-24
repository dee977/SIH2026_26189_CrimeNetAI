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
    question: str = Field(..., min_length=3, description='Investigator question')
    questionType: str = Field(default='natural_language')
    caseId: Optional[str] = None
    focusEntityIds: Optional[List[str]] = Field(default_factory=list)
    conversationHistory: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class AIQuestionResponse(BaseModel):
    question: str
    answer: str
    supportingEntities: List[SupportingEntity] = Field(default_factory=list)
    source: str = 'M4_GROUNDED_AI_ENGINE'
    supportingEvidence: List[SupportingEvidence] = Field(default_factory=list)
    graphPath: Optional[SupportingGraphPath] = None
    confidenceContext: str = 'High confidence grounded in verified FIR, CDR, and Bank records'
    caseReferences: List[str] = Field(default_factory=list)
    hasHallucinationFlag: bool = False
