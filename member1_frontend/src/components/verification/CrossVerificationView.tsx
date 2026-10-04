import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { CrossVerificationDiscrepancy } from '../../types/evidence';
import { fetchDiscrepancies, downloadBsaSection63CertificatePdf } from '../../services/evidenceService';
import { 
  AlertOctagon, 
  AlertTriangle, 
  FileText, 
  Radio, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  Share2,
  Fingerprint,
  FileCheck,
  Check,
  Layers,
  MapPin,
  Info,
  ShieldCheck,
  Search,
  ExternalLink,
  Loader2
} from 'lucide-react';

export const CrossVerificationView: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useNotificationStore();
  const { 
    setView, 
    selectedCaseId, 
    selectEntity, 
    setGlobalSearchQuery, 
    selectEvidence 
  } = useNavigationStore();

  const [discrepancies, setDiscrepancies] = useState<CrossVerificationDiscrepancy[]>([]);
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState<string>('');
  const [certGenerated, setCertGenerated] = useState<boolean>(false);
  const [isGeneratingCert, setIsGeneratingCert] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedCaseId) {
      setDiscrepancies([]);
      setSelectedDiscrepancyId('');
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    fetchDiscrepancies(selectedCaseId)
      .then(res => {
        if (!active) return;
        if (res.success && res.data && res.data.length > 0) {
          setDiscrepancies(res.data);
          setSelectedDiscrepancyId(res.data[0].id);
        } else {
          setDiscrepancies([]);
          setSelectedDiscrepancyId('');
        }
      })
      .catch((err) => {
        if (!active) return;
        setDiscrepancies([]);
        setSelectedDiscrepancyId('');
        setError('Failed to fetch cross-verification discrepancies.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [selectedCaseId]);

  const activeDiscrepancy = discrepancies.find(d => d.id === selectedDiscrepancyId) || discrepancies[0];

  const handleExportCertificate = async () => {
    if (!selectedCaseId) {
      addToast({
        type: 'warning',
        title: 'No Case Selected',
        message: 'Please select an active case to generate a statutory certificate.'
      });
      return;
    }

    setIsGeneratingCert(true);
    try {
      const evidenceInfo = activeDiscrepancy ? resolveContradictionEvidence(activeDiscrepancy) : undefined;
      const blob = await downloadBsaSection63CertificatePdf(
        selectedCaseId,
        activeDiscrepancy?.id,
        evidenceInfo?.id
      );

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const discTag = (activeDiscrepancy?.id || 'M3-01').replace('-', '_');
      link.download = `BSA_Section_63_Certificate_${selectedCaseId}_${discTag}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setCertGenerated(true);
      addToast({
        type: 'success',
        title: 'BSA §63 Certificate Generated',
        message: 'Electronic Evidence Certificate PDF generated with cryptographic SHA-256 hash.',
        duration: 4000
      });

      setTimeout(() => {
        setCertGenerated(false);
      }, 5000);
    } catch (err: any) {
      console.error('Failed to download BSA §63 certificate PDF:', err);
      addToast({
        type: 'error',
        title: 'Certificate Generation Failed',
        message: err.message || 'Unable to generate BSA §63 certificate PDF.',
        duration: 4000
      });
    } finally {
      setIsGeneratingCert(false);
    }
  };

  // Resolves the primary subject or entity associated with the current contradiction
  const resolveContradictionEntity = (disc: CrossVerificationDiscrepancy) => {
    const title = (disc.title || '').toLowerCase();
    const field = (disc.conflictingField || '').toLowerCase();

    const CASE_SUSPECT_MAP: Record<string, { id: string; name: string }> = {
      'CASE-2026-011': { id: 'P-SLV-001', name: 'Vikramaditya Rao' },
      'CASE-2024-001': { id: 'PER-UP-DA284E', name: 'Vikram Malhotra' },
      'CASE-2026-CTB-005': { id: 'P-CTB-02', name: 'Vikram Malhotra' },
      'CASE-2026-NRC-003': { id: 'P-NRC-03', name: 'Tariq Butt' },
      'CASE-2026-HWL-001': { id: 'P-HWL-01', name: 'Rajesh Singhania' },
      'CASE-2026-CYB-002': { id: 'P-CYB-01', name: 'Deepak Chouhan' },
      'CASE-2026-VHL-004': { id: 'P-VHL-01', name: 'Gurpreet Singh' },
      'CASE-2026-DOC-006': { id: 'P-DOC-01', name: 'Arunachalam Murthy' },
      'CASE-2026-SHL-007': { id: 'P-SHL-01', name: 'Venkat Ramanathan' },
      'CASE-2026-VOIP-008': { id: 'P-VOIP-01', name: 'Karthik Subramanian' },
      'CASE-2026-ARM-009': { id: 'P-ARM-01', name: 'Rameshwar Singh' },
      'CASE-2026-GNG-010': { id: 'P-GNG-01', name: 'Tejpal Bishnoi' },
      'CASE-2026-013': { id: 'CRR-B001', name: 'CRR-ACC-1202' }
    };

    if (selectedCaseId && CASE_SUSPECT_MAP[selectedCaseId]) {
      return CASE_SUSPECT_MAP[selectedCaseId];
    }

    // 1. Alibi vs Telecom Tower contradiction (DISCREPANCY-M3-01)
    if (disc.id === 'DISCREPANCY-M3-01' || title.includes('alibi') || field.includes('suspect location')) {
      return { id: 'P-SLV-001', name: 'Vikramaditya Rao' };
    }

    // 2. Cargo declaration vs weighbridge (DISCREPANCY-M3-02)
    if (disc.id === 'DISCREPANCY-M3-02' || title.includes('cargo') || field.includes('weight')) {
      return { id: 'ENT-ORG-001', name: 'Container #MRKU-982141-0' };
    }

    // 3. Financial Income vs RTGS Hawala (DISCREPANCY-V1-01)
    if (disc.id === 'DISCREPANCY-V1-01' || title.includes('income') || title.includes('rtgs')) {
      return { id: 'P-HWL-01', name: 'Rajesh Singhania' };
    }

    // 4. Vessel AIS Tracker (DISCREPANCY-V2-01)
    if (disc.id === 'DISCREPANCY-V2-01' || title.includes('vessel') || title.includes('ais')) {
      return { id: 'P-NRC-03', name: 'Tariq Butt' };
    }

    // 5. Domain WHOIS / Tor Server (DISCREPANCY-V3-01)
    if (disc.id === 'DISCREPANCY-V3-01' || title.includes('whois') || title.includes('tls')) {
      return { id: 'P-CYB-01', name: 'Deepak Chouhan' };
    }

    // 6. Fastag Toll Booth (DISCREPANCY-V4-01)
    if (disc.id === 'DISCREPANCY-V4-01' || title.includes('fastag') || title.includes('toll')) {
      return { id: 'P-VHL-01', name: 'Gurpreet Singh' };
    }

    return { id: 'P-SLV-001', name: 'Vikramaditya Rao' };
  };

  // Resolves the evidence vault record associated with the contradiction
  const resolveContradictionEvidence = (disc: CrossVerificationDiscrepancy) => {
    if (disc.id === 'DISCREPANCY-M3-01' || disc.title.toLowerCase().includes('telecom cdr')) {
      return { id: 'EVD-2025-M3-03', title: disc.sourceB?.documentRef || 'Carrier Audit Dump AIRTEL-CDR' };
    }
    if (disc.id === 'DISCREPANCY-M3-02' || disc.title.toLowerCase().includes('cargo')) {
      return { id: 'EVD-2025-M3-01', title: disc.sourceB?.documentRef || 'Port Weighbridge Panchnama' };
    }
    if (disc.id === 'DISCREPANCY-V1-01') return { id: 'EVD-VIDEO-001', title: 'Accounting Hard Drive' };
    if (disc.id === 'DISCREPANCY-V2-01') return { id: 'EVD-VIDEO-002', title: 'Satellite Intercept Voice Capture' };
    if (disc.id === 'DISCREPANCY-V3-01') return { id: 'EVD-VIDEO-003', title: 'C2 Server Memory Dump' };
    if (disc.id === 'DISCREPANCY-V4-01') return { id: 'EVD-VIDEO-004', title: 'Safehouse Route Ledger' };

    return { id: '', title: disc.sourceB?.documentRef || 'Case Evidence Records' };
  };

  const handleSearchInDossier = () => {
    if (!activeDiscrepancy) return;
    const target = resolveContradictionEntity(activeDiscrepancy);
    const query = target.name;

    selectEntity(target.id);
    setGlobalSearchQuery(query);
    setView('entity');

    addToast({
      type: 'info',
      title: 'Dossier Query Initiated',
      message: `Loading dossier for ${query} (${target.id})...`,
      duration: 2500
    });

    navigate(`/entities?q=${encodeURIComponent(query)}&entityId=${encodeURIComponent(target.id)}&caseId=${encodeURIComponent(selectedCaseId || '')}`);
  };

  const handleOpenEvidenceVault = () => {
    if (!activeDiscrepancy) return;
    const evidence = resolveContradictionEvidence(activeDiscrepancy);

    if (evidence.id) {
      selectEvidence(evidence.id);
    }
    setView('evidence');

    addToast({
      type: 'info',
      title: 'Evidence Vault Access',
      message: `Opening Evidence Vault for case ${selectedCaseId}...`,
      duration: 2500
    });

    const url = evidence.id ? `/evidence?evidenceId=${encodeURIComponent(evidence.id)}` : '/evidence';
    navigate(url);
  };

  const handleInspectInNetworkGraph = () => {
    if (!activeDiscrepancy) return;
    const target = resolveContradictionEntity(activeDiscrepancy);

    selectEntity(target.id);
    setView('graph');

    addToast({
      type: 'info',
      title: 'Network Graph Centering',
      message: `Focusing graph on ${target.name} and connected contradiction nodes...`,
      duration: 2500
    });

    navigate(`/graph?entityId=${encodeURIComponent(target.id)}&caseId=${encodeURIComponent(selectedCaseId || '')}&focus=${encodeURIComponent(target.id)}`);
  };

  if (!selectedCaseId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
        <Info className="w-10 h-10 text-[var(--primary)] mb-4" />
        <h3 className="text-lg font-semibold text-slate-800">No Case Selected</h3>
        <p className="text-sm text-[var(--text-muted)] mt-2">Please select an active case to run cross-verification analysis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-ping inline-block" />
              M5 Cross-Verification Engine
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
              Multi-Source Contradiction Auditor
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              BSA Section 63 Compliant
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1.5">
            Cross-Source Evidentiary Discrepancy Analysis
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Automated confrontation of statements, CDR dumps, ledgers, and telemetrics to detect irreconcilable factual discrepancies.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">Active Case:</span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              {selectedCaseId}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 shadow-sm">
        <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-blue-900 uppercase tracking-wide font-mono block">
            JUDICIAL IMPARTIALITY DIRECTIVE (BSA 2023):
          </span>
          <p className="text-blue-950 mt-1 leading-relaxed font-normal">
            CrimeNet AI highlights mathematical, temporal, and spatial contradictions between conflicting evidence records. <strong>The engine does not decide which source is truthful.</strong> Admissibility determinations remain within the exclusive domain of the Trial Court.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-slate-600 font-medium">Analyzing multi-source evidence...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-3">
          <Info className="w-5 h-5" />
          {error}
        </div>
      ) : discrepancies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100">
            <ShieldCheck className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Discrepancies Found</h3>
          <p className="text-sm text-[var(--text-muted)] mt-2 max-w-md">
            The cross-verification engine did not detect any direct factual contradictions across the processed evidence sources for this case.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600" />
                Detected Contradiction Records ({discrepancies.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {discrepancies.map(disc => {
                const isSelected = disc.id === activeDiscrepancy?.id;
                return (
                  <div
                    key={disc.id}
                    onClick={() => setSelectedDiscrepancyId(disc.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-100'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        isSelected
                          ? 'text-blue-700 bg-blue-100 border-blue-200'
                          : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}>
                        {disc.id}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{disc.title}</h4>
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-navy-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 truncate font-medium">
                      <AlertOctagon className="w-3.5 h-3.5 text-navy-600 shrink-0" />
                      <span className="truncate">{disc.conflictingField}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {activeDiscrepancy && (
            <div className="border border-slate-200 bg-white rounded-2xl p-6 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                    <AlertOctagon className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                        {activeDiscrepancy.status}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {activeDiscrepancy.title}
                    </h2>
                    <div className="text-xs font-mono text-slate-600 mt-1.5 flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[var(--text-muted)]">Parameter Contradiction:</span>
                      <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded-md border border-slate-200">
                        {activeDiscrepancy.conflictingField}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={handleExportCertificate}
                    disabled={isGeneratingCert}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 hover:border-slate-400 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Generate and download statutory Electronic Evidence Certificate PDF under Section 63 of Bharatiya Sakshya Adhiniyam, 2023"
                  >
                    {certGenerated ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-700 font-bold">BSA §63 Certificate Downloaded!</span>
                      </>
                    ) : isGeneratingCert ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                        <span className="text-slate-700">Generating Certificate...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Generate BSA §63 Electronic Evidence Certificate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">
                        SOURCE RECORD A
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                      {activeDiscrepancy.sourceA.timestamp}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {activeDiscrepancy.sourceA.sourceName}
                    </div>
                    <div className="text-xs font-mono text-blue-700 font-semibold mt-0.5">
                      Reference: {activeDiscrepancy.sourceA.documentRef}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-100">
                    <span className="text-[10px] font-mono uppercase text-blue-800 font-bold block mb-1">
                      Claimed / Logged Value:
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                      {activeDiscrepancy.sourceA.recordedValue}
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 italic bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                    <span className="not-italic text-[10px] font-mono text-[var(--text-muted)] font-bold block mb-1">
                      Documentary Excerpt:
                    </span>
                    {activeDiscrepancy.sourceA.excerpt}
                  </div>
                </div>

                <div className="bg-white border border-navy-200 rounded-xl p-5 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-navy-600" />
                      <span className="text-xs font-mono font-bold text-navy-700 uppercase tracking-wider">
                        SOURCE RECORD B (CORROBORATION)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                      {activeDiscrepancy.sourceB.timestamp}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {activeDiscrepancy.sourceB.sourceName}
                    </div>
                    <div className="text-xs font-mono text-navy-700 font-semibold mt-0.5">
                      Reference: {activeDiscrepancy.sourceB.documentRef}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-mono uppercase text-slate-700 font-bold block mb-1">
                      Sensor / Telemetry / Ledger Verification:
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                      {activeDiscrepancy.sourceB.recordedValue}
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 italic bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                    <span className="not-italic text-[10px] font-mono text-[var(--text-muted)] font-bold block mb-1">
                      Documentary Excerpt:
                    </span>
                    {activeDiscrepancy.sourceB.excerpt}
                  </div>
                </div>

              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-700 font-mono font-bold uppercase tracking-wider text-[11px]">
                  <Fingerprint className="w-4 h-4 text-slate-600" />
                  Forensic Intelligence Commentary & Discrepancy Synthesis
                </div>
                <p className="text-slate-900 font-normal text-xs sm:text-[13px] leading-relaxed">
                  {activeDiscrepancy.analyticalNotes}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-slate-700 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Recommended Investigator Inquiries & Statutory Notices:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeDiscrepancy.investigatorActions.map((action, i) => (
                    <div 
                      key={i} 
                      className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs text-slate-800 leading-snug"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="font-medium text-slate-800">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSearchInDossier}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer hover:border-blue-300"
                    title="Search suspect dossier and associated entities in Dossier Explorer"
                  >
                    <Search className="w-3.5 h-3.5 text-blue-600" />
                    <span>Search in Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenEvidenceVault}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer hover:border-slate-400"
                    title="Open Evidence Vault and inspect source corroboration artifacts for this case"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    <span>Open Evidence Vault</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInspectInNetworkGraph}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer hover:border-slate-400"
                    title="Inspect entity relationships and telecom/location link in Network Graph"
                  >
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Inspect in Network Graph</span>
                  </button>
                </div>
              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
};
