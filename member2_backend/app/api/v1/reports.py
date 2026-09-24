from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.dependencies import require_permission
from app.exceptions import ResourceNotFoundError
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.schemas.reports import ReportGenerationRequest, ReportResponse, ReportSectionResponse
from app.services.demo_data import DEMO_CASES
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client

router = APIRouter(prefix='/reports', tags=['Comprehensive Investigative Reports'])

@router.post('/generate', response_model=ResponseEnvelope[ReportResponse], summary='Generate Multi-Section Case Report')
async def generate_report(
    req: ReportGenerationRequest,
    current_user: UserProfile = Depends(require_permission('report:generate')),
    m6_client: M6SecurityClient = Depends(get_m6_client)
):
    case_summary = next((c for c in DEMO_CASES if c.get('caseId') == req.caseId), None)
    if not case_summary:
        raise ResourceNotFoundError('Case', req.caseId)

    now = datetime.now(timezone.utc).isoformat()
    bsa_cert = await m6_client.get_bsa_certificate('EVD-2024-001')

    sections = [
        ReportSectionResponse(sectionKey='case_summary', title='Executive Case Summary', content='Operation Blue Shadow unraveled an international contraband diversion network operating through JNPT Navi Mumbai.'),
        ReportSectionResponse(sectionKey='key_entities', title='Identified Key Entities', content='9 Verified Primary Entities: Vikram Malhotra (PER-001), Rajesh Sharma (PER-002), Shadow Logistics Ltd (ORG-001).'),
        ReportSectionResponse(sectionKey='network_findings', title='Network Topology & Shortest Path Findings', content='Critical 4-hop nexus linking FIR-2024-8841 directly to Godown #4 and illicit contraband seizure.'),
        ReportSectionResponse(sectionKey='timeline', title='Chronological Event Timeline', content='Chronological playback logs 5 major milestones across March 8 - March 10, 2024.'),
        ReportSectionResponse(sectionKey='evidence_integrity', title='Evidence Ledger & Hash Verification', content='All 6 evidence records cryptographically hashed with SHA-256 and anchored in tamper-evident ledger.'),
        ReportSectionResponse(sectionKey='audit_information', title='Chain of Custody & Audit Trails', content=f'Report compiled and authenticated by {current_user.fullName} ({current_user.badgeNumber}).')
    ]

    report = ReportResponse(
        reportId=f'RPT-2024-{req.caseId}',
        caseId=req.caseId,
        caseTitle=case_summary['title'],
        generatedAt=now,
        generatedBy=current_user.fullName,
        sections=sections,
        bsaSection65BCertificate=bsa_cert,
        exportUrl=f'/api/v1/reports/export/RPT-2024-{req.caseId}.pdf'
    )
    return ResponseEnvelope(data=report)
