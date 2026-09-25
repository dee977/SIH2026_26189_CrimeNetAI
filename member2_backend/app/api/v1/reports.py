from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response
from app.dependencies import get_current_user, require_permission
from app.exceptions import ResourceNotFoundError
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.schemas.reports import (
    ReportGenerationRequest,
    ReportResponse,
    ReportSectionResponse,
    ReportDossierData
)
from app.services.demo_data import DEMO_CASES
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client
from app.services.report_pdf_service import generate_investigation_report_pdf, resolve_case_dossier_data

router = APIRouter(prefix='/reports', tags=['Comprehensive Investigative Reports'])


def _build_report_sections(current_user_name: str, current_user_badge: str) -> list[ReportSectionResponse]:
    return [
        ReportSectionResponse(
            sectionKey='case_summary',
            title='1. Executive Investigation Summary',
            content='Operation Blue Tide unraveled an organized contraband import syndicate operating through fictitious shipping manifests, shell clearing companies, and offshore hawala conduits along the Mumbai-Surat maritime corridor. Joint preventive raid on 14 August 2024 at Nhava Sheva Port Yard 4B intercepted container #MRKU-982141-0, recovering 42.5 kg concealed illicit contraband behind false insulation bulkheads.'
        ),
        ReportSectionResponse(
            sectionKey='key_entities',
            title='2. Key Indexed Network Entities',
            content='Indexed network entities: Vikram Malhotra (ENT-PERS-001 - Primary Consignee), Rajesh K. Sharma (ENT-PERS-002 - Surat Financial Broker), BlueSea Logistics & Trading Pvt Ltd (ENT-ORG-001 - Shell Clearing Entity), HDFC Account 9921-4820 (ENT-BANK-001 - Pooling Account), +91-98201-99412 (ENT-PHON-001 - Target Burner Handset).'
        ),
        ReportSectionResponse(
            sectionKey='network_findings',
            title='3. Network Graph Intelligence Findings (M5 Traversal)',
            content='Documented 6-Hop Multi-Hop Conduit: Vikram Malhotra (Person) -> +91-98201-99412 (Phone) -> Call 342s (01:04 AM) -> Rajesh K. Sharma (Person) -> HDFC Account 9921-4820 (Bank) -> TXN-90214 ₹15,00,000 (NEFT) -> BlueSea Logistics & Trading Pvt Ltd (Shell Org) -> Container #MRKU-982141-0 (Contraband Seizure).'
        ),
        ReportSectionResponse(
            sectionKey='discrepancies',
            title='4. Evidentiary Discrepancies (Cross-Verification)',
            content='2 Critical Discrepancies Detected: DISCREPANCY-001 (Contradiction between accused Pune hotel alibi statement and Airtel Sector 4 cell tower radio ping 120km away at Nhava Sheva Port); DISCREPANCY-002 (Declared cargo manifest of 18,200 kg dates vs customs physical search revealing 42.5 kg concealed narcotics).'
        ),
        ReportSectionResponse(
            sectionKey='evidence_integrity',
            title='5. Cryptographic Evidence Integrity (M6 Ledger)',
            content='Cryptographic Ledger Audit: EVD-2024-0812 (Phone Forensics - Genesis SHA-256 MATCH), EVD-2024-0813 (HDFC Bank Ledger - Genesis SHA-256 MATCH), EVD-2024-0814 (Airtel CDR Dump - Genesis SHA-256 MISMATCH ALERT, unauthorized alteration detected and quarantined).'
        ),
        ReportSectionResponse(
            sectionKey='timeline',
            title='6. Chronological Case Timeline',
            content='Key Milestone Events: 2024-08-10 16:00 IGM manifest filed; 2024-08-14 01:04 342s call between Malhotra and Sharma; 2024-08-14 01:18 ₹15L NEFT debit wire; 2024-08-14 02:30 container intercepted; 2024-08-14 04:00 suspect apprehended and phone seized.'
        ),
        ReportSectionResponse(
            sectionKey='audit_information',
            title='7. Formal Attestation & Judicial Certification',
            content=f'BSA Section 63 compliant digital forensic certificate generated and authenticated by {current_user_name} ({current_user_badge}) for prosecutorial submission.'
        )
    ]


