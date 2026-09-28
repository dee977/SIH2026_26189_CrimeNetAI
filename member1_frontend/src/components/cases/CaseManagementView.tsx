import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { SYNTHETIC_CASES } from '../../data/syntheticData';
import { CaseDossier } from '../../types/cases';
import { apiRequest } from '../../services/apiClient';
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

const DEMO_5_CASES: CaseDossier[] = [
  {
    id: 'CASE-2025-M3-DATASET',
    caseNumber: 'CASE-2025-M3-DATASET',
    title: 'Operation Falcon Web - National Contraband & Communications Syndicate',
    description: 'Centralized multi-state intelligence graph synthesized from the live Member 3 repository dataset: CDR call logs, hawala accounts, and co-conspirator networks across Mumbai, Delhi, Pune, Ahmedabad, and Hyderabad.',
    leadInvestigator: 'Deputy Director Vikramaditya Rao (LEO-7729)',
    assignedTeam: ['Insp. V. Rao', 'SI Priyanka Sen', 'Analyst K. Nair'],
    status: 'Active',
    priority: 'Critical',
    openedDate: '2025-01-15',
    lastUpdated: '2025-03-26',
    policeStation: 'Central Intelligence Grid HQ, New Delhi',
    jurisdiction: 'National Multi-State Cyber & Economic Zone',
    entityCount: 184,
    evidenceCount: 12,
    alertCount: 4,
    associatedFIRs: ['F000001', 'F000002', 'F000003'],
    accessClassification: 'TOP SECRET',
    auditHistory: [
      {
        timestamp: '2025-01-15 09:00:00',
        officer: 'Deputy Director V. Rao',
        action: 'CASE_CREATION',
        details: 'Dossier initialized from National Central Bureau multi-modal intelligence feed.'
      }
    ]
  },
  {
    id: 'CASE-VIDEO-001',
    caseNumber: 'CASE-VIDEO-001',
    title: 'Operation Golden Fleece - Financial Syndicate',
    description: 'Multi-layer money laundering operation spanning offshore shell accounts, hawala conduits, and luxury asset liquidations.',
    leadInvestigator: 'Inspector Sharma (LEO-5521)',
    assignedTeam: ['Insp. Sharma', 'Analyst S. Verma'],
    status: 'Active',
    priority: 'Critical',
    openedDate: '2025-02-01',
    lastUpdated: '2025-03-24',
    policeStation: 'Cyber Cell HQ, Mumbai',
    jurisdiction: 'Economic Offences Wing, Maharashtra',
    entityCount: 100,
    evidenceCount: 8,
    alertCount: 3,
    associatedFIRs: ['FIR-2025-FIN-088'],
    accessClassification: 'RESTRICTED',
    auditHistory: [
      {
        timestamp: '2025-02-01 10:15:00',
        officer: 'Inspector Sharma',
        action: 'CASE_CREATION',
        details: 'Financial crime dossier opened following suspicious transaction report.'
      }
    ]
  },
  {
    id: 'CASE-VIDEO-002',
    caseNumber: 'CASE-VIDEO-002',
    title: 'Operation White Dust - Narcotics Ring',
    description: 'Multi-state coastal narcotics trafficking ring coordinating distribution via domestic express courier services and darknet dead drops.',
    leadInvestigator: 'Officer Reddy (LEO-3342)',
    assignedTeam: ['Officer Reddy', 'SI K. Raman'],
    status: 'Active',
    priority: 'High',
    openedDate: '2025-02-10',
    lastUpdated: '2025-03-25',
    policeStation: 'Narcotics Enforcement Wing, Goa',
    jurisdiction: 'Western Coastal Narcotics Control Zone',
    entityCount: 100,
    evidenceCount: 6,
    alertCount: 2,
    associatedFIRs: ['FIR-2025-NAR-104'],
    accessClassification: 'CONFIDENTIAL',
    auditHistory: [
      {
        timestamp: '2025-02-10 11:30:00',
        officer: 'Officer Reddy',
        action: 'CASE_CREATION',
        details: 'Narcotics intercept registered.'
      }
    ]
  },
  {
    id: 'CASE-VIDEO-003',
    caseNumber: 'CASE-VIDEO-003',
    title: 'Operation Phishnet - Cyber Fraud',
    description: 'Organized phishing and banking credential harvesting network targeting critical national infrastructure and banking consumers.',
    leadInvestigator: 'Inspector Khan (LEO-9102)',
    assignedTeam: ['Insp. Khan', 'Tech Specialist D. Gupta'],
    status: 'Active',
    priority: 'High',
    openedDate: '2025-02-20',
    lastUpdated: '2025-03-25',
    policeStation: 'Cyber Crime Police Station, Bangalore',
    jurisdiction: 'National Cyber Crime Coordination Centre (I4C)',
    entityCount: 100,
    evidenceCount: 7,
    alertCount: 5,
    associatedFIRs: ['FIR-2025-CYB-201'],
    accessClassification: 'RESTRICTED',
    auditHistory: [
      {
        timestamp: '2025-02-20 14:00:00',
        officer: 'Inspector Khan',
        action: 'CASE_CREATION',
        details: 'Cyber fraud task force initiated.'
      }
    ]
  },
  {
    id: 'CASE-VIDEO-004',
    caseNumber: 'CASE-VIDEO-004',
    title: 'Operation Iron Shield - Human Trafficking',
    description: 'Cross-border organized human trafficking, forged transit visa syndicate, and illegal border transit conduit across regional corridors.',
    leadInvestigator: 'Officer Patel (LEO-4419)',
    assignedTeam: ['Officer Patel', 'SI M. Joshi'],
    status: 'Active',
    priority: 'Critical',
    openedDate: '2025-03-01',
    lastUpdated: '2025-03-26',
    policeStation: 'Border Anti-Trafficking Unit, Kolkata',
    jurisdiction: 'Eastern Frontier Security Grid',
    entityCount: 100,
    evidenceCount: 5,
    alertCount: 3,
    associatedFIRs: ['FIR-2025-TRF-312'],
    accessClassification: 'TOP SECRET',
    auditHistory: [
      {
        timestamp: '2025-03-01 08:45:00',
        officer: 'Officer Patel',
        action: 'CASE_CREATION',
        details: 'Anti-human trafficking joint operation initiated.'
      }
    ]
  }
];

