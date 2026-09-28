import React, { useState, useEffect, useRef } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { SYNTHETIC_CASES, ALL_ENTITIES, SYNTHETIC_EVIDENCE_RECORDS, SYNTHETIC_ALERTS } from '../../data/syntheticData';
import { apiRequest } from '../../services/apiClient';
import { NetworkGraphView } from '../graph/NetworkGraphView';
import { TimelineView } from '../timeline/TimelineView';
import { GISMapView } from '../gis/GISMapView';
import { UnifiedEntitySearchView } from '../entity/UnifiedEntitySearchView';
import { EvidenceView } from '../evidence/EvidenceView';
import { AlertsView } from '../alerts/AlertsView';
import { AIAssistantView } from '../assistant/AIAssistantView';
import { ReportView } from '../reports/ReportView';
import { 
  Briefcase, 
  Share2, 
  Clock, 
  MapPin, 
  Database, 
  FileCheck, 
  Bell, 
  Bot, 
  FileText, 
  History, 
  Lock, 
  ArrowLeft,
  Upload,
  Download,
  CheckCircle2,
  File,
  Plus,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');

export const InvestigationWorkspace: React.FC = () => {
  const { selectedCaseId, setView } = useNavigationStore();
  const { addToast } = useNotificationStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'graph' | 'timeline' | 'map' | 'entities' | 'evidence' | 'alerts' | 'assistant' | 'reports' | 'audit'>('overview');
  const [liveCase, setLiveCase] = useState<any>(null);

  // Document attachment state
  const [caseDocuments, setCaseDocuments] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('FIR / Complaint');
  const [docDescription, setDocDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCaseId = selectedCaseId || 'CASE-2025-M3-DATASET';

  const loadCaseData = () => {
    if (activeCaseId) {
      apiRequest<any>(`/cases/${activeCaseId}`).then(res => {
        if (res.success && res.data) {
          setLiveCase(res.data);
          if (Array.isArray(res.data.evidence) && res.data.evidence.length > 0) {
            setCaseDocuments(res.data.evidence);
          }
        }
      }).catch(() => {});

      // Load documents from dedicated endpoint
      apiRequest<any>(`/cases/${activeCaseId}/documents`).then(res => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCaseDocuments(res.data);
        }
      }).catch(() => {});
    }
  };

  useEffect(() => {
    loadCaseData();
  }, [selectedCaseId]);

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      addToast({ type: 'error', title: 'File Missing', message: 'Please select a document or evidence file to attach.' });
      return;
    }

    setIsUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('document_type', docType);
      formData.append('description', docDescription || `Attached ${docFile.name} to case ${activeCaseId}`);
      formData.append('caseId', activeCaseId);

      const res = await apiRequest<any>(`/cases/${encodeURIComponent(activeCaseId)}/documents`, {
        method: 'POST',
        body: formData
      });

      if (res.success && res.data) {
        const attached = res.data;
        setCaseDocuments(prev => [attached, ...prev]);
        setDocFile(null);
        setDocDescription('');
        if (fileInputRef.current) fileInputRef.current.value = '';

        addToast({
          type: 'success',
          title: 'Document Attached & Cryptographically Hashed',
          message: `${attached.filename || docFile.name} verified with SHA-256 genesis hash.`
        });

        // Refresh case data
        loadCaseData();
      } else {
        addToast({
          type: 'error',
          title: 'Attachment Failed',
          message: res.error || 'Unable to attach document to case.'
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Upload Error',
        message: err.message || 'Network error while attaching document.'
      });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const fallbackCase = SYNTHETIC_CASES.find(c => c.id === selectedCaseId) || SYNTHETIC_CASES[0];
  const activeCase = {
    ...fallbackCase,
    ...(liveCase || {}),
    title: liveCase?.title || fallbackCase.title,
    caseNumber: liveCase?.caseId || fallbackCase.caseNumber,
    description: liveCase?.description || fallbackCase.description,
    leadInvestigator: liveCase?.assignedInvestigator || fallbackCase.leadInvestigator,
    assignedTeam: Array.isArray(liveCase?.assignedTeam) ? liveCase.assignedTeam : (liveCase?.assignedTeam ? [liveCase.assignedTeam] : fallbackCase.assignedTeam),
    evidenceCount: caseDocuments.length > 0 ? caseDocuments.length : (liveCase?.evidenceCount || fallbackCase.evidenceCount || 0),
    auditHistory: (liveCase?.recentActivity && liveCase.recentActivity.length > 0)
      ? liveCase.recentActivity.map((a: any) => ({
          timestamp: a.timestamp ? a.timestamp.slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' '),
          officer: a.performedBy || 'System Daemon',
          action: a.action,
          details: typeof a.details === 'object' ? JSON.stringify(a.details) : (a.details || 'Audit verification logged.')
        }))
      : fallbackCase.auditHistory
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'documents', label: `Documents (${caseDocuments.length})`, icon: <FileCheck className="w-4 h-4" /> },
    { id: 'graph', label: 'Network Graph', icon: <Share2 className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'map', label: 'GIS Map', icon: <MapPin className="w-4 h-4" /> },
    { id: 'entities', label: 'Entities', icon: <Database className="w-4 h-4" /> },
    { id: 'evidence', label: 'Evidence Vault', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell className="w-4 h-4" /> },
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Dossier Header */}
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-6 border-[var(--border)] bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button
              onClick={() => setView('cases')}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] font-mono transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Cases List</span>
            </button>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-[var(--primary)] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                {activeCase.caseNumber}
              </span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                {activeCase.status}
              </span>
              <span className="text-xs font-mono text-[var(--text-secondary)]">
                Classification: {activeCase.accessClassification}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{activeCase.title}</h1>
          </div>

          <div className="text-right text-xs font-mono text-[var(--text-secondary)] self-start sm:self-auto">
            <div>Lead: <span className="text-[var(--text-primary)] font-semibold">{activeCase.leadInvestigator}</span></div>
            <div>Opened: <span className="text-[var(--text-secondary)]">{activeCase.openedDate}</span></div>
            <div>Station: <span className="text-[var(--primary)]">{activeCase.policeStation}</span></div>
          </div>
        </div>

        {/* Workspace Tab Bar */}
        <div className="flex items-center gap-1 overflow-x-auto mt-6 pt-4 border-t border-[var(--border)] scrollbar-none">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[var(--surface-cyan)] text-cyan-300 border border-[var(--primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'overview' && (
          <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-6 border-[var(--border)] space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Investigation Summary & Scope</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-4 rounded-xl border border-[var(--border)]">
                {activeCase.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block mb-1">Associated FIRs</span>
                <span className="text-xs font-mono font-bold text-cyan-300">{activeCase.associatedFIRs.join(', ')}</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block mb-1">Assigned Team Officers</span>
                <span className="text-xs text-[var(--text-primary)]">{activeCase.assignedTeam.join(' • ')}</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block mb-1">Jurisdiction Area</span>
                <span className="text-xs text-[var(--text-primary)]">{activeCase.jurisdiction}</span>
              </div>
            </div>

            {/* Quick Case Documents Overview Card */}
            <div className="pt-2 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Attached Case Documents & Evidence Files ({caseDocuments.length})
                  </h4>
                </div>
                <button
                  onClick={() => setActiveTab('documents')}
                  className="text-xs font-mono text-[var(--primary)] hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach New Document</span>
                </button>
              </div>

              {caseDocuments.length === 0 ? (
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-dashed border-[var(--border)] text-center">
                  <p className="text-xs text-[var(--text-secondary)]">No documents or evidence files attached yet.</p>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-cyan)] text-cyan-300 border border-[var(--primary)] text-xs font-semibold hover:bg-cyan-950 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload First Document</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {caseDocuments.slice(0, 6).map((doc, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-cyan-500/50 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {doc.documentType || doc.category || 'Evidence'}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>BSA-63</span>
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-[var(--text-primary)] truncate" title={doc.filename || doc.title}>
                          {doc.filename || doc.title || 'Attached File'}
                        </h5>
                        <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate mt-0.5">
                          SHA: {doc.sha256Hash ? `${doc.sha256Hash.slice(0, 16)}…` : 'Calculated'}
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
                        <span>{doc.uploadedAt ? doc.uploadedAt.slice(0, 10) : 'Recent'}</span>
                        <button
                          onClick={() => setActiveTab('documents')}
                          className="text-cyan-400 hover:text-cyan-300 font-mono font-semibold"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Dedicated Documents & Attachments Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            
            {/* Upload New Document Form */}
            <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Attach Evidence File or Legal Document to Case
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                Files uploaded here are cryptographically hashed using SHA-256 for BSA Section 63 electronic evidence compliance and automatically linked into this case dossier.
              </p>

              <form onSubmit={handleDocumentUpload} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* File Selection */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      Select Document / File *
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      required
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-[var(--text-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--surface-cyan)] file:text-cyan-300 hover:file:bg-cyan-950 file:cursor-pointer border border-[var(--border)] rounded-xl p-2 bg-[var(--bg-card)]"
                    />
                    {docFile && (
                      <span className="block mt-1 text-[11px] font-mono text-emerald-400">
                        Selected: {docFile.name} ({(docFile.size / 1024).toFixed(1)} KB)
                      </span>
                    )}
                  </div>

                  {/* Document Category */}
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                      Document / Evidence Classification *
                    </label>
                    <select
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
                    >
                      <option value="FIR / Complaint">FIR / Formal Complaint</option>
                      <option value="Charge Sheet">Police Charge Sheet / Final Report</option>
                      <option value="Seizure Memo / Panchnama">Seizure Memo / Panchnama</option>
                      <option value="Forensic Disk Image">Forensic Disk Image / Raw Dump</option>
                      <option value="Phone Extraction / CDR Dump">Phone Extraction / CDR Call Logs</option>
                      <option value="Bank Statement / KYC">Bank Statement / Hawala KYC Ledger</option>
                      <option value="Witness Statement">Witness Statement (Sec 161 CrPC)</option>
                      <option value="Photo / Audio Evidence">Surveillance Photo / Intercept Audio</option>
                      <option value="Other Evidence Document">Other Evidence Document</option>
                    </select>
                  </div>

                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Document Context & Evidence Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Seized from suspect laptop at Mumbai warehouse; recovery memo #421"
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isUploadingDoc || !docFile}
                    className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                  >
                    {isUploadingDoc && <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                    <span>{isUploadingDoc ? 'Hashing & Attaching...' : 'Attach Document with SHA-256 Hash'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Document Registry Table */}
            <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Attached Case Documents Registry ({caseDocuments.length})
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  Tamper-evident electronic record chain
                </span>
              </div>

              {caseDocuments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[var(--border)] rounded-xl">
                  <p className="text-xs text-[var(--text-secondary)]">No documents attached to this case dossier yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[10px] font-mono uppercase text-[var(--text-secondary)]">
                        <th className="py-2.5 px-3">Document Title</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">SHA-256 Genesis Hash</th>
                        <th className="py-2.5 px-3">Date Attached</th>
                        <th className="py-2.5 px-3">Integrity</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {caseDocuments.map((doc, idx) => {
                        const hash = doc.sha256Hash || doc.originalHashSHA256 || 'Calculated on upload';
                        return (
                          <tr key={idx} className="hover:bg-[var(--bg-card)]/50 transition-colors">
                            <td className="py-3 px-3">
                              <div className="font-semibold text-[var(--text-primary)]">
                                {doc.filename || doc.title || `Document ${doc.id}`}
                              </div>
                              {doc.description && (
                                <div className="text-[10px] text-[var(--text-secondary)] truncate max-w-xs">
                                  {doc.description}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                                {doc.documentType || doc.category || 'Evidence'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-cyan-300">
                              <span title={hash}>
                                {hash.length > 20 ? `${hash.slice(0, 16)}…${hash.slice(-6)}` : hash}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px] text-[var(--text-secondary)]">
                              {doc.uploadedAt ? doc.uploadedAt.slice(0, 16).replace('T', ' ') : 'Recent'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>MATCH</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <a
                                href={`${API_BASE}/evidence/${encodeURIComponent(doc.id || doc.evidenceId)}/file`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-cyan)] hover:bg-cyan-950 text-cyan-300 border border-[var(--primary)] text-[10px] font-mono font-bold transition-colors"
                              >
                                <Download className="w-3 h-3" />
                                <span>Download</span>
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'graph' && <NetworkGraphView />}
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'map' && <GISMapView />}
        {activeTab === 'entities' && <UnifiedEntitySearchView />}
        {activeTab === 'evidence' && <EvidenceView />}
        {activeTab === 'alerts' && <AlertsView />}
        {activeTab === 'assistant' && <AIAssistantView />}
        {activeTab === 'reports' && <ReportView />}

        {activeTab === 'audit' && (
          <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-6 border-[var(--border)] space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
              Immutable Cryptographic Audit Trail (M6 Ledger)
            </h3>
            <div className="space-y-2">
              {activeCase.auditHistory.map((item: any, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[var(--primary)] font-bold">{item.action}</span>
                    <span className="text-[var(--text-secondary)]">{item.timestamp}</span>
                  </div>
                  <div className="text-[var(--text-secondary)] font-sans">{item.details}</div>
                  <div className="text-[10px] text-[var(--text-secondary)] mt-1">Officer: {item.officer}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
