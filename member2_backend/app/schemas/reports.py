from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ReportSectionResponse(BaseModel):
    sectionKey: str
    title: str
    content: str
    data: Optional[Dict[str, Any]] = None

class EntitySummary(BaseModel):
    category: str
    name: str
    id: str
    aliases: str
    role: str
    details: str
    source: str

class DiscrepancySource(BaseModel):
    name: str
    docRef: str
    timestamp: str
    recordedValue: str
    excerpt: str

class DiscrepancySummary(BaseModel):
    id: str
    status: str
    title: str
    conflictingField: str
    sourceA: DiscrepancySource
    sourceB: DiscrepancySource
    assessment: str
    actions: Optional[str] = None

class EvidenceSummary(BaseModel):
    id: str
    name: str
    type: str
    category: str
    size: str
    custodian: str
    bsaCert: str
    status: str
    resultText: str
    genesisHash: str
    currentHash: str
    history: List[str] = Field(default_factory=list)
    evidentiaryInfo: List[str] = Field(default_factory=list)

class PathHop(BaseModel):
    hop: str
    origin: str
    originSub: str
    rel: str
    relSub: str
    dest: str
    destSub: str
    audit: str

class AttestationSummary(BaseModel):
    standard: str
    certText: str
    investigatingOfficer: str
    officerBadge: str
    officerUnit: str
    attestingAuthority: str
    authorityUnit: str
    digitalSeal: str

class ReportDossierData(BaseModel):
    caseReference: str
    dossierId: str
    leadInvestigator: str
    badgeNumber: str
    agencyUnit: str
    dateGenerated: str
    securityClearance: str
    jurisdiction: str
    assignedTeam: str
    associatedFIR: str
    statutoryCompliance: str
    summary: str
    entities: List[EntitySummary] = Field(default_factory=list)
    pathHops: List[PathHop] = Field(default_factory=list)
    networkMetrics: Dict[str, Any] = Field(default_factory=dict)
    discrepancies: List[DiscrepancySummary] = Field(default_factory=list)
    evidenceItems: List[EvidenceSummary] = Field(default_factory=list)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    attestation: Optional[AttestationSummary] = None

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
    caseData: Optional[Dict[str, Any]] = None

class ReportResponse(BaseModel):
    reportId: str
    caseId: str
    caseTitle: str
    generatedAt: str
    generatedBy: str
    sections: List[ReportSectionResponse] = Field(default_factory=list)
    dossierData: Optional[ReportDossierData] = None
    bsaSection65BCertificate: Optional[Dict[str, Any]] = None
    exportUrl: Optional[str] = None
    pdfDownloadUrl: Optional[str] = None
