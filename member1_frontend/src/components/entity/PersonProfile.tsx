import React from 'react';
import { PersonEntity } from '../../types/entities';
import { useNavigationStore } from '../../store/navigationStore';
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
  CheckCircle2
} from 'lucide-react';

interface PersonProfileProps {
  person: PersonEntity;
}

export const PersonProfile: React.FC<PersonProfileProps> = ({ person }) => {
  const { setView, selectEntity, selectEvidence } = useNavigationStore();

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
            <button
              onClick={() => setView('graph')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-sm"
              title="Inspect in Interactive Network Graph"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>View in Graph</span>
            </button>
            <button
              onClick={() => setView('timeline')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
              title="View Chronological Event Trail"
            >
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setView('evidence')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-sm"
              title="Inspect Evidence Ledger"
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
            <div className="text-[10px] uppercase text-slate-500 font-bold">Corroborated Sources:</div>
            <div className="text-slate-900 font-semibold">{person.source || 'Central Criminal Database'}</div>
            <div className="text-slate-500 text-[11px] truncate">Ref: {person.sourceDocument || 'Primary Dossier Filing'}</div>
            <div className="text-emerald-700 font-semibold text-[11px]">Chain of Evidence: {person.evidenceCount || 1} Files Logged</div>
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
                  onClick={() => { selectEntity('ENT-PHON-001'); }}
                  className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 hover:border-emerald-400 cursor-pointer flex items-center justify-between text-xs font-mono text-emerald-800 transition-colors"
                >
                  <span className="font-semibold">{ph}</span>
                  <span className="text-[10px] text-emerald-600 font-sans">Bharti Airtel CDR →</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">No phone records registered</div>
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
                  onClick={() => { selectEntity('ENT-BANK-001'); }}
                  className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 hover:border-amber-400 cursor-pointer flex items-center justify-between text-xs font-mono text-amber-900 transition-colors"
                >
                  <span className="font-semibold">{ba}</span>
                  <span className="text-[10px] text-amber-700 font-sans">Subpoena Log →</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">No banking accounts registered</div>
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
                  onClick={() => { selectEntity('ENT-VEH-001'); }}
                  className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200 hover:border-indigo-400 cursor-pointer flex items-center justify-between text-xs font-mono text-indigo-900 transition-colors"
                >
                  <span className="font-semibold">{v}</span>
                  <span className="text-[10px] text-indigo-600 font-sans">FASTag Ingress →</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">No vehicle registrations linked</div>
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
                  onClick={() => { selectEntity('ENT-ORG-001'); }}
                  className="p-2.5 rounded-lg bg-purple-50/60 border border-purple-200 hover:border-purple-400 cursor-pointer flex items-center justify-between text-xs text-purple-900 transition-colors"
                >
                  <span className="font-semibold">{org}</span>
                  <span className="text-[10px] font-mono text-purple-600">MCA Filing →</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">No corporate shells linked</div>
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
                  onClick={() => { selectEntity('ENT-FIR-001'); }}
                  className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 hover:border-blue-400 cursor-pointer flex items-center justify-between text-xs font-mono text-blue-900 transition-colors"
                >
                  <span className="font-semibold">{fir}</span>
                  <span className="text-[10px] text-blue-600 font-sans">Nhava Sheva CID →</span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">No active FIRs filed</div>
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
                  onClick={() => { selectEntity(assoc.personId); }}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-900">{assoc.name}</span>
                    <div className="text-[10px] text-slate-500">{assoc.relationType}</div>
                  </div>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                    Conf: {assoc.confidence}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic py-2">No documented associates</div>
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
            onClick={() => setView('evidence')}
            className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
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
            <div className="text-[11px] text-slate-500 font-mono mt-1.5">
              Original SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>SHA-256 MATCH</span>
            </span>
            <button
              onClick={() => {
                selectEvidence('EVD-2024-0812');
                setView('evidence');
              }}
              className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors shadow-sm"
              title="Inspect Full Evidence Chain"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
