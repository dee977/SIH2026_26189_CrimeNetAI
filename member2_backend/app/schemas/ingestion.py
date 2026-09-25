from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ExtractionSummary(BaseModel):
    personsExtracted: int = 0
    phonesExtracted: int = 0
    bankAccountsExtracted: int = 0
    vehiclesExtracted: int = 0
    locationsExtracted: int = 0
    organizationsExtracted: int = 0
    firsExtracted: int = 0
    crimesExtracted: int = 0
    transactionsExtracted: int = 0
    communicationsExtracted: int = 0
    evidenceExtracted: int = 0
    relationshipsExtracted: int = 0

class DataIngestUploadResponse(BaseModel):
    jobId: str
    fileId: Optional[str] = None
    fileName: str
    fileSizeBytes: int
    docType: str
    status: str = 'UPLOADED'
    uploadedAt: str
    caseId: Optional[str] = None
    message: str = 'File uploaded successfully and queued for validation and processing.'

class IngestJobStatusResponse(BaseModel):
    jobId: str
    fileId: Optional[str] = None
    fileName: str
    docType: str
    caseId: Optional[str] = None
    status: str  # UPLOADED, VALIDATING, PROCESSING, EXTRACTING, NORMALIZING, INDEXING, ANALYZING, COMPLETED, FAILED
    stage: str = 'COMPLETED'
    progressPercent: int = 0
    successfulRecords: int = 0
    failedRecords: int = 0
    duplicateRecords: int = 0
    recordsProcessed: int = 0
    recordsCreated: int = 0
    recordsUpdated: int = 0
    invalidRows: int = 0
    entitiesExtracted: int = 0
    relationshipsExtracted: int = 0
    evidenceId: Optional[str] = None
    sha256Hash: Optional[str] = None
    schemaDetected: Optional[str] = None
    extractionResults: ExtractionSummary = Field(default_factory=ExtractionSummary)
    extractedEntitiesList: List[Dict[str, Any]] = Field(default_factory=list)
    extractedRelationshipsList: List[Dict[str, Any]] = Field(default_factory=list)
    samplePreview: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    sourceProvenance: Optional[Dict[str, Any]] = None
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    errorDetails: Optional[str] = None

class CsvValidationResponse(BaseModel):
    fileName: str
    detectedSchema: str
    columnNames: List[str]
    totalRows: int
    validRows: int
    invalidRows: int
    duplicateRows: int
    sampleRows: List[Dict[str, Any]]
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    isValid: bool
