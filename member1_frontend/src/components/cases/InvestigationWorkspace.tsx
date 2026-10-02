import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useCaseStore, CaseMember, CaseNote } from '../../store/caseStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { NetworkGraphView } from '../graph/NetworkGraphView';
import { GraphAnalyticsView } from '../graph/GraphAnalyticsView';
import { TimelineView } from '../timeline/TimelineView';
import { EvidenceView } from '../evidence/EvidenceView';
import { 
  Briefcase, 
  Share2, 
  Clock, 
  HardDrive, 
  Users, 
  StickyNote, 
  BarChart, 
  ArrowLeft,
  Archive,
  Power,
  XCircle,
  Plus,
  Send,
  Edit,
  UserPlus,
  Upload,
  FilePlus,
  AlertTriangle
} from 'lucide-react';

export const InvestigationWorkspace: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'overview';
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const { selectedCaseId, setEvidenceUploadModalOpen } = useNavigationStore();
  const { cases, closeCase, archiveCase, reactivateCase, fetchMembers, addMember, fetchNotes, createNote } = useCaseStore();
  const { addToast } = useNotificationStore();

  useEffect(() => {
    if (caseId && caseId !== selectedCaseId) {
      useNavigationStore.getState().selectCase(caseId);
    }
  }, [caseId, selectedCaseId]);

  const activeCase = cases.find(c => c.caseId === caseId);

  // Members state
  const [members, setMembers] = useState<CaseMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('investigator');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  useEffect(() => {
    if (activeCase && activeTab === 'members') {
      loadMembers();
    }
    if (activeCase && activeTab === 'notes') {
      loadNotes();
    }
  }, [activeCase, activeTab]);

  const loadMembers = async () => {
    if (!activeCase) return;
    const data = await fetchMembers(activeCase.caseId);
    setMembers(data);
  };

  const loadNotes = async () => {
    if (!activeCase) return;
    const data = await fetchNotes(activeCase.caseId);
    setNotes(data);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !newMemberEmail.trim()) return;
    setIsAddingMember(true);
    const success = await addMember(activeCase.caseId, newMemberEmail.trim(), newMemberRole);
    if (success) {
      addToast({ type: 'success', title: 'Member Added', message: `${newMemberEmail} has been added to the case.` });
      setNewMemberEmail('');
      loadMembers();
    } else {
      addToast({ type: 'error', title: 'Error', message: 'Failed to add member.' });
    }
    setIsAddingMember(false);
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !newNoteContent.trim()) return;
    setIsAddingNote(true);
    const note = await createNote(activeCase.caseId, newNoteContent.trim(), false);
    if (note) {
      addToast({ type: 'success', title: 'Note Added', message: 'Case note has been saved.' });
      setNewNoteContent('');
      loadNotes();
    } else {
      addToast({ type: 'error', title: 'Error', message: 'Failed to save note.' });
    }
    setIsAddingNote(false);
  };

  const handleStatusAction = async (action: 'close' | 'archive' | 'reactivate') => {
    if (!activeCase) return;
    let success = false;
    if (action === 'close') {
      const reason = window.prompt('Reason for closing case:');
      if (!reason) return;
      success = await closeCase(activeCase.caseId, reason);
    } else if (action === 'archive') {
      if (window.confirm('Are you sure you want to archive this case?')) {
        success = await archiveCase(activeCase.caseId);
      }
    } else if (action === 'reactivate') {
      success = await reactivateCase(activeCase.caseId);
    }

    if (success) {
      addToast({ type: 'success', title: 'Case Updated', message: `Case status has been updated.` });
    } else {
      addToast({ type: 'error', title: 'Action Failed', message: `Could not update case status.` });
    }
  };

  if (!activeCase) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-2xl border border-[var(--border)]">
        <Briefcase className="w-12 h-12 text-[var(--text-muted)] mb-4" />
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Case Not Found</h2>
        <p className="text-[var(--text-secondary)] mt-2">The selected case could not be loaded or doesn't exist.</p>
        <button onClick={() => navigate('/cases')} className="mt-6 px-4 py-2 bg-[var(--primary)] text-[var(--text-primary)] font-bold rounded-xl flex items-center gap-2 hover:bg-[var(--primary)] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Cases
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'graph', label: 'Network Graph', icon: <Share2 className="w-4 h-4" /> },
    { id: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4" /> },
    { id: 'evidence', label: 'Evidence', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
    { id: 'notes', label: 'Notes', icon: <StickyNote className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart className="w-4 h-4" /> },
  ] as const;

  const isCaseActive = activeCase.status.toLowerCase() === 'active';
  const isCaseClosed = activeCase.status.toLowerCase() === 'closed';
  const isCaseArchived = activeCase.status.toLowerCase() === 'archived';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Dossier Header */}
      <div className="bg-[var(--bg-card)] shadow-xl rounded-2xl p-6 border border-[var(--border)]">
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
          <div className="flex-1">
            <button
              onClick={() => navigate('/cases')}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--primary)] hover:text-[var(--primary)] transition-colors mb-4 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Cases List</span>
            </button>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-xs font-mono font-bold text-[var(--text-primary)] bg-[var(--primary)]/40 px-2.5 py-1 rounded border border-[var(--primary)]/50">
                {activeCase.caseNumber}
              </span>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded border ${
                isCaseActive ? 'text-[var(--success)] bg-[var(--success)]/30 border-[var(--success)]/50' :
                isCaseClosed ? 'text-[var(--danger)] bg-[var(--danger)]/30 border-[var(--danger)]/50' :
                'text-[var(--text-secondary)] bg-[var(--bg-card)] border-[var(--border)]'
              }`}>
                {activeCase.status}
              </span>
              <span className="text-xs font-bold text-[var(--warning)] bg-[var(--warning)]/30 px-2.5 py-1 rounded border border-[var(--warning)]/50 uppercase">
                {activeCase.priority} Priority
              </span>
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">{activeCase.title}</h1>
            
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div className="flex flex-col">
                <span className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">Case Type</span>
                <span className="text-[var(--text-secondary)] font-medium">{activeCase.caseType || 'General Investigation'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">Jurisdiction</span>
                <span className="text-[var(--primary)] font-medium">{activeCase.jurisdiction || 'Unknown'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">Police Station</span>
                <span className="text-[var(--text-secondary)] font-medium">{activeCase.policeStation || 'N/A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">Lead Investigator</span>
                <span className="text-[var(--text-primary)] font-medium">{activeCase.assignedInvestigator || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start xl:items-end gap-4 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setActiveTab('members')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/30 hover:bg-blue-800/40 text-[var(--primary)] text-xs font-bold rounded border border-[var(--primary)]/50 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" /> Add Investigator
              </button>
              <button 
                onClick={() => { setActiveTab('evidence'); setEvidenceUploadModalOpen(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)]/30 hover:bg-blue-800/40 text-[var(--primary)] text-xs font-bold rounded border border-[var(--primary)]/50 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Evidence/Doc
              </button>
              <button 
                onClick={() => setActiveTab('notes')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--warning)]/30 hover:bg-amber-800/40 text-[var(--warning)] text-xs font-bold rounded border border-[var(--warning)]/50 transition-colors"
              >
                <StickyNote className="w-3.5 h-3.5" /> Add Note
              </button>

              {isCaseActive && (
                <button onClick={() => handleStatusAction('close')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--danger)]/30 hover:bg-rose-800/40 text-[var(--danger)] text-xs font-bold rounded border border-[var(--danger)]/50 transition-colors">
                  <XCircle className="w-3.5 h-3.5" /> Close Case
                </button>
              )}
              {isCaseClosed && (
                <button onClick={() => handleStatusAction('archive')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] text-xs font-bold rounded border border-[var(--border)] transition-colors">
                  <Archive className="w-3.5 h-3.5" /> Archive Case
                </button>
              )}
              {(isCaseClosed || isCaseArchived) && (
                <button onClick={() => handleStatusAction('reactivate')} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--success)]/30 hover:bg-emerald-800/40 text-[var(--success)] text-xs font-bold rounded border border-[var(--success)]/50 transition-colors">
                  <Power className="w-3.5 h-3.5" /> Reactivate
                </button>
              )}
            </div>
            
            <div className="text-xs text-[var(--text-muted)] font-medium">
              Created: {activeCase.createdAt ? new Date(activeCase.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Entities</span>
              <Share2 className="w-3.5 h-3.5 text-[var(--accent)]/50" />
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">{activeCase.entityCount || 0}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Relations</span>
              <Share2 className="w-3.5 h-3.5 text-[var(--secondary)]/50" />
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">{activeCase.relationshipCount || 0}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Evidence</span>
              <HardDrive className="w-3.5 h-3.5 text-[var(--success)]/50" />
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">{activeCase.evidenceCount || 0}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Docs</span>
              <FilePlus className="w-3.5 h-3.5 text-[var(--primary)]/50" />
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">{activeCase.importCount || 0}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Alerts</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--danger)]/50" />
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">{activeCase.alertCount || 0}</span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-3 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Notes</span>
              <StickyNote className="w-3.5 h-3.5 text-[var(--warning)]/50" />
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)]">{activeCase.noteCount || 0}</span>
          </div>
        </div>

        {/* Workspace Tab Bar */}
        <div className="flex items-center gap-1 overflow-x-auto mt-8 pt-4 border-t border-[var(--border)] custom-scrollbar pb-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as string)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/80'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="min-h-[500px]">
        {activeTab === 'overview' && (
          <div className="bg-[var(--bg-card)] shadow-lg rounded-2xl p-6 border border-[var(--border)] space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Investigation Description</h3>
                  <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {activeCase.description || 'No description provided for this case.'}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[var(--primary)]" />
                    Investigation Team
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Lead Investigator</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-7 h-7 rounded-full bg-[var(--primary)]/50 text-[var(--primary)] flex items-center justify-center font-bold text-xs uppercase border border-[var(--primary)]/50">
                          {activeCase.assignedInvestigator ? activeCase.assignedInvestigator.charAt(0) : 'U'}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{activeCase.assignedInvestigator || 'Unassigned'}</span>
                      </div>
                    </div>
                    {activeCase.assignedTeam && (
                      <div className="pt-3 border-t border-[var(--border)]">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Assigned Task Force</span>
                        <div className="flex items-center gap-2 mt-1.5">
                           <span className="text-sm font-medium text-[var(--text-primary)]">{activeCase.assignedTeam}</span>
                           <span className="text-xs text-[var(--primary)] bg-[var(--primary)]/30 px-2 py-0.5 rounded-full border border-[var(--primary)]/50">{activeCase.teamCount || 0} Members</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[var(--primary)]" />
                    Case Metadata
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Case Type</span>
                      <span className="font-medium text-[var(--text-primary)]">{activeCase.caseType || 'General'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Police Station</span>
                      <span className="font-medium text-[var(--text-primary)]">{activeCase.policeStation || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--text-secondary)]">Last Updated</span>
                      <span className="font-medium text-[var(--text-primary)]">{activeCase.updatedAt ? new Date(activeCase.updatedAt).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'graph' && <NetworkGraphView caseId={activeCase.caseId} />}
        {activeTab === 'timeline' && <TimelineView caseId={activeCase.caseId} />}
        {activeTab === 'evidence' && <EvidenceView caseId={activeCase.caseId} />}
        {activeTab === 'analytics' && <GraphAnalyticsView caseId={activeCase.caseId} />}

        {activeTab === 'members' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[var(--bg-card)] text-[var(--text-primary)] shadow-lg rounded-2xl p-6 border border-[var(--border)]">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--primary)]" />
                Case Members
              </h3>
              
              {members.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] text-sm">
                  No members assigned to this case yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-xs font-semibold uppercase text-[var(--text-muted)] tracking-wider">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Added Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {members.map((m, idx) => (
                        <tr key={idx} className="hover:bg-[var(--bg-card)]/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{m.email}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-[var(--primary)]/30 text-[var(--primary)] border border-[var(--primary)]/50">
                              {m.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[var(--text-secondary)] text-xs">
                            {m.addedAt ? new Date(m.addedAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {isCaseActive && (
              <div className="bg-[var(--bg-card)] shadow-lg rounded-2xl p-6 border border-[var(--border)] h-fit">
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">Add Member</h4>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Email / User ID</label>
                    <input
                      type="text"
                      required
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="user@crimenet.gov"
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">Case Role</label>
                    <select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="investigator">Investigator</option>
                      <option value="analyst">Analyst</option>
                      <option value="viewer">Viewer (Read-Only)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={isAddingMember}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--text-primary)] font-bold text-sm rounded-xl hover:bg-[var(--primary)] transition-colors shadow-lg disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {isAddingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {notes.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] rounded-2xl text-[var(--text-secondary)] text-sm">
                  No notes have been added to this case yet.
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.noteId} className={`p-5 rounded-2xl border ${note.isPinned ? 'bg-amber-900/10 border-amber-800/30' : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)]'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--text-primary)] flex items-center justify-center font-bold text-xs uppercase">
                          {note.authorName ? note.authorName.charAt(0) : note.authorEmail.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[var(--text-primary)]">{note.authorName || note.authorEmail}</div>
                          <div className="text-[10px] text-[var(--text-secondary)]">{note.createdAt ? new Date(note.createdAt).toLocaleString() : ''}</div>
                        </div>
                      </div>
                      {note.isPinned && (
                        <span className="text-[10px] font-bold uppercase bg-[var(--warning)]/30 text-[var(--warning)] px-2 py-1 rounded border border-[var(--warning)]/50">Pinned</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap ml-11">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {isCaseActive && (
              <div className="bg-[var(--bg-card)] shadow-lg rounded-2xl p-6 border border-[var(--border)] h-fit sticky top-6">
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">Add Case Note</h4>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <textarea
                    required
                    rows={5}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Type your investigation notes, observations, or updates here..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 resize-none transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isAddingNote}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-[var(--text-primary)] font-bold text-sm rounded-xl hover:bg-[var(--primary)] transition-colors shadow-lg disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isAddingNote ? 'Saving...' : 'Post Note'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};


