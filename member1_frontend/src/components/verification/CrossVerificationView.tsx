import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { SYNTHETIC_DISCREPANCIES } from '../../data/syntheticData';
import { CrossVerificationDiscrepancy } from '../../types/evidence';
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
  HelpCircle
} from 'lucide-react';

export const CrossVerificationView: React.FC = () => {
  const { setView } = useNavigationStore();
  const [selectedDiscrepancyId, setSelectedDiscrepancyId] = useState<string>(SYNTHETIC_DISCREPANCIES[0].id);

  const activeDiscrepancy = SYNTHETIC_DISCREPANCIES.find(d => d.id === selectedDiscrepancyId) || SYNTHETIC_DISCREPANCIES[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-semibold">
            M5 Cross-Verification Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
            Contradiction Detector
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 mt-1">
          Cross-Source Evidentiary Discrepancy Analysis
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Automated multi-record cross-examination flagging physical, temporal, and documentary contradictions across police statements, telecom records, and banking files.
        </p>
      </div>

      {/* Mandatory Non-Decisional Policy Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wide font-mono block">
            JUDICIAL IMPARTIALITY DIRECTIVE:
          </span>
          <p className="text-slate-400 mt-0.5 leading-relaxed">
            CrimeNet AI surfaces mathematical and documentary discrepancies between conflicting evidence sources. <strong>The system does not decide which source is truthful.</strong> Corroboration and legal weight remain within the exclusive domain of the investigating officer and trial court.
          </p>
        </div>
      </div>

      {/* Discrepancy Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYNTHETIC_DISCREPANCIES.map(disc => {
          const isSelected = disc.id === activeDiscrepancy.id;
          return (
            <div
              key={disc.id}
              onClick={() => setSelectedDiscrepancyId(disc.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'glass-panel bg-red-500/10 border-red-500/50 shadow-lg'
                  : 'glass-card bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold uppercase text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                  {disc.id}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Case: {disc.caseId}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-200">{disc.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1 truncate">Conflict: {disc.conflictingField}</p>
            </div>
          );
        })}
      </div>

      {/* FLASHING / PROMINENT DISCREPANCY DETECTED BANNER */}
      <div className="glass-panel rounded-2xl p-6 border-red-500/40 bg-gradient-to-r from-red-950/40 via-slate-900/60 to-red-950/40 discrepancy-pulse">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-red-500/30 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
              <AlertOctagon className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                {activeDiscrepancy.status}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 mt-1">{activeDiscrepancy.title}</h2>
              <div className="text-xs font-mono text-amber-300 mt-0.5">
                Conflicting Parameter: {activeDiscrepancy.conflictingField}
              </div>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-300 text-xs font-mono border border-slate-700 self-start sm:self-center">
            Status: ACTIVE REVIEW
          </span>
        </div>

        {/* Side-by-Side Source Comparison: Source A vs Source B */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SOURCE A */}
          <div className="glass-card rounded-xl p-5 border-slate-700 space-y-3 bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">SOURCE A</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{activeDiscrepancy.sourceA.timestamp}</span>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-200">{activeDiscrepancy.sourceA.sourceName}</div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">Record: {activeDiscrepancy.sourceA.documentRef}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Recorded Value:</span>
              <div className="text-sm font-bold text-cyan-300 font-mono">
                {activeDiscrepancy.sourceA.recordedValue}
              </div>
            </div>

            <div className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded border border-slate-800/80">
              {activeDiscrepancy.sourceA.excerpt}
            </div>
          </div>

          {/* SOURCE B */}
          <div className="glass-card rounded-xl p-5 border-slate-700 space-y-3 bg-slate-950/70">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">SOURCE B</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{activeDiscrepancy.sourceB.timestamp}</span>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-200">{activeDiscrepancy.sourceB.sourceName}</div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">Record: {activeDiscrepancy.sourceB.documentRef}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">Recorded Value:</span>
              <div className="text-sm font-bold text-emerald-300 font-mono">
                {activeDiscrepancy.sourceB.recordedValue}
              </div>
            </div>

            <div className="text-xs text-slate-400 italic bg-slate-900/40 p-2.5 rounded border border-slate-800/80">
              {activeDiscrepancy.sourceB.excerpt}
            </div>
          </div>

        </div>

        {/* Analytical Notes & Recommended Field Inquiries */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-cyan-400 block mb-1">Analytical Notes:</span>
            {activeDiscrepancy.analyticalNotes}
          </div>

          <div>
            <span className="text-xs font-mono uppercase text-slate-400 block mb-2 font-semibold">
              Investigator Follow-Up Action Items:
            </span>
            <div className="space-y-1.5">
              {activeDiscrepancy.investigatorActions.map((action, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
