import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { SYNTHETIC_EVIDENCE_RECORDS } from '../../data/syntheticData';
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

export const EvidenceView: React.FC = () => {
  const { selectedEvidenceId, selectEvidence, setView, selectEntity } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [evidenceList, setEvidenceList] = useState<EvidenceRecord[]>(SYNTHETIC_EVIDENCE_RECORDS);
  const [selectedId, setSelectedId] = useState<string>(selectedEvidenceId || SYNTHETIC_EVIDENCE_RECORDS[0].id);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // New Evidence Upload Form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'Digital Forensic Image' | 'CDR Dump' | 'Bank Statement'>('Digital Forensic Image');
  const [officerName, setOfficerName] = useState('Inspector Vikramaditya Rao');

  const activeEvidence = evidenceList.find(e => e.id === selectedId) || evidenceList[0];

  const handleVerifyNow = (evdId: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const isMismatch = evdId === 'EVD-2024-0814';
      addToast({
        type: isMismatch ? 'error' : 'success',
        title: isMismatch ? 'INTEGRITY MISMATCH DETECTED' : 'SHA-256 Checksum Verified',
        message: isMismatch 
          ? 'Byte comparison failed! File modified since initial custody logging.' 
          : 'Genesis hash matches current file bit-stream.'
      });
    }, 800);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: EvidenceRecord = {
      id: `EVD-2024-08${Math.floor(15 + Math.random() * 80)}`,
      evidenceCode: `EVD-2024-08${Math.floor(15 + Math.random() * 80)}`,
      title: uploadTitle || 'Seized Secondary Digital Storage Device',
      category: uploadCategory,
      caseId: 'CASE-2024-MH-092',
      caseTitle: 'Operation Blue Tide',
      seizureDate: new Date().toISOString().replace('T', ' ').slice(0, 19),
      seizingOfficer: officerName,
      custodian: 'CID Digital Evidence Locker',
      fileSizeBytes: 842000000,
      originalHashSHA256: '7b9c1d2e3f4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789',
      currentHashSHA256: '7b9c1d2e3f4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789',
      integrityStatus: 'MATCH',
      lastVerifiedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      verifiedBy: 'M6 Automated SHA-256 Daemon',
      chainOfCustody: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          action: 'EVIDENCE_INGESTION',
          officer: officerName,
          notes: 'Evidence uploaded and hashed under BSA Section 63 electronic signature.'
        }
      ],
      bsaSection63Certificate: {
        certificateId: `BSA-63-CID-${Math.floor(1000 + Math.random() * 9000)}`,
        issuer: 'State Forensic Laboratory Maharashtra',
        hashAlgorithm: 'SHA-256',
        signedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'VALID'
      },
      associatedEntities: [
        { entityId: 'ENT-PERS-001', entityType: 'Person', label: 'Vikram Malhotra' }
      ],
      description: 'Newly uploaded evidentiary artefact for forensic analysis.'
    };

    setEvidenceList([newRecord, ...evidenceList]);
    setSelectedId(newRecord.id);
    setIsUploadModalOpen(false);
    setUploadTitle('');
    addToast({
      type: 'success',
      title: 'Evidence Registered',
      message: `${newRecord.evidenceCode} logged with cryptographic SHA-256 genesis hash.`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Upload Action */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              M6 Cryptographic Security & Ledger
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Bharatiya Sakshya Adhiniyam (BSA §63) Compliant
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1">
            Evidence Chain of Custody & SHA-256 Verification
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamper-evident verification comparing original genesis checksums against active bitstreams.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Evidence</span>
        </button>
      </div>

      {/* Main Grid: Left Evidence List, Right Active Evidence Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Evidence List (1 Col) */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Catalogued Seizure Items ({evidenceList.length})
          </div>

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
                    ? 'glass-panel bg-slate-900/90 border-cyan-500/50 shadow-md'
                    : 'glass-card bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono font-bold text-cyan-400">{evd.evidenceCode}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isMatch 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-red-500/15 text-red-300 border border-red-500/40 animate-pulse'
                  }`}>
                    {evd.integrityStatus}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 truncate">{evd.title}</h4>
                <div className="text-[11px] text-slate-400 mt-1 truncate">Seized: {evd.seizureDate}</div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Evidence Profile & SHA-256 Verifier (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          
          {/* Header Card */}
          <div className="glass-panel rounded-2xl p-6 border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {activeEvidence.evidenceCode}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{activeEvidence.category}</span>
                  <span className="text-xs font-mono text-slate-500">Case: {activeEvidence.caseId}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-100">{activeEvidence.title}</h2>
                <p className="text-xs text-slate-400 mt-1">{activeEvidence.description}</p>
              </div>

              <button
                onClick={() => handleVerifyNow(activeEvidence.id)}
                disabled={isVerifying}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-semibold text-cyan-300 transition-colors shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>{isVerifying ? 'Computing Hash...' : 'Re-verify SHA-256'}</span>
              </button>
            </div>

            {/* SHA-256 COMPARISON DISPLAY BOX */}
            <div className={`mt-5 p-4 rounded-xl border ${
              activeEvidence.integrityStatus === 'MATCH'
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/40'
            }`}>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  Cryptographic Checksum Audit (SHA-256)
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                  activeEvidence.integrityStatus === 'MATCH'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/20 text-red-400 animate-pulse'
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
                  <div className="text-[10px] uppercase text-slate-400 mb-0.5">Original Genesis Hash (At Seizure):</div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 break-all select-all">
                    {activeEvidence.originalHashSHA256}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase text-slate-400 mb-0.5">Current Computed Hash (Storage Node):</div>
                  <div className={`p-2 rounded border break-all select-all ${
                    activeEvidence.integrityStatus === 'MATCH'
                      ? 'bg-slate-950 border-slate-800 text-emerald-400'
                      : 'bg-red-950/40 border-red-800 text-red-300 font-bold'
                  }`}>
                    {activeEvidence.currentHashSHA256}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800/80">
                <div>Verified By: <span className="text-slate-200">{activeEvidence.verifiedBy}</span></div>
                <div>Timestamp: <span className="text-cyan-400">{activeEvidence.lastVerifiedAt}</span></div>
              </div>

            </div>

            {/* BSA Section 63 Electronic Evidence Certificate */}
            <div className="mt-5 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>BSA Section 63 Admissibility Certificate</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  {activeEvidence.bsaSection63Certificate.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div>Cert ID: <span className="text-slate-200">{activeEvidence.bsaSection63Certificate.certificateId}</span></div>
                <div>Issuer: <span className="text-slate-200 truncate">{activeEvidence.bsaSection63Certificate.issuer}</span></div>
                <div>Signed: <span className="text-slate-200">{activeEvidence.bsaSection63Certificate.signedAt}</span></div>
              </div>
            </div>

            {/* Chain of Custody History */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Chain of Custody Ledger Logs
              </h4>

              <div className="space-y-2">
                {activeEvidence.chainOfCustody.map((log, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="font-semibold text-cyan-400">{log.action}</span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <div className="text-slate-300">{log.notes}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Custodian: {log.officer}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Associated Entities Links */}
            <div className="mt-5 pt-4 border-t border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-semibold">
                Associated Entities in Evidence:
              </span>
              <div className="flex flex-wrap gap-2">
                {activeEvidence.associatedEntities.map(ent => (
                  <button
                    key={ent.entityId}
                    onClick={() => { selectEntity(ent.entityId); setView('entity'); }}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs text-cyan-300 font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <span>{ent.label}</span>
                    <span className="text-[10px] text-slate-500">({ent.entityType})</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* UPLOAD EVIDENCE MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-950 rounded-2xl border-cyan-500/40 p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">Upload Seized Digital Evidence</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Evidence Title / Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seized Laptop Bitstream Image (Dell Latitude)"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Evidence Category *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Digital Forensic Image">Digital Forensic Image (E01 / RAW)</option>
                  <option value="CDR Dump">Telecom CDR Dump (CSV / XLS)</option>
                  <option value="Bank Statement">Certified Bank Statement (PDF)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Seizing Officer / Lead Investigator *
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Drag Drop Mock Area */}
              <div className="p-6 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900/50 text-center space-y-2">
                <HardDrive className="w-8 h-8 text-cyan-400 mx-auto" />
                <div className="text-slate-300 font-medium">Select file or drag bitstream image here</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  SHA-256 calculation will be executed automatically by M6 integrity daemon upon ingest
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider shadow"
                >
                  Ingest & Compute Hash
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
