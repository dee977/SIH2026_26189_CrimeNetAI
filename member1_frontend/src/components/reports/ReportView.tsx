import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { SYNTHETIC_CASES } from '../../data/syntheticData';
import { 
  Download, 
  Printer, 
  ArrowLeft,
  Shield
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const { selectedCaseId, setView } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [isExporting, setIsExporting] = useState(false);
  const activeCase = SYNTHETIC_CASES.find(c => c.id === selectedCaseId || c.caseNumber === selectedCaseId) || SYNTHETIC_CASES[0];

  const handleExportPdf = async () => {
    setIsExporting(true);
    addToast({
      type: 'info',
      title: 'Compiling Intelligence Dossier PDF',
      message: 'Generating official A4 text-based dossier from backend engine...'
    });

    const token = localStorage.getItem('crimenet_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    try {
      const response = await fetch(`http://localhost:8000/api/v1/reports/export/${activeCase.caseNumber}.pdf`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Investigation_Report_${activeCase.caseNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        addToast({
          type: 'success',
          title: 'Official Dossier Downloaded',
          message: `Dossier PDF for ${activeCase.caseNumber} exported successfully with text layer intact.`
        });
        setIsExporting(false);
        return;
      }
    } catch (err) {
      console.warn('Backend PDF endpoint offline, initiating browser print fallback', err);
    }

    setTimeout(() => {
      setIsExporting(false);
      addToast({
        type: 'success',
        title: 'Report Compiled for Print',
        message: `Dossier ready for multi-page export.`
      });
      window.print();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#080d1a] py-6 px-3 sm:px-6 flex flex-col items-center animate-in fade-in duration-200">
      
      {/* High-Fidelity Print & Dark-Theme Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 14mm 16mm 14mm 16mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            background: white !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
          #investigation-report-doc {
            background: white !important;
            color: #0f172a !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          /* Print Typography & Styling */
          .print-header-border {
            border-bottom: 2px solid #0f172a !important;
          }
          .print-tag {
            color: #0891b2 !important;
            font-weight: 700 !important;
          }
          .print-title {
            color: #0f172a !important;
            font-weight: 800 !important;
          }
          .print-sec-title {
            color: #0f172a !important;
            border-bottom: 1.5px solid #0f172a !important;
            font-weight: 700 !important;
          }
          .print-box {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          .print-box-white {
            background: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-text-muted {
            color: #475569 !important;
          }
          .print-badge-valid {
            color: #15803d !important;
            background: #dcfce7 !important;
            border: 1px solid #86efac !important;
          }
          .print-badge-revoked {
            color: #b91c1c !important;
            background: #fee2e2 !important;
            border: 1px solid #fca5a5 !important;
          }
          .print-badge-discrepancy {
            color: #b45309 !important;
            background: #fef3c7 !important;
            border: 1px solid #fde68a !important;
          }
          .print-caveat {
            color: #0e7490 !important;
            background: #ecfeff !important;
            border: 1px solid #a5f3fc !important;
          }
          .print-sig-line {
            border-color: #64748b !important;
          }
          .avoid-page-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}</style>

      {/* Report Toolbar ABOVE the Report (no-print) */}
      <div className="no-print w-full max-w-[210mm] mb-5 flex flex-wrap items-center justify-between gap-3 bg-[#0d162b]/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 shadow-xl shadow-black/40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('cases')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#070b14] border border-slate-800 text-xs font-mono text-cyan-300">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Case: <strong className="text-white">{activeCase.caseNumber}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Print</span>
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-600/30 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          DOCUMENT CANVAS
          Dark Navy / Cyber Intelligence theme on screen; Clean White A4 on print
          ===================================================================== */}
      <div 
        id="investigation-report-doc"
        className="w-full max-w-[210mm] bg-[#0b1328] text-slate-100 shadow-2xl border border-cyan-900/40 rounded-sm font-sans my-2 p-8 sm:p-12 space-y-7"
      >
        
        {/* Document Header */}
        <div className="border-b border-cyan-900/50 pb-5 text-center space-y-1.5 avoid-page-break print-header-border">
          <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold print-tag">
            CONFIDENTIAL LAW ENFORCEMENT INTELLIGENCE DOSSIER
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase print-title">
            CRIME NETWORK ANALYSIS & EVIDENCE INTEGRITY REPORT
          </h1>
        </div>

        {/* Structured Metadata Table */}
        <div className="border border-slate-800 rounded overflow-hidden text-xs avoid-page-break print-box">
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b border-slate-800 bg-[#070d1a] print-box">
                <td className="p-2.5 font-bold text-slate-400 border-r border-slate-800 w-1/2 print-text-muted">
                  Case Reference: <span className="font-mono text-cyan-300 font-bold print-text-dark">CASE-2024-MH-092</span>
                </td>
                <td className="p-2.5 font-bold text-slate-400 w-1/2 print-text-muted">
                  Jurisdiction: <span className="text-slate-200 print-text-dark">Special Crime Branch, CID Mumbai</span>
                </td>
              </tr>
              <tr className="border-b border-slate-800 bg-[#091122] print-box-white">
                <td className="p-2.5 font-bold text-slate-400 border-r border-slate-800 print-text-muted">
                  DOSSIER ID: <span className="font-mono text-cyan-300 font-bold print-text-dark">CASE-2024-MH-092</span>
                </td>
                <td className="p-2.5 font-bold text-slate-400 print-text-muted">
                  LEAD OFFICER: <span className="text-slate-200 print-text-dark">Inspector Vikramaditya Rao (LEO-7729)</span>
                </td>
              </tr>
              <tr className="bg-[#070d1a] print-box">
                <td className="p-2.5 font-bold text-slate-400 border-r border-slate-800 print-text-muted">
                  DATE GENERATED: <span className="font-mono text-slate-300 print-text-dark">2026-09-24</span>
                </td>
                <td className="p-2.5 font-bold text-slate-400 print-text-muted">
                  SECURITY CLEARANCE: <span className="font-mono text-amber-400 font-bold print-badge-discrepancy px-1.5 py-0.5 rounded">CONFIDENTIAL</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 1: EXECUTIVE INVESTIGATION SUMMARY */}
        <div className="space-y-2.5 avoid-page-break">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1.5 print-sec-title">
            1. EXECUTIVE INVESTIGATION SUMMARY
          </h2>
          <div className="p-4 rounded bg-[#091122] border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed text-justify print-box print-text-dark">
            Investigation into organized contraband import through fictitious
            shipping manifests, shell clearing companies, and offshore hawala
            conduits along the Mumbai-Surat maritime corridor. On 14 August
            2024 at 02:30 AM, joint preventive officers intercepted refrigerated
            container #MRKU-982141-0 at Nhava Sheva Port Yard 4B, recovering
            42.5 kg concealed illicit contraband. Multi-hop network synthesis
            establishes operational coordination between logistics operator
            Vikram Malhotra and Surat financial broker Rajesh K. Sharma via
            shell entity BlueSea Logistics & Trading Pvt Ltd.
          </div>
        </div>

        {/* SECTION 2: KEY INDEXED NETWORK ENTITIES */}
        <div className="space-y-3 avoid-page-break">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1.5 print-sec-title">
            2. KEY INDEXED NETWORK ENTITIES
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Primary Subject */}
            <div className="p-4 rounded bg-[#091122] border border-slate-800 space-y-2 print-box">
              <div className="font-bold uppercase tracking-wide text-[11px] text-cyan-400 border-b border-slate-800 pb-1 font-mono print-tag">
                PRIMARY SUBJECT:
              </div>
              <div className="text-sm font-bold text-white print-text-dark">
                Vikram Malhotra (ENT-PERS-001)
              </div>
              <div className="font-mono text-slate-400 text-[11px] print-text-muted">
                Aliases: Vicky Cargo, V.M. Logistics
              </div>
              <p className="text-slate-300 leading-relaxed pt-1 text-justify print-text-dark">
                Identified as principal on-ground logistics coordinator in
                container handling at Nhava Sheva. CDR indicates repeated burst
                calls prior to consignment arrivals. No prior convictions
                recorded; analytical focus centered on multi-hop remittances and
                discrepancies in cargo declaration documents.
              </p>
            </div>

            {/* Intermediary Broker */}
            <div className="p-4 rounded bg-[#091122] border border-slate-800 space-y-2 print-box">
              <div className="font-bold uppercase tracking-wide text-[11px] text-amber-400 border-b border-slate-800 pb-1 font-mono print-text-dark">
                INTERMEDIARY BROKER:
              </div>
              <div className="text-sm font-bold text-white print-text-dark">
                Rajesh Kumar Sharma (ENT-PERS-002)
              </div>
              <div className="font-mono text-slate-400 text-[11px] print-text-muted">
                Aliases: Sharma Ji, RK Hawala, Bhaiya Surat
              </div>
              <p className="text-slate-300 leading-relaxed pt-1 text-justify print-text-dark">
                Documented financial intermediary operating out of Surat diamond
                bazaar. Banking audit reveals high-velocity pass-through transfers
                between bullion accounts and logistics firms.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: NETWORK GRAPH INTELLIGENCE FINDINGS (M5 TRAVERSAL) */}
        <div className="space-y-3.5 page-break-before avoid-page-break">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1.5 print-sec-title">
            3. NETWORK GRAPH INTELLIGENCE FINDINGS (M5 TRAVERSAL)
          </h2>

          {/* Visual 6-Hop Grouping Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 rounded bg-[#091122] border border-slate-800 flex flex-col items-center justify-center print-box">
              <span className="font-bold text-cyan-400 text-xs print-tag">01</span>
              <span className="font-bold text-slate-100 text-[11px] mt-0.5 print-text-dark">Vikram Malhotra</span>
              <span className="text-slate-500 my-0.5 print-text-muted">↓</span>
              <span className="text-[10px] text-cyan-300 font-semibold print-tag">OPERATES / PHONE</span>
            </div>

            <div className="p-2.5 rounded bg-[#091122] border border-slate-800 flex flex-col items-center justify-center print-box">
              <span className="font-bold text-cyan-400 text-xs print-tag">02</span>
              <span className="font-bold text-slate-100 text-[11px] mt-0.5 print-text-dark">+91-98201-99412</span>
              <span className="text-slate-500 my-0.5 print-text-muted">↓</span>
              <span className="text-[10px] text-cyan-300 font-semibold print-tag">342s CALL</span>
            </div>

            <div className="p-2.5 rounded bg-[#091122] border border-slate-800 flex flex-col items-center justify-center print-box">
              <span className="font-bold text-cyan-400 text-xs print-tag">03</span>
              <span className="font-bold text-slate-100 text-[11px] mt-0.5 print-text-dark">Rajesh K. Sharma</span>
              <span className="text-slate-500 my-0.5 print-text-muted">↓</span>
              <span className="text-[10px] text-cyan-300 font-semibold print-tag">FINANCIAL CONTROL</span>
            </div>

            <div className="p-2.5 rounded bg-[#091122] border border-slate-800 flex flex-col items-center justify-center print-box">
              <span className="font-bold text-cyan-400 text-xs print-tag">04</span>
              <span className="font-bold text-slate-100 text-[11px] mt-0.5 print-text-dark leading-tight">HDFC Account 9921-4820</span>
              <span className="text-slate-500 my-0.5 print-text-muted">↓</span>
              <span className="text-[10px] text-cyan-300 font-semibold print-tag">NEFT</span>
            </div>

            <div className="p-2.5 rounded bg-[#091122] border border-slate-800 flex flex-col items-center justify-center print-box">
              <span className="font-bold text-cyan-400 text-xs print-tag">05</span>
              <span className="font-bold text-slate-100 text-[11px] mt-0.5 print-text-dark">TXN-90214</span>
              <span className="text-slate-500 my-0.5 print-text-muted">↓</span>
              <span className="text-[10px] text-cyan-300 font-semibold print-tag">BENEFICIARY</span>
            </div>

            <div className="p-2.5 rounded bg-[#091122] border border-slate-800 flex flex-col items-center justify-center print-box">
              <span className="font-bold text-cyan-400 text-xs print-tag">06</span>
              <span className="font-bold text-slate-100 text-[11px] mt-0.5 leading-tight print-text-dark">BlueSea Logistics & Trading Pvt Ltd</span>
            </div>
          </div>

          {/* Original Source Conduit Sentence */}
          <div className="p-3.5 rounded bg-[#091122] border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono print-box print-text-dark">
            <div className="font-bold text-cyan-300 mb-1 font-sans text-xs print-tag">Documented 6-Hop Conduit:</div>
            Vikram Malhotra (Person) → +91-98201-99412 (Phone) → Call 342s (01:04 AM) → Rajesh K. Sharma (Person) → HDFC Account 9921-4820 (Bank) → TXN-90214 ₹15,00,000 (NEFT) → BlueSea Logistics & Trading Pvt Ltd (Shell Org)
          </div>

          {/* Analytical Caveat Box */}
          <div className="p-3 rounded bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 italic print-caveat">
            <strong>Note:</strong> Network betweenness centrality highlights key liaison role. Does not represent automated judicial guilt.
          </div>
        </div>

        {/* SECTION 4: EVIDENTIARY DISCREPANCIES (CROSS-VERIFICATION) */}
        <div className="space-y-3 avoid-page-break">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1.5 print-sec-title">
            4. EVIDENTIARY DISCREPANCIES (CROSS-VERIFICATION)
          </h2>

          <div className="space-y-3">
            {/* Discrepancy 1 */}
            <div className="p-4 rounded bg-[#091122] border border-amber-500/40 text-xs space-y-1.5 print-box">
              <div className="inline-block px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold text-[10px] font-mono print-badge-discrepancy">
                DATA DISCREPANCY DETECTED
              </div>
              <div className="font-bold text-white text-sm print-text-dark">
                Contradiction: Accused Alibi Statement vs Telecom CDR Tower Ping
              </div>
              <div className="font-mono text-cyan-400 font-bold text-xs print-tag">
                DISCREPANCY-001
              </div>
              <p className="text-slate-300 leading-relaxed pt-1 print-text-dark">
                Physical alibi statement is mathematically irreconcilable with
                radio propagation range of Sector 4 cell tower. System flags this
                for investigator follow-up without drawing definitive legal
                conclusions.
              </p>
            </div>

            {/* Discrepancy 2 */}
            <div className="p-4 rounded bg-[#091122] border border-amber-500/40 text-xs space-y-1.5 print-box">
              <div className="inline-block px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold text-[10px] font-mono print-badge-discrepancy">
                DATA DISCREPANCY DETECTED
              </div>
              <div className="font-bold text-white text-sm print-text-dark">
                Discrepancy: Shipping Cargo Declaration vs Physical Customs Panchnama
              </div>
              <div className="font-mono text-cyan-400 font-bold text-xs print-tag">
                DISCREPANCY-002
              </div>
              <p className="text-slate-300 leading-relaxed pt-1 print-text-dark">
                Weight discrepancy confirms secondary unmanifested payload
                concealed within container structure.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 5: CRYPTOGRAPHIC EVIDENCE INTEGRITY (M6 LEDGER) */}
        <div className="space-y-3 page-break-before avoid-page-break">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 font-mono border-b border-slate-800 pb-1.5 print-sec-title">
            5. CRYPTOGRAPHIC EVIDENCE INTEGRITY (M6 LEDGER)
          </h2>

          <div className="space-y-3 text-xs">
            {/* Evidence 1 */}
            <div className="p-4 rounded bg-[#091122] border border-emerald-500/40 space-y-1.5 font-mono print-box">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-white text-xs print-text-dark">
                  EVD-2024-0812: Physical Extraction Image: Mobile Phone (+91-98201-99412)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-[10px] print-badge-valid">
                  Status: VALID
                </span>
              </div>
              <div className="text-[11px] text-cyan-300 break-all print-text-dark">
                Genesis Hash: e3b0c44298fc1c149afbF4c8996F92477a...
              </div>
              <div className="text-[11px] text-slate-300 print-text-muted">
                BSA §63 Cert: <strong className="text-white print-text-dark">BSA-63-FSI-2024-8841</strong>
              </div>
            </div>

            {/* Evidence 2 */}
            <div className="p-4 rounded bg-[#091122] border border-emerald-500/40 space-y-1.5 font-mono print-box">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-white text-xs print-text-dark">
                  EVD-2024-0813: Certified Bank Ledger: HDFC Account 9921-4820
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold text-[10px] print-badge-valid">
                  Status: VALID
                </span>
              </div>
              <div className="text-[11px] text-cyan-300 break-all print-text-dark">
                Genesis Hash: 9b71d224bd62f3785496d4ad3ea3d73319fbc2890caadae2dff72519673ca7
              </div>
              <div className="text-[11px] text-slate-300 print-text-muted">
                BSA §63 Cert: <strong className="text-white print-text-dark">BSA-63-BNK-2024-1102</strong>
              </div>
            </div>

            {/* Evidence 3 */}
            <div className="p-4 rounded bg-[#091122] border border-red-500/40 space-y-1.5 font-mono print-box">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-white text-xs print-text-dark">
                  EVD-2024-0814: Tampered CDR Audit File (Demonstration of Mismatch Alert)
                </span>
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 font-bold text-[10px] print-badge-revoked">
                  Status: REVOKED
                </span>
              </div>
              <div className="text-[11px] text-red-400 break-all print-badge-revoked px-1 rounded">
                Genesis Hash: a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0
              </div>
              <div className="text-[11px] text-slate-300 print-text-muted">
                BSA §63 Cert: <strong className="text-white print-text-dark">BSA-63-TEL-2024-0091</strong>
              </div>
            </div>
          </div>
        </div>

        {/* SIGNATURES / ATTESTATION BLOCK */}
        <div className="pt-6 border-t border-slate-800 space-y-4 avoid-page-break print-header-border">
          <div className="grid grid-cols-2 gap-8 text-xs font-sans">
            <div className="space-y-1">
              <div className="h-10 border-b border-slate-700 print-sig-line"></div>
              <div className="font-bold text-slate-200 pt-1 print-text-dark">
                Investigating Officer Signature
              </div>
              <div className="text-cyan-400 font-mono text-[11px] print-tag">
                Insp. Vikramaditya Rao (LEO-7729)
              </div>
            </div>

            <div className="space-y-1">
              <div className="h-10 border-b border-slate-700 print-sig-line"></div>
              <div className="font-bold text-slate-200 pt-1 print-text-dark">
                Superintendent of Police / Authority Attestation
              </div>
              <div className="text-cyan-400 font-mono text-[11px] print-tag">
                Special Crime Branch CID Maharashtra
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
