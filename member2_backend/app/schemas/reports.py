from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ReportSectionResponse(BaseModel):
    sectionKey: str
    title: str
    content: str
    data: Optional[Dict[str, Any]] = None

class EntitySummary(BaseModel):
    id: str
    category: Optional[str] = 'Person'
    name: Optional[str] = 'Entity'
    aliases: Optional[str] = 'None'
    role: Optional[str] = 'Subject of Interest'
    details: Optional[str] = 'Active network node'
    source: Optional[str] = 'Neo4j Intelligence Graph'
    type: Optional[str] = None

class DiscrepancySource(BaseModel):
    name: Optional[str] = 'Source Document'
    docRef: Optional[str] = 'REF-01'
    timestamp: Optional[str] = ''
    recordedValue: Optional[str] = ''
    excerpt: Optional[str] = ''

class DiscrepancySummary(BaseModel):
    id: str
    status: Optional[str] = 'DATA DISCREPANCY DETECTED'
    title: Optional[str] = 'Evidentiary Contradiction'
    conflictingField: Optional[str] = 'Discrepancy Parameter'
    sourceA: Optional[DiscrepancySource] = None
    sourceB: Optional[DiscrepancySource] = None
    assessment: Optional[str] = ''
    actions: Optional[str] = None
    description: Optional[str] = None

class EvidenceSummary(BaseModel):
    id: str
    name: Optional[str] = 'Evidence Item'
    title: Optional[str] = None
    type: Optional[str] = 'Document'
    category: Optional[str] = 'Forensic Seizure'
    size: Optional[str] = 'N/A'
    custodian: Optional[str] = 'Central Evidence Vault'
    bsaCert: Optional[str] = 'BSA-63'
    status: Optional[str] = 'VALID'
    resultText: Optional[str] = 'Integrity Verified'
    genesisHash: Optional[str] = ''
    currentHash: Optional[str] = ''
    hash: Optional[str] = None
    history: List[str] = Field(default_factory=list)
    evidentiaryInfo: List[str] = Field(default_factory=list)

class PathHop(BaseModel):
    hop: Optional[str] = ''
    origin: Optional[str] = ''
    originSub: Optional[str] = ''
    rel: Optional[str] = ''
    relSub: Optional[str] = ''
    dest: Optional[str] = ''
    destSub: Optional[str] = ''
    audit: Optional[str] = ''
    source: Optional[str] = None
    target: Optional[str] = None
    relation: Optional[str] = None

class AttestationSummary(BaseModel):
    standard: Optional[str] = 'BSA Section 63'
    certText: Optional[str] = ''
    investigatingOfficer: Optional[str] = ''
    officerBadge: Optional[str] = 'LEO-7729'
    officerUnit: Optional[str] = 'Special Crime Branch'
    attestingAuthority: Optional[str] = 'State Cyber Police'
    authorityUnit: Optional[str] = 'Forensic Laboratory'
    digitalSeal: Optional[str] = 'SHA-256 SEAL'

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
