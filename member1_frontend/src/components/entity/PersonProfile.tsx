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
      <div className="glass-panel rounded-2xl p-6 border-cyan-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/80">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-lg shadow-cyan-500/10">
              <User className="w-8 h-8" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {person.id}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  DOB: {person.dateOfBirth || 'N/A'} • {person.gender || 'Unknown'} • {person.nationality || 'Indian'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  ID: {person.nationalIdNumber}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-100">{person.fullName}</h1>

              {person.aliases && person.aliases.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-amber-400 font-mono">
                  <span>Known Aliases / Handles:</span>
                  <span className="font-semibold">{person.aliases.join(' • ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => setView('graph')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>View Network Graph</span>
            </button>
            <button
              onClick={() => setView('timeline')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Timeline</span>
            </button>
          </div>

        </div>

        {/* Investigator Analytical Summary & Disclaimers */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold block mb-1">
              Investigator Analytical Assessment (Not a Guilt Label):
            </span>
            {person.analyticalSummary}
          </div>

          <div className="text-xs text-slate-400 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1 font-mono">
            <div className="text-[10px] uppercase text-slate-400 font-semibold">Corroborated Sources:</div>
            <div className="text-slate-200">{person.source}</div>
            <div className="text-slate-400 text-[11px] truncate">Ref: {person.sourceDocument}</div>
            <div className="text-emerald-400 text-[11px]">Chain of Evidence: {person.evidenceCount} Files Logged</div>
          </div>
        </div>

        {/* Anomaly Indicators (Factual Signals - NOT Risk Scores) */}
        {person.anomalyIndicators && person.anomalyIndicators.length > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono mb-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>FACTUAL ANOMALY FINDINGS & DISCREPANCIES (FOR INVESTIGATOR FOLLOW-UP)</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-200/90 list-disc list-inside">
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
        <div className="glass-panel rounded-xl p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span>Registered Phone Numbers</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{person.phoneNumbers.length}</span>
          </div>
          <div className="space-y-1.5">
            {person.phoneNumbers.map(ph => (
              <div 
                key={ph}
                onClick={() => { selectEntity('ENT-PHON-001'); }}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 cursor-pointer flex items-center justify-between text-xs font-mono text-emerald-300"
              >
                <span>{ph}</span>
                <span className="text-[10px] text-slate-500">Bharti Airtel CDR →</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Bank Accounts */}
        <div className="glass-panel rounded-xl p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-400" />
              <span>Associated Bank Accounts</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{person.bankAccounts.length}</span>
          </div>
          <div className="space-y-1.5">
            {person.bankAccounts.map(ba => (
              <div 
                key={ba}
                onClick={() => { selectEntity('ENT-BANK-001'); }}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 cursor-pointer flex items-center justify-between text-xs font-mono text-amber-300"
              >
                <span>{ba}</span>
                <span className="text-[10px] text-slate-500">Subpoena Log →</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Vehicles */}
        <div className="glass-panel rounded-xl p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              <span>Registered Vehicles</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{person.vehicles.length}</span>
          </div>
          <div className="space-y-1.5">
            {person.vehicles.map(v => (
              <div 
                key={v}
                onClick={() => { selectEntity('ENT-VEH-001'); }}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 cursor-pointer flex items-center justify-between text-xs font-mono text-indigo-300"
              >
                <span>{v}</span>
                <span className="text-[10px] text-slate-500">FASTag Ingress →</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Organizations */}
        <div className="glass-panel rounded-xl p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>Corporate Entities & Shells</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{person.organizations.length}</span>
          </div>
          <div className="space-y-1.5">
            {person.organizations.map(org => (
              <div 
                key={org}
                onClick={() => { selectEntity('ENT-ORG-001'); }}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 cursor-pointer flex items-center justify-between text-xs text-purple-300"
              >
                <span>{org}</span>
                <span className="text-[10px] font-mono text-slate-500">MCA Filing →</span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. FIRs & Legal Proceedings */}
        <div className="glass-panel rounded-xl p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Associated FIRs</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{person.associatedFIRs.length}</span>
          </div>
          <div className="space-y-1.5">
            {person.associatedFIRs.map(fir => (
              <div 
                key={fir}
                onClick={() => { selectEntity('ENT-FIR-001'); }}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between text-xs font-mono text-cyan-300"
              >
                <span>{fir}</span>
                <span className="text-[10px] text-slate-500">Nhava Sheva CID →</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Known Associates & Co-Accused */}
        <div className="glass-panel rounded-xl p-4 border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <span>Documented Associates</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">{person.knownAssociates.length}</span>
          </div>
          <div className="space-y-1.5">
            {person.knownAssociates.map(assoc => (
              <div 
                key={assoc.personId}
                onClick={() => { selectEntity(assoc.personId); }}
                className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 cursor-pointer flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200">{assoc.name}</span>
                  <div className="text-[10px] text-slate-400">{assoc.relationType}</div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                  Conf: {assoc.confidence}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Primary Evidence Chain Link */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Primary Seized Evidence Corroboration
            </h3>
          </div>
          <button
            onClick={() => setView('evidence')}
            className="text-xs text-cyan-400 hover:underline font-mono"
          >
            All Evidence Items →
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400">EVD-2024-0812</span>
              <span className="text-xs font-semibold text-slate-200">
                Forensic Physical Clone: OnePlus 11 5G (IMEI 864201048821901)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-1">
              Original SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SHA-256 MATCH</span>
            </span>
            <button
              onClick={() => {
                selectEvidence('EVD-2024-0812');
                setView('evidence');
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Inspect Full Evidence Chain"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