export const CaseManagementView: React.FC = () => {
  const { selectCase, setView } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [cases, setCases] = useState<CaseDossier[]>(DEMO_5_CASES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Case State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStation, setNewStation] = useState('CID Crime Branch Mumbai');
  const [newPriority, setNewPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [newStatus, setNewStatus] = useState<'Active' | 'Under Review' | 'Charge Sheeted' | 'Archived'>('Active');
  const [newInvestigator, setNewInvestigator] = useState('Inspector Vikramaditya Rao (LEO-7729)');
  const [newJurisdiction, setNewJurisdiction] = useState('National Multi-State Cyber & Economic Zone');
  const [newClassification, setNewClassification] = useState<'RESTRICTED' | 'CONFIDENTIAL' | 'TOP SECRET'>('CONFIDENTIAL');
  const [newFIR, setNewFIR] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const caseNumberId = `CASE-2025-LEO-0${cases.length + 101}`;
    const newCase: CaseDossier = {
      id: caseNumberId,
      caseNumber: caseNumberId,
      title: newTitle || 'New Organized Network Inquiry',
      description: newDesc || 'Inquiry registered to investigate cross-border contraband operations.',
      leadInvestigator: newInvestigator || 'Inspector Vikramaditya Rao (LEO-7729)',
      assignedTeam: [newInvestigator.split('(')[0].trim(), 'SI Priyanka Sen'],
      status: newStatus,
      priority: newPriority,
      openedDate: new Date().toISOString().replace('T', ' ').slice(0, 10),
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 10),
      policeStation: newStation,
      jurisdiction: newJurisdiction,
      entityCount: 1,
      evidenceCount: 1,
      alertCount: 0,
      associatedFIRs: newFIR ? [newFIR] : [`FIR-2025-${caseNumberId.slice(-3)}`],
      accessClassification: newClassification,
      auditHistory: [
        {
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          officer: newInvestigator,
          action: 'CASE_CREATION',
          details: `Dossier initialized with ${newPriority} priority and ${newClassification} classification.`
        }
      ]
    };

    try {
      await apiRequest('/cases', {
        method: 'POST',
        body: JSON.stringify({
          title: newCase.title,
          description: newCase.description,
          assignedInvestigator: newCase.leadInvestigator,
          assignedTeam: newStation,
          priority: newPriority.toLowerCase(),
          caseType: 'Organized Crime Investigation'
        })
      });
    } catch (err) {
      console.warn('Backend sync warning for new case, saved to active session:', err);
    }

    setCases([newCase, ...cases]);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewFIR('');

    addToast({
      type: 'success',
      title: 'Investigation Dossier Created',
      message: `${newCase.caseNumber} registered with Priority [${newPriority.toUpperCase()}].`
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Action */}
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-5 border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold">
              Multi-Agency Operations
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-[var(--primary)] border border-cyan-800">
              CCTNS Master Dossiers
            </span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1">
            Case Management & Investigation Dossiers
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Organized syndicates partitioned by formal investigation dossiers with access classification and immutable audit logging.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
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
            className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-6 border-[var(--border)] hover:border-[var(--primary)] transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[var(--primary)] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    {c.caseNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {c.priority} Priority
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 font-bold">
                  {c.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 mt-1">{c.title}</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">
                {c.description}
              </p>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono">
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Entities</div>
                <div className="text-sm font-bold text-blue-700">{c.entityCount}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Evidence</div>
                <div className="text-sm font-bold text-emerald-700">{c.evidenceCount}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px] uppercase font-bold">Alerts</div>
                <div className="text-sm font-bold text-amber-700">{c.alertCount}</div>
              </div>
            </div>

            {/* Bottom Details & Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                Lead: <span className="text-slate-900 font-semibold">{c.leadInvestigator}</span>
              </div>
              <button
                onClick={() => selectCase(c.id)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
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
          <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl bg-[var(--bg-card)] rounded-2xl border-[var(--primary)] p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Initialize Formal Investigation Dossier</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Investigation Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operation Blue Tide: Port Smuggling Syndicate"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1 font-semibold text-cyan-400">
                    Priority Level *
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-medium"
                  >
                    <option value="Critical">🔴 Critical (High Threat / Multi-Agency)</option>
                    <option value="High">🟠 High (Syndicate / Active Hawala)</option>
                    <option value="Medium">🟡 Medium (Standard Cross-Jurisdiction)</option>
                    <option value="Low">🟢 Low (Routine Intercept Inquiry)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Dossier Status *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="Active">Active Investigation</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Charge Sheeted">Charge Sheeted</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Lead Investigator *
                  </label>
                  <input
                    type="text"
                    required
                    value={newInvestigator}
                    onChange={(e) => setNewInvestigator(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Police Unit / Station *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Security Classification *
                  </label>
                  <select
                    value={newClassification}
                    onChange={(e) => setNewClassification(e.target.value as any)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
                  >
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="TOP SECRET">TOP SECRET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Associated FIR No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. FIR-2025-MUM-8841"
                    value={newFIR}
                    onChange={(e) => setNewFIR(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Jurisdiction *
                </label>
                <input
                  type="text"
                  required
                  value={newJurisdiction}
                  onChange={(e) => setNewJurisdiction(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Operational Facts & Scope *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail primary allegations, intercepted consignments, or suspect groups."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-slate-50 text-[var(--text-secondary)] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider shadow"
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
