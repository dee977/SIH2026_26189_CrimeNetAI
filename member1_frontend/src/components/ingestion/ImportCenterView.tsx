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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-[var(--surface-cyan)] border border-[var(--primary)] text-[var(--primary)]">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              Data Ingestion &amp; Evidence Import Center
            </h1>
          </div>
          <p className="text-[var(--text-secondary)] text-sm max-w-3xl">
            Upload forensic documents, structured CSV datasets, scanned statements, and evidentiary records into the CrimeNet AI knowledge graph. Automatically extracts entities, generates SHA-256 integrity hashes, and indexes data for the AI Assistant and Investigation Reports.
          </p>
        </div>

        {/* Case Selector */}
        <div className="flex flex-col gap-1.5 min-w-[280px]">
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
            Active Case Association
          </label>
          <select
            value={activeCase}
            onChange={(e) => {
              setActiveCase(e.target.value);
              selectCase(e.target.value);
            }}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3.5 py-2 text-sm text-cyan-300 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-[var(--primary)]"
          >
            <option value="CASE-2025-M3-DATASET">CASE-2025-M3-DATASET — Operation Falcon Web (National Dataset)</option>
            <option value="CASE-VIDEO-001">CASE-VIDEO-001 — Operation Golden Fleece (Financial Syndicate)</option>
            <option value="CASE-VIDEO-002">CASE-VIDEO-002 — Operation White Dust (Narcotics Ring)</option>
            <option value="CASE-VIDEO-003">CASE-VIDEO-003 — Operation Phishnet (Cyber Fraud)</option>
            <option value="CASE-VIDEO-004">CASE-VIDEO-004 — Operation Iron Shield (Human Trafficking)</option>
          </select>
        </div>
      </div>

      {/* Main Upload Area & File Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Drop Zone */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 min-h-[260px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--bg-card)] bg-[var(--bg-card)]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.pdf,.png,.jpg,.jpeg,.tiff"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-[var(--surface-cyan)] border border-[var(--primary)] flex items-center justify-center text-[var(--primary)] mb-4 shadow-sm shadow-cyan-500/10">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
              Select or Drop Evidence File Here
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4 max-w-md">
              Supports <span className="text-cyan-300 font-medium">CSV</span> (persons, phone numbers, bank accounts, relationships), <span className="text-cyan-300 font-medium">PDF</span> (selectable &amp; scanned OCR), and <span className="text-cyan-300 font-medium">Images</span>.
            </p>
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Max size: 50 MB &bull; SHA-256 Verified &bull; BSA &sect;63 Certified</span>
            </div>
          </div>
        </div>

        {/* Selected File Stage & Preview Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--primary)]" /> Staged File Information
                </span>
                {selectedFile && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setCsvValidation(null);
                    }}
                    className="text-slate-500 hover:text-[var(--text-secondary)] text-xs flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl">
                    <div className="p-2.5 rounded-lg bg-[var(--surface-cyan)] border border-[var(--primary)] text-[var(--primary)] shrink-0">
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
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-2">
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                        <span>&bull;</span>
                        <span className="uppercase text-[var(--primary)] font-semibold">
                          {selectedFile.name.substring(selectedFile.name.lastIndexOf('.') + 1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Image Staged Preview */}
                  {selectedFile.name.match(/\.(png|jpg|jpeg|tiff|webp)$/i) && (
                    <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-black/40 p-2.5 flex flex-col items-center">
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Evidence Preview"
                        className="max-h-44 w-auto rounded object-contain shadow-md"
                      />
                      <span className="text-[10px] font-mono text-cyan-400 mt-2 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Forensic image staged for BSA §63 SHA-256 ingestion
                      </span>
                    </div>
                  )}

                  {/* CSV Quick Stats / Preview button */}
                  {csvValidation && (
                    <div className="bg-[var(--bg-card)] p-3.5 rounded-xl border border-[var(--border)] text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Detected Schema:</span>
                        <span className="font-semibold text-cyan-300 px-2 py-0.5 rounded bg-[var(--surface-cyan)] border border-[var(--primary)]">
                          {csvValidation.detectedSchema}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Total Rows:</span>
                        <span className="text-[var(--text-primary)] font-medium">{csvValidation.totalRows}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-secondary)]">Columns Identified:</span>
                        <span className="text-[var(--text-primary)] font-medium">{csvValidation.columnNames.length}</span>
                      </div>

                      {csvValidation.warnings.length > 0 && (
                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-300 text-[11px] flex items-center gap-1.5 mt-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{csvValidation.warnings[0]}</span>
                        </div>
                      )}

                      <button
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="w-full mt-2 py-1.5 bg-slate-50 hover:bg-slate-200 text-[var(--text-primary)] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border border-[var(--border)]"
                      >
                        <Eye className="w-3.5 h-3.5 text-[var(--primary)]" /> Preview Dataset Rows &amp; Schema
                      </button>
                    </div>
                  )}

                  {!selectedFile.name.endsWith('.csv') && (
                    <div className="p-3 bg-cyan-950/20 border border-[var(--primary)] rounded-xl text-xs text-[var(--text-secondary)] space-y-1.5">
                      <div className="font-semibold text-[var(--primary)] flex items-center gap-1.5">
                        <Info className="w-4 h-4" /> Multi-Engine Document Processing
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                        CrimeNet AI extracts selectable text or automatically executes high-resolution OCR, extracts named entities (Persons, Organizations, Accounts), detects relationships, and creates a BSA Section 63 chain of custody evidence record.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center text-slate-500">
                  <Database className="w-8 h-8 stroke-1 mb-2 text-slate-600" />
                  <p className="text-xs">No file currently staged.</p>
                  <p className="text-[11px] text-slate-600 mt-1">Select or drop a file to view schema and preview details.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border)] mt-4">
              <button
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  !selectedFile || isUploading
                    ? 'bg-slate-50 text-slate-500 cursor-not-allowed border border-[var(--border)]'
                    : 'bg-[var(--primary)] text-white hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                }`}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Ingesting &amp; Extracting...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" /> Start Ingestion Pipeline
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Ingestion Job Status Tracker (When Active) */}
      {currentJob && (
        <div className="bg-[var(--bg-card)] border border-[var(--primary)] rounded-2xl p-6 shadow-xl shadow-cyan-500/5 backdrop-blur-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Ingestion Job: {currentJob.jobId}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--surface-cyan)] border border-[var(--primary)] text-cyan-300">
                  {currentJob.status}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                File: <span className="text-[var(--text-primary)] font-medium">{currentJob.fileName}</span> &bull; Case: <span className="text-[var(--primary)]">{currentJob.caseId}</span>
              </p>
            </div>

            {currentJob.sha256Hash && (
              <div className="flex items-center gap-2 bg-[var(--bg-card)] px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-[var(--text-secondary)] truncate max-w-[200px]" title={currentJob.sha256Hash}>
                  SHA-256: {currentJob.sha256Hash.slice(0, 16)}...
                </span>
                <button
                  onClick={() => copyToClipboard(currentJob.sha256Hash!, 'SHA-256 Hash')}
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)]"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Progress Bar & Stage Tracker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--primary)]">Pipeline Stage: {currentJob.stage}</span>
              <span>{currentJob.progressPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-[var(--bg-card)] rounded-full overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${currentJob.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Extracted Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] text-center">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase">Records Read</div>
              <div className="text-lg font-bold text-[var(--text-primary)] mt-0.5">{currentJob.recordsProcessed}</div>
            </div>
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] text-center">
              <div className="text-[11px] font-semibold text-emerald-400 uppercase">Entities Created</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">{currentJob.recordsCreated || currentJob.entitiesExtracted}</div>
            </div>
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] text-center">
              <div className="text-[11px] font-semibold text-[var(--primary)] uppercase">Persons</div>
              <div className="text-lg font-bold text-cyan-300 mt-0.5">
                {currentJob.extractionResults?.personsExtracted || 0}
              </div>
            </div>
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] text-center">
              <div className="text-[11px] font-semibold text-indigo-400 uppercase">Phones</div>
              <div className="text-lg font-bold text-indigo-300 mt-0.5">
                {currentJob.extractionResults?.phonesExtracted || 0}
              </div>
            </div>
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] text-center">
              <div className="text-[11px] font-semibold text-amber-400 uppercase">Accounts</div>
              <div className="text-lg font-bold text-amber-300 mt-0.5">
                {currentJob.extractionResults?.bankAccountsExtracted || 0}
              </div>
            </div>
            <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)] text-center">
              <div className="text-[11px] font-semibold text-purple-400 uppercase">Relationships</div>
              <div className="text-lg font-bold text-purple-300 mt-0.5">
                {currentJob.relationshipsExtracted || 0}
              </div>
            </div>
          </div>

          {currentJob.status === 'COMPLETED' && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setView('graph')}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--surface-cyan)] hover:bg-[var(--surface-cyan)] border border-[var(--primary)] text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> View in Network Graph
              </button>
              <button
                onClick={() => setView('search')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-200 border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[var(--primary)]" /> Search Ingested Entities
              </button>
              <button
                onClick={() => setView('assistant')}
                className="px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-200 border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Bot className="w-3.5 h-3.5 text-indigo-400" /> Query Grounded AI Assistant
              </button>
              <button
                onClick={() => setSelectedJobDetails(currentJob)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-200 border border-[var(--border)] text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition-colors ml-auto"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" /> Full Audit Dossier
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Ingestions Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--primary)]" /> Case Evidence &amp; Ingestion History
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Verified files ingested into case {activeCase} with cryptographic hash records.
            </p>
          </div>
          <button
            onClick={fetchRecentJobs}
            disabled={isLoadingJobs}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-200 text-[var(--text-secondary)] transition-colors border border-[var(--border)]"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingJobs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-card)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] border-b border-[var(--border)]">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Doc Type / Schema</th>
                <th className="py-3 px-4">Entities Extracted</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-[var(--text-secondary)]">
                      {job.jobId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {job.docType === 'CSV' ? (
                          <FileSpreadsheet className="w-4 h-4 text-[var(--primary)] shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                        <span className="font-medium text-[var(--text-primary)] truncate max-w-[180px]">
                          {job.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-50 text-[var(--text-secondary)] border border-[var(--border)] font-mono">
                        {job.schemaDetected || job.docType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-emerald-400">
                      {job.entitiesExtracted || job.recordsCreated || 0} entities
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-[var(--text-secondary)]">
                      {job.sha256Hash ? (
                        <div className="flex items-center gap-1.5">
                          <span title={job.sha256Hash}>{job.sha256Hash.slice(0, 12)}...</span>
                          <button
                            onClick={() => copyToClipboard(job.sha256Hash!, 'SHA-256 Hash')}
                            className="text-slate-500 hover:text-[var(--primary)]"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                          (job.status || '').toUpperCase() === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : (job.status || '').toUpperCase() === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}
                      >
                        {(job.status || '').toUpperCase() === 'COMPLETED' && <CheckCircle2 className="w-3 h-3" />}
                        {(job.status || '').toUpperCase() === 'FAILED' && <AlertTriangle className="w-3 h-3" />}
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {job.startedAt ? new Date(job.startedAt).toLocaleString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedJobDetails(job)}
                        className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-200 text-xs text-[var(--text-primary)] border border-[var(--border)] transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    No ingestion jobs recorded for case {activeCase}. Upload a file above to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSV Preview Modal */}
      {isPreviewModalOpen && csvValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[var(--primary)]" />
                  Dataset Preview: {csvValidation.fileName}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Schema Classification: <span className="text-cyan-300 font-semibold">{csvValidation.detectedSchema}</span> &bull; {csvValidation.totalRows} Total Rows
                </p>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-secondary)] block font-semibold uppercase">Total Rows</span>
                  <span className="text-lg font-bold text-[var(--text-primary)]">{csvValidation.totalRows}</span>
                </div>
                <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-secondary)] block font-semibold uppercase">Valid Rows</span>
                  <span className="text-lg font-bold text-emerald-400">{csvValidation.validRows}</span>
                </div>
                <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-secondary)] block font-semibold uppercase">Duplicate Rows</span>
                  <span className="text-lg font-bold text-amber-400">{csvValidation.duplicateRows}</span>
                </div>
                <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-secondary)] block font-semibold uppercase">Columns Detected</span>
                  <span className="text-lg font-bold text-[var(--primary)]">{csvValidation.columnNames.length}</span>
                </div>
              </div>

              {/* Sample Rows Table */}
              <div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Sample Data Rows (First {csvValidation.sampleRows.length})
                </h4>
                <div className="border border-[var(--border)] rounded-xl overflow-x-auto bg-[var(--bg-card)]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)] border-b border-[var(--border)] font-mono">
                      <tr>
                        {csvValidation.columnNames.map((col, idx) => (
                          <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {csvValidation.sampleRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[var(--bg-card)]">
                          {csvValidation.columnNames.map((col, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 text-[var(--text-secondary)] whitespace-nowrap">
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

            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--bg-card)]">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-200 text-[var(--text-primary)] rounded-xl text-xs font-medium"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Evidence Ingestion Record: {selectedJobDetails.jobId}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  File: <span className="text-[var(--text-primary)]">{selectedJobDetails.fileName}</span> &bull; Status: <span className="text-[var(--primary)] font-semibold">{selectedJobDetails.status}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-slate-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Provenance & Crypto */}
              <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] space-y-2.5">
                <div className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[var(--primary)]" /> Provenance &amp; Forensic Integrity (M6/BSA §63)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[var(--text-secondary)] pt-1">
                  <div>
                    <span className="text-slate-500 block">SHA-256 Bitstream Hash:</span>
                    <span className="font-mono text-cyan-300 break-all select-all">
                      {selectedJobDetails.sha256Hash || 'Calculated on ingestion'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Evidence Locker ID:</span>
                    <span className="font-mono text-emerald-300">
                      {selectedJobDetails.evidenceId || 'EVD-PENDING'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Ingested By:</span>
                    <span className="text-[var(--text-primary)]">
                      {selectedJobDetails.sourceProvenance?.uploadedBy || 'Inspector Rajesh Kumar'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Timestamp:</span>
                    <span className="text-[var(--text-primary)]">
                      {selectedJobDetails.startedAt ? new Date(selectedJobDetails.startedAt).toUTCString() : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Photographic Asset Preview if Image Evidence */}
              {(selectedJobDetails.docType === 'IMAGE_EVIDENCE' || (selectedJobDetails.fileName && selectedJobDetails.fileName.match(/\.(png|jpg|jpeg|tiff|webp)$/i))) && (
                <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] space-y-2.5">
                  <div className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[var(--primary)]" /> Forensic Photographic Asset
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800">
                      SHA-256 Validated
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-black/50 p-2 flex items-center justify-center min-h-[160px]">
                    <img 
                      src={`${API_BASE}/evidence/${selectedJobDetails.evidenceId}/file`}
                      alt={selectedJobDetails.fileName}
                      className="max-h-64 w-auto max-w-full rounded object-contain shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Extraction Breakdown */}
              <div>
                <h4 className="font-bold text-[var(--text-secondary)] uppercase tracking-wider text-[11px] mb-2.5">
                  Extracted Entities Breakdown
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                    <span className="text-slate-500 block">Persons</span>
                    <span className="text-base font-bold text-[var(--primary)]">
                      {selectedJobDetails.extractionResults?.personsExtracted || 0}
                    </span>
                  </div>
                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                    <span className="text-slate-500 block">Phones</span>
                    <span className="text-base font-bold text-indigo-400">
                      {selectedJobDetails.extractionResults?.phonesExtracted || 0}
                    </span>
                  </div>
                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                    <span className="text-slate-500 block">Bank Accounts</span>
                    <span className="text-base font-bold text-amber-400">
                      {selectedJobDetails.extractionResults?.bankAccountsExtracted || 0}
                    </span>
                  </div>
                  <div className="bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                    <span className="text-slate-500 block">Organizations</span>
                    <span className="text-base font-bold text-purple-400">
                      {selectedJobDetails.extractionResults?.organizationsExtracted || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Extracted Entities */}
              {selectedJobDetails.extractedEntitiesList && selectedJobDetails.extractedEntitiesList.length > 0 && (
                <div>
                  <h4 className="font-bold text-[var(--text-secondary)] uppercase tracking-wider text-[11px] mb-2">
                    Sample Ingested Entities
                  </h4>
                  <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--bg-card)]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-card)] text-[var(--text-secondary)] border-b border-[var(--border)]">
                        <tr>
                          <th className="py-2 px-3">Entity ID</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3">Name / Value</th>
                          <th className="py-2 px-3">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selectedJobDetails.extractedEntitiesList.slice(0, 5).map((e: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono text-cyan-300">{e.id}</td>
                            <td className="py-2 px-3 text-[var(--text-secondary)]">{e.entityType || e.type}</td>
                            <td className="py-2 px-3 text-[var(--text-primary)] font-medium">{e.canonicalName || e.name}</td>
                            <td className="py-2 px-3 text-emerald-400 font-mono">
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

            <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3 bg-[var(--bg-card)]">
              <button
                onClick={() => setSelectedJobDetails(null)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-200 text-[var(--text-primary)] rounded-xl text-xs font-medium"
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
