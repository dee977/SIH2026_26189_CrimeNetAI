import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  SYNTHETIC_CASES, 
  PERSON_VIKRAM_MALHOTRA, 
  PERSON_RAJESH_SHARMA,
  SYNTHETIC_EVIDENCE_RECORDS, 
  SYNTHETIC_DISCREPANCIES,
  SYNTHETIC_TIMELINE_EVENTS,
  GRAPH_NODES
} from '../../data/syntheticData';
import { 
  FileText, 
  Download, 
  Printer, 
  ShieldCheck, 
  Share2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const { selectedCaseId } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [isExporting, setIsExporting] = useState(false);
  const activeCase = SYNTHETIC_CASES.find(c => c.id === selectedCaseId) || SYNTHETIC_CASES[0];

  const handleExportPdf = () => {
    setIsExporting(true);
    addToast({
      type: 'info',
      title: 'Dispatching PDF Job to M2',
      message: 'Requesting backend report generation engine...'
    });

    setTimeout(() => {
      setIsExporting(false);
      addToast({
        type: 'success',
        title: 'Report Compiled & Signed',
        message: `Investigation Dossier ${activeCase.caseNumber}.pdf ready for download.`
      });
      window.print();
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Actions */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Formal Judicial Dossier Generator
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              BSA Section 63 Compliant Export
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1">
            Comprehensive Case Intelligence Report
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured forensic dossier summarizing network findings, multi-hop evidence links, and cryptographic checksums for prosecutorial submission.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Export Formal PDF'}</span>
          </button>
        </div>
      </div>

      {/* FORMAL REPORT PREVIEW DOCUMENT */}
      <div className="glass-panel rounded-2xl p-8 sm:p-10 border-slate-800 bg-[#0b1020] text-slate-200 space-y-8 font-sans shadow-2xl max-w-4xl mx-auto">
        
        {/* Document Header */}
        <div className="border-b-2 border-slate-700 pb-6 text-center space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
            CONFIDENTIAL LAW ENFORCEMENT INTELLIGENCE DOSSIER
          </div>
          <h2 className="text-2xl font-bold text-slate-100">
            CRIME NETWORK ANALYSIS & EVIDENCE INTEGRITY REPORT
          </h2>
          <div className="text-xs font-mono text-slate-400">
            Case Reference: <strong className="text-cyan-300">{activeCase.caseNumber}</strong> • Jurisdiction: {activeCase.policeStation}
          </div>
        </div>

        {/* 1. Case Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Dossier ID:</span>
            <span className="text-slate-100 font-bold">{activeCase.id}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Lead Officer:</span>
            <span className="text-slate-100 font-bold">{activeCase.leadInvestigator}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Date Generated:</span>
            <span className="text-slate-100">{new Date().toISOString().replace('T', ' ').slice(0, 10)}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase block">Security Clearance:</span>
            <span className="text-amber-400 font-bold">{activeCase.accessClassification}</span>
          </div>
        </div>

        {/* 2. Executive Case Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1">
            1. Executive Investigation Summary
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {activeCase.description} On 14 August 2024 at 02:30 AM, joint preventive officers intercepted refrigerated container #MRKU-982141-0 at Nhava Sheva Port Yard 4B, recovering 42.5 kg concealed illicit contraband. Multi-hop network synthesis establishes operational coordination between logistics operator Vikram Malhotra and Surat financial broker Rajesh K. Sharma via shell entity BlueSea Logistics & Trading Pvt Ltd.
          </p>
        </div>

        {/* 3. Key Entities */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1">
            2. Key Indexed Network Entities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Primary Subject:</span>
              <div className="font-bold text-slate-100">{PERSON_VIKRAM_MALHOTRA.fullName} ({PERSON_VIKRAM_MALHOTRA.id})</div>
              <div className="text-[11px] text-slate-400 font-mono">Aliases: {PERSON_VIKRAM_MALHOTRA.aliases.join(', ')}</div>
              <p className="text-[11px] text-slate-400 mt-1">{PERSON_VIKRAM_MALHOTRA.analyticalSummary}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Intermediary Broker:</span>
              <div className="font-bold text-slate-100">{PERSON_RAJESH_SHARMA.fullName} ({PERSON_RAJESH_SHARMA.id})</div>
              <div className="text-[11px] text-slate-400 font-mono">Aliases: {PERSON_RAJESH_SHARMA.aliases.join(', ')}</div>
              <p className="text-[11px] text-slate-400 mt-1">{PERSON_RAJESH_SHARMA.analyticalSummary}</p>
            </div>
          </div>
        </div>

        {/* 4. Network Graph Findings (M5 Model Traversal) */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1">
            3. Network Graph Intelligence Findings (M5 Traversal)
          </h3>
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
            <div className="text-cyan-300 font-bold">Documented 6-Hop Conduit:</div>
            <div className="text-[11px] text-slate-400 leading-relaxed">
              Vikram Malhotra (Person) → +91-98201-99412 (Phone) → Call 342s (01:04 AM) → Rajesh K. Sharma (Person) → HDFC Account 9921-4820 (Bank) → TXN-90214 ₹15,00,000 (NEFT) → BlueSea Logistics & Trading Pvt Ltd (Shell Org).
            </div>
            <p className="text-[10px] text-slate-500 italic font-sans pt-1">
              Note: Network betweenness centrality highlights key liaison role. Does not represent automated judicial guilt.
            </p>
          </div>
        </div>

        {/* 5. Cross-Verification Discrepancies */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1">
            4. Evidentiary Discrepancies (Cross-Verification)
          </h3>
          <div className="space-y-2">
            {SYNTHETIC_DISCREPANCIES.map(d => (
              <div key={d.id} className="p-3 rounded-lg bg-slate-900 border border-red-500/30 text-xs">
                <div className="flex items-center justify-between text-red-400 font-mono font-bold mb-1">
                  <span>{d.status}</span>
                  <span className="text-slate-400">{d.id}</span>
                </div>
                <div className="font-semibold text-slate-200">{d.title}</div>
                <p className="text-slate-400 text-[11px] mt-1">{d.analyticalNotes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Evidence Chain of Custody & SHA-256 Audit */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1">
            5. Cryptographic Evidence Integrity (M6 Ledger)
          </h3>
          <div className="space-y-2">
            {SYNTHETIC_EVIDENCE_RECORDS.map(e => (
              <div key={e.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{e.evidenceCode}: {e.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    e.integrityStatus === 'MATCH' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {e.integrityStatus}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 break-all">Genesis Hash: {e.originalHashSHA256}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">BSA §63 Cert: {e.bsaSection63Certificate.certificateId} (Status: {e.bsaSection63Certificate.status})</div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="pt-8 border-t border-slate-800 grid grid-cols-2 gap-8 text-xs font-mono text-slate-400">
          <div>
            <div className="h-10 border-b border-slate-700 mb-1" />
            <div>Investigating Officer Signature</div>
            <div className="text-[10px] text-slate-500">Insp. Vikramaditya Rao (LEO-7729)</div>
          </div>
          <div>
            <div className="h-10 border-b border-slate-700 mb-1" />
            <div>Superintendent of Police / Authority Attestation</div>
            <div className="text-[10px] text-slate-500">Special Crime Branch CID Maharashtra</div>
          </div>
        </div>

      </div>

    </div>
  );
};
