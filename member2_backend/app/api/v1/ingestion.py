import io
from typing import Optional, List
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status, HTTPException
from app.dependencies import require_permission, get_current_user
from app.schemas.auth import UserProfile
from app.schemas.common import ResponseEnvelope, PaginatedResponse, PaginationMeta
from app.schemas.ingestion import (
    DataIngestUploadResponse,
    IngestJobStatusResponse,
    CsvValidationResponse
)
from app.services.ingestion_service import (
    IngestionService,
    get_ingestion_service,
    get_ingest_job,
    get_all_ingest_jobs
)
from app.services.m6_security_evidence import M6SecurityClient, get_m6_client

router = APIRouter(prefix='', tags=['Data Ingestion & Extraction Orchestration'])

@router.post('/upload', response_model=ResponseEnvelope[DataIngestUploadResponse], status_code=status.HTTP_202_ACCEPTED, summary='Upload & Ingest Document / Dataset')
async def upload_document(
    file: UploadFile = File(...),
    docType: Optional[str] = Form(None),
    doc_type: Optional[str] = Form(None),
    caseId: Optional[str] = Form(None),
    case_id: Optional[str] = Form(None),
    current_user: UserProfile = Depends(require_permission('ingest:upload')),
    ingest_svc: IngestionService = Depends(get_ingestion_service),
    m6_client: M6SecurityClient = Depends(get_m6_client)
):
    """
    Accepts CSV, PDF, or image files, runs validation, extracts entities and relationships,
    indexes into knowledge graph and vector RAG, and registers cryptographic evidence.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="INVALID FILE: Filename is empty.")

    raw_case_id = (caseId if caseId and str(caseId).strip() else None) or (case_id if case_id and str(case_id).strip() else None)
    target_case_id = str(raw_case_id).strip() if raw_case_id else 'CASE-2025-M3-DATASET'
    
    content = await file.read()
    
    # Audit log start
    await m6_client.log_audit_event({
        'action': 'FILE_UPLOAD_INITIATED',
        'fileName': file.filename,
        'caseId': target_case_id,
        'officer': current_user.fullName
    })

    # Process upload through pipeline
    job_status = await ingest_svc.process_file_upload(
        file_bytes=content,
        filename=file.filename,
        case_id=target_case_id,
        uploader=current_user.fullName,
        content_type=file.content_type
    )

    # Audit log completion
    await m6_client.log_audit_event({
        'action': 'FILE_INGESTION_COMPLETED',
        'jobId': job_status.jobId,
        'fileName': file.filename,
        'caseId': target_case_id,
        'evidenceId': job_status.evidenceId,
        'sha256': job_status.sha256Hash,
        'officer': current_user.fullName
    })

    upload_res = DataIngestUploadResponse(
        jobId=job_status.jobId,
        fileId=job_status.fileId,
        fileName=file.filename,
        fileSizeBytes=len(content),
        docType=job_status.docType,
        status=job_status.status,
        uploadedAt=job_status.startedAt or '',
        caseId=target_case_id,
        message='Document processed and extracted entities integrated into knowledge graph.'
    )
    return ResponseEnvelope(data=upload_res)


@router.get('/status/{job_id}', response_model=ResponseEnvelope[IngestJobStatusResponse], summary='Get Ingestion Job Status by Job ID')
@router.get('/jobs/{job_id}', response_model=ResponseEnvelope[IngestJobStatusResponse], summary='Get Ingestion Job Status (Alias)')
async def get_job_status(job_id: str, current_user: UserProfile = Depends(require_permission('ingest:upload'))):
    """Returns lifecycle status, stage, records, extracted entities, and SHA-256 hash."""
    job = get_ingest_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return ResponseEnvelope(data=IngestJobStatusResponse(**job))


@router.get('/jobs', response_model=PaginatedResponse[IngestJobStatusResponse], summary='List Recent Ingestion Jobs')
async def list_ingest_jobs(
    caseId: Optional[str] = Query(None),
    case_id: Optional[str] = Query(None),
    page: int = 1,
    pageSize: int = 20,
    current_user: UserProfile = Depends(require_permission('ingest:upload'))
):
    """Returns list of recent uploads and ingestion jobs."""
    target_case = caseId or case_id
    jobs = get_all_ingest_jobs(case_id=target_case if target_case else None)
    items = [IngestJobStatusResponse(**j) for j in jobs]
    return PaginatedResponse(
        items=items,
        pagination=PaginationMeta(
            page=page,
            pageSize=pageSize,
            totalRecords=len(items),
            totalPages=1
        )
    )


@router.post('/validate', response_model=ResponseEnvelope[CsvValidationResponse], summary='Validate CSV File & Preview Schema')
async def validate_csv(
    file: UploadFile = File(...),
    ingest_svc: IngestionService = Depends(get_ingestion_service),
    current_user: UserProfile = Depends(require_permission('ingest:upload'))
):
    """
    Pre-upload validation endpoint: inspects columns, detects known schemas,
    counts valid and duplicate rows, and provides a sample preview.
    """
    content = await file.read()
    res = ingest_svc.validate_csv_content(content, file.filename or 'upload.csv')
    return ResponseEnvelope(data=res)
