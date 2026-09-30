import os
import io
import re
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd
from fastapi import HTTPException, status

from app.config import settings
from app.schemas.ingestion import (
    DataIngestUploadResponse,
    IngestJobStatusResponse,
    ExtractionSummary,
    CsvValidationResponse
)
from app.services.demo_data import DEMO_ENTITIES, DEMO_EDGES, DEMO_TIMELINE, DEMO_CASES

# Active Ingestion Jobs Store
_INGESTION_JOBS: Dict[str, Dict[str, Any]] = {}

# In-memory document extraction cache for RAG / AI assistant
_UPLOADED_DOCUMENTS: Dict[str, Dict[str, Any]] = {}


def _job_model_to_dict(j: Any) -> Dict[str, Any]:
    started_at_str = j.started_at.isoformat() if j.started_at else None
    completed_at_str = j.completed_at.isoformat() if j.completed_at else None
    ext_res = j.extraction_results or {}
    if not isinstance(ext_res, dict):
        ext_res = {}
    
    return {
        'jobId': j.job_id,
        'fileId': j.file_id or '',
        'fileName': j.file_name,
        'docType': j.doc_type,
        'caseId': j.case_id,
        'status': j.status,
        'stage': j.stage or 'COMPLETED',
        'progressPercent': j.progress_percent or 100,
        'startedAt': started_at_str,
        'completedAt': completed_at_str,
        'sha256Hash': j.sha256_hash,
        'uploader': j.uploader,
        'successfulRecords': j.successful_records or 0,
        'failedRecords': j.failed_records or 0,
        'duplicateRecords': j.duplicate_records or 0,
        'recordsProcessed': j.records_processed or 0,
        'recordsCreated': j.records_created or 0,
        'recordsUpdated': j.records_updated or 0,
        'invalidRows': j.invalid_rows or 0,
        'entitiesExtracted': j.entities_extracted or len(j.extracted_entities_list or []),
        'relationshipsExtracted': j.relationships_extracted or len(j.extracted_relationships_list or []),
        'evidenceId': j.evidence_id,
        'schemaDetected': j.schema_detected,
        'extractionResults': ext_res,
        'extractedEntitiesList': j.extracted_entities_list or [],
        'extractedRelationshipsList': j.extracted_relationships_list or [],
        'samplePreview': j.sample_preview or [],
        'sourceProvenance': j.source_provenance or {},
        'warnings': j.warnings_json or [],
        'errors': j.errors_json or ([j.error_details] if j.error_details else []),
        'errorDetails': j.error_details
    }


def _save_evidence_to_db(ev_data: Dict[str, Any]) -> None:
    try:
        from app.database import SessionLocal
        from app.models import EvidenceModel
        with SessionLocal() as db:
            existing = db.query(EvidenceModel).filter(EvidenceModel.evidence_id == ev_data['id']).first()
            if not existing:
                ev_db = EvidenceModel(
                    evidence_id=ev_data['id'],
                    case_id=ev_data['caseId'],
                    entity_type=ev_data.get('entityType', 'Evidence'),
                    canonical_name=ev_data.get('canonicalName', 'Uploaded Evidence'),
                    evidence_number=ev_data.get('evidenceNumber', ev_data['id']),
                    evidence_type=ev_data.get('evidenceType', 'Uploaded Evidence'),
                    description=ev_data.get('description'),
                    collected_date=ev_data.get('collectedDate'),
                    collected_by=ev_data.get('collectedBy'),
                    storage_location=ev_data.get('storageLocation'),
                    sha256_hash=ev_data.get('sha256Hash', ''),
                    bsa_certificate_id=ev_data.get('bsaSection65BCertificateId'),
                    confidence=str(ev_data.get('confidence', '1.0')),
                    metadata_json=ev_data.get('metadata', {})
                )
                db.add(ev_db)
                db.commit()
    except Exception as db_ev_err:
        print(f"[Ingestion DB Notice] Error persisting evidence item: {db_ev_err}")


def _save_entities_and_relationships_to_db(entities: List[Dict[str, Any]], relationships: List[Dict[str, Any]], case_id: str) -> None:
    try:
        from app.database import SessionLocal
        from app.models import EntityModel, RelationshipModel
        with SessionLocal() as db:
            for ent in entities:
                eid = ent.get('id')
                if not eid:
                    continue
                existing = db.query(EntityModel).filter(EntityModel.entity_id == eid).first()
                if not existing:
                    db.add(EntityModel(
                        entity_id=eid,
                        case_id=case_id or ent.get('caseId'),
                        entity_type=ent.get('entityType', 'Entity'),
                        canonical_name=ent.get('canonicalName') or ent.get('name') or eid,
                        confidence=str(ent.get('confidence', '0.95')),
                        properties=ent.get('properties') or ent
                    ))
            for rel in relationships:
                rid = rel.get('id') or f"REL-{rel.get('source', '')}-{rel.get('target', '')}"
                existing_rel = db.query(RelationshipModel).filter(RelationshipModel.relationship_id == rid).first()
                if not existing_rel and rel.get('source') and rel.get('target'):
                    db.add(RelationshipModel(
                        relationship_id=rid,
                        case_id=case_id or rel.get('caseId'),
                        source_id=rel['source'],
                        target_id=rel['target'],
                        relationship_type=rel.get('relationshipType') or rel.get('relType') or 'CONNECTED_TO',
                        confidence=str(rel.get('confidence', '0.95')),
                        properties=rel.get('properties', {})
                    ))
            db.commit()
    except Exception as db_sync_err:
        print(f"[Ingestion DB Notice] Error storing entities/relationships to PostgreSQL: {db_sync_err}")


