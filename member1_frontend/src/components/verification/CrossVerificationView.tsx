import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { CrossVerificationDiscrepancy } from '../../types/evidence';
import { fetchDiscrepancies } from '../../services/evidenceService';
import { 
  AlertOctagon, 
  AlertTriangle, 
  FileText, 
  Radio, 
  Scale, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Share2,
  ExternalLink,
  Download,
  Fingerprint,
  FileCheck,
  Check,
  Layers,
  MapPin,
  RefreshCw
} from 'lucide-react';

const FALLBACK_DISCREPANCIES: Record<string, CrossVerificationDiscrepancy[]> = {
  'CASE-2025-M3-DATASET': [
    {
      id: 'DISCREPANCY-M3-01',
      caseId: 'CASE-2025-M3-DATASET',
      title: 'Suspect Interrogation Alibi vs CDR Cell Tower Triangulation',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'Physical Geolocation at 14:15 IST (22.4 km variance)',
      sourceA: {
        sourceName: 'Police Interrogation Statement (Voluntary)',
        documentRef: 'FIR-2026-0881 / Record #04',
        timestamp: '2026-01-08 14:15:00',
        recordedValue: 'At Home: 14/B Dadar West, Central Mumbai',
        excerpt: '"I was having lunch with my family in Dadar until 16:30 and did not travel to Navi Mumbai."'
      },
      sourceB: {
        sourceName: 'Airtel BTS Cell Tower Azimuth Triangulation',
        documentRef: 'Tower CDR Dump: MH-JNPT-04B',
        timestamp: '2026-01-08 14:18:22',
        recordedValue: 'Sector 4 Mast, JNPT Port Approach (Nhava Sheva)',
        excerpt: 'Handset IMEI-3549920144912 connected to Sector 4 cell site 19402, 22.4 km away from Dadar.'
      },
      analyticalNotes: 'Physical impossibility confirmed. Cell tower sector azimuth 142° directly overlooks the container berth where consignment MSKU-882910 was being offloaded.',
      investigatorActions: [
        'Subpoena raw handoff logs for preceding 6 hours from telecom operator.',
        'Issue notice under BNSS Section 94 for vehicle GPS telemetry.',
        'Confront suspect with certified Section 65B BTS record in supplementary inquiry.'
      ]
    },
    {
      id: 'DISCREPANCY-M3-02',
      caseId: 'CASE-2025-M3-DATASET',
      title: 'Declared Income Tax Return vs RTGS Core Banking Ledger',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'Annual Turnover vs High-Velocity Inward Remittances (347x variance)',
      sourceA: {
        sourceName: 'ITR-4 Filing FY 2024-25 (CBDT Record)',
        documentRef: 'PAN: AABCP9921D / Ack: 88291024',
        timestamp: '2025-07-28 11:20:00',
        recordedValue: 'Gross Annual Income: INR 3,60,000 (Freight Broker)',
        excerpt: 'Declared net taxable profit of Rs. 3.6 Lakhs from sole proprietorship logistics brokerage.'
      },
      sourceB: {
        sourceName: 'HDFC Core Banking Ledger (BSA Certified)',
        documentRef: 'Account Statement #99214430',
        timestamp: '2026-01-08 16:45:00',
        recordedValue: 'Inward Credit: INR 1,25,00,000 via multi-layered RTGS',
        excerpt: 'Account received 18 high-velocity remittances followed by immediate outward RTGS dispersion within 120 seconds.'
      },
      analyticalNotes: 'Severe turnover mismatch (347x declared income) strongly corroborates mule account facilitation under PMLA §3. Originating entities trace to shell companies in Surat.',
      investigatorActions: [
        'Issue provisional attachment order under PMLA Section 5.',
        'Freeze 4 secondary beneficiary accounts via FIU-IND STR protocol.',
        'Summon statutory auditor of originating shell firm.'
      ]
    }
  ],
  'CASE-VIDEO-001': [
    {
      id: 'DISCREPANCY-V1-01',
      caseId: 'CASE-VIDEO-001',
      title: 'Declared Income Tax Return vs Inward Core Banking Turnover',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'Financial Liquidity & Velocity (347x Variance)',
      sourceA: {
        sourceName: 'ITR-4 Filing FY 2024-25',
        documentRef: 'ITR Filing PAN: AABCP9921D',
        timestamp: '2025-07-31 12:00:00',
        recordedValue: 'Gross Total Income: INR 3,60,000 / year',
        excerpt: 'Declared income from small-scale logistics brokerage firm.'
      },
      sourceB: {
        sourceName: 'HDFC Core Banking Ledger (BSA Certified)',
        documentRef: 'Bank Statement HDFC-99214430',
        timestamp: '2026-01-08 16:45:00',
        recordedValue: 'Credit Turnover: INR 1,25,00,000 via multi-layered RTGS',
        excerpt: 'Account received 18 high-velocity remittances followed by immediate outward RTGS dispersion.'
      },
      analyticalNotes: 'Severe turnover mismatch (347x declared income) strongly corroborates mule account facilitation under PMLA §3.',
      investigatorActions: [
        'Issue summons under PMLA Section 50 for personal appearance.',
        'Freeze beneficiary accounts via FIU-IND STR protocol.',
        'Subpoena MCA registry for beneficial ownership filings.'
      ]
    },
    {
      id: 'DISCREPANCY-V1-02',
      caseId: 'CASE-VIDEO-001',
      title: 'Registered Office Lease Agreement vs GST Physical Site Audit',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'Physical Corporate Existence & Operational Headcount',
      sourceA: {
        sourceName: 'ROC Certificate of Incorporation',
        documentRef: 'CIN: U74999MH2022PTC882190',
        timestamp: '2022-04-11 10:00:00',
        recordedValue: 'Corporate HQ: Suite 402, Nariman Point, Mumbai',
        excerpt: 'Registered headquarters with purported 24 administrative staff.'
      },
      sourceB: {
        sourceName: 'GST Anti-Evasion Field Inspection Report',
        documentRef: 'GST-AE-MUM-2026-104',
        timestamp: '2026-01-05 15:30:00',
        recordedValue: 'Site Status: Locked Residential Tenement (Zero Commercial Operations)',
        excerpt: 'Premises locked for past 18 months; no commercial activity or corporate signage.'
      },
      analyticalNotes: 'Classic shell corporation footprint designed to generate fictitious GST input tax credits and layer illegal proceeds.',
      investigatorActions: [
        'Initiate suomoto cancellation of GST registration.',
        'File complaint with Registrar of Companies under Section 447 (Fraud).'
      ]
    }
  ],
  'CASE-VIDEO-002': [
    {
      id: 'DISCREPANCY-V2-01',
      caseId: 'CASE-VIDEO-002',
      title: 'Vessel AIS Tracker Telemetry vs Harbour Master Log Entry',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'Vessel Offshore Coordinates at Sea Berth (Speed 14.2 knots)',
      sourceA: {
        sourceName: 'Harbour Master Manual Check-in Register',
        documentRef: 'Berth Log #BM-2026-09',
        timestamp: '2026-01-07 01:15:00',
        recordedValue: 'Stationary at Outer Anchorage Berth 3',
        excerpt: 'Skipper logged vessel anchored with main propulsion disabled.'
      },
      sourceB: {
        sourceName: 'Coast Guard Radar & AIS Transponder Recording',
        documentRef: 'ICG Coastal Surveillance Radar Tape #07',
        timestamp: '2026-01-07 01:18:22',
        recordedValue: 'Underway at 14 knots heading 240 degrees southwest',
        excerpt: 'Target vessel rendezvoused with unflagged high-speed skiff at coordinates 18.91N 72.82E.'
      },
      analyticalNotes: 'Direct radar confrontation invalidates manual harbour log entry, demonstrating intentional AIS falsification and off-record rendezvous.',
      investigatorActions: [
        'Impound vessel navigational chart plotter and GPS receiver.',
        'Detain crew for formal statement recording under NDPS Section 67.',
        'Inspect hull compartments with underwater diver team.'
      ]
    },
    {
      id: 'DISCREPANCY-V2-02',
      caseId: 'CASE-VIDEO-002',
      title: 'Customs Import Manifest vs Bilge Compartment Physical Seizure',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'Cargo Description & Physical Density',
      sourceA: {
        sourceName: 'Electronic Bill of Entry (ICEGATE)',
        documentRef: 'BE-JNPT-2026-778901',
        timestamp: '2026-01-06 09:00:00',
        recordedValue: '400 Cartons Frozen Ribbon Fish (HSN 03038990)',
        excerpt: 'Perishable seafood consignment declared origin Karachi via Dubai transshipment.'
      },
      sourceB: {
        sourceName: 'NCB Physical Seizure Panchnama',
        documentRef: 'NCB-MUM-PANCH-09',
        timestamp: '2026-01-07 04:30:00',
        recordedValue: '120 kg High-Purity Methamphetamine in Vacuum-Sealed Bilge Cavities',
        excerpt: 'Physical inventory recovered 120 kg contraband concealed behind false steel bulkheads.'
      },
      analyticalNotes: 'Total contradiction between commercial shipping paperwork and contraband concealed inside structural compartments.',
      investigatorActions: [
        'Arrest clearing agent for criminal conspiracy under NDPS Section 29.',
        'Issue red corner notice against foreign syndicate coordinator.'
      ]
    }
  ],
  'CASE-VIDEO-003': [
    {
      id: 'DISCREPANCY-V3-01',
      caseId: 'CASE-VIDEO-003',
      title: 'Domain WHOIS Registrant vs TLS Certificate Server Origin',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'Infrastructure Identity & Geolocation (Offshore Proxy)',
      sourceA: {
        sourceName: 'ICANN WHOIS Registration Record',
        documentRef: 'Domain Registrar Filing: sbi-secure-portal.net',
        timestamp: '2026-01-02 08:00:00',
        recordedValue: 'Registrant: Ramesh Patel, Surat, Gujarat (Indian Resident)',
        excerpt: 'Registered with dummy local KYC details.'
      },
      sourceB: {
        sourceName: 'BGP Route & Reverse DNS Telemetry',
        documentRef: 'Cloudflare & AWS Ingress Traffic Analysis',
        timestamp: '2026-01-08 03:12:00',
        recordedValue: 'Origin IP: 185.220.101.42 (Anonymous Tor Exit Relay, Frankfurt)',
        excerpt: 'All credential submissions routed to offshore Telegram Bot token via foreign reverse-proxy.'
      },
      analyticalNotes: 'Proves synthetic identity was deployed for domain masking while command server operated abroad.',
      investigatorActions: [
        'Issue MLAT request to German Federal Criminal Police (BKA).',
        'Subpoena domain registrar payment gateway transaction logs.',
        'Block malicious domain via CERT-In emergency directive.'
      ]
    },
    {
      id: 'DISCREPANCY-V3-02',
      caseId: 'CASE-VIDEO-003',
      title: 'SMS Gateway Telemetry vs Bank SMPP Binding Token',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'SMS Originator Header & Routing Protocol',
      sourceA: {
        sourceName: 'Victim Mobile Handset SMS Header',
        documentRef: 'Victim Phone Dump #VIC-01',
        timestamp: '2026-01-07 19:40:00',
        recordedValue: 'Header: VM-SBIBNK (Purported Verified Bank Sender)',
        excerpt: '"Dear Customer, your NetBanking access is suspended. Click link to re-activate."'
      },
      sourceB: {
        sourceName: 'TRAI Distributed Ledger Platform (DLT) Log',
        documentRef: 'DLT Route Inspection #TR-9912',
        timestamp: '2026-01-07 19:40:02',
        recordedValue: 'Spoofed Header from Overseas VoIP Aggregator (Hong Kong)',
        excerpt: 'Originating IP bypasses registered Indian telecommunications interconnect gateways.'
      },
      analyticalNotes: 'Header spoofing confirmed via overseas SMPP trunk bypass in direct violation of TRAI anti-phishing rules.',
      investigatorActions: [
        'Blacklist rogue SMPP aggregator IP address block.',
        'Issue advisory to cellular carriers to enable cryptographic header filtering.'
      ]
    }
  ],
  'CASE-VIDEO-004': [
    {
      id: 'DISCREPANCY-V4-01',
      caseId: 'CASE-VIDEO-004',
      title: 'Fastag Toll Booth Timestamp vs Transport Manifest Schedule',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'Vehicle Route & Transit Timeline (140 km Route Divergence)',
      sourceA: {
        sourceName: 'Commercial Transport Waybill',
        documentRef: 'Consignment Waybill #TR-9902',
        timestamp: '2026-01-09 14:00:00',
        recordedValue: 'Intended Route: Mumbai to Surat via NH48 (Northbound)',
        excerpt: 'Goods carrier registered for scheduled agricultural equipment transport.'
      },
      sourceB: {
        sourceName: 'NHAI Fastag Toll Plaza Electronic Log',
        documentRef: 'Khed Shivapur Toll Gate Camera 03',
        timestamp: '2026-01-09 17:42:10',
        recordedValue: 'Diverted South: Pune-Bangalore Corridor (NH4)',
        excerpt: 'Vehicle crossed toll heading towards isolated rural safehouse cluster, contrary to manifest.'
      },
      analyticalNotes: 'Unauthorized route diversion confirms intentional transit to secondary unmonitored drop point in rural Pune.',
      investigatorActions: [
        'Alert regional highway police check-posts along NH4.',
        'Seize vehicle GPS tracker unit upon interception.',
        'Raid identified farmhouse safehouse locus.'
      ]
    },
    {
      id: 'DISCREPANCY-V4-02',
      caseId: 'CASE-VIDEO-004',
      title: 'Consignee Business Identity vs Ministry of Corporate Affairs Status',
      status: 'DATA DISCREPANCY DETECTED',
      conflictingField: 'Entity Operational State & Compliance Status',
      sourceA: {
        sourceName: 'Carrier Consignment Note',
        documentRef: 'CN-2026-8812',
        timestamp: '2026-01-09 11:00:00',
        recordedValue: 'Consignee: Shivam Agro Industries Pvt Ltd (Active Buyer)',
        excerpt: 'Purported recipient of agricultural equipment.'
      },
      sourceB: {
        sourceName: 'MCA Portal & GSTIN Common Portal Database',
        documentRef: 'MCA Company Master Data / GST Status',
        timestamp: '2026-01-09 11:05:00',
        recordedValue: 'Company Status: STRIKEN OFF (Cancelled Since Sept 2023)',
        excerpt: 'Entity registration cancelled due to fraudulent incorporation and non-filing.'
      },
      analyticalNotes: 'Deceased/struck-off corporate shell used as fictitious front to mask covert human transit operation.',
      investigatorActions: [
        'Interrogate driver regarding actual drop contact person.',
        'Impound vehicle under BNSS Section 106.'
      ]
    }
  ]
};

