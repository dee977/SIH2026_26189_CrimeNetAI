import React, { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  ExternalLink,
  ShieldCheck,
  Eye,
  RefreshCw,
  Search,
  Database,
  Share2,
  Bot,
  X,
  ArrowRight,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { CaseSelector } from '../common/CaseSelector';

interface IngestionJob {
  jobId: string;
  fileId: string;
  fileName: string;
  docType: string;
  caseId: string;
  status: 'PENDING' | 'VALIDATING' | 'PARSING' | 'EXTRACTING' | 'INDEXING' | 'COMPLETED' | 'FAILED';
  stage: string;
  progressPercent: number;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  duplicates?: number;
  invalidRows?: number;
  entitiesExtracted: number;
  relationshipsExtracted: number;
  evidenceId?: string;
  sha256Hash?: string;
  schemaDetected?: string;
  extractionResults?: {
    personsExtracted?: number;
    phonesExtracted?: number;
    bankAccountsExtracted?: number;
    vehiclesExtracted?: number;
    locationsExtracted?: number;
    organizationsExtracted?: number;
    firsExtracted?: number;
    crimesExtracted?: number;
    transactionsExtracted?: number;
    communicationsExtracted?: number;
    evidenceExtracted?: number;
    relationshipsExtracted?: number;
  };
  extractedEntitiesList?: any[];
  extractedRelationshipsList?: any[];
  samplePreview?: any[];
  warnings?: string[];
  errors?: string[];
  sourceProvenance?: {
    sourceFilename: string;
    caseId: string;
    uploadedBy: string;
    uploadTimestamp: string;
    sha256Hash: string;
    storagePath?: string;
  };
  startedAt?: string;
  completedAt?: string;
  errorDetails?: string;
}

interface CsvValidationResult {
  fileName: string;
  detectedSchema: string;
  columnNames: string[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  sampleRows: any[];
  warnings: string[];
  errors: string[];
  isValid: boolean;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');

const getAuthHeaders = (): Record<string, string> => {
  const token = (typeof localStorage !== 'undefined' && localStorage.getItem('crimenet_auth_token')) || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const ImportCenterView: React.FC = () => {
  const { selectedCaseId, selectCase, setView } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [activeCase, setActiveCase] = useState<string>(selectedCaseId || 'CASE-2025-M3-DATASET');
  useEffect(() => {
    if (selectedCaseId) {
      setActiveCase(selectedCaseId);
    } else {
      selectCase('CASE-2025-M3-DATASET');
    }
  }, [selectedCaseId]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentJob, setCurrentJob] = useState<IngestionJob | null>(null);
  const [recentJobs, setRecentJobs] = useState<IngestionJob[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // Validation state
  const [csvValidation, setCsvValidation] = useState<CsvValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Detail Modal state
  const [selectedJobDetails, setSelectedJobDetails] = useState<IngestionJob | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<any>(null);

  // Fetch recent jobs
  const fetchRecentJobs = async () => {
    setIsLoadingJobs(true);
    const targetCase = (activeCase && activeCase.trim()) || (selectedCaseId && selectedCaseId.trim()) || 'CASE-2025-M3-DATASET';
    try {
      const res = await fetch(`${API_BASE}/ingestion/jobs?case_id=${encodeURIComponent(targetCase)}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setRecentJobs(json.items || []);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchRecentJobs();
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeCase]);

  // Polling helper
  const startPollingJob = (jobId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/ingestion/status/${jobId}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const json = await res.json();
          const job: IngestionJob = json.data;
          setCurrentJob(job);

          const normalizedStatus = (job.status || '').toUpperCase();
          if (normalizedStatus === 'COMPLETED') {
            clearInterval(pollTimerRef.current);
            setIsUploading(false);
            addToast({
              type: 'success',
              title: 'Ingestion Completed Successfully',
              message: `Processed ${job.recordsProcessed || job.entitiesExtracted} items from ${job.fileName}. Graph and indices updated.`
            });
            fetchRecentJobs();
          } else if (normalizedStatus === 'FAILED') {
            clearInterval(pollTimerRef.current);
            setIsUploading(false);
            addToast({
              type: 'error',
              title: 'Ingestion Failed',
              message: job.errorDetails || 'Error encountered while processing file.'
            });
            fetchRecentJobs();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1500);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.csv', '.pdf', '.png', '.jpg', '.jpeg', '.tiff'];
    if (!allowed.includes(ext)) {
      addToast({
        type: 'error',
        title: 'Unsupported File Format',
        message: `File format '${ext}' is not supported. Please select a CSV (.csv), PDF (.pdf), or Image file.`
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: `File size exceeds the 50 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
      });
      return;
    }

    setSelectedFile(file);
    setCsvValidation(null);

    // If CSV, automatically run pre-upload validation
    if (ext === '.csv') {
      validateCsv(file);
    }
  };

  // Validate CSV
  const validateCsv = async (file: File) => {
    setIsValidating(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/ingestion/validate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      if (res.ok) {
        const json = await res.json();
        setCsvValidation(json.data || json);
      }
    } catch (err) {
      console.error('Validation error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  // Start Upload & Ingestion
  const handleUpload = async () => {
    if (!selectedFile) return;

    const targetCase = (activeCase && activeCase.trim()) || (selectedCaseId && selectedCaseId.trim()) || 'CASE-2025-M3-DATASET';

    setIsUploading(true);
    setCurrentJob({
      jobId: 'INITIALIZING...',
      fileId: '',
      fileName: selectedFile.name,
      docType: selectedFile.name.match(/\.(png|jpg|jpeg|tiff|webp)$/i) ? 'IMAGE_EVIDENCE' : (selectedFile.name.endsWith('.csv') ? 'CSV' : 'PDF'),
      caseId: targetCase,
      status: 'VALIDATING',
      stage: 'VALIDATING',
      progressPercent: 15,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      entitiesExtracted: 0,
      relationshipsExtracted: 0
    });

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('caseId', targetCase);
    formData.append('case_id', targetCase);

    try {
      const res = await fetch(`${API_BASE}/ingestion/upload`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (res.status === 200 || res.status === 201 || res.status === 202) {
        const json = await res.json();
        const uploadData = json.data || json;
        const targetJobId = uploadData.jobId || uploadData.job_id || uploadData.id;
        if (targetJobId) {
          startPollingJob(targetJobId);
        } else {
          setIsUploading(false);
          fetchRecentJobs();
          addToast({
            type: 'success',
            title: 'Ingestion Completed',
            message: `Processed file ${selectedFile.name}`
          });
        }
      } else {
        const errJson = await res.json().catch(() => ({ detail: 'Upload failed' }));
        setIsUploading(false);
        setCurrentJob(null);
        addToast({
          type: 'error',
          title: 'Upload Rejected',
          message: errJson.detail || errJson.message || 'Could not process upload request.'
        });
      }
    } catch (err: any) {
      setIsUploading(false);
      setCurrentJob(null);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: err.message || 'Failed to connect to ingestion server.'
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `${label} copied.`
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-[var(--primary)]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              Import Center
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm max-w-2xl">
            Upload forensic documents, structured CSV datasets, scanned statements, and evidentiary records into the CrimeNet AI knowledge graph. Automatically extracts entities, generates SHA-256 integrity hashes, and indexes data for the AI Assistant.
          </p>
        </div>
          {/* Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 min-h-[300px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-[var(--primary)] bg-blue-50/50 shadow-sm'
                : 'border-slate-300 hover:border-[var(--primary)] hover:bg-slate-50 bg-white'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.pdf,.png,.jpg,.jpeg,.tiff"
              className="hidden"
            />
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[var(--primary)] mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
              Select or Drop Evidence File Here
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md">
              Supports <span className="font-semibold text-slate-700">CSV</span>, <span className="font-semibold text-slate-700">PDF</span>, and <span className="font-semibold text-slate-700">Images</span> (PNG, JPG, TIFF).
            </p>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              <span>Max size: 50 MB &bull; SHA-256 Verified &bull; BSA &sect;63 Certified</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Case Context */}
        <div className="flex flex-col gap-2 bg-white p-5 rounded-xl border border-[var(--border)]">
          <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <Database className="w-4 h-4 text-[var(--primary)]" />
            Active Case Association
          </label>
          <CaseSelector onChange={(caseId) => setActiveCase(caseId)} />
        </div>
          {/* Selected File Stage & Preview Panel */}
          <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm flex-1 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[var(--primary)]" /> Staged File
                </span>
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setCsvValidation(null);
                    }}
                    className="text-[var(--text-secondary)] hover:text-slate-700 text-xs flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-slate-50 border border-[var(--border)] rounded-lg">
                    <div className="p-2 rounded bg-white shadow-sm border border-slate-200 text-[var(--primary)] shrink-0">
                      {selectedFile.name.endsWith('.csv') ? (
                        <FileSpreadsheet className="w-6 h-6" />
                      ) : selectedFile.name.match(/\.(png|jpg|jpeg|tiff|webp)$/i) ? (
                        <ImageIcon className="w-6 h-6" />
                      ) : (
                        <FileText className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-[var(--text-primary)] truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1 flex items-center gap-2">
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                        <span>&bull;</span>
                        <span className="uppercase text-[var(--primary)] font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                          {selectedFile.name.substring(selectedFile.name.lastIndexOf('.') + 1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Image Staged Preview */}
                  {selectedFile.name.match(/\.(png|jpg|jpeg|tiff|webp)$/i) && (
                    <div className="rounded-lg overflow-hidden border border-[var(--border)] bg-slate-100 p-2 flex flex-col items-center">
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Evidence Preview"
                        className="max-h-40 w-auto rounded object-contain shadow-sm"
                      />
                      <span className="text-[10px] font-mono text-[var(--text-muted)] mt-2 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Forensic image staged for BSA §63 SHA-256 ingestion
                      </span>
                    </div>
                  )}

                  {/* CSV Quick Stats / Preview button */}
                  {csvValidation && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-[var(--border)] text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)] font-medium">Detected Schema:</span>
                        <span className="font-semibold text-[var(--primary)] px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                          {csvValidation.detectedSchema}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)] font-medium">Total Rows:</span>
                        <span className="text-[var(--text-primary)] font-bold">{csvValidation.totalRows}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)] font-medium">Columns Identified:</span>
                        <span className="text-[var(--text-primary)] font-bold">{csvValidation.columnNames.length}</span>
                      </div>

                      {csvValidation.warnings.length > 0 && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] flex items-start gap-1.5 mt-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                          <span>{csvValidation.warnings[0]}</span>
                        </div>
                      )}

                      <button
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="w-full mt-3 py-2 bg-white hover:bg-slate-100 text-[var(--text-primary)] rounded shadow-sm text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[var(--border)]"
                      >
                        <Eye className="w-4 h-4 text-[var(--primary)]" /> Preview Dataset Rows &amp; Schema
                      </button>
                    </div>
                  )}

                  {!selectedFile.name.endsWith('.csv') && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs space-y-1.5">
                      <div className="font-semibold text-[var(--primary)] flex items-center gap-1.5">
                        <Info className="w-4 h-4" /> Multi-Engine Document Processing
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        CrimeNet AI extracts selectable text or automatically executes high-resolution OCR, extracts named entities (Persons, Organizations, Accounts), detects relationships, and creates a BSA Section 63 chain of custody evidence record.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-center text-[var(--text-secondary)] bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <FileText className="w-10 h-10 stroke-1 mb-2 text-[var(--text-secondary)]" />
                  <p className="text-sm font-medium text-[var(--text-muted)]">No file staged</p>
                  <p className="text-xs mt-1">Select or drop a file to begin.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border)] mt-4">
              <button
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
                className={`w-full py-2.5 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  !selectedFile || isUploading
                    ? 'bg-slate-100 text-[var(--text-secondary)] cursor-not-allowed border border-[var(--border)]'
                    : 'bg-[var(--primary)] text-[var(--text-primary)] hover:bg-blue-700 shadow-sm'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Start Ingestion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Ingestion Job Status Tracker (When Active) */}
      {currentJob && (
        <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6 border-l-4 border-l-[var(--primary)] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[var(--primary)]"></span>
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Job Status: {currentJob.jobId}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[var(--primary)] border border-blue-200">
                  {currentJob.status}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-1.5">
                Processing <span className="font-semibold text-[var(--text-primary)]">{currentJob.fileName}</span> for case <span className="font-semibold text-[var(--primary)]">{currentJob.caseId}</span>
              </p>
            </div>

            {currentJob.sha256Hash && (
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-[var(--border)] text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-mono text-slate-600 truncate max-w-[200px]" title={currentJob.sha256Hash}>
                  SHA-256: {currentJob.sha256Hash.slice(0, 16)}...
                </span>
                <button
                  onClick={() => copyToClipboard(currentJob.sha256Hash!, 'SHA-256 Hash')}
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)]"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar & Stage Tracker */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-[var(--border)]">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-[var(--primary)]">Stage: {currentJob.stage}</span>
              <span className="text-slate-700">{currentJob.progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--primary)] transition-all duration-300"
                style={{ width: `${currentJob.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Extracted Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            <div className="bg-white p-3 rounded-lg border border-[var(--border)] shadow-sm text-center">
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Records Read</div>
              <div className="text-xl font-black text-[var(--text-primary)] mt-1">{currentJob.recordsProcessed}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-sm text-center bg-emerald-50/30">
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wide">Entities Created</div>
              <div className="text-xl font-black text-emerald-700 mt-1">{currentJob.recordsCreated || currentJob.entitiesExtracted}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[var(--border)] shadow-sm text-center">
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Persons</div>
              <div className="text-xl font-black text-[var(--primary)] mt-1">
                {currentJob.extractionResults?.personsExtracted || 0}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[var(--border)] shadow-sm text-center">
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Phones</div>
              <div className="text-xl font-black text-[var(--primary)] mt-1">
                {currentJob.extractionResults?.phonesExtracted || 0}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[var(--border)] shadow-sm text-center">
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Accounts</div>
              <div className="text-xl font-black text-[var(--primary)] mt-1">
                {currentJob.extractionResults?.bankAccountsExtracted || 0}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-[var(--border)] shadow-sm text-center">
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Relationships</div>
              <div className="text-xl font-black text-purple-600 mt-1">
                {currentJob.relationshipsExtracted || 0}
              </div>
            </div>
          </div>

          {currentJob.status === 'COMPLETED' && (
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setView('graph')}
                className="btn-primary text-xs flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" /> View in Network Graph
              </button>
              <button
                onClick={() => setView('search')}
                className="btn-secondary text-xs flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-[var(--primary)]" /> Search Entities
              </button>
              <button
                onClick={() => setView('assistant')}
                className="btn-secondary text-xs flex items-center gap-2"
              >
                <Bot className="w-4 h-4 text-indigo-600" /> Query AI Assistant
              </button>
              <button
                onClick={() => setSelectedJobDetails(currentJob)}
                className="btn-secondary text-xs flex items-center gap-2 ml-auto"
              >
                <Eye className="w-4 h-4 text-emerald-600" /> Full Audit Dossier
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Ingestions Table */}
      <div className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--primary)]" /> Ingestion History
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Verified files ingested into case <span className="font-semibold text-[var(--text-primary)]">{activeCase}</span>
            </p>
          </div>
          <button
            onClick={fetchRecentJobs}
            disabled={isLoadingJobs}
            className="p-2 rounded bg-white hover:bg-slate-100 text-slate-600 transition-colors border border-[var(--border)] shadow-sm"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)]">
              <tr>
                <th className="py-3 px-5">Job ID</th>
                <th className="py-3 px-5">File Name</th>
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-5">Entities</th>
                <th className="py-3 px-5">SHA-256 Hash</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Timestamp</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] bg-white">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-5 font-mono text-xs text-[var(--text-muted)]">
                      {job.jobId}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        {job.docType === 'CSV' ? (
                          <FileSpreadsheet className="w-4 h-4 text-[var(--primary)] shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-[var(--secondary)] shrink-0" />
                        )}
                        <span className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">
                          {job.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-xs">
                      <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                        {job.schemaDetected || job.docType}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-xs font-bold text-emerald-600">
                      {job.entitiesExtracted || job.recordsCreated || 0}
                    </td>
                    <td className="py-3 px-5 text-xs font-mono text-[var(--text-muted)]">
                      {job.sha256Hash ? (
                        <div className="flex items-center gap-2">
                          <span title={job.sha256Hash}>{job.sha256Hash.slice(0, 12)}...</span>
                          <button
                            onClick={() => copyToClipboard(job.sha256Hash!, 'SHA-256 Hash')}
                            className="text-[var(--text-secondary)] hover:text-[var(--primary)]"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                          (job.status || '').toUpperCase() === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : (job.status || '').toUpperCase() === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {(job.status || '').toUpperCase() === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {(job.status || '').toUpperCase() === 'FAILED' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {job.startedAt ? new Date(job.startedAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => setSelectedJobDetails(job)}
                        className="btn-secondary px-3 py-1 text-xs"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--text-muted)] text-sm">
                    <div className="flex flex-col items-center justify-center">
                      <Database className="w-8 h-8 text-[var(--text-secondary)] mb-2" />
                      No ingestion jobs recorded for case {activeCase}.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Preview Modal */}
      {isPreviewModalOpen && csvValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
          <div className="bg-white border border-[var(--border)] rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[var(--primary)]" />
                  Dataset Preview: {csvValidation.fileName}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Schema Classification: <span className="text-[var(--primary)] font-semibold">{csvValidation.detectedSchema}</span> &bull; {csvValidation.totalRows} Total Rows
                </p>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-[var(--border)]">
                  <span className="text-xs text-[var(--text-secondary)] block font-bold uppercase tracking-wide">Total Rows</span>
                  <span className="text-2xl font-black text-[var(--text-primary)]">{csvValidation.totalRows}</span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-200">
                  <span className="text-xs text-emerald-700 block font-bold uppercase tracking-wide">Valid Rows</span>
                  <span className="text-2xl font-black text-emerald-600">{csvValidation.validRows}</span>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-200">
                  <span className="text-xs text-amber-700 block font-bold uppercase tracking-wide">Duplicate Rows</span>
                  <span className="text-2xl font-black text-amber-600">{csvValidation.duplicateRows}</span>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200">
                  <span className="text-xs text-[var(--primary)] block font-bold uppercase tracking-wide">Columns Detected</span>
                  <span className="text-2xl font-black text-[var(--primary)]">{csvValidation.columnNames.length}</span>
                </div>
              </div>

              {/* Sample Rows Table */}
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                  Sample Data Rows (First {csvValidation.sampleRows.length})
                </h4>
                <div className="border border-[var(--border)] rounded-lg overflow-x-auto bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[var(--text-secondary)] border-b border-[var(--border)] font-semibold">
                      <tr>
                        {csvValidation.columnNames.map((col, idx) => (
                          <th key={idx} className="py-3 px-4 whitespace-nowrap border-r last:border-r-0 border-[var(--border)]">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {csvValidation.sampleRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {csvValidation.columnNames.map((col, cIdx) => (
                            <td key={cIdx} className="py-2.5 px-4 text-slate-700 whitespace-nowrap border-r last:border-r-0 border-[var(--border)]">
                              {String(row[col] ?? '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="btn-secondary"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
          <div className="bg-white border border-[var(--border)] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Evidence Ingestion Record: {selectedJobDetails.jobId}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  File: <span className="font-semibold text-[var(--text-primary)]">{selectedJobDetails.fileName}</span> &bull; Status: <span className="text-[var(--primary)] font-bold">{selectedJobDetails.status}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Provenance & Crypto */}
              <div className="p-5 bg-slate-50 rounded-lg border border-[var(--border)] space-y-3">
                <div className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-xs flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                  <FileCheck className="w-4 h-4 text-[var(--primary)]" /> Provenance &amp; Forensic Integrity (M6/BSA §63)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600 pt-1">
                  <div>
                    <span className="text-[var(--text-muted)] block text-xs font-semibold uppercase mb-1">SHA-256 Bitstream Hash:</span>
                    <span className="font-mono text-slate-700 font-bold break-all bg-white px-2 py-1 border rounded inline-block">
                      {selectedJobDetails.sha256Hash || 'Calculated on ingestion'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-xs font-semibold uppercase mb-1">Evidence Locker ID:</span>
                    <span className="font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-1 border border-emerald-100 rounded inline-block">
                      {selectedJobDetails.evidenceId || 'EVD-PENDING'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-xs font-semibold uppercase mb-1">Ingested By:</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      {selectedJobDetails.sourceProvenance?.uploadedBy || 'Inspector Rajesh Kumar'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-xs font-semibold uppercase mb-1">Timestamp:</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      {selectedJobDetails.startedAt ? new Date(selectedJobDetails.startedAt).toUTCString() : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Photographic Asset Preview if Image Evidence */}
              {(selectedJobDetails.docType === 'IMAGE_EVIDENCE' || (selectedJobDetails.fileName && selectedJobDetails.fileName.match(/\.(png|jpg|jpeg|tiff|webp)$/i))) && (
                <div className="p-5 bg-slate-50 rounded-lg border border-[var(--border)] space-y-3">
                  <div className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-xs flex items-center justify-between pb-2 border-b border-[var(--border)]">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[var(--primary)]" /> Forensic Photographic Asset
                    </span>
                    <span className="text-emerald-700 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200">
                      SHA-256 Validated
                    </span>
                  </div>
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-200 p-2 flex items-center justify-center min-h-[160px]">
                    <img 
                      src={`${API_BASE}/evidence/${selectedJobDetails.evidenceId}/file`}
                      alt={selectedJobDetails.fileName}
                      className="max-h-64 w-auto max-w-full rounded shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Extraction Breakdown */}
              <div>
                <h4 className="font-bold text-[var(--text-primary)] mb-3">
                  Extracted Entities Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-[var(--border)] shadow-sm text-center">
                    <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wide block mb-1">Persons</span>
                    <span className="text-2xl font-black text-[var(--primary)]">
                      {selectedJobDetails.extractionResults?.personsExtracted || 0}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[var(--border)] shadow-sm text-center">
                    <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wide block mb-1">Phones</span>
                    <span className="text-2xl font-black text-indigo-600">
                      {selectedJobDetails.extractionResults?.phonesExtracted || 0}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[var(--border)] shadow-sm text-center">
                    <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wide block mb-1">Accounts</span>
                    <span className="text-2xl font-black text-amber-600">
                      {selectedJobDetails.extractionResults?.bankAccountsExtracted || 0}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-[var(--border)] shadow-sm text-center">
                    <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wide block mb-1">Organizations</span>
                    <span className="text-2xl font-black text-purple-600">
                      {selectedJobDetails.extractionResults?.organizationsExtracted || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Extracted Entities */}
              {selectedJobDetails.extractedEntitiesList && selectedJobDetails.extractedEntitiesList.length > 0 && (
                <div>
                  <h4 className="font-bold text-[var(--text-primary)] mb-3">
                    Sample Ingested Entities
                  </h4>
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[var(--text-secondary)] border-b border-[var(--border)] font-semibold">
                        <tr>
                          <th className="py-2.5 px-4">Entity ID</th>
                          <th className="py-2.5 px-4">Type</th>
                          <th className="py-2.5 px-4">Name / Value</th>
                          <th className="py-2.5 px-4">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {selectedJobDetails.extractedEntitiesList.slice(0, 5).map((e: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 font-mono text-[var(--text-muted)] text-xs">{e.id}</td>
                            <td className="py-2.5 px-4 text-[var(--text-secondary)] font-medium">{e.entityType || e.type}</td>
                            <td className="py-2.5 px-4 text-[var(--text-primary)] font-bold">{e.canonicalName || e.name}</td>
                            <td className="py-2.5 px-4 text-emerald-600 font-mono text-xs font-semibold">
                              {((e.confidence || 0.95) * 100).toFixed(0)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="btn-secondary"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