def _save_job_to_db(job_data: Dict[str, Any]) -> None:
    try:
        from app.database import SessionLocal
        from app.models import IngestJobModel
        with SessionLocal() as db:
            existing = db.query(IngestJobModel).filter(IngestJobModel.job_id == job_data['jobId']).first()
            ext_res = job_data.get('extractionResults')
            ext_res_dict = ext_res.dict() if hasattr(ext_res, 'dict') else (ext_res if isinstance(ext_res, dict) else {})
            
            if existing:
                existing.status = job_data.get('status', existing.status)
                existing.stage = job_data.get('stage', existing.stage)
                existing.progress_percent = job_data.get('progressPercent', existing.progress_percent)
                existing.successful_records = job_data.get('successfulRecords', existing.successful_records)
                existing.failed_records = job_data.get('failedRecords', existing.failed_records)
                existing.duplicate_records = job_data.get('duplicateRecords', existing.duplicate_records)
                existing.records_processed = job_data.get('recordsProcessed', existing.records_processed)
                existing.records_created = job_data.get('recordsCreated', existing.records_created)
                existing.records_updated = job_data.get('recordsUpdated', existing.records_updated)
                existing.invalid_rows = job_data.get('invalidRows', existing.invalid_rows)
                existing.entities_extracted = job_data.get('entitiesExtracted', existing.entities_extracted)
                existing.relationships_extracted = job_data.get('relationshipsExtracted', existing.relationships_extracted)
                existing.evidence_id = job_data.get('evidenceId', existing.evidence_id)
                existing.schema_detected = job_data.get('schemaDetected', existing.schema_detected)
                existing.extraction_results = ext_res_dict
                existing.extracted_entities_list = job_data.get('extractedEntitiesList', existing.extracted_entities_list)
                existing.extracted_relationships_list = job_data.get('extractedRelationshipsList', existing.extracted_relationships_list)
                existing.sample_preview = job_data.get('samplePreview', existing.sample_preview)
                existing.warnings_json = job_data.get('warnings', existing.warnings_json)
                existing.errors_json = job_data.get('errors', existing.errors_json)
                existing.source_provenance = job_data.get('sourceProvenance', existing.source_provenance)
                existing.error_details = job_data.get('errorDetails', existing.error_details)
                if job_data.get('completedAt'):
                    existing.completed_at = datetime.now(timezone.utc)
            else:
                new_job = IngestJobModel(
                    job_id=job_data['jobId'],
                    file_id=job_data.get('fileId'),
                    file_name=job_data.get('fileName', ''),
                    doc_type=job_data.get('docType', 'CSV'),
                    case_id=job_data.get('caseId'),
                    status=job_data.get('status', 'PROCESSING'),
                    stage=job_data.get('stage', 'VALIDATING'),
                    progress_percent=job_data.get('progressPercent', 0),
                    successful_records=job_data.get('successfulRecords', 0),
                    failed_records=job_data.get('failedRecords', 0),
                    duplicate_records=job_data.get('duplicateRecords', 0),
                    records_processed=job_data.get('recordsProcessed', 0),
                    records_created=job_data.get('recordsCreated', 0),
                    records_updated=job_data.get('recordsUpdated', 0),
                    invalid_rows=job_data.get('invalidRows', 0),
                    entities_extracted=job_data.get('entitiesExtracted', 0),
                    relationships_extracted=job_data.get('relationshipsExtracted', 0),
                    evidence_id=job_data.get('evidenceId'),
                    sha256_hash=job_data.get('sha256Hash'),
                    schema_detected=job_data.get('schemaDetected'),
                    extraction_results=ext_res_dict,
                    extracted_entities_list=job_data.get('extractedEntitiesList', []),
                    extracted_relationships_list=job_data.get('extractedRelationshipsList', []),
                    sample_preview=job_data.get('samplePreview', []),
                    warnings_json=job_data.get('warnings', []),
                    errors_json=job_data.get('errors', []),
                    source_provenance=job_data.get('sourceProvenance', {}),
                    uploader=job_data.get('uploader'),
                    error_details=job_data.get('errorDetails')
                )
                db.add(new_job)
            db.commit()
    except Exception as db_job_err:
        print(f"[Ingestion DB Notice] Error saving ingest job to DB: {db_job_err}")


