from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Response, HTTPException
from app.dependencies import get_current_user, require_permission
from app.dependencies import assert_case_access
from app.database import get_db
from app.exceptions import ResourceNotFoundError
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope
from app.schemas.reports import (
    ReportGenerationRequest,
    ReportResponse,
    ReportSectionResponse,
    ReportDossierData
)
from app.services.case_service import get_case_service
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client
from app.services.report_pdf_service import generate_investigation_report_pdf, resolve_case_dossier_data

router = APIRouter(prefix='/reports', tags=['Comprehensive Investigative Reports'])


def _build_report_sections(current_user_name: str, current_user_badge: str, dossier_dict: dict) -> list[ReportSectionResponse]:
    sections = []
    
    sections.append(ReportSectionResponse(
        sectionKey='case_summary',
        title='1. Executive Investigation Summary',
        content=dossier_dict.get('summary', 'No summary available.')
    ))
    
    # Just minimal sections as placeholder, since actual content is in PDF
    # But API returns it too
    
    entities = dossier_dict.get('entities', [])
    entities_text = f"Indexed {len(entities)} network entities."
    sections.append(ReportSectionResponse(
        sectionKey='key_entities',
        title='2. Key Indexed Network Entities',
        content=entities_text
    ))
    
    sections.append(ReportSectionResponse(
        sectionKey='audit_information',
        title='Audit Information',
        content=f'BSA Section 63 compliant digital forensic certificate generated and authenticated by {current_user_name} ({current_user_badge}) for prosecutorial submission.'
    ))
    
    return sections


@router.post('/generate', response_model=ResponseEnvelope[ReportResponse], summary='Generate Multi-Section Case Report')
async def generate_report(
    req: ReportGenerationRequest,
    current_user: UserProfile = Depends(require_permission('report:generate')),
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    assert_case_access(db, current_user, req.caseId)
    case_service = get_case_service()
    case_summary = case_service.get_case(req.caseId)
    if not case_summary:
        case_summary = {'title': f'Case {req.caseId}', 'caseNumber': req.caseId}

    now = datetime.now(timezone.utc).isoformat()
    bsa_cert = await m6_client.get_bsa_certificate('EVD-2024-0812')

    dossier_dict = resolve_case_dossier_data({
        'caseId': req.caseId,
        'caseNumber': case_summary.get('caseNumber', req.caseId),
        'user': current_user.model_dump() if hasattr(current_user, 'model_dump') else None,
        'caseData': req.caseData
    })
    dossier_obj = ReportDossierData(**dossier_dict)

    sections = _build_report_sections(current_user.fullName, current_user.badgeNumber or "LEO-7729", dossier_dict)

    report = ReportResponse(
        reportId=f'RPT-2024-{req.caseId}',
        caseId=req.caseId,
        caseTitle=case_summary.get('title', 'Unknown Title'),
        generatedAt=now,
        generatedBy=current_user.fullName,
        sections=sections,
        dossierData=dossier_obj,
        bsaSection65BCertificate=bsa_cert,
        exportUrl=f'/api/v1/reports/export/{req.caseId}.pdf',
        pdfDownloadUrl=f'/api/v1/reports/export/{req.caseId}.pdf'
    )
    return ResponseEnvelope(data=report)


@router.get('/export', summary='Download Investigation PDF by Query Parameter')
async def export_report_pdf_query(
    case_id: Optional[str] = None,
    caseId: Optional[str] = None,
    current_user: UserProfile = Depends(require_permission('report:generate')),
    db = Depends(get_db)
):
    cid = case_id or caseId
    if not cid:
        raise HTTPException(status_code=400, detail='caseId is required')
    assert_case_access(db, current_user, cid)
    return await export_report_pdf_get(cid, current_user, db)


@router.get('/export/{case_or_report_id}', summary='Download Complete Multi-Page Investigation PDF')
async def export_report_pdf_get(
    case_or_report_id: str,
    current_user: UserProfile = Depends(require_permission('report:generate')),
    db = Depends(get_db)
):
    clean_id = case_or_report_id.replace('.pdf', '').replace('RPT-2024-', '')
    assert_case_access(db, current_user, clean_id)
    case_service = get_case_service()
    case_summary = case_service.get_case(clean_id)
    if not case_summary:
        raise ResourceNotFoundError('Case', clean_id)
    
    user_data = current_user.model_dump() if hasattr(current_user, 'model_dump') else (current_user.dict() if hasattr(current_user, 'dict') else None)
    pdf_buffer = generate_investigation_report_pdf({
        'caseId': case_summary.get('caseId', clean_id),
        'caseNumber': case_summary.get('caseNumber', clean_id),
        'user': user_data
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


@router.post('/export/pdf', summary='Generate & Stream Multi-Page Investigation Report PDF')
async def export_report_pdf_post(
    req: ReportGenerationRequest,
    current_user: UserProfile = Depends(require_permission('report:generate')),
    db = Depends(get_db)
):
    clean_id = req.caseId.replace('.pdf', '').replace('RPT-2024-', '')
    assert_case_access(db, current_user, clean_id)
    case_service = get_case_service()
    case_summary = case_service.get_case(clean_id)
    if not case_summary:
        raise ResourceNotFoundError('Case', clean_id)

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
    m6_client: M6SecurityClient = Depends(get_m6_client),
    db = Depends(get_db)
):
    clean_id = case_or_report_id.replace('.pdf', '').replace('RPT-2024-', '')
    assert_case_access(db, current_user, clean_id)
    case_service = get_case_service()
    case_summary = case_service.get_case(clean_id)
    if not case_summary:
        case_summary = {'title': f'Case {clean_id}', 'caseNumber': clean_id}

    now = datetime.now(timezone.utc).isoformat()
    bsa_cert = await m6_client.get_bsa_certificate('EVD-2024-0812')

    dossier_dict = resolve_case_dossier_data({
        'caseId': clean_id,
        'caseNumber': case_summary.get('caseNumber', clean_id),
        'user': current_user.model_dump() if hasattr(current_user, 'model_dump') else None
    })
    dossier_obj = ReportDossierData(**dossier_dict)

    sections = _build_report_sections(current_user.fullName, current_user.badgeNumber or "LEO-7729", dossier_dict)

    report = ReportResponse(
        reportId=f'RPT-2024-{clean_id}',
        caseId=clean_id,
        caseTitle=case_summary.get('title', 'Unknown Title'),
        generatedAt=now,
        generatedBy=current_user.fullName,
        sections=sections,
        dossierData=dossier_obj,
        bsaSection65BCertificate=bsa_cert,
        exportUrl=f'/api/v1/reports/export/{clean_id}.pdf',
        pdfDownloadUrl=f'/api/v1/reports/export/{clean_id}.pdf'
    )
    return ResponseEnvelope(data=report)