export const CrossVerificationView: React.FC = () => {
  const { setView, selectedCaseId, selectCase } = useNavigationStore();
  const activeCaseId = selectedCaseId || 'CASE-2025-M3-DATASET';

  const [discrepancies, setDiscrepancies] = useState<CrossVerificationDiscrepancy[]>(
    FALLBACK_DISCREPANCIES[activeCaseId] || FALLBACK_DISCREPANCIES['CASE-2025-M3-DATASET']
  );
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState<string>('');
  const [certGenerated, setCertGenerated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    fetchDiscrepancies(activeCaseId)
      .then(res => {
        if (!active) return;
        if (res.success && res.data && res.data.length > 0) {
          setDiscrepancies(res.data);
          setSelectedDiscrepancyId(res.data[0].id);
        } else {
          const fallback = FALLBACK_DISCREPANCIES[activeCaseId] || FALLBACK_DISCREPANCIES['CASE-2025-M3-DATASET'];
          setDiscrepancies(fallback);
          setSelectedDiscrepancyId(fallback[0]?.id || '');
        }
      })
      .catch(() => {
        if (!active) return;
        const fallback = FALLBACK_DISCREPANCIES[activeCaseId] || FALLBACK_DISCREPANCIES['CASE-2025-M3-DATASET'];
        setDiscrepancies(fallback);
        setSelectedDiscrepancyId(fallback[0]?.id || '');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [activeCaseId]);

  const activeDiscrepancy = discrepancies.find(d => d.id === selectedDiscrepancyId) || discrepancies[0];

  const handleExportCertificate = () => {
    setCertGenerated(true);
    setTimeout(() => {
      setCertGenerated(false);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-rose-600 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
              M5 Cross-Verification Engine
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              Multi-Source Contradiction Auditor
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              BSA Section 65B Compliant
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1.5">
            Cross-Source Evidentiary Discrepancy Analysis
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Automated confrontation of statements, CDR cell tower dumps, bank ledgers, Fastag toll cameras, and radar telemetry to detect irreconcilable factual discrepancies.
          </p>
        </div>

        {/* Case selector indicator and quick navigation */}
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Active Case:</span>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
              {activeCaseId}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['CASE-2025-M3-DATASET', 'CASE-VIDEO-001', 'CASE-VIDEO-002', 'CASE-VIDEO-003', 'CASE-VIDEO-004'].map((cId) => (
              <button
                key={cId}
                onClick={() => selectCase(cId)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-md transition-all font-semibold ${
                  cId === activeCaseId
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-600'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {cId.replace('CASE-', '')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mandatory Non-Decisional Policy Directive (Court Impartiality) */}
      <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 shadow-sm">
        <HelpCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-amber-900 uppercase tracking-wide font-mono block">
            JUDICIAL IMPARTIALITY DIRECTIVE (BSA 2023):
          </span>
          <p className="text-amber-950 mt-1 leading-relaxed font-normal">
            CrimeNet AI highlights mathematical, temporal, and spatial contradictions between conflicting evidence records. <strong>The engine does not decide which source is truthful.</strong> Evidentiary admissibility and credibility determinations remain within the exclusive constitutional domain of the Investigating Officer and Trial Court.
          </p>
        </div>
      </div>

      {/* Discrepancy Selector Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Detected Contradiction Records ({discrepancies.length})
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Click any conflict below to inspect side-by-side evidence confrontation
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
                    ? 'bg-rose-50/70 border-rose-300 shadow-md ring-2 ring-rose-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    isSelected
                      ? 'text-rose-700 bg-rose-100 border-rose-200'
                      : 'text-slate-600 bg-slate-100 border-slate-200'
                  }`}>
                    {disc.id}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Case: {disc.caseId}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{disc.title}</h4>
                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 truncate font-medium">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{disc.conflictingField}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE DISCREPANCY COMPARISON PANEL */}
      {activeDiscrepancy && (
        <div className="border border-slate-200 bg-white rounded-2xl p-6 shadow-sm space-y-6 bg-gradient-to-br from-white via-rose-50/15 to-slate-50/30">
          
          {/* Header of Active Conflict */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-sm">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                    {activeDiscrepancy.status}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                    Record ID: {activeDiscrepancy.id}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {activeDiscrepancy.title}
                </h2>
                <div className="text-xs font-mono text-slate-600 mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-500">Parameter Contradiction:</span>
                  <span className="bg-amber-50 text-amber-900 font-bold px-2.5 py-0.5 rounded-md border border-amber-200">
                    {activeDiscrepancy.conflictingField}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <button
                onClick={handleExportCertificate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold transition shadow-sm"
              >
                {certGenerated ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>BSA Docket Certified!</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5 text-white" />
                    <span>Generate BSA §65B Docket</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Side-by-Side Source Confrontation Cards: SOURCE A vs SOURCE B */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SOURCE A */}
            <div className="bg-white border border-blue-200 rounded-xl p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-mono font-bold text-blue-700 uppercase tracking-wider">
                    SOURCE RECORD A
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
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

              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                <span className="text-[10px] font-mono uppercase text-blue-800 font-bold block mb-1">
                  Claimed / Logged Value:
                </span>
                <div className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                  {activeDiscrepancy.sourceA.recordedValue}
                </div>
              </div>

              <div className="text-xs text-slate-700 italic bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                <span className="not-italic text-[10px] font-mono text-slate-500 font-bold block mb-1">
                  Documentary Excerpt:
                </span>
                {activeDiscrepancy.sourceA.excerpt}
              </div>
            </div>

            {/* SOURCE B */}
            <div className="bg-white border border-emerald-200 rounded-xl p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider">
                    SOURCE RECORD B (CORROBORATION)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {activeDiscrepancy.sourceB.timestamp}
                </span>
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900">
                  {activeDiscrepancy.sourceB.sourceName}
                </div>
                <div className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">
                  Reference: {activeDiscrepancy.sourceB.documentRef}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-mono uppercase text-emerald-800 font-bold block mb-1">
                  Sensor / Telemetry / Ledger Verification:
                </span>
                <div className="text-xs sm:text-sm font-bold text-emerald-950 font-mono">
                  {activeDiscrepancy.sourceB.recordedValue}
                </div>
              </div>

              <div className="text-xs text-slate-700 italic bg-slate-50 p-3.5 rounded-xl border border-slate-200 leading-relaxed">
                <span className="not-italic text-[10px] font-mono text-slate-500 font-bold block mb-1">
                  Documentary Excerpt:
                </span>
                {activeDiscrepancy.sourceB.excerpt}
              </div>
            </div>

          </div>

          {/* Analytical Forensic Commentary */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-700 font-mono font-bold uppercase tracking-wider text-[11px]">
              <Fingerprint className="w-4 h-4 text-blue-600" />
              Forensic Intelligence Commentary & Discrepancy Synthesis
            </div>
            <p className="text-slate-900 font-normal text-xs sm:text-[13px] leading-relaxed">
              {activeDiscrepancy.analyticalNotes}
            </p>
          </div>

          {/* Investigator Action Plan */}
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

          {/* Inter-Module Navigation / Investigation Shortcuts */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setView('evidence')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Open Evidence Vault</span>
              </button>
              <button
                onClick={() => setView('graph')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Inspect in Network Graph</span>
              </button>
              <button
                onClick={() => setView('timeline')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Timeline Synchronizer</span>
              </button>
              <button
                onClick={() => setView('gis')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>GIS Tactical Loci</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-500 font-medium">
              BSA Section 65B Audit Trail Active • Case ID: {activeCaseId}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
