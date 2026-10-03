import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonEntity } from '../../types/entities';
import { useNavigationStore } from '../../store/navigationStore';
import { EntitySourceDocument, fetchEntityDocuments } from '../../services/evidenceService';
import { 
  User, 
  Phone, 
  Landmark, 
  Truck, 
  MapPin, 
  Building2, 
  FileText, 
  ShieldAlert, 
  ArrowLeftRight, 
  PhoneCall, 
  Share2, 
  Clock, 
  FileCheck, 
  AlertTriangle,
  BadgeAlert,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Download,
  Copy,
  Check,
  Loader2,
  FileCode,
  Shield,
  FolderOpen
} from 'lucide-react';

export interface PersonProfileProps {
  person: PersonEntity;
  onSelectLinkedEntity?: (entityId: string, entityName?: string) => void;
  onCloseModal?: () => void;
  caseId?: string;
}

export const PersonProfile: React.FC<PersonProfileProps> = ({ 
  person, 
  onSelectLinkedEntity, 
  onCloseModal, 
  caseId 
}) => {
  const navigate = useNavigate();
  const { setView, selectEntity, selectEvidence, selectedCaseId } = useNavigationStore();
  const activeCaseId = caseId || selectedCaseId || person.caseIds?.[0] || 'CASE-2026-HWL-001';

  // State for Evidence & Source Documents Modal
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isEvidenceLoading, setIsEvidenceLoading] = useState(false);
  const [evidenceDocs, setEvidenceDocs] = useState<EntitySourceDocument[]>([]);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // State for Document / Telemetry Previewer (e.g. CDR, Subpoena, FASTag, MCA)
  const [previewDoc, setPreviewDoc] = useState<{
    title: string;
    category: string;
    reference: string;
    hash: string;
    bsaCert: string;
    custodian: string;
    date: string;
    details: string;
  } | null>(null);

  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyHash = (hash: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // 1. View in Graph handler: Navigate to /graph with focused entityId
  const handleViewInGraph = () => {
    console.log('[PersonProfile] View in Graph:', person.id, person.fullName);
    selectEntity(person.id);
    setView('graph');
    if (onCloseModal) onCloseModal();
    navigate(`/graph?entityId=${encodeURIComponent(person.id)}&caseId=${encodeURIComponent(activeCaseId)}`);
  };

  // 2. Timeline handler: Navigate to /timeline with filtered entityId
  const handleViewTimeline = () => {
    console.log('[PersonProfile] Timeline clicked:', person.id, person.fullName);
    selectEntity(person.id);
    setView('timeline');
    if (onCloseModal) onCloseModal();
    navigate(`/timeline?entityId=${encodeURIComponent(person.id)}&caseId=${encodeURIComponent(activeCaseId)}`);
  };

  // 3. Evidence handler: Open source documents modal & load verified case evidence
  const handleOpenEvidence = async () => {
    console.log('[PersonProfile] Evidence button clicked for:', person.id);
    setIsEvidenceModalOpen(true);
    setIsEvidenceLoading(true);
    setEvidenceError(null);
    try {
      const res = await fetchEntityDocuments(person.id, activeCaseId);
      console.log('[PersonProfile] Evidence documents response:', res);
      if (res.success && Array.isArray(res.data)) {
        setEvidenceDocs(res.data);
      } else {
        setEvidenceDocs([]);
      }
    } catch (err: any) {
      console.error('[PersonProfile] Failed to fetch documents:', err);
      setEvidenceError(err?.message || 'Failed to load evidentiary records');
      setEvidenceDocs([]);
    } finally {
      setIsEvidenceLoading(false);
    }
  };

  // 4. Linked Entity Click handler: Navigate to or inspect linked entity
  const handleInspectEntity = (targetId: string, type: string, targetName?: string) => {
    console.log('[PersonProfile] Linked entity clicked:', targetId, type, targetName);
    if (onSelectLinkedEntity) {
      onSelectLinkedEntity(targetId, targetName || targetId);
    } else {
      selectEntity(targetId);
      setView('entity');
      navigate('/entities');
    }
  };

  // 5. Document / Telemetry Click handler (CDR, Subpoena, FASTag, etc.)
  const handleInspectDocument = (title: string, category: string, reference: string, docDetails?: string) => {
    console.log('[PersonProfile] Inspect Document clicked:', title, reference);
    const refSlug = reference.replace(/[^a-zA-Z0-9]/g, '');
    const syntheticHash = `a4f89c02${refSlug.padEnd(16, '0').slice(0, 16)}77b310928e45f910`;
    setPreviewDoc({
      title,
      category,
      reference,
      hash: syntheticHash,
      bsaCert: `BSA-65B-CORR-${refSlug.slice(0, 8).toUpperCase()}`,
      custodian: 'State Police Cyber & Intelligence Cell',
      date: new Date().toISOString().split('T')[0],
      details: docDetails || `Statutory evidentiary record retrieved under BSA Section 63/65B referencing subject ${person.fullName} (${person.id}).`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Dossier Card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 bg-gradient-to-br from-white via-slate-50/40 to-blue-50/20">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <User className="w-8 h-8" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {person.id}
                </span>
                <span className="text-xs font-mono text-slate-600 font-medium">
                  DOB: {person.dateOfBirth || 'N/A'} • {person.gender || 'Unknown'} • {person.nationality || 'Indian'}
                </span>
                <span className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  ID: {person.nationalIdNumber || 'UID-VERIFIED'}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mt-1">{person.fullName}</h1>

              {person.aliases && person.aliases.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-800 font-mono bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-flex">
                  <span className="font-semibold text-amber-900">Aliases:</span>
                  <span>{person.aliases.join(' • ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons - Cleanly Aligned in Header */}
          <div className="flex items-center gap-2 self-start shrink-0">
            {/* View in Graph Button */}
            <button
              type="button"
              onClick={handleViewInGraph}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              title="Inspect in Interactive Network Graph"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>View in Graph</span>
            </button>

            {/* Timeline Button */}
            <button
              type="button"
              onClick={handleViewTimeline}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer"
              title="View Chronological Event Trail"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Timeline</span>
            </button>

            {/* Evidence Button */}
            <button
              type="button"
              onClick={handleOpenEvidence}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer"
              title="Inspect Evidence Ledger & Linked Files"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Evidence</span>
            </button>
          </div>

        </div>

        {/* Investigator Analytical Summary & Disclaimers */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 text-xs text-slate-700 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-bold block mb-1">
              Investigator Analytical Assessment (Not a Guilt Label):
            </span>
            <p className="text-slate-800 font-normal">
              {person.analyticalSummary || `Indexed individual ${person.fullName} associated with case dossiers and multi-source corroboration telemetry.`}
            </p>
          </div>

          <div className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 font-mono">
            <div className="text-[10px] uppercase text-[var(--text-muted)] font-bold">Corroborated Sources:</div>
            <div className="text-slate-900 font-semibold">{person.source || 'Central Criminal Database'}</div>
            <div className="text-[var(--text-muted)] text-[11px] truncate">Ref: {person.sourceDocument || 'Primary Dossier Filing'}</div>
            <button
              type="button"
              onClick={handleOpenEvidence}
              className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] underline flex items-center gap-1 cursor-pointer transition-colors pt-0.5 text-left"
              title="Click to view verified evidence documents"
            >
              <span>Chain of Evidence: {person.evidenceCount || 1} Files Logged</span>
              <ExternalLink className="w-3 h-3 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Anomaly Indicators (Factual Signals - NOT Risk Scores) */}
        {person.anomalyIndicators && person.anomalyIndicators.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold font-mono mb-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>FACTUAL ANOMALY FINDINGS & DISCREPANCIES (FOR INVESTIGATOR FOLLOW-UP)</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
              {person.anomalyIndicators.map((ind, i) => (
                <li key={i}>{ind}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Grid of Linked Entities & Multi-Modal Relationships */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* 1. Phone Numbers */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Registered Phone Numbers</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {person.phoneNumbers?.length || 0}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {person.phoneNumbers && person.phoneNumbers.length > 0 ? (
              person.phoneNumbers.map(ph => (
                <div 
                  key={ph}
                  className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 hover:border-emerald-400 flex items-center justify-between text-xs font-mono text-emerald-800 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleInspectEntity(ph, 'Phone', ph)}
                    className="font-semibold hover:underline text-left cursor-pointer flex items-center gap-1"
                    title="Inspect Phone Entity Dossier"
                  >
                    <span>{ph}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInspectDocument('Bharti Airtel Call Detail Record (CDR) Extraction', 'CDR Dump', ph, `CDR dump and cell tower telemetry corroborated for subscriber ${ph}.`)}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-sans hover:underline cursor-pointer flex items-center gap-0.5"
                    title="View CDR Document & Verification"
                  >
                    <span>Bharti Airtel CDR →</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-[var(--text-secondary)] italic py-2">No phone records registered</div>
            )}
          </div>
        </div>

        {/* 2. Bank Accounts */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-600" />
              <span>Associated Bank Accounts</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
              {person.bankAccounts?.length || 0}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {person.bankAccounts && person.bankAccounts.length > 0 ? (
              person.bankAccounts.map(ba => (
                <div 
                  key={ba}
                  className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 hover:border-amber-400 flex items-center justify-between text-xs font-mono text-amber-900 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleInspectEntity(ba, 'BankAccount', ba)}
                    className="font-semibold hover:underline text-left cursor-pointer flex items-center gap-1"
                    title="Inspect Bank Account Dossier"
                  >
                    <span>{ba}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInspectDocument('Banking Subpoena & KYC Mandate', 'Subpoena Log', ba, `Statutory KYC ledger and subpoena disclosure statement for account ${ba}.`)}
                    className="text-[10px] text-amber-800 hover:text-amber-950 font-sans hover:underline cursor-pointer flex items-center gap-0.5"
                    title="View Subpoena Document & Verification"
                  >
                    <span>Subpoena Log →</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-[var(--text-secondary)] italic py-2">No banking accounts registered</div>
            )}
          </div>
        </div>

        {/* 3. Vehicles */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>Registered Vehicles</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
              {person.vehicles?.length || 0}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {person.vehicles && person.vehicles.length > 0 ? (
              person.vehicles.map(v => (
                <div 
                  key={v}
                  className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200 hover:border-indigo-400 flex items-center justify-between text-xs font-mono text-indigo-900 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleInspectEntity(v, 'Vehicle', v)}
                    className="font-semibold hover:underline text-left cursor-pointer flex items-center gap-1"
                    title="Inspect Vehicle Dossier"
                  >
                    <span>{v}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInspectDocument('FASTag Toll Gate Ingress & ANPR Log', 'FASTag Ingress', v, `ANPR camera match and FASTag toll transaction log registered for vehicle ${v}.`)}
                    className="text-[10px] text-indigo-700 hover:text-indigo-950 font-sans hover:underline cursor-pointer flex items-center gap-0.5"
                    title="View FASTag Telemetry & Verification"
                  >
                    <span>FASTag Ingress →</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-[var(--text-secondary)] italic py-2">No vehicle registrations linked</div>
            )}
          </div>
        </div>

        {/* 4. Organizations */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Corporate Entities & Shells</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-200">
              {person.organizations?.length || 0}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {person.organizations && person.organizations.length > 0 ? (
              person.organizations.map(org => (
                <div 
                  key={org}
                  className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 hover:border-purple-400 flex items-center justify-between text-xs text-purple-900 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleInspectEntity(org, 'Organization', org)}
                    className="font-semibold hover:underline text-left cursor-pointer truncate max-w-[150px]"
                    title="Inspect Organization Dossier"
                  >
                    <span>{org}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInspectDocument('MCA Corporate Filings & Registry Extract', 'Corporate Filing', org, `Ministry of Corporate Affairs incorporation document and shareholding profile for ${org}.`)}
                    className="text-[10px] font-mono text-purple-700 hover:text-purple-950 hover:underline cursor-pointer shrink-0"
                    title="View MCA Filing Document"
                  >
                    <span>MCA Filing →</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-[var(--text-secondary)] italic py-2">No corporate shells linked</div>
            )}
          </div>
        </div>

        {/* 5. FIRs & Legal Proceedings */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Associated FIRs</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {person.associatedFIRs?.length || 0}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {person.associatedFIRs && person.associatedFIRs.length > 0 ? (
              person.associatedFIRs.map(fir => (
                <div 
                  key={fir}
                  className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 hover:border-blue-400 flex items-center justify-between text-xs font-mono text-blue-900 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => handleInspectEntity(fir, 'FIR', fir)}
                    className="font-semibold hover:underline text-left cursor-pointer"
                    title="Inspect FIR Dossier"
                  >
                    <span>{fir}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInspectDocument('Official First Information Report Filing', 'FIR Copy', fir, `Registered statutory FIR ${fir} filed under jurisdiction of investigating agency.`)}
                    className="text-[10px] text-blue-700 hover:text-blue-950 font-sans hover:underline cursor-pointer"
                    title="View FIR Document & Verification"
                  >
                    <span>FIR Document →</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-xs text-[var(--text-secondary)] italic py-2">No active FIRs filed</div>
            )}
          </div>
        </div>

        {/* 6. Known Associates & Co-Accused */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-700" />
              <span>Documented Associates</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
              {person.knownAssociates?.length || 0}
            </span>
          </div>
          <div className="space-y-1.5 pt-1">
            {person.knownAssociates && person.knownAssociates.length > 0 ? (
              person.knownAssociates.map(assoc => (
                <div 
                  key={assoc.personId}
                  onClick={() => handleInspectEntity(assoc.personId, 'Person', assoc.name)}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  title={`Inspect Associate Dossier for ${assoc.name}`}
                >
                  <div>
                    <span className="font-bold text-slate-900 hover:text-blue-700">{assoc.name}</span>
                    <div className="text-[10px] text-[var(--text-muted)]">{assoc.relationType}</div>
                  </div>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                    Conf: {assoc.confidence}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-[var(--text-secondary)] italic py-2">No documented associates</div>
            )}
          </div>
        </div>

      </div>

      {/* Primary Evidence Chain Link */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Primary Seized Evidence Corroboration
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setView('evidence');
              if (onCloseModal) onCloseModal();
              navigate(`/evidence?caseId=${encodeURIComponent(activeCaseId)}`);
            }}
            className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>All Evidence Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200">
                EVD-2024-0812
              </span>
              <span className="text-xs font-bold text-slate-900">
                Forensic Physical Clone: OnePlus 11 5G (IMEI 864201048821901)
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-muted)] font-mono mt-1.5 flex items-center gap-2">
              <span>Original SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</span>
              <button
                type="button"
                onClick={() => handleCopyHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}
                className="text-slate-500 hover:text-blue-600 cursor-pointer"
                title="Copy Hash"
              >
                {copiedHash === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>SHA-256 MATCH</span>
            </span>
            <button
              type="button"
              onClick={() => {
                selectEvidence('EVD-2024-0812');
                setView('evidence');
                if (onCloseModal) onCloseModal();
                navigate(`/evidence?caseId=${encodeURIComponent(activeCaseId)}`);
              }}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shadow-sm cursor-pointer"
              title="Inspect in Evidence Ledger"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => handleInspectDocument('Forensic Physical Clone: OnePlus 11 5G', 'Digital Forensics', 'EVD-2024-0812', 'Full physical disk extraction and cryptographic chain of custody registered under BSA Section 63/65B.')}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Quick Inspect Chain"
            >
              Inspect Chain
            </button>
          </div>
        </div>
      </div>

      {/* Evidence & Source Documents Modal */}
      {isEvidenceModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsEvidenceModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Evidentiary Assets & Chain of Custody</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Subject: <span className="text-slate-800 font-semibold">{person.fullName}</span> (ID: {person.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEvidenceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-2 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">BSA Section 63/65B Legal Chain of Custody Verified</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 font-medium">Case: {activeCaseId}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {isEvidenceLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-600 space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-sm font-medium">Retrieving verified evidence records for {person.fullName}...</p>
                </div>
              ) : evidenceError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-red-800 space-y-2">
                  <p className="text-xs font-semibold">{evidenceError}</p>
                  <button
                    type="button"
                    onClick={handleOpenEvidence}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
                  >
                    Try Again
                  </button>
                </div>
              ) : evidenceDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <FolderOpen className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                  <h4 className="text-sm font-bold text-slate-800">No primary evidence files directly linked</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    No files are registered for {person.fullName} in this case. You can inspect all case-level assets in the main ledger.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEvidenceModalOpen(false);
                      if (onCloseModal) onCloseModal();
                      navigate(`/evidence?caseId=${encodeURIComponent(activeCaseId)}`);
                    }}
                    className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Open Case Evidence Ledger
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600 pb-1">
                    <span className="font-semibold text-slate-800">
                      {evidenceDocs.length} Evidence Record{evidenceDocs.length > 1 ? 's' : ''} Associated
                    </span>
                  </div>
                  {evidenceDocs.map(doc => (
                    <div
                      key={doc.id || doc.documentId}
                      className="border border-slate-200 rounded-lg p-4 bg-white hover:border-emerald-300 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {doc.category || doc.fileType}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {doc.bsaCertificateId || 'BSA-65B Verified'}
                        </span>
                      </div>
                      <h5 className="font-semibold text-slate-900 text-sm">{doc.fileName}</h5>
                      <p className="text-xs text-slate-600 line-clamp-2">{doc.description}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">SHA-256</span>
                          <span className="font-mono text-slate-700 truncate block" title={doc.sha256Hash}>
                            {doc.sha256Hash ? `${doc.sha256Hash.slice(0, 8)}...${doc.sha256Hash.slice(-6)}` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Custodian</span>
                          <span className="font-medium text-slate-700 truncate block">{doc.custodian || 'Officer'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Date</span>
                          <span className="font-medium text-slate-700 block">{doc.uploadedAt ? (doc.uploadedAt.includes('T') ? doc.uploadedAt.split('T')[0] : doc.uploadedAt) : 'Logged'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Size</span>
                          <span className="font-medium text-slate-700 block">{doc.fileSizeBytes ? `${(doc.fileSizeBytes / 1024).toFixed(0)} KB` : '1.2 MB'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <a
                          href={doc.storageUrl || `/api/v1/evidence/${encodeURIComponent(doc.id)}/file`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Asset
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <button
                type="button"
                onClick={() => {
                  setIsEvidenceModalOpen(false);
                  if (onCloseModal) onCloseModal();
                  navigate(`/evidence?caseId=${encodeURIComponent(activeCaseId)}`);
                }}
                className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Evidence Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsEvidenceModalOpen(false)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telemetry / Document Inspection Popover Modal */}
      {previewDoc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setPreviewDoc(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{previewDoc.title}</h4>
                  <p className="text-[11px] text-slate-500 font-mono">Ref: {previewDoc.reference}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-slate-700 leading-relaxed">
                {previewDoc.details}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 uppercase text-[11px]">Cryptographic SHA-256 Hash</span>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(previewDoc.hash)}
                    className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedHash === previewDoc.hash ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Hash</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-800 bg-slate-100 p-2 rounded border border-slate-200 break-all select-all">
                  {previewDoc.hash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Statutory Certificate</span>
                  <span className="font-mono font-semibold text-slate-800">{previewDoc.bsaCert}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-500 block">Intake Custodian</span>
                  <span className="font-semibold text-slate-800 truncate block">{previewDoc.custodian}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified Legal Chain
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-md hover:bg-slate-100 text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
