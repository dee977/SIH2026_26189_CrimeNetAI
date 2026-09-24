from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ReportSectionResponse(BaseModel):
    sectionKey: str
    title: str
    content: str
    data: Optional[Dict[str, Any]] = None

class ReportGenerationRequest(BaseModel):
    caseId: str
    includeSections: List[str] = Field(
        default=[
            'case_summary',
            'key_entities',
            'network_findings',
            'relationships',
            'timeline',
            'anomalies',
            'evidence',
            'source_records',
            'graph_snapshot',
            'map_snapshot',
            'evidence_integrity',
            'audit_information'
        ]
    )
    format: str = Field(default='JSON', description='JSON | PDF | HTML')

class ReportResponse(BaseModel):
    reportId: str
    caseId: str
    caseTitle: str
    generatedAt: str
    generatedBy: str
    sections: List[ReportSectionResponse] = Field(default_factory=list)
    bsaSection65BCertificate: Optional[Dict[str, Any]] = None
    exportUrl: Optional[str] = None
