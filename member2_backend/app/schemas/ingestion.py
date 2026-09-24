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
    fileName: str
    fileSizeBytes: int
    docType: str
    status: str = 'Uploaded'
    uploadedAt: str
    caseId: Optional[str] = None
    message: str = 'File uploaded successfully and queued for validation and extraction.'

class IngestJobStatusResponse(BaseModel):
    jobId: str
    status: str
    progressPercent: int = 0
    docType: str
    fileName: str
    caseId: Optional[str] = None
    successfulRecords: int = 0
    failedRecords: int = 0
    duplicateRecords: int = 0
    extractionResults: ExtractionSummary = Field(default_factory=ExtractionSummary)
    startedAt: Optional[str] = None
    completedAt: Optional[str] = None
    errorDetails: Optional[str] = None