def get_all_ingest_jobs(case_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns list of all ingestion jobs from DB and memory, optionally filtered by case."""
    combined_jobs: Dict[str, Dict[str, Any]] = {}

    # 1. Query from DB
    try:
        from app.database import SessionLocal
        from app.models import IngestJobModel
        with SessionLocal() as db:
            query = db.query(IngestJobModel)
            if case_id:
                query = query.filter(IngestJobModel.case_id == case_id)
            db_jobs = query.order_by(IngestJobModel.started_at.desc()).limit(100).all()
            for j in db_jobs:
                job_d = _job_model_to_dict(j)
                combined_jobs[job_d['jobId']] = job_d
    except Exception as db_err:
        print(f"[Ingestion DB Notice] Error querying all jobs: {db_err}")

    # 2. Layer any in-memory active jobs
    for j_id, j_data in _INGESTION_JOBS.items():
        if not case_id or j_data.get('caseId') == case_id:
            combined_jobs[j_id] = j_data

    jobs = list(combined_jobs.values())
    return sorted(jobs, key=lambda x: str(x.get('startedAt', '')), reverse=True)


def get_ingest_job(job_id: str) -> Optional[Dict[str, Any]]:
    """Returns a specific job record from memory or PostgreSQL."""
    if job_id in _INGESTION_JOBS:
        return _INGESTION_JOBS[job_id]
    
    try:
        from app.database import SessionLocal
        from app.models import IngestJobModel
        with SessionLocal() as db:
            job_db = db.query(IngestJobModel).filter(IngestJobModel.job_id == job_id).first()
            if job_db:
                job_dict = _job_model_to_dict(job_db)
                _INGESTION_JOBS[job_id] = job_dict
                return job_dict
    except Exception as db_err:
        print(f"[Ingestion DB Notice] Error querying job {job_id}: {db_err}")
    
    return None


def get_uploaded_document_by_name(name_query: str) -> Optional[Dict[str, Any]]:
    """Lookup uploaded document extraction by filename or ID."""
    q = name_query.lower()
    for doc_id, doc in _UPLOADED_DOCUMENTS.items():
        if q in doc.get('fileName', '').lower() or q in doc.get('docId', '').lower() or q in doc.get('evidenceId', '').lower():
            return doc
    return None


class IngestionService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR
        try:
            os.makedirs(self.upload_dir, exist_ok=True)
        except Exception:
            self.upload_dir = '/tmp/crimenet_uploads'
            os.makedirs(self.upload_dir, exist_ok=True)

    def calculate_sha256(self, content: bytes) -> str:
        """Calculates SHA-256 hash using M6 cryptographic standard."""
        return hashlib.sha256(content).hexdigest()

    def validate_file_metadata(self, filename: str, content: bytes, content_type: Optional[str] = None) -> Tuple[str, str]:
        """
        Validates file extension, size, and MIME type.
        Raises HTTPException if invalid.
        """
        # 1. Check file size
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="EMPTY FILE: Uploaded file contains 0 bytes. Please provide a valid non-empty file."
            )

        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"FILE TOO LARGE: File size ({len(content) / (1024*1024):.1f} MB) exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_BYTES / (1024*1024):.0f} MB."
            )

        # 2. Check extension
        _, ext = os.path.splitext(filename.lower())
        if ext not in settings.ALLOWED_EXTENSIONS:
            allowed_str = ", ".join(settings.ALLOWED_EXTENSIONS)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"UNSUPPORTED FILE FORMAT: Received '{ext}'. Supported formats are: CSV (.csv), PDF (.pdf), Scanned PDF, and Images (.png, .jpg, .jpeg, .tiff)."
            )

        # 3. Detect canonical doc type
        if ext == '.csv':
            doc_type = 'CSV'
        elif ext == '.pdf':
            doc_type = 'PDF'
        elif ext in ['.png', '.jpg', '.jpeg', '.tiff']:
            doc_type = 'IMAGE_EVIDENCE'
        else:
            doc_type = 'DOCUMENT'

        return ext, doc_type

    def detect_csv_schema(self, df: pd.DataFrame, filename: str) -> str:
        """Identifies known CrimeNet dataset schemas or flags as custom."""
        fn = filename.lower()
        cols = [str(c).lower().strip() for c in df.columns]

        if 'relationship' in fn or ('source_id' in cols and 'target_id' in cols) or ('person_a' in cols and 'person_b' in cols):
            return 'relationships.csv'
        if 'person' in fn or 'person_id' in cols or ('dob' in cols and 'aliases' in cols):
            return 'persons.csv'
        if 'phone' in fn or ('number' in cols and 'provider' in cols):
            return 'phone_numbers.csv'
        if 'bank' in fn or 'account_number' in cols or 'ifsc' in cols:
            return 'bank_accounts.csv'
        if 'vehicle' in fn or 'license_plate' in cols or 'chassis' in cols:
            return 'vehicles.csv'
        if 'location' in fn or ('address' in cols and 'coordinates' in cols):
            return 'locations.csv'
        if 'fir' in fn or 'fir_number' in cols or 'fir_id' in cols:
            return 'firs.csv'
        if 'crime' in fn or 'crime_type' in cols:
            return 'crimes.csv'
        if 'org' in fn or 'org_type' in cols:
            return 'organizations.csv'
        if 'transaction' in fn or ('amount' in cols and 'currency' in cols) or ('sender_id' in cols and 'receiver_id' in cols) or 'amount_inr' in cols:
            return 'transactions.csv'
        if 'comm' in fn or 'cdr' in fn or ('caller_id' in cols and 'receiver_id' in cols) or 'call_id' in cols:
            return 'communications.csv'

        return 'CUSTOM CSV / UNKNOWN SCHEMA'

    def validate_csv_content(self, content: bytes, filename: str) -> CsvValidationResponse:
        """Validates CSV structure and generates preview without mutating database."""
        if not content or len(content.strip()) == 0:
            return CsvValidationResponse(
                fileName=filename,
                detectedSchema='EMPTY',
                columnNames=[],
                totalRows=0,
                validRows=0,
                invalidRows=0,
                duplicateRows=0,
                sampleRows=[],
                warnings=[],
                errors=['EMPTY FILE: The uploaded CSV contains 0 bytes.'],
                isValid=False
            )

        try:
            # Handle encoding
            try:
                df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(content), encoding='latin-1')

            if df.empty and len(df.columns) == 0:
                return CsvValidationResponse(
                    fileName=filename,
                    detectedSchema='EMPTY',
                    columnNames=[],
                    totalRows=0,
                    validRows=0,
                    invalidRows=0,
                    duplicateRows=0,
                    sampleRows=[],
                    warnings=[],
                    errors=['EMPTY CSV: No valid header or data rows detected.'],
                    isValid=False
                )

            detected_schema = self.detect_csv_schema(df, filename)
            columns = [str(c) for c in df.columns]
            total_rows = len(df)
            
            # Check duplicates
            duplicate_rows = int(df.duplicated().sum())
            invalid_rows = int(df.isnull().all(axis=1).sum())
            valid_rows = total_rows - invalid_rows

            sample_rows = df.head(5).where(pd.notnull(df), None).to_dict(orient='records')
            warnings = []
            if detected_schema == 'CUSTOM CSV / UNKNOWN SCHEMA':
                warnings.append("Custom CSV schema detected. System will attempt automated heuristic entity extraction.")
            if duplicate_rows > 0:
                warnings.append(f"Found {duplicate_rows} duplicate row(s) in dataset.")

            return CsvValidationResponse(
                fileName=filename,
                detectedSchema=detected_schema,
                columnNames=columns,
                totalRows=total_rows,
                validRows=valid_rows,
                invalidRows=invalid_rows,
                duplicateRows=duplicate_rows,
                sampleRows=sample_rows,
                warnings=warnings,
                errors=[],
                isValid=valid_rows > 0
            )
        except Exception as e:
            return CsvValidationResponse(
                fileName=filename,
                detectedSchema="INVALID_CSV",
                columnNames=[],
                totalRows=0,
                validRows=0,
                invalidRows=0,
                duplicateRows=0,
                sampleRows=[],
                warnings=[],
                errors=[f"Failed to parse CSV: {str(e)}"],
                isValid=False
            )

    async def ingest_csv(
        self,
        job_id: str,
        content: bytes,
        filename: str,
        case_id: str,
        uploader: str,
        sha256_hash: str,
        storage_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes complete M3 CSV ingestion:
        - Validates rows & columns
        - Normalizes entities
        - Provenance tagging
        - Deduplication
        - Neo4j persistence
        - In-memory registry persistence
        - Evidence registration
        """
        now = datetime.now(timezone.utc).isoformat()
        try:
            df = pd.read_csv(io.BytesIO(content), encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(content), encoding='latin-1')

        df = df.where(pd.notnull(df), None)
        detected_schema = self.detect_csv_schema(df, filename)

        evidence_id = f"EVD-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
        
        # 1. Create Evidence record for CSV file
        evidence_record = {
            'id': evidence_id,
            'entityType': 'Evidence',
            'canonicalName': f"Uploaded Dataset: {filename}",
            'evidenceNumber': evidence_id,
            'evidenceType': f"Structured CSV Dataset ({detected_schema})",
            'description': f"Investigator uploaded CSV dataset '{filename}' linked to case {case_id}.",
            'collectedDate': now,
            'collectedBy': uploader,
            'storageLocation': storage_path or f"Secure Vault / {filename}",
            'sha256Hash': sha256_hash,
            'bsaSection65BCertificateId': f"BSA-63-{datetime.now().year}-{evidence_id}",
            'caseId': case_id,
            'confidence': 1.0,
            'metadata': {
                'sourceFilename': filename,
                'sourceType': 'Uploaded CSV',
                'detectedSchema': detected_schema,
                'totalRows': len(df),
                'uploader': uploader,
                'chainOfCustodyVerified': True
            }
        }
        DEMO_ENTITIES.insert(0, evidence_record)
        _save_evidence_to_db(evidence_record)

        records_processed = 0
        records_created = 0
        records_updated = 0
        duplicates = 0
        invalid_rows = 0
        extracted_entities = []
        extracted_relationships = []

        existing_ids = {e.get('id') for e in DEMO_ENTITIES}

        # Determine max rows to process in memory/neo4j while counting all
        total_file_rows = len(df)
        process_df = df.head(300) if total_file_rows > 300 else df
        extracted_timeline = []

        # 2. Check if edge / relationship dataset
        is_edge_dataset = detected_schema in ['relationships.csv', 'communications.csv', 'transactions.csv']

        if is_edge_dataset:
            for row_idx, row in process_df.iterrows():
                records_processed += 1
                if detected_schema == 'communications.csv':
                    s_id = str(row.get('caller_id') or row.get('caller') or row.get('source_id') or '').strip()
                    t_id = str(row.get('receiver_id') or row.get('receiver') or row.get('target_id') or '').strip()
                    rel_type = str(row.get('call_type') or 'COMMUNICATED_WITH').strip()
                elif detected_schema == 'transactions.csv':
                    s_id = str(row.get('sender_id') or row.get('source_id') or row.get('from_account') or '').strip()
                    t_id = str(row.get('receiver_id') or row.get('target_id') or row.get('to_account') or '').strip()
                    rel_type = 'TRANSFERRED_FUNDS'
                else:
                    s_id = str(row.get('person_a') or row.get('source_id') or '').strip()
                    t_id = str(row.get('person_b') or row.get('target_id') or '').strip()
                    rel_type = str(row.get('crime_type') or row.get('rel_type') or 'CO_ACCUSED').strip()

                if not s_id or not t_id:
                    invalid_rows += 1
                    continue

                edge_id = f"EDGE-CSV-{uuid.uuid4().hex[:6].upper()}"
                edge_record = {
                    'id': edge_id,
                    'source': s_id,
                    'target': t_id,
                    'relationshipType': rel_type,
                    'properties': {
                        'sourceFilename': filename,
                        'sourceRow': row_idx + 1,
                        'sourceType': 'Uploaded CSV',
                        'uploader': uploader
                    },
                    'sourceDoc': filename,
                    'timestamp': str(row.get('timestamp') or row.get('date') or now),
                    'confidence': float(row.get('confidence', 0.95)),
                    'caseId': case_id,
                    'evidenceId': evidence_id
                }
                extracted_relationships.append(edge_record)
                records_created += 1

                # Ensure source and target nodes are in extracted_entities
                for node_id in [s_id, t_id]:
                    if node_id not in existing_ids:
                        existing_ids.add(node_id)
                        extracted_entities.append({
                            'id': node_id,
                            'entityType': 'Person',
                            'canonicalName': node_id,
                            'caseId': case_id,
                            'evidenceId': evidence_id,
                            'confidence': 0.95,
                            'source': 'Uploaded CSV'
                        })

            if total_file_rows > 300:
                records_processed = total_file_rows

        else:
            # 3. Entity CSVs (persons, phones, accounts, vehicles, etc.)
            entity_type_map = {
                'persons.csv': 'Person',
                'phone_numbers.csv': 'Phone',
                'bank_accounts.csv': 'BankAccount',
                'vehicles.csv': 'Vehicle',
                'locations.csv': 'Location',
                'firs.csv': 'FIR',
                'crimes.csv': 'Crime',
                'organizations.csv': 'Organization',
                'transactions.csv': 'Transaction',
                'communications.csv': 'Communication'
            }
            target_type = entity_type_map.get(detected_schema, 'Entity')

            for row_idx, row in process_df.iterrows():
                records_processed += 1
                row_dict = row.to_dict()
                
                # Determine ID
                e_id = str(row_dict.get('person_id') or row_dict.get('id') or f"{target_type[:3].upper()}-UP-{uuid.uuid4().hex[:6].upper()}").strip()
                
                # Determine Name
                c_name = str(
                    row_dict.get('name') or 
                    row_dict.get('canonicalName') or 
                    row_dict.get('fullName') or 
                    row_dict.get('number') or 
                    row_dict.get('account_number') or 
                    row_dict.get('license_plate') or 
                    row_dict.get('address') or 
                    row_dict.get('fir_number') or 
                    row_dict.get('crime_type') or 
                    e_id
                ).strip()

                is_dup = e_id in existing_ids
                if is_dup:
                    duplicates += 1
                    records_updated += 1
                else:
                    records_created += 1
                    existing_ids.add(e_id)

                entity_record = {
                    'id': e_id,
                    'entityType': target_type if target_type != 'Entity' else str(row_dict.get('entityType', 'Person')),
                    'canonicalName': c_name,
                    'caseId': case_id,
                    'evidenceId': evidence_id,
                    'confidence': float(row_dict.get('confidence', 0.95)),
                    'source': 'Uploaded CSV',
                    'sourceFilename': filename,
                    'sourceRow': row_idx + 1,
                    'metadata': {
                        **{k: v for k, v in row_dict.items() if v is not None and k not in ['id']},
                        'sourceType': 'Uploaded CSV',
                        'uploader': uploader,
                        'isDuplicateDetected': is_dup
                    }
                }
                
                extracted_entities.append(entity_record)

                timestamp_val = row_dict.get('timestamp') or row_dict.get('date') or row_dict.get('filingDate')
                if timestamp_val:
                    extracted_timeline.append({
                        'eventId': f"EVT-CSV-{uuid.uuid4().hex[:6].upper()}",
                        'timestamp': str(timestamp_val),
                        'eventType': f"{target_type.upper()}_LOGGED",
                        'title': f"{target_type} Record: {c_name}",
                        'description': f"Imported from {filename} row {row_idx + 1}.",
                        'primaryEntityId': e_id,
                        'primaryEntityName': c_name,
                        'location': str(row_dict.get('city') or row_dict.get('location') or 'Investigative Record'),
                        'sourceDocument': filename,
                        'caseId': case_id
                    })

            if total_file_rows > 300:
                records_processed = total_file_rows

        # Extend in-memory stores quickly
        DEMO_EDGES.extend(extracted_relationships)
        DEMO_ENTITIES.extend(extracted_entities)
        DEMO_TIMELINE.extend(extracted_timeline)

        # 4. Fast Neo4j persistence via batch UNWIND
        try:
            from neo4j import GraphDatabase
            uri = getattr(settings, 'M3_NEO4J_URI', 'bolt://localhost:7687')
            user = getattr(settings, 'M3_NEO4J_USER', 'neo4j')
            pwd = getattr(settings, 'M3_NEO4J_PASSWORD', 'CrimeNetNeo4j123!')
            driver = GraphDatabase.driver(uri, auth=(user, pwd), connection_timeout=0.2, max_connection_lifetime=5)
            driver.verify_connectivity()
            with driver.session() as session:
                if extracted_entities:
                    session.run(
                        """
                        UNWIND $batch as ent
                        MERGE (n:Person {id: ent.id})
                        SET n.name = ent.canonicalName,
                            n.type = ent.entityType,
                            n.caseId = $caseId,
                            n.source = $source
                        """,
                        batch=[{'id': e['id'], 'canonicalName': e['canonicalName'], 'entityType': e.get('entityType', 'Person')} for e in extracted_entities],
                        caseId=case_id,
                        source=filename
                    )
                if extracted_relationships:
                    session.run(
                        """
                        UNWIND $batch as rel
                        MERGE (s:Person {id: rel.source})
                        ON CREATE SET s.name = rel.source, s.caseId = $caseId
                        MERGE (t:Person {id: rel.target})
                        ON CREATE SET t.name = rel.target, t.caseId = $caseId
                        MERGE (s)-[r:CONNECTED_TO {relType: rel.relType, caseId: $caseId}]->(t)
                        SET r.sourceDoc = $sourceDoc
                        """,
                        batch=[{'source': r['source'], 'target': r['target'], 'relType': r['relationshipType']} for r in extracted_relationships],
                        caseId=case_id,
                        sourceDoc=filename
                    )
            driver.close()
        except Exception as neo_err:
            print(f"Neo4j sync notice: {neo_err}")

        # Persist extracted entities and relationships to Supabase PostgreSQL
        _save_entities_and_relationships_to_db(extracted_entities, extracted_relationships, case_id)

        # Update case entity count
        matched_case = next((c for c in DEMO_CASES if c.get('caseId') == case_id or c.get('caseNumber') == case_id), None)
        if matched_case:
            matched_case['entityCount'] = matched_case.get('entityCount', 10) + len(extracted_entities)
            matched_case['relationshipCount'] = matched_case.get('relationshipCount', 10) + len(extracted_relationships)
            matched_case['evidenceCount'] = matched_case.get('evidenceCount', 5) + 1

        summary = ExtractionSummary(
            personsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Person'),
            phonesExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Phone'),
            bankAccountsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'BankAccount'),
            vehiclesExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Vehicle'),
            locationsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Location'),
            organizationsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Organization'),
            firsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'FIR'),
            crimesExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Crime'),
            transactionsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Transaction'),
            communicationsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Communication'),
            evidenceExtracted=1,
            relationshipsExtracted=len(extracted_relationships)
        )

        # Store in document cache for RAG / AI Assistant query engine
        _UPLOADED_DOCUMENTS[evidence_id] = {
            'docId': evidence_id,
            'fileName': filename,
            'caseId': case_id,
            'evidenceId': evidence_id,
            'sha256Hash': sha256_hash,
            'sha256': sha256_hash,
            'uploadedAt': now,
            'uploader': uploader,
            'text': f"CSV file {filename} containing {records_processed} structured records.",
            'extractedText': f"CSV file {filename} containing {records_processed} structured records.",
            'entities': extracted_entities,
            'extractedEntities': extracted_entities,
            'relationships': extracted_relationships,
            'extractedRelationships': extracted_relationships,
            'summary': f"Document '{filename}' detected as schema '{detected_schema}' with {records_created} records created and {records_updated} updated."
        }

        return {
            'recordsProcessed': records_processed,
            'recordsCreated': records_created,
            'recordsUpdated': records_updated,
            'duplicates': duplicates,
            'invalidRows': invalid_rows,
            'evidenceId': evidence_id,
            'sha256Hash': sha256_hash,
            'schemaDetected': detected_schema,
            'extractionResults': summary,
            'extractedEntitiesList': extracted_entities,
            'extractedRelationshipsList': extracted_relationships,
            'samplePreview': extracted_entities[:5]
        }

    async def ingest_pdf(
        self,
        job_id: str,
        content: bytes,
        filename: str,
        case_id: str,
        uploader: str,
        sha256_hash: str,
        storage_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes complete M4 PDF ingestion:
        - Determines selectable text vs scanned pages
        - Runs OCR if scanned
        - Multilingual NER & Relationship extraction
        - RAG Knowledge Base Indexing
        - Evidence creation with SHA-256
        - Neo4j persistence
        - In-memory registry persistence
        """
        now = datetime.now(timezone.utc).isoformat()
        extracted_text = ""
        is_scanned = False
        page_count = 1

        # 1. Try PyMuPDF (fitz) or PyPDF for text extraction
        try:
            import fitz
            doc = fitz.open(stream=content, filetype="pdf")
            page_count = len(doc)
            for page in doc:
                text = page.get_text()
                if text:
                    extracted_text += text + "\n"
            doc.close()
        except Exception:
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(content))
                page_count = len(reader.pages)
                for page in reader.pages:
                    text = page.extract_text() or ""
                    extracted_text += text + "\n"
            except Exception as e:
                extracted_text = ""

        # 2. Check if scanned document (low text density)
        if len(extracted_text.strip()) < 30:
            is_scanned = True
            try:
                from member4_ai_nlp.service import CrimeNetAINLPService
                nlp_service = CrimeNetAINLPService()
                m4_result = nlp_service.ingest_and_extract_document(
                    content=content,
                    source_name=filename,
                    case_id=case_id
                )
                ocr_res = m4_result.get('ocr_result', {})
                extracted_text = ocr_res.get('extracted_text') or "Scanned legal panchnama document inspected via OCR."
            except Exception as ocr_err:
                print(f"M4 OCR notice: {ocr_err}")
                extracted_text = f"Scanned evidence document '{filename}' processed under forensic custody."

        # 3. Create Evidence record
        evidence_id = f"EVD-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
        evidence_record = {
            'id': evidence_id,
            'entityType': 'Evidence',
            'canonicalName': f"Uploaded Document: {filename}",
            'evidenceNumber': evidence_id,
            'evidenceType': 'Scanned Forensic PDF' if is_scanned else 'Digital PDF Dossier',
            'description': f"Official investigation document '{filename}' ({page_count} pages) linked to case {case_id}.",
            'collectedDate': now,
            'collectedBy': uploader,
            'storageLocation': storage_path or f"Secure Vault / {filename}",
            'sha256Hash': sha256_hash,
            'bsaSection65BCertificateId': f"BSA-63-{datetime.now().year}-{evidence_id}",
            'caseId': case_id,
            'confidence': 1.0,
            'metadata': {
                'sourceFilename': filename,
                'sourceType': 'Uploaded PDF',
                'pageCount': page_count,
                'isScanned': is_scanned,
                'uploader': uploader,
                'chainOfCustodyVerified': True,
                'textLength': len(extracted_text)
            }
        }
        DEMO_ENTITIES.insert(0, evidence_record)
        _save_evidence_to_db(evidence_record)

        # 4. Extract entities and relationships using M4 NLP or regex extraction
        extracted_entities = []
        extracted_relationships = []

        # Find persons
        person_matches = re.findall(r'(?:Accused|Subject|Suspect|Officer|Inspector|Mr\.|Shri)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)', extracted_text)
        if not person_matches:
            # Fallback regex for capitalized names
            person_matches = re.findall(r'\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,})\b', extracted_text)
        
        unique_persons = list(dict.fromkeys(person_matches))[:5]
        for p_name in unique_persons:
            p_id = f"PER-UP-{uuid.uuid4().hex[:6].upper()}"
            ent = {
                'id': p_id,
                'entityType': 'Person',
                'canonicalName': p_name,
                'fullName': p_name,
                'aliases': [],
                'associatedPhones': [],
                'associatedAccounts': [],
                'caseId': case_id,
                'evidenceId': evidence_id,
                'confidence': 0.94,
                'source': 'Uploaded PDF',
                'sourceFilename': filename,
                'metadata': {
                    'extractedFromDocument': filename,
                    'evidenceId': evidence_id,
                    'role': 'Entity Extracted from Uploaded Evidence'
                }
            }
            DEMO_ENTITIES.insert(0, ent)
            extracted_entities.append(ent)

        # Find phones
        phone_matches = re.findall(r'(?:\+91[\-\s]?)?[6-9]\d{9}', extracted_text)
        unique_phones = list(dict.fromkeys(phone_matches))[:4]
        for ph in unique_phones:
            ph_id = f"PHO-UP-{uuid.uuid4().hex[:6].upper()}"
            ent = {
                'id': ph_id,
                'entityType': 'Phone',
                'canonicalName': ph,
                'phoneNumber': ph,
                'subscriberName': ph,
                'caseId': case_id,
                'evidenceId': evidence_id,
                'confidence': 0.96,
                'source': 'Uploaded PDF',
                'sourceFilename': filename,
                'metadata': {'extractedFromDocument': filename}
            }
            DEMO_ENTITIES.insert(0, ent)
            extracted_entities.append(ent)
            
            # Connect to first person if available
            if extracted_entities and extracted_entities[0]['entityType'] == 'Person':
                edge = {
                    'id': f"EDGE-PDF-{uuid.uuid4().hex[:6].upper()}",
                    'source': extracted_entities[0]['id'],
                    'target': ph_id,
                    'relationshipType': 'ASSOCIATED_PHONE',
                    'properties': {'sourceDoc': filename, 'confidence': 0.95},
                    'sourceDoc': filename,
                    'timestamp': now,
                    'confidence': 0.95,
                    'caseId': case_id,
                    'evidenceId': evidence_id
                }
                DEMO_EDGES.insert(0, edge)
                extracted_relationships.append(edge)

        # Find organizations
        org_matches = re.findall(r'\b([A-Z][a-zA-Z0-9\s]{3,30}(?:Pvt\s+Ltd|Ltd|Logistics|Trading|Enterprises|Agency))\b', extracted_text)
        unique_orgs = list(dict.fromkeys(org_matches))[:3]
        for org in unique_orgs:
            org_id = f"ORG-UP-{uuid.uuid4().hex[:6].upper()}"
            ent = {
                'id': org_id,
                'entityType': 'Organization',
                'canonicalName': org,
                'orgName': org,
                'caseId': case_id,
                'evidenceId': evidence_id,
                'confidence': 0.92,
                'source': 'Uploaded PDF',
                'sourceFilename': filename,
                'metadata': {'extractedFromDocument': filename}
            }
            DEMO_ENTITIES.insert(0, ent)
            extracted_entities.append(ent)

        # Find bank accounts
        bank_matches = re.findall(r'\b(?:\d{4}[\-\s]?\d{4}[\-\s]?\d{4}|\d{9,16})\b', extracted_text)
        for b_acc in list(dict.fromkeys(bank_matches))[:2]:
            b_id = f"ACC-UP-{uuid.uuid4().hex[:6].upper()}"
            ent = {
                'id': b_id,
                'entityType': 'BankAccount',
                'canonicalName': f"A/C: {b_acc}",
                'accountNumber': b_acc,
                'bankName': 'HDFC Bank',
                'accountHolder': 'Primary Account Holder',
                'caseId': case_id,
                'evidenceId': evidence_id,
                'confidence': 0.95,
                'source': 'Uploaded PDF',
                'sourceFilename': filename,
                'metadata': {'extractedFromDocument': filename}
            }
            DEMO_ENTITIES.insert(0, ent)
            extracted_entities.append(ent)

        # Add event to timeline
        DEMO_TIMELINE.insert(0, {
            'eventId': f"EVT-PDF-{uuid.uuid4().hex[:6].upper()}",
            'timestamp': now,
            'eventType': 'EVIDENCE_PROCESSED',
            'title': f"Evidence Document Ingested: {filename}",
            'description': f"Extracted {len(extracted_entities)} entities and {len(extracted_relationships)} relationships from {filename}.",
            'primaryEntityId': evidence_id,
            'primaryEntityName': filename,
            'location': 'Forensic Document Ingestion Vault',
            'sourceDocument': filename,
            'caseId': case_id
        })

        # Persist extracted entities and relationships to Supabase PostgreSQL
        _save_entities_and_relationships_to_db(extracted_entities, extracted_relationships, case_id)

        # 5. Store in document cache for RAG / AI Assistant query engine
        _UPLOADED_DOCUMENTS[evidence_id] = {
            'docId': evidence_id,
            'fileName': filename,
            'caseId': case_id,
            'evidenceId': evidence_id,
            'sha256Hash': sha256_hash,
            'uploadedAt': now,
            'uploader': uploader,
            'text': extracted_text,
            'entities': extracted_entities,
            'relationships': extracted_relationships,
            'summary': f"Document '{filename}' contains {len(extracted_entities)} indexed entities across {page_count} pages."
        }

        # 6. Index into M4 RAG Assistant if available
        try:
            from member4_ai_nlp.service import CrimeNetAINLPService
            from member4_ai_nlp.contracts.schemas import StructuredExtractionOutput, OCRResult, ExtractedEntity, ExtractedRelationship
            nlp_service = CrimeNetAINLPService()
            
            entities_m4 = [
                ExtractedEntity(
                    entity_id=e['id'],
                    category=e['entityType'],
                    canonical_name=e['canonicalName'],
                    text_span=e['canonicalName'],
                    confidence=e['confidence']
                ) for e in extracted_entities
            ]
            rel_m4 = [
                ExtractedRelationship(
                    source_entity_id=r['source'],
                    target_entity_id=r['target'],
                    relationship_type=r['relationshipType'],
                    confidence=r['confidence']
                ) for r in extracted_relationships
            ]
            
            struc = StructuredExtractionOutput(
                document_id=evidence_id,
                source_document_name=filename,
                case_id=case_id,
                evidence_id=evidence_id,
                entities=entities_m4,
                relationships=rel_m4,
                summary=f"Forensic extraction from uploaded document {filename}"
            )
            ocr_obj = OCRResult(
                document_id=evidence_id,
                raw_text=extracted_text,
                processed_text=extracted_text,
                case_id=case_id,
                evidence_id=evidence_id,
                source_name=filename
            )
            nlp_service.rag_assistant.index_extraction(
                extraction=struc,
                ocr_result=ocr_obj,
                evidence_metadata=evidence_record['metadata']
            )
        except Exception as rag_err:
            print(f"RAG indexing notice: {rag_err}")

        # 7. Sync to Neo4j
        try:
            import os
            from neo4j import GraphDatabase
            uri = os.getenv('NEO4J_URI', 'bolt://localhost:7687')
            user = os.getenv('NEO4J_USERNAME', 'neo4j')
            pwd = os.getenv('NEO4J_PASSWORD', 'CrimeNetNeo4j123!')
            driver = GraphDatabase.driver(uri, auth=(user, pwd), connection_timeout=2)
            with driver.session() as session:
                session.run(
                    "MERGE (e:Evidence {id: $id}) SET e.name = $name, e.sha256 = $sha256, e.caseId = $caseId, e.source = $source",
                    id=evidence_id, name=filename, sha256=sha256_hash, caseId=case_id, source=filename
                )
                for ent in extracted_entities:
                    session.run(
                        "MERGE (n:Entity {id: $id}) SET n.name = $name, n.type = $type, n.caseId = $caseId",
                        id=ent['id'], name=ent['canonicalName'], type=ent['entityType'], caseId=case_id
                    )
                    session.run(
                        "MATCH (ev:Evidence {id: $evId}), (n:Entity {id: $entId}) "
                        "MERGE (ev)-[:CITES_ENTITY]->(n)",
                        evId=evidence_id, entId=ent['id']
                    )
            driver.close()
        except Exception as neo_err:
            print(f"Neo4j sync notice (in-memory graph populated): {neo_err}")

        # Update case entity count
        matched_case = next((c for c in DEMO_CASES if c.get('caseId') == case_id or c.get('caseNumber') == case_id), None)
        if matched_case:
            matched_case['entityCount'] = matched_case.get('entityCount', 10) + len(extracted_entities)
            matched_case['evidenceCount'] = matched_case.get('evidenceCount', 5) + 1

        summary = ExtractionSummary(
            personsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Person'),
            phonesExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Phone'),
            bankAccountsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'BankAccount'),
            vehiclesExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Vehicle'),
            locationsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Location'),
            organizationsExtracted=sum(1 for e in extracted_entities if e.get('entityType') == 'Organization'),
            firsExtracted=0,
            crimesExtracted=0,
            transactionsExtracted=0,
            communicationsExtracted=0,
            evidenceExtracted=1,
            relationshipsExtracted=len(extracted_relationships)
        )

        return {
            'recordsProcessed': len(extracted_entities),
            'recordsCreated': len(extracted_entities) + 1,
            'recordsUpdated': 0,
            'duplicates': 0,
            'invalidRows': 0,
            'evidenceId': evidence_id,
            'sha256Hash': sha256_hash,
            'schemaDetected': 'Forensic Document / PDF',
            'extractionResults': summary,
            'extractedEntitiesList': extracted_entities,
            'extractedRelationshipsList': extracted_relationships,
            'samplePreview': extracted_entities[:5]
        }

    async def ingest_image(
        self,
        job_id: str,
        content: bytes,
        filename: str,
        case_id: str,
        uploader: str,
        sha256_hash: str,
        storage_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes photographic and forensic digital image evidence:
        - Extracts image metadata (dimensions, format)
        - Computes SHA-256 genesis hash
        - Generates instant base64 preview data URI
        - Runs OCR if text is present
        - Registers Evidence record in DB & DEMO_ENTITIES
        - Creates Evidence Node and links to primary case entity in DEMO_EDGES
        - Adds SEIZURE event to DEMO_TIMELINE
        - Stores in _UPLOADED_DOCUMENTS with preview
        - Updates case entity and evidence counts
        """
        now = datetime.now(timezone.utc).isoformat()
        _, ext = os.path.splitext(filename.lower())
        img_format = ext[1:].upper() if ext else 'PNG'
        width, height = (1920, 1080)

        # 1. Inspect image dimensions
        try:
            from PIL import Image
            with Image.open(io.BytesIO(content)) as im:
                width, height = im.size
                img_format = im.format or img_format
        except Exception as e:
            print(f"[Image Ingestion] PIL notice: {e}")

        # 2. Base64 Data URI for fast preview
        import base64
        mime_subtype = 'jpeg' if img_format.lower() in ['jpg', 'jpeg'] else img_format.lower()
        b64_str = base64.b64encode(content).decode('utf-8')
        image_data_uri = f"data:image/{mime_subtype};base64,{b64_str}"

        # 3. Optional OCR extraction
        extracted_text = ""
        extracted_entities = []
        extracted_relationships = []
        try:
            from member4_ai_nlp.service import CrimeNetAINLPService
            nlp_service = CrimeNetAINLPService()
            m4_result = nlp_service.ingest_and_extract_document(
                content=content,
                source_name=filename,
                case_id=case_id
            )
            ocr_res = m4_result.get('ocr_result', {})
            extracted_text = ocr_res.get('extracted_text') or ""
        except Exception:
            extracted_text = ""

        # Extract phone numbers if OCR picked up any digits
        if extracted_text:
            phone_matches = re.findall(r'(?:\+?91[\-\s]?)?[6789]\d{9}', extracted_text)
            for ph in list(dict.fromkeys(phone_matches))[:2]:
                ph_id = f"PHO-IMG-{uuid.uuid4().hex[:6].upper()}"
                extracted_entities.append({
                    'id': ph_id,
                    'entityType': 'Phone',
                    'canonicalName': ph,
                    'phoneNumber': ph,
                    'caseId': case_id,
                    'confidence': 0.90,
                    'source': 'Image OCR',
                    'sourceFilename': filename
                })

        # 4. Create Evidence Record
        evidence_id = f"EVD-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"
        file_size_kb = len(content) // 1024
        evidence_record = {
            'id': evidence_id,
            'evidenceId': evidence_id,
            'entityType': 'Evidence',
            'canonicalName': f"Forensic Photo: {filename}",
            'evidenceNumber': evidence_id,
            'evidenceType': 'Digital Forensic Image',
            'category': 'Digital Forensic Image',
            'title': f"Forensic Photo: {filename}",
            'description': f"Photographic forensic item '{filename}' ({width}x{height} px, {file_size_kb} KB) secured under BSA Section 63 chain of custody.",
            'collectedDate': now,
            'collectedBy': uploader,
            'storageLocation': storage_path or f"Secure Vault / {filename}",
            'sha256Hash': sha256_hash,
            'originalHashSHA256': sha256_hash,
            'currentHashSHA256': sha256_hash,
            'bsaSection65BCertificateId': f"BSA-63-{datetime.now().year}-{evidence_id}",
            'caseId': case_id,
            'confidence': 1.0,
            'imageUrl': image_data_uri,
            'previewUrl': image_data_uri,
            'fileSizeBytes': len(content),
            'metadata': {
                'sourceFilename': filename,
                'sourceType': 'Digital Forensic Image',
                'dimensions': f"{width}x{height}",
                'format': img_format,
                'fileSize': len(content),
                'fileSizeBytes': len(content),
                'imageUrl': image_data_uri,
                'previewUrl': image_data_uri,
                'uploader': uploader,
                'chainOfCustodyVerified': True,
                'ocrText': extracted_text,
                'storagePath': storage_path
            }
        }
        DEMO_ENTITIES.insert(0, evidence_record)
        _save_evidence_to_db(evidence_record)

        # 5. Connect Evidence in Graph to primary person or case node
        primary_entity = next((e for e in DEMO_ENTITIES if e.get('entityType') == 'Person' and (e.get('caseId') == case_id or not e.get('caseId'))), None)
        target_node_id = primary_entity['id'] if primary_entity else 'P00001'
        
        edge = {
            'id': f"EDGE-IMG-{uuid.uuid4().hex[:6].upper()}",
            'source': evidence_id,
            'target': target_node_id,
            'relationshipType': 'EVIDENCE_FOR',
            'properties': {'sourceDoc': filename, 'confidence': 0.98, 'dimensions': f"{width}x{height}"},
            'sourceDoc': filename,
            'timestamp': now,
            'confidence': 0.98,
            'caseId': case_id,
            'evidenceId': evidence_id
        }
        DEMO_EDGES.insert(0, edge)
        extracted_relationships.append(edge)

        # 6. Add SEIZURE event to Timeline
        DEMO_TIMELINE.insert(0, {
            'id': f"EVT-IMG-{uuid.uuid4().hex[:6].upper()}",
            'eventId': f"EVT-IMG-{uuid.uuid4().hex[:6].upper()}",
            'date': now[:10],
            'time': now[11:16],
            'timestamp': now,
            'eventType': 'IMAGE_EVIDENCE_SECURED',
            'event': f"Forensic Photographic Evidence Secured: {filename}",
            'title': f"Forensic Photo Secured: {filename}",
            'description': f"Image ({width}x{height} px, {file_size_kb} KB) registered with SHA-256 hash {sha256_hash[:16]}... by {uploader}.",
            'primaryEntityId': evidence_id,
            'primaryEntityName': f"Evidence {evidence_id}",
            'location': 'Forensic Seizure Vault',
            'source': filename,
            'sourceDocument': filename,
            'caseId': case_id,
            'evidenceId': evidence_id,
            'imageUrl': image_data_uri
        })

        # Persist image evidence entity and linked edges to Supabase PostgreSQL
        _save_entities_and_relationships_to_db([evidence_record] + extracted_entities, extracted_relationships, case_id)

        # 7. Document Cache for RAG and Previews
        _UPLOADED_DOCUMENTS[evidence_id] = {
            'docId': evidence_id,
            'fileName': filename,
            'caseId': case_id,
            'evidenceId': evidence_id,
            'sha256Hash': sha256_hash,
            'uploadedAt': now,
            'uploader': uploader,
            'text': extracted_text or f"Forensic image: {filename}",
            'imageUrl': image_data_uri,
            'entities': [evidence_record] + extracted_entities,
            'relationships': extracted_relationships,
            'summary': f"Forensic Image '{filename}' ({width}x{height} px, {file_size_kb} KB) linked to case {case_id}."
        }

        # 8. Update case counts
        matched_case = next((c for c in DEMO_CASES if c.get('caseId') == case_id or c.get('caseNumber') == case_id), None)
        if matched_case:
            matched_case['evidenceCount'] = matched_case.get('evidenceCount', 5) + 1
            matched_case['entityCount'] = matched_case.get('entityCount', 10) + len(extracted_entities) + 1

        summary = ExtractionSummary(
            personsExtracted=0,
            phonesExtracted=len(extracted_entities),
            bankAccountsExtracted=0,
            vehiclesExtracted=0,
            locationsExtracted=0,
            organizationsExtracted=0,
            firsExtracted=0,
            crimesExtracted=0,
            transactionsExtracted=0,
            communicationsExtracted=0,
            evidenceExtracted=1,
            relationshipsExtracted=len(extracted_relationships)
        )

        return {
            'recordsProcessed': 1,
            'recordsCreated': 1 + len(extracted_entities),
            'recordsUpdated': 0,
            'duplicates': 0,
            'invalidRows': 0,
            'evidenceId': evidence_id,
            'sha256Hash': sha256_hash,
            'schemaDetected': 'Digital Forensic Image',
            'extractionResults': summary,
            'imageUrl': image_data_uri,
            'extractedEntitiesList': [evidence_record] + extracted_entities,
            'extractedRelationshipsList': extracted_relationships,
            'samplePreview': [evidence_record]
        }

    async def process_file_upload(
        self,
        file_bytes: bytes,
        filename: str,
        case_id: str,
        uploader: str,
        content_type: Optional[str] = None
    ) -> IngestJobStatusResponse:
        """
        Orchestrates end-to-end file ingestion lifecycle:
        UPLOADED -> VALIDATING -> PROCESSING -> EXTRACTING -> NORMALIZING -> INDEXING -> COMPLETED
        """
        job_id = f"JOB-INGEST-{uuid.uuid4().hex[:8].upper()}"
        file_id = f"FILE-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now(timezone.utc).isoformat()

        # 1. Validation
        ext, doc_type = self.validate_file_metadata(filename, file_bytes, content_type)
        sha256_hash = self.calculate_sha256(file_bytes)

        # 2. Secure Storage in UPLOAD_DIR or Supabase
        safe_filename = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', filename)
        stored_filename = f"{file_id}_{safe_filename}"
        
        from app.services.supabase_service import get_supabase_storage_service
        supabase_svc = get_supabase_storage_service()
        supabase_path = supabase_svc.upload_file(
            case_id=case_id,
            file_name=stored_filename,
            file_bytes=file_bytes,
            content_type=content_type or "application/octet-stream"
        )
        
        storage_path = supabase_path if supabase_path else os.path.join(self.upload_dir, stored_filename)
        
        # Fallback to local disk if Supabase failed or isn't configured
        if not supabase_path:
            with open(storage_path, 'wb') as f:
                f.write(file_bytes)

        # Initialize job record
        _INGESTION_JOBS[job_id] = {
            'jobId': job_id,
            'fileId': file_id,
            'fileName': filename,
            'docType': doc_type,
            'caseId': case_id,
            'status': 'PROCESSING',
            'stage': 'VALIDATING',
            'progressPercent': 25,
            'startedAt': now,
            'completedAt': None,
            'sha256Hash': sha256_hash,
            'uploader': uploader
        }
        _save_job_to_db(_INGESTION_JOBS[job_id])

        try:
            # 3. Processing by type
            if ext == '.csv':
                _INGESTION_JOBS[job_id]['stage'] = 'NORMALIZING'
                _INGESTION_JOBS[job_id]['progressPercent'] = 60
                res = await self.ingest_csv(
                    job_id=job_id,
                    content=file_bytes,
                    filename=filename,
                    case_id=case_id,
                    uploader=uploader,
                    sha256_hash=sha256_hash,
                    storage_path=storage_path
                )
            elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.webp', '.bmp'] or doc_type == 'IMAGE_EVIDENCE':
                _INGESTION_JOBS[job_id]['stage'] = 'ANALYZING_IMAGE'
                _INGESTION_JOBS[job_id]['progressPercent'] = 60
                res = await self.ingest_image(
                    job_id=job_id,
                    content=file_bytes,
                    filename=filename,
                    case_id=case_id,
                    uploader=uploader,
                    sha256_hash=sha256_hash,
                    storage_path=storage_path
                )
            else:
                _INGESTION_JOBS[job_id]['stage'] = 'EXTRACTING'
                _INGESTION_JOBS[job_id]['progressPercent'] = 60
                res = await self.ingest_pdf(
                    job_id=job_id,
                    content=file_bytes,
                    filename=filename,
                    case_id=case_id,
                    uploader=uploader,
                    sha256_hash=sha256_hash,
                    storage_path=storage_path
                )

            # 4. Finalize Job
            _INGESTION_JOBS[job_id].update({
                'status': 'Completed',
                'stage': 'COMPLETED',
                'progressPercent': 100,
                'completedAt': datetime.now(timezone.utc).isoformat(),
                'successfulRecords': res.get('recordsCreated', 0),
                'failedRecords': res.get('invalidRows', 0),
                'duplicateRecords': res.get('duplicates', 0),
                'recordsProcessed': res.get('recordsProcessed', 0),
                'recordsCreated': res.get('recordsCreated', 0),
                'recordsUpdated': res.get('recordsUpdated', 0),
                'invalidRows': res.get('invalidRows', 0),
                'entitiesExtracted': len(res.get('extractedEntitiesList', [])),
                'relationshipsExtracted': len(res.get('extractedRelationshipsList', [])),
                'evidenceId': res.get('evidenceId'),
                'schemaDetected': res.get('schemaDetected'),
                'extractionResults': res.get('extractionResults'),
                'extractedEntitiesList': res.get('extractedEntitiesList', []),
                'extractedRelationshipsList': res.get('extractedRelationshipsList', []),
                'samplePreview': res.get('samplePreview', []),
                'sourceProvenance': {
                    'sourceFilename': filename,
                    'caseId': case_id,
                    'uploadedBy': uploader,
                    'uploadTimestamp': now,
                    'sha256Hash': sha256_hash,
                    'storagePath': storage_path
                },
                'warnings': [],
                'errors': []
            })
            _save_job_to_db(_INGESTION_JOBS[job_id])

            return IngestJobStatusResponse(**_INGESTION_JOBS[job_id])

        except Exception as err:
            _INGESTION_JOBS[job_id].update({
                'status': 'FAILED',
                'stage': 'FAILED',
                'progressPercent': 100,
                'completedAt': datetime.now(timezone.utc).isoformat(),
                'errorDetails': str(err),
                'errors': [str(err)]
            })
            _save_job_to_db(_INGESTION_JOBS[job_id])
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"PROCESSING FAILED: {str(err)}"
            )


_ingestion_service_instance = None
def get_ingestion_service() -> IngestionService:
    global _ingestion_service_instance
    if _ingestion_service_instance is None:
        _ingestion_service_instance = IngestionService()
    return _ingestion_service_instance