@router.post('/generate', response_model=ResponseEnvelope[ReportResponse], summary='Generate Multi-Section Case Report')
async def generate_report(
    req: ReportGenerationRequest,
    current_user: UserProfile = Depends(require_permission('report:generate')),
    m6_client: M6SecurityClient = Depends(get_m6_client)
):
    case_summary = next((c for c in DEMO_CASES if c.get('caseId') == req.caseId or c.get('caseNumber') == req.caseId), None)
    if not case_summary:
        case_summary = DEMO_CASES[0]

    now = datetime.now(timezone.utc).isoformat()
    bsa_cert = await m6_client.get_bsa_certificate('EVD-2024-0812')

    dossier_dict = resolve_case_dossier_data({
        'caseId': req.caseId,
        'caseNumber': case_summary.get('caseNumber', req.caseId),
        'user': current_user.model_dump() if hasattr(current_user, 'model_dump') else None,
        'caseData': req.caseData
    })
    dossier_obj = ReportDossierData(**dossier_dict)

    sections = _build_report_sections(current_user.fullName, current_user.badgeNumber or "LEO-7729")

    report = ReportResponse(
        reportId=f'RPT-2024-{req.caseId}',
        caseId=req.caseId,
        caseTitle=case_summary.get('title', 'Operation Blue Tide'),
        generatedAt=now,
        generatedBy=current_user.fullName,
        sections=sections,
        dossierData=dossier_obj,
        bsaSection65BCertificate=bsa_cert,
        exportUrl=f'/api/v1/reports/export/{req.caseId}.pdf',
        pdfDownloadUrl=f'/api/v1/reports/export/{req.caseId}.pdf'
    )
    return ResponseEnvelope(data=report)


@router.get('/export/{case_or_report_id}', summary='Download Complete Multi-Page Investigation PDF')
async def export_report_pdf_get(case_or_report_id: str):
    clean_id = case_or_report_id.replace('.pdf', '').replace('RPT-2024-', '')
    case_summary = next((c for c in DEMO_CASES if c.get('caseId') == clean_id or c.get('caseNumber') == clean_id), DEMO_CASES[0])
    
    pdf_buffer = generate_investigation_report_pdf({'caseId': clean_id, 'caseNumber': case_summary.get('caseNumber', clean_id)})
    pdf_bytes = pdf_buffer.getvalue()

    filename = f"Investigation_Report_{clean_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Content-Type": "application/pdf"
        }
    )


@router.post('/export/pdf', summary='Generate & Stream Multi-Page Investigation Report PDF')
async def export_report_pdf_post(
    req: ReportGenerationRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    clean_id = req.caseId.replace('.pdf', '').replace('RPT-2024-', '')
    case_summary = next((c for c in DEMO_CASES if c.get('caseId') == clean_id or c.get('caseNumber') == clean_id), DEMO_CASES[0])

    pdf_buffer = generate_investigation_report_pdf({
        'caseId': clean_id,
        'caseNumber': case_summary.get('caseNumber', clean_id),
        'user': current_user.model_dump() if hasattr(current_user, 'model_dump') else (current_user.dict() if current_user else None),
        'caseData': req.caseData
    })
    pdf_bytes = pdf_buffer.getvalue()

    filename = f"Investigation_Report_{clean_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"",
            "Content-Type": "application/pdf"
        }
    )


@router.get('/{case_or_report_id}', response_model=ResponseEnvelope[ReportResponse], summary='Get Investigation Report Data')
async def get_report_data(
    case_or_report_id: str,
    current_user: UserProfile = Depends(get_current_user),
    m6_client: M6SecurityClient = Depends(get_m6_client)
):
    clean_id = case_or_report_id.replace('.pdf', '').replace('RPT-2024-', '')
    case_summary = next((c for c in DEMO_CASES if c.get('caseId') == clean_id or c.get('caseNumber') == clean_id), None)
    if not case_summary:
        case_summary = DEMO_CASES[0]

    now = datetime.now(timezone.utc).isoformat()
    bsa_cert = await m6_client.get_bsa_certificate('EVD-2024-0812')

    dossier_dict = resolve_case_dossier_data({
        'caseId': clean_id,
        'caseNumber': case_summary.get('caseNumber', clean_id),
        'user': current_user.model_dump() if hasattr(current_user, 'model_dump') else None
    })
    dossier_obj = ReportDossierData(**dossier_dict)

    sections = _build_report_sections(current_user.fullName, current_user.badgeNumber or "LEO-7729")

    report = ReportResponse(
        reportId=f'RPT-2024-{clean_id}',
        caseId=clean_id,
        caseTitle=case_summary.get('title', 'Operation Blue Tide'),
        generatedAt=now,
        generatedBy=current_user.fullName,
        sections=sections,
        dossierData=dossier_obj,
        bsaSection65BCertificate=bsa_cert,
        exportUrl=f'/api/v1/reports/export/{clean_id}.pdf',
        pdfDownloadUrl=f'/api/v1/reports/export/{clean_id}.pdf'
    )
    return ResponseEnvelope(data=report)
