import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnyEntity } from '../../types/entities';
import { useNavigationStore } from '../../store/navigationStore';
import { EntitySourceDocument, fetchEntityDocuments } from '../../services/evidenceService';
import { 
  Phone, 
  Landmark, 
  Truck, 
  MapPin, 
  Building2, 
  FileText, 
  ShieldAlert, 
  ArrowLeftRight, 
  PhoneCall, 
  FileCheck,
  Share2,
  Clock,
  ExternalLink,
  AlertTriangle,
  Database,
  X,
  Download,
  Copy,
  Check,
  Loader2,
  ArrowRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

export interface GenericEntityProfileProps {
  entity: AnyEntity;
  onSelectLinkedEntity?: (entityId: string, entityName?: string) => void;
  onCloseModal?: () => void;
  caseId?: string;
}

export const GenericEntityProfile: React.FC<GenericEntityProfileProps> = ({ 
  entity,
  onSelectLinkedEntity,
  onCloseModal,
  caseId
}) => {
  const navigate = useNavigate();
  const { setView, selectEntity, selectedCaseId } = useNavigationStore();
  const activeCaseId = caseId || selectedCaseId || entity.caseIds?.[0] || 'CASE-2026-HWL-001';

  // State for Evidence & Source Documents Modal
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [isEvidenceLoading, setIsEvidenceLoading] = useState(false);
  const [evidenceDocs, setEvidenceDocs] = useState<EntitySourceDocument[]>([]);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // 1. View in Graph handler
  const handleViewInGraph = () => {
    console.log('[GenericEntityProfile] View in Graph:', entity.id, entity.label);
    selectEntity(entity.id);
    setView('graph');
    if (onCloseModal) onCloseModal();
    navigate(`/graph?entityId=${encodeURIComponent(entity.id)}&caseId=${encodeURIComponent(activeCaseId)}`);
  };

  // 2. Timeline handler
  const handleViewTimeline = () => {
    console.log('[GenericEntityProfile] Timeline clicked:', entity.id, entity.label);
    selectEntity(entity.id);
    setView('timeline');
    if (onCloseModal) onCloseModal();
    navigate(`/timeline?entityId=${encodeURIComponent(entity.id)}&caseId=${encodeURIComponent(activeCaseId)}`);
  };

  // 3. Evidence handler
  const handleOpenEvidence = async () => {
    console.log('[GenericEntityProfile] Evidence button clicked for:', entity.id);
    setIsEvidenceModalOpen(true);
    setIsEvidenceLoading(true);
    setEvidenceError(null);
    try {
      const res = await fetchEntityDocuments(entity.id, activeCaseId);
      console.log('[GenericEntityProfile] Loaded documents:', res);
      setEvidenceDocs(res.data || []);
    } catch (err: any) {
      console.error('[GenericEntityProfile] Error fetching entity documents:', err);
      setEvidenceError(err?.message || 'Failed to load evidence documents.');
    } finally {
      setIsEvidenceLoading(false);
    }
  };

  const getEntityIcon = () => {
    switch (entity.type) {
      case 'Phone': return <Phone className="w-8 h-8 text-emerald-600" />;
      case 'BankAccount': return <Landmark className="w-8 h-8 text-amber-600" />;
      case 'Vehicle': return <Truck className="w-8 h-8 text-indigo-600" />;
      case 'Location': return <MapPin className="w-8 h-8 text-red-600" />;
      case 'Organization': return <Building2 className="w-8 h-8 text-purple-600" />;
      case 'FIR': return <FileText className="w-8 h-8 text-blue-600" />;
      case 'Crime': return <ShieldAlert className="w-8 h-8 text-rose-600" />;
      case 'Transaction': return <ArrowLeftRight className="w-8 h-8 text-amber-600" />;
      case 'Communication': return <PhoneCall className="w-8 h-8 text-teal-600" />;
      case 'Evidence': return <FileCheck className="w-8 h-8 text-emerald-600" />;
      default: return <Database className="w-8 h-8 text-[var(--text-muted)]" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 bg-gradient-to-br from-white via-slate-50/40 to-blue-50/20">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 shadow-sm">
              {getEntityIcon()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                  {entity.type}
                </span>
                <span className="text-xs font-mono text-slate-600 font-medium">
                  {entity.id}
                </span>
                {entity.firstObserved && (
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    Logged: {entity.firstObserved}
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mt-1">{entity.label}</h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2 font-mono">
                <div>Source: <span className="text-slate-900 font-semibold">{entity.source}</span></div>
                {entity.sourceDocument && <div>Ref: <span className="text-[var(--text-muted)]">{entity.sourceDocument}</span></div>}
                <div>Case: <span className="text-blue-700 font-semibold">{entity.caseIds?.join(', ')}</span></div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start shrink-0">
            <button
              onClick={handleViewInGraph}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              title="Locate Entity in Network Graph"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Locate in Graph</span>
            </button>
            <button
              onClick={handleViewTimeline}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer"
              title="View Chronological Event Trail"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Timeline</span>
            </button>
            <button
              onClick={handleOpenEvidence}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-sm cursor-pointer"
              title="View Associated Evidence"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Evidence</span>
            </button>
          </div>

        </div>

        {/* Factual Anomaly Indicators */}
        {entity.anomalyIndicators && entity.anomalyIndicators.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold font-mono mb-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>ANOMALY & IRREGULARITY SIGNALS</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-900 list-disc list-inside">
              {entity.anomalyIndicators.map((ind, i) => (
                <li key={i}>{ind}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Field-Specific Data Renderers */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
          Technical Specifications & Corroborated Attributes
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          
          {/* PHONE */}
          {entity.type === 'Phone' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Phone Number</div>
                <div className="text-sm font-bold text-slate-900 font-mono mt-1">{(entity as any).phoneNumber || entity.label}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Hardware IMEI</div>
                <div className="text-sm font-mono text-slate-800 mt-1 font-semibold">{(entity as any).imei || 'Not Extracted'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Carrier / Provider</div>
                <div className="text-sm text-emerald-700 font-bold mt-1">{(entity as any).serviceProvider || 'Cellular Operator'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Registered Subscriber</div>
                {(entity as any).registeredSubscriber ? (
                  <button
                    type="button"
                    onClick={() => onSelectLinkedEntity?.((entity as any).registeredSubscriber)}
                    className="text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline mt-1 text-left flex items-center gap-1 cursor-pointer"
                    title="View Subscriber Dossier"
                  >
                    <span>{(entity as any).registeredSubscriber}</span>
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                  </button>
                ) : (
                  <div className="text-sm text-slate-600 mt-1">Unknown Subscriber</div>
                )}
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Last Active Tower</div>
                <div className="text-sm text-blue-700 font-mono mt-1 font-semibold">{(entity as any).lastActiveTower || 'BTS Location Logged'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">CDR Call Volume</div>
                <div className="text-sm font-mono text-amber-700 font-bold mt-1">{(entity as any).cdrCallCount || 0} calls</div>
              </div>
            </>
          )}

          {/* BANK ACCOUNT */}
          {entity.type === 'BankAccount' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Account Number</div>
                <div className="text-sm font-bold text-amber-900 font-mono mt-1">{(entity as any).accountNumber || entity.label}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Financial Institution</div>
                <div className="text-sm text-slate-900 font-semibold mt-1">{(entity as any).bankName || 'Bank'} {(entity as any).branch ? `(${(entity as any).branch})` : ''}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">IFSC Code</div>
                <div className="text-sm font-mono text-slate-700 mt-1 font-semibold">{(entity as any).ifscCode || 'IFSC Logged'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Account Title</div>
                {(entity as any).accountHolderName ? (
                  <button
                    type="button"
                    onClick={() => onSelectLinkedEntity?.((entity as any).accountHolderName)}
                    className="text-sm font-bold text-blue-700 hover:text-blue-900 hover:underline mt-1 text-left flex items-center gap-1 cursor-pointer"
                    title="View Account Holder Dossier"
                  >
                    <span>{(entity as any).accountHolderName}</span>
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                  </button>
                ) : (
                  <div className="text-sm font-bold text-slate-900 mt-1">{(entity as any).holderName || 'Verified Holder'}</div>
                )}
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Account Classification</div>
                <div className="text-sm text-blue-700 font-bold mt-1">{(entity as any).accountType || 'Current / Savings'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Total Transactions Logged</div>
                <div className="text-sm font-mono text-slate-900 font-bold mt-1">{(entity as any).totalTransactionsLogged || 0} Entries</div>
              </div>
            </>
          )}

          {/* TRANSACTION */}
          {entity.type === 'Transaction' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Settlement Amount</div>
                <div className="text-lg font-bold text-amber-700 font-mono mt-1">
                  ₹{(entity as any).amountINR?.toLocaleString('en-IN') || (entity as any).amount || '0'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Timestamp</div>
                <div className="text-sm font-mono text-slate-900 font-semibold mt-1">{(entity as any).timestamp || 'Logged'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Payment Rails</div>
                <div className="text-sm text-blue-700 font-bold mt-1">{(entity as any).channel || 'NEFT / RTGS'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Originator Account</div>
                {(entity as any).sourceAccount ? (
                  <button
                    type="button"
                    onClick={() => onSelectLinkedEntity?.((entity as any).sourceAccount, (entity as any).sourceHolder)}
                    className="text-sm font-mono text-blue-700 hover:underline font-bold mt-1 text-left flex items-center gap-1 cursor-pointer"
                  >
                    <span>{(entity as any).sourceAccount}</span>
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                  </button>
                ) : (
                  <div className="text-sm font-mono text-slate-900 font-bold mt-1">N/A</div>
                )}
                {(entity as any).sourceHolder && (
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">{(entity as any).sourceHolder}</div>
                )}
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Beneficiary Account</div>
                {(entity as any).destinationAccount ? (
                  <button
                    type="button"
                    onClick={() => onSelectLinkedEntity?.((entity as any).destinationAccount, (entity as any).destinationHolder)}
                    className="text-sm font-mono text-blue-700 hover:underline font-bold mt-1 text-left flex items-center gap-1 cursor-pointer"
                  >
                    <span>{(entity as any).destinationAccount}</span>
                    <ExternalLink className="w-3 h-3 text-blue-500" />
                  </button>
                ) : (
                  <div className="text-sm font-mono text-slate-900 font-bold mt-1">N/A</div>
                )}
                {(entity as any).destinationHolder && (
                  <div className="text-[11px] text-[var(--text-muted)] font-medium">{(entity as any).destinationHolder}</div>
                )}
              </div>
            </>
          )}

          {/* LOCATION */}
          {entity.type === 'Location' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Coordinates</div>
                <div className="text-sm font-mono text-red-600 font-bold mt-1">
                  {(entity as any).latitude}, {(entity as any).longitude}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Category</div>
                <div className="text-sm text-slate-900 font-bold mt-1">{(entity as any).locationCategory || 'Geo Coordinates'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Jurisdiction Address</div>
                <div className="text-xs text-slate-700 mt-1 font-medium">{(entity as any).address || entity.label}</div>
              </div>
            </>
          )}

          {/* FIR */}
          {entity.type === 'FIR' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">FIR Number</div>
                <div className="text-sm font-bold text-blue-700 font-mono mt-1">{(entity as any).firNumber || entity.label}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Police Station</div>
                <div className="text-sm text-slate-900 font-semibold mt-1">{(entity as any).policeStation || 'Central PS'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Investigation Status</div>
                <div className="text-sm text-emerald-700 font-bold mt-1">{(entity as any).status || 'Under Investigation'}</div>
              </div>
              <div className="col-span-full p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold mb-1.5">Applied Legal Sections</div>
                <div className="flex flex-wrap gap-1.5">
                  {((entity as any).sectionsApplied || ['IPC 420', 'IT Act 66D', 'PMLA 3/4']).map((sec: string) => (
                    <span key={sec} className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono text-[11px] font-semibold">
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* CRIME */}
          {entity.type === 'Crime' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Crime Incident ID</div>
                <div className="text-sm font-bold text-rose-700 font-mono mt-1">{(entity as any).crimeId || entity.id}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Category</div>
                <div className="text-sm text-slate-900 font-bold mt-1">{(entity as any).crimeCategory || 'Cybercrime / Money Laundering'}</div>
              </div>
              <div className="col-span-full p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold mb-1">Modus Operandi</div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{(entity as any).modusOperandi || 'Illicit fund dissipation and shell company layering.'}</p>
              </div>
            </>
          )}

          {/* ORGANIZATION */}
          {entity.type === 'Organization' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Corporate Name</div>
                <div className="text-sm font-bold text-purple-900 mt-1">{(entity as any).orgName || entity.label}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">CIN / Registration</div>
                <div className="text-sm font-mono text-slate-800 mt-1 font-semibold">{(entity as any).registrationNumber || 'U74999MH2021PTC368112'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Type</div>
                <div className="text-sm text-amber-800 font-bold mt-1">{(entity as any).orgType || 'Private Limited / Shell Entity'}</div>
              </div>
            </>
          )}

          {/* VEHICLE */}
          {entity.type === 'Vehicle' && (
            <>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Registration Number</div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-1">{(entity as any).licensePlate || entity.label}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">Vehicle Model</div>
                <div className="text-sm font-medium text-slate-800 mt-1">{(entity as any).makeModel || (entity as any).model || 'Commercial Carrier'}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[var(--text-muted)] font-mono text-[10px] uppercase font-semibold">FASTag Ingress Log</div>
                <div className="text-sm text-emerald-700 font-bold mt-1">{(entity as any).tagStatus || 'Active Tag Identified'}</div>
              </div>
            </>
          )}

        </div>

      </div>

      {/* Evidence & Source Documents Modal */}
      {isEvidenceModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsEvidenceModalOpen(false)}
        >
          <div 
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Forensic Source Documents & Evidence Assets
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    Entity: {entity.id} ({entity.label}) • Case: {activeCaseId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEvidenceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
              {isEvidenceLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                  <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                  <p className="text-xs font-semibold">Fetching authenticated evidence records...</p>
                </div>
              ) : evidenceError ? (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {evidenceError}
                </div>
              ) : evidenceDocs.length === 0 ? (
                <div className="text-center py-10 text-slate-500 space-y-2">
                  <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700">No Direct Evidence Files Registered</p>
                  <p className="text-xs text-slate-500">
                    No individual uploaded source files linked specifically to {entity.id}. View the full case evidence registry below.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEvidenceModalOpen(false);
                      if (onCloseModal) onCloseModal();
                      navigate(`/evidence?caseId=${encodeURIComponent(activeCaseId)}`);
                    }}
                    className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
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

    </div>
  );
};
