import React, { useState, useRef, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { hasPermission } from '../../utils/rbac';
import { fetchEvidenceList, verifyEvidenceSHA256 } from '../../services/evidenceService';
import { EvidenceRecord } from '../../types/evidence';
import { 
  FileCheck, 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Lock, 
  ExternalLink,
  Plus,
  X,
  File,
  HardDrive
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');

const getAuthHeaders = (): Record<string, string> => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('crimenet_auth_token') : null;
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`
  };
};

const normalizeEvidenceRecord = (e: any): EvidenceRecord => {
  const code = e.evidenceCode || e.id || '';
  const origHash = e.originalHashSHA256 || e.genesisHash || e.sha256Hash || '';
  const currHash = e.currentHashSHA256 || e.currentHash || origHash;
  const isMatch = (origHash && currHash && origHash.toLowerCase() === currHash.toLowerCase()) && (e.status !== 'REVOKED') && (e.integrityStatus !== 'MISMATCH');

  return {
    id: e.id || code,
    evidenceCode: code,
    title: e.title || e.name || e.canonicalName || 'Unknown Evidence',
    category: (e.category || e.evidenceType || 'Digital Forensic Image') as any,
    caseId: e.caseId || e.case_id || '',
    caseTitle: e.caseTitle || '',
    seizureDate: e.seizureDate || e.collectedDate || '',
    seizingOfficer: e.seizingOfficer || e.collectedBy || '',
    custodian: e.custodian || e.storageLocation || '',
    fileSizeBytes: typeof e.fileSizeBytes === 'number' ? e.fileSizeBytes : (typeof e.size === 'number' ? e.size : 0),
    originalHashSHA256: origHash,
    currentHashSHA256: currHash,
    integrityStatus: e.integrityStatus || (isMatch ? 'MATCH' : 'MISMATCH'),
    lastVerifiedAt: e.lastVerifiedAt || '',
    verifiedBy: e.verifiedBy || '',
    chainOfCustody: Array.isArray(e.chainOfCustody) ? e.chainOfCustody : [],
    bsaSection63Certificate: e.bsaSection63Certificate || {
      certificateId: e.bsaCert || e.bsaSection65BCertificateId || '',
      issuer: '',
      hashAlgorithm: 'SHA-256',
      signedAt: '',
      status: isMatch ? 'VALID' : 'REVOKED'
    },
    associatedEntities: Array.isArray(e.associatedEntities) ? e.associatedEntities : [],
    description: e.description || '',
    imageUrl: e.imageUrl || e.previewUrl || (e.metadata && (e.metadata.imageUrl || e.metadata.previewUrl)) || undefined,
    previewUrl: e.previewUrl || e.imageUrl,
    metadata: e.metadata || {}
  };
};

interface EvidenceViewProps {
  caseId?: string;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ caseId }) => {
  const { selectedEvidenceId, selectEvidence, setView, selectEntity, selectedCaseId } = useNavigationStore();
  const { addToast } = useNotificationStore();
  const { user } = useAuthStore();
  const canWriteEvidence = hasPermission(user?.grantedRole, 'evidence:write');

  const targetCase = caseId || selectedCaseId;

  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvidence = () => {
    if (!targetCase) return;
    setIsLoading(true);
    fetchEvidenceList(targetCase)
      .then(res => {
        if (res.success && res.data) {
          const list = (res.data || []).map(normalizeEvidenceRecord);
          setEvidenceList(list);
          if (list.length > 0) {
            setSelectedId(prev => (prev && list.some(item => item.id === prev)) ? prev : list[0].id);
          } else {
            setSelectedId('');
          }
        } else {
          setEvidenceList([]);
          setError(res.error || 'Failed to fetch evidence');
        }
      })
      .catch(err => {
        setEvidenceList([]);
        setError(err.message || 'Network request failed');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (targetCase) {
      loadEvidence();
    }
  }, [targetCase]);

  const [selectedId, setSelectedId] = useState<string>(selectedEvidenceId || '');
  useEffect(() => {
    if (!selectedId && evidenceList.length > 0) {
      setSelectedId(evidenceList[0].id);
    }
  }, [evidenceList, selectedId]);

  const isUploadModalOpen = useNavigationStore(state => state.isEvidenceUploadModalOpen);
  const [localModalOpen, setLocalModalOpen] = useState(false);
  const setIsUploadModalOpen = useNavigationStore(state => state.setEvidenceUploadModalOpen);
  const [isVerifying, setIsVerifying] = useState(false);
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // New Evidence Upload Form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'Digital Forensic Image' | 'CDR Dump' | 'Bank Statement'>('Digital Forensic Image');
  const [officerName, setOfficerName] = useState(user?.name || user?.email || 'Unknown Officer');
  const [realEvidenceFile, setRealEvidenceFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const realFileInputRef = useRef<HTMLInputElement>(null);

  const activeEvidence = evidenceList.find(e => e.id === selectedId) || evidenceList[0];

  const handleVerifyNow = async (evdId: string) => {
    setIsVerifying(true);
    try {
      const res = await verifyEvidenceSHA256(evdId);
      if (res.success && res.data) {
        const isMismatch = res.data.status !== 'MATCH' && res.data.isMatch !== true;
        const liveTimestamp = res.data.verifiedAt || new Date().toISOString().replace('T', ' ').slice(0, 19);

        setEvidenceList(prev => prev.map(item => {
          if (item.id === evdId) {
            return {
              ...item,
              currentHashSHA256: res.data.currentHash || res.data.calculatedHash || item.currentHashSHA256,
              integrityStatus: isMismatch ? 'MISMATCH' : 'MATCH',
              lastVerifiedAt: liveTimestamp,
              verifiedBy: 'System Verifier'
            };
          }
          return item;
        }));

        addToast({
          type: isMismatch ? 'error' : 'success',
          title: isMismatch ? 'INTEGRITY MISMATCH DETECTED' : 'SHA-256 Checksum Verified',
          message: isMismatch 
            ? 'Byte comparison failed! File modified since initial custody logging.' 
            : 'Genesis hash matches current storage bit-stream.'
        });
      } else {
        addToast({ type: 'error', title: 'Error', message: 'Verification failed.' });
      }
    } catch (e) {
      addToast({ type: 'error', title: 'Error', message: 'Verification failed.' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCase || !realEvidenceFile) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', realEvidenceFile);
      formData.append('title', uploadTitle);
      formData.append('seizingOfficer', officerName);
      
      const res = await fetch(`${API_BASE}/cases/${targetCase}/documents?category=${encodeURIComponent(uploadCategory)}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      if (res.ok || res.status === 201 || res.status === 202) {
        addToast({
          type: 'success',
          title: 'Evidence Uploaded',
          message: 'Evidence file successfully uploaded and logged.'
        });
        setLocalModalOpen(false); setIsUploadModalOpen(false);
        setUploadTitle('');
        setRealEvidenceFile(null);
        // Refresh evidence list to get the actual data from the backend
        loadEvidence();
      } else {
        const err = await res.json().catch(() => ({}));
        addToast({ type: 'error', title: 'Upload Failed', message: err.detail || err.message || 'Failed to upload evidence' });
      }
    } catch (err: any) {
      console.error('Evidence upload error:', err);
      addToast({ type: 'error', title: 'Upload Error', message: err.message || 'An error occurred during upload' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadModalJSX = (
    <>
            {/* UPLOAD EVIDENCE MODAL */}
            {(isUploadModalOpen || localModalOpen) && (
              <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[var(--bg-card)] shadow-xl border border-[var(--border)] rounded-2xl p-6 max-w-lg w-full animate-in zoom-in-95">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-[var(--primary)]" />
                      <h3 className="text-base font-bold text-[var(--text-primary)]">Upload Evidence</h3>
                    </div>
                    <button
                      onClick={() => { setLocalModalOpen(false); setIsUploadModalOpen(false); }}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
      
                  <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
                    
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                        Evidence Title / Description *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Seized Laptop"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full bg-[var(--bg-body)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
      
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                        Evidence Category *
                      </label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value as any)}
                        className="w-full bg-[var(--bg-body)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="Digital Forensic Image">Digital Forensic Image (E01 / RAW)</option>
                        <option value="CDR Dump">Telecom CDR Dump (CSV / XLS)</option>
                        <option value="Bank Statement">Bank Statement (PDF)</option>
                        <option value="Seized Physical Item">Seized Physical Item Photo</option>
                        <option value="CCTV Footage">CCTV Footage</option>
                        <option value="FIR Copy">FIR Copy</option>
                      </select>
                    </div>
      
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                        Seizing Officer / Lead Investigator *
                      </label>
                      <input
                        type="text"
                        required
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        className="w-full bg-[var(--bg-body)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>
      
                    {/* Drag Drop & Real File Picker Area */}
                    <div
                      onClick={() => realFileInputRef.current?.click()}
                      className="p-6 rounded-xl border-2 border-dashed border-[var(--primary)] bg-[var(--bg-body)] hover:bg-[var(--border)]/50 cursor-pointer text-center space-y-2 transition-colors"
                    >
                      <input
                        type="file"
                        ref={realFileInputRef}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setRealEvidenceFile(e.target.files[0]);
                            if (!uploadTitle) setUploadTitle(e.target.files[0].name);
                          }
                        }}
                      />
                      <HardDrive className="w-8 h-8 text-[var(--primary)] mx-auto opacity-80" />
                      <div className="text-[var(--text-secondary)] font-medium text-sm">
                        {realEvidenceFile ? (
                          <span className="text-[var(--primary)] font-bold">{realEvidenceFile.name} ({(realEvidenceFile.size / 1024).toFixed(1)} KB)</span>
                        ) : (
                          'Click to select file'
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                        {realEvidenceFile 
                          ? 'File ready for upload'
                          : 'Any file format accepted'}
                      </div>
                    </div>
      
                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setLocalModalOpen(false); setIsUploadModalOpen(false);
                          setRealEvidenceFile(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-[var(--bg-body)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !realEvidenceFile}
                        className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 font-bold uppercase tracking-wider shadow disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                      >
                        {isSubmitting ? 'Uploading...' : 'Upload Evidence'}
                      </button>
                    </div>
      
                  </form>
      
                </div>
              </div>
            )}
    </>
  );

  if (!targetCase) {
    return (
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl p-12 text-center space-y-4 animate-in fade-in">
        <FileCheck className="w-10 h-10 text-[var(--primary)] mx-auto opacity-70" />
        <h3 className="text-sm font-bold text-[var(--text-primary)]">No Case Selected</h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
          Please select a case to view its associated evidence catalogue.
        </p>
      </div>
    );
  }

  if (isLoading && evidenceList.length === 0) {
    return (
      <div className="p-12 text-center text-[var(--primary)] flex items-center justify-center gap-3">
        <span className="w-3 h-3 rounded-full bg-[var(--primary)] animate-ping" />
        <span className="font-mono text-sm">Loading Evidence Vault...</span>
      </div>
    );
  }

  if (error && evidenceList.length === 0) {
    return (
      <div className="p-8 bg-red-950/20 border border-red-800 rounded-2xl text-red-300 space-y-2">
        <div className="font-bold text-sm">Evidence Vault Error: {error}</div>
        <p className="text-xs text-red-400/70">Please check network connection or switch cases.</p>
      </div>
    );
  }

  if (evidenceList.length === 0) {
    return (
        <>
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl p-12 text-center space-y-4 animate-in fade-in">
        <FileCheck className="w-10 h-10 text-[var(--primary)] mx-auto opacity-70" />
        <h3 className="text-sm font-bold text-[var(--text-primary)]">No Evidence Catalogued For This Case</h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
          Upload physical seizure memos, digital forensic images, or telecom dumps.
        </p>
        {canWriteEvidence ? (
          <button
            onClick={() => { setLocalModalOpen(true); setIsUploadModalOpen(true); }}
            className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-opacity-90 font-bold text-xs uppercase"
          >
            Upload Evidence
          </button>
        ) : (
          <div className="text-xs text-[var(--warning)] font-mono">
            Read-only Evidence Access ({user?.grantedRole || 'ANALYST'})
          </div>
        )}
      </div>
          {uploadModalJSX}
        </>
    );
  }


  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Upload Action */}
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold">
              Evidence Security & Ledger
            </span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1">
            Evidence Chain of Custody
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Cryptographic verification and storage management.
          </p>
        </div>

        {canWriteEvidence ? (
          <button
            onClick={() => { setLocalModalOpen(true); setIsUploadModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 font-bold text-xs uppercase tracking-wider transition-colors self-start sm:self-auto shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Evidence</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[var(--warning)] text-xs font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Read-Only Evidence Vault ({user?.grantedRole || 'ANALYST'})</span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Evidence List, Right Active Evidence Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Evidence List (1 Col) */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
            Catalogued Items ({evidenceList.length})
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {evidenceList.map(evd => {
              const isSelected = evd.id === activeEvidence.id;
              const isMatch = evd.integrityStatus === 'MATCH';
              return (
                <div
                  key={evd.id}
                  onClick={() => {
                    setSelectedId(evd.id);
                    selectEvidence(evd.id);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--bg-card)] border-[var(--primary)] shadow-sm'
                      : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--text-secondary)]/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-mono font-bold text-[var(--primary)]">{evd.evidenceCode || 'N/A'}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isMatch 
                        ? 'bg-emerald-500/10 text-[var(--success)] border border-emerald-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}>
                      {evd.integrityStatus}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)] line-clamp-2">{evd.title}</h4>
                  {evd.seizureDate && <div className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">Seized: {evd.seizureDate}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Evidence Profile & SHA-256 Verifier (2 Cols) */}
        {activeEvidence && (
        <div className="lg:col-span-2 space-y-5">
          
          {/* Header Card */}
          <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {activeEvidence.evidenceCode && (
                    <span className="text-xs font-mono font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded border border-[var(--primary)]/20">
                      {activeEvidence.evidenceCode}
                    </span>
                  )}
                  <span className="text-xs font-mono text-[var(--text-secondary)]">{activeEvidence.category}</span>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">Size: {(activeEvidence.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{activeEvidence.title}</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-2">{activeEvidence.description || 'No description provided.'}</p>
              </div>

              <button
                onClick={() => handleVerifyNow(activeEvidence.id)}
                disabled={isVerifying || !activeEvidence.originalHashSHA256}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--border)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] transition-colors shrink-0 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                <span>{isVerifying ? 'Computing Hash...' : 'Re-verify SHA-256'}</span>
              </button>
            </div>

            {/* SHA-256 COMPARISON DISPLAY BOX */}
            <div className={`mt-5 p-4 rounded-xl border ${
              activeEvidence.integrityStatus === 'MATCH'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Cryptographic Checksum Audit
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                  activeEvidence.integrityStatus === 'MATCH'
                    ? 'bg-emerald-500/10 text-[var(--success)]'
                    : 'bg-red-500/10 text-red-500'
                }`}>
                  {activeEvidence.integrityStatus === 'MATCH' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>MATCH (INTEGRITY INTACT)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>MISMATCH (TAMPER ALERT!)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div>
                  <div className="text-[10px] uppercase text-[var(--text-secondary)] mb-0.5">Original Genesis Hash:</div>
                  <div className="p-2 rounded bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] break-all select-all">
                    {activeEvidence.originalHashSHA256 || 'Not Available'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase text-[var(--text-secondary)] mb-0.5">Current Computed Hash:</div>
                  <div className={`p-2 rounded border break-all select-all ${
                    activeEvidence.integrityStatus === 'MATCH'
                      ? 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--success)]'
                      : 'bg-red-500/10 border-red-500/30 text-red-500 font-bold'
                  }`}>
                    {activeEvidence.currentHashSHA256 || 'Not Available'}
                  </div>
                </div>
              </div>

              {(activeEvidence.verifiedBy || activeEvidence.lastVerifiedAt) && (
                <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] mt-3 pt-2 border-t border-[var(--border)]">
                  <div>Verified By: <span className="text-[var(--text-primary)]">{activeEvidence.verifiedBy || 'N/A'}</span></div>
                  <div>Timestamp: <span className="text-[var(--primary)]">{activeEvidence.lastVerifiedAt || 'N/A'}</span></div>
                </div>
              )}

            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-1">
                <div className="text-[10px] uppercase text-[var(--text-secondary)] font-semibold">Uploader / Seizing Officer</div>
                <div className="text-xs font-medium text-[var(--text-primary)]">{activeEvidence.seizingOfficer || 'Unknown'}</div>
              </div>
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-1">
                <div className="text-[10px] uppercase text-[var(--text-secondary)] font-semibold">Upload Date / Seizure</div>
                <div className="text-xs font-medium text-[var(--text-primary)]">{activeEvidence.seizureDate || 'Unknown'}</div>
              </div>
            </div>

            {/* BSA Certificate (if exists) */}
            {activeEvidence.bsaSection63Certificate?.certificateId && (
              <div className="mt-5 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                    <Lock className="w-4 h-4 text-[var(--primary)]" />
                    <span>Evidence Certificate</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded border border-[var(--primary)]/20">
                    {activeEvidence.bsaSection63Certificate.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-[var(--text-secondary)] pt-1">
                  <div>Cert ID: <span className="text-[var(--text-primary)]">{activeEvidence.bsaSection63Certificate.certificateId}</span></div>
                  <div>Issuer: <span className="text-[var(--text-primary)] truncate">{activeEvidence.bsaSection63Certificate.issuer || 'N/A'}</span></div>
                  <div>Signed: <span className="text-[var(--text-primary)]">{activeEvidence.bsaSection63Certificate.signedAt || 'N/A'}</span></div>
                </div>
              </div>
            )}

            {/* Visual Photographic Evidence Card */}
            {(activeEvidence.imageUrl) && (
              <div className="mt-5 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)]">
                    <FileCode className="w-4 h-4 text-[var(--primary)]" />
                    <span>Visual Evidence Artefact</span>
                  </div>
                </div>

                <div className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-body)] flex items-center justify-center min-h-[220px] max-h-[380px]">
                  <img 
                    src={activeEvidence.imageUrl} 
                    alt={activeEvidence.title}
                    className="max-h-[360px] w-auto max-w-full object-contain cursor-pointer transition-transform group-hover:scale-[1.02]"
                    onClick={() => setPreviewImageModal(activeEvidence.imageUrl || null)}
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewImageModal(activeEvidence.imageUrl || null)}
                    className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-mono text-[var(--text-primary)] border border-white/20 hover:bg-black"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Enlarge</span>
                  </button>
                </div>
              </div>
            )}

            {/* Chain of Custody History */}
            {activeEvidence.chainOfCustody && activeEvidence.chainOfCustody.length > 0 && (
              <div className="mt-5 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                  Chain of Custody Ledger Logs
                </h4>

                <div className="space-y-2">
                  {activeEvidence.chainOfCustody.map((log, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="font-semibold text-[var(--primary)]">{log.action}</span>
                        <span className="text-[var(--text-secondary)]">{log.timestamp}</span>
                      </div>
                      <div className="text-[var(--text-secondary)]">{log.notes}</div>
                      <div className="text-[10px] text-[var(--text-secondary)] mt-1">Custodian: {log.officer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Associated Entities Links */}
            {activeEvidence.associatedEntities && activeEvidence.associatedEntities.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[var(--border)]">
                <span className="text-[10px] font-mono uppercase text-[var(--text-secondary)] block mb-2 font-semibold">
                  Associated Entities:
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeEvidence.associatedEntities.map(ent => (
                    <button
                      key={ent.entityId}
                      onClick={() => { selectEntity(ent.entityId); setView('entity'); }}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--border)] border border-[var(--border)] text-xs text-[var(--primary)] font-mono flex items-center gap-1.5 transition-colors"
                    >
                      <span>{ent.label}</span>
                      <span className="text-[10px] opacity-70">({ent.entityType})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
        )}

      </div>


      {/* FULLSCREEN IMAGE EVIDENCE MODAL */}
      {previewImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImageModal(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between pb-3 text-[var(--text-primary)] mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--primary)] font-bold">{activeEvidence.evidenceCode}</span>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{activeEvidence.title}</span>
              </div>
              <button
                onClick={() => setPreviewImageModal(null)}
                className="p-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--sidebar-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img 
              src={previewImageModal} 
              alt={activeEvidence.title} 
              className="max-h-[75vh] w-auto max-w-full rounded-xl border border-white/10 shadow-2xl object-contain bg-black"
            />
          </div>
        </div>
      )}

      {uploadModalJSX}
    </div>
  );
};







