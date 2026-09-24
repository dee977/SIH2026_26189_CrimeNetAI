import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { SYNTHETIC_CASES } from '../../data/syntheticData';
import { CaseDossier } from '../../types/cases';
import { 
  Briefcase, 
  Plus, 
  Calendar, 
  User, 
  Shield, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  X,
  FileCheck,
  AlertTriangle
} from 'lucide-react';

export const CaseManagementView: React.FC = () => {
  const { selectCase, setView } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [cases, setCases] = useState<CaseDossier[]>(SYNTHETIC_CASES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Case State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStation, setNewStation] = useState('CID Crime Branch Mumbai');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCase: CaseDossier = {
      id: `CASE-2024-MH-0${cases.length + 93}`,
      caseNumber: `CASE-2024-MH-0${cases.length + 93}`,
      title: newTitle || 'New Organized Network Inquiry',
      description: newDesc || 'Inquiry registered to investigate cross-border contraband operations.',
      leadInvestigator: 'Inspector Vikramaditya Rao (LEO-7729)',
      assignedTeam: ['Insp. V. Rao', 'SI Priyanka Sen'],
      status: 'Active',
      priority: 'High',
      openedDate: new Date().toISOString().replace('T', ' ').slice(0, 10),
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 10),
      policeStation: newStation,
      jurisdiction: 'Maharashtra Cyber & Maritime Zone',
      entityCount: 1,
      evidenceCount: 1,
      alertCount: 0,
      associatedFIRs: ['FIR-2024-9011'],
      accessClassification: 'CONFIDENTIAL',
      auditHistory: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          officer: 'Insp. Vikramaditya Rao',
          action: 'CASE_CREATION',
          details: 'Dossier initialized via CrimeNet AI Terminal.'
        }
      ]
    };

    setCases([newCase, ...cases]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');

    addToast({
      type: 'success',
      title: 'Investigation Dossier Created',
      message: `${newCase.caseNumber} registered in case ledger.`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Action */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Multi-Agency Operations
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              CCTNS Master Dossiers
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1">
            Case Management & Investigation Dossiers
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organized syndicates partitioned by formal investigation dossiers with access classification and immutable audit logging.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Initialize New Case</span>
        </button>
      </div>

      {/* Case Dossiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cases.map(c => (
          <div
            key={c.id}
            className="glass-panel rounded-2xl p-6 border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {c.caseNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                    {c.priority} Priority
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                  {c.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-100 mt-1">{c.title}</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-3">
                {c.description}
              </p>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-mono">
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Entities</div>
                <div className="text-sm font-bold text-cyan-300">{c.entityCount}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Evidence</div>
                <div className="text-sm font-bold text-emerald-300">{c.evidenceCount}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px] uppercase">Alerts</div>
                <div className="text-sm font-bold text-amber-300">{c.alertCount}</div>
              </div>
            </div>

            {/* Bottom Details & Button */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div className="text-[11px] text-slate-400">
                Lead: <span className="text-slate-200 font-semibold">{c.leadInvestigator}</span>
              </div>
              <button
                onClick={() => selectCase(c.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
              >
                <span>Enter Workspace</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* CREATE CASE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-950 rounded-2xl border-cyan-500/40 p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">Initialize Formal Investigation Dossier</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Investigation Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operation Blue Tide: Port Smuggling Syndicate"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Police Unit / Station *
                </label>
                <input
                  type="text"
                  required
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Operational Facts & Scope *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail primary allegations, intercepted consignments, or suspect groups."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider shadow"
                >
                  Create Dossier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
