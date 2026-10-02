import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useCaseStore } from '../../store/caseStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Briefcase, Plus, Calendar, User, Shield, ExternalLink, 
  Clock, X, Database, Users, Search, Filter, SlidersHorizontal, 
  Archive, CheckSquare, AlertTriangle, FileText, CheckCircle2,
  ListFilter
} from 'lucide-react';

export const CaseManagementView: React.FC = () => {
  const { openCase } = useNavigationStore();
  const navigate = useNavigate();
  const { addToast } = useNotificationStore();
  const { cases, isLoading, fetchCases, createCase, addMember, closeCase, archiveCase } = useCaseStore();
  const { user } = useAuthStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // Filters and Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'priority', 'title'

  // Dashboard Stats
  const totalCases = cases.length;
  const activeCases = cases.filter(c => c.status?.toLowerCase() === 'active').length;
  const highPriorityCases = cases.filter(c => ['high', 'critical'].includes(c.priority?.toLowerCase() || '')).length;
  const closedArchivedCases = cases.filter(c => ['closed', 'archived'].includes(c.status?.toLowerCase() || '')).length;

  // Filter & Sort Logic
  const filteredAndSortedCases = useMemo(() => {
    let result = cases.filter(c => {
      const searchMatch = !searchTerm || [c.caseNumber, c.title, c.jurisdiction, c.policeStation, c.assignedInvestigator]
        .some(val => val?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const statusMatch = !filterStatus || c.status?.toLowerCase() === filterStatus.toLowerCase();
      const priorityMatch = !filterPriority || c.priority?.toLowerCase() === filterPriority.toLowerCase();
      const typeMatch = !filterType || c.caseType?.toLowerCase() === filterType.toLowerCase();

      return searchMatch && statusMatch && priorityMatch && typeMatch;
    });

    result.sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'priority') {
        const priorities: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        const pA = priorities[a.priority?.toLowerCase() || ''] || 0;
        const pB = priorities[b.priority?.toLowerCase() || ''] || 0;
        return pB - pA;
      }
      return 0;
    });

    return result;
  }, [cases, searchTerm, filterStatus, filterPriority, filterType, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterPriority('');
    setFilterType('');
    setSortBy('recent');
  };

  const handleClose = async (caseId: string) => {
    try {
      if (closeCase) {
        await closeCase(caseId, 'Closed via Case Management Dashboard');
        addToast({ type: 'success', title: 'Case Closed', message: 'Case successfully closed.' });
        fetchCases();
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message || 'Failed to close case.' });
    }
  };

  const handleArchive = async (caseId: string) => {
    try {
      if (archiveCase) {
        await archiveCase(caseId);
        addToast({ type: 'success', title: 'Case Archived', message: 'Case successfully archived.' });
        fetchCases();
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Error', message: e.message || 'Failed to archive case.' });
    }
  };

  // New Case State
  const [newTitle, setNewTitle] = useState('');
  const [newCaseNumber, setNewCaseNumber] = useState('');
  const [newCaseType, setNewCaseType] = useState('Financial Crime');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('High');
  const [newStatus, setNewStatus] = useState('Active');
  const [newJurisdiction, setNewJurisdiction] = useState('');
  const [newStation, setNewStation] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newLeadInvestigator, setNewLeadInvestigator] = useState('');
  const [newAdditionalInvestigators, setNewAdditionalInvestigators] = useState('');
  const [newAnalysts, setNewAnalysts] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCaseType.trim() || !newPriority.trim() || !newJurisdiction.trim() || !newStatus.trim()) {
      addToast({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields.' });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const createdCase = await createCase({
        title: newTitle.trim(),
        caseNumber: newCaseNumber.trim() || undefined,
        description: newDesc.trim(),
        policeStation: newStation.trim(),
        jurisdiction: newJurisdiction.trim(),
        assignedTeam: newTeam.trim(),
        priority: newPriority.toLowerCase(),
        caseType: newCaseType.trim(),
        status: newStatus.toLowerCase(),
      });

      if (createdCase) {
        // Add memberships
        if (user?.email) {
          await addMember(createdCase.caseId, user.email, 'OWNER');
        }
        if (newLeadInvestigator.trim()) {
          await addMember(createdCase.caseId, newLeadInvestigator.trim(), 'LEAD');
        }
        
        const additionalInvs = newAdditionalInvestigators.split(',').map(e => e.trim()).filter(Boolean);
        for (const email of additionalInvs) {
          await addMember(createdCase.caseId, email, 'INVESTIGATOR');
        }
        
        const analysts = newAnalysts.split(',').map(e => e.trim()).filter(Boolean);
        for (const email of analysts) {
          await addMember(createdCase.caseId, email, 'ANALYST');
        }

        setIsCreateModalOpen(false);
        // Reset state
        setNewTitle('');
        setNewCaseNumber('');
        setNewDesc('');
        setNewStation('');
        setNewJurisdiction('');
        setNewTeam('');
        setNewLeadInvestigator('');
        setNewAdditionalInvestigators('');
        setNewAnalysts('');
        setNewCaseType('Financial Crime');
        setNewPriority('High');
        setNewStatus('Active');
        
        addToast({
          type: 'success',
          title: 'Case Created',
          message: `${createdCase.caseNumber} has been created.`
        });

        openCase(createdCase.caseId);
        navigate('/cases/' + createdCase.caseId);
      } else {
        addToast({
          type: 'error',
          title: 'Creation Failed',
          message: 'Failed to create case.'
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'An error occurred while creating the case.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'active': return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
      case 'closed': return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
      case 'archived': return 'text-slate-600 bg-slate-500/10 border-slate-500/20';
      default: return 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'critical': return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
      case 'high': return 'text-orange-600 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
      case 'low': return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-600 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title & Action */}
      <div className="bg-[var(--bg-card)] shadow-sm rounded-2xl p-6 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--primary)]">
              <Briefcase className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Case Management
            </h1>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl mt-2">
            Manage investigation dossiers, review analytics, and collaborate with your team.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 font-bold text-sm uppercase tracking-wider transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Case</span>
        </button>
      </div>

      {/* Header Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[ 
          { label: 'Total Cases', value: totalCases, icon: Database, color: 'text-[var(--primary)]', bg: 'bg-blue-500/10' },
          { label: 'Active Cases', value: activeCases, icon: Clock, color: 'text-[var(--success)]', bg: 'bg-emerald-500/10' },
          { label: 'High Priority', value: highPriorityCases, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Closed / Archived', value: closedArchivedCases, icon: Archive, color: 'text-[var(--text-muted)]', bg: 'bg-slate-500/10' }
        ].map((metric, idx) => (
          <div key={idx} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg \${metric.bg} \${metric.color}`}>
              <metric.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">{metric.label}</p>
              <h4 className="text-xl font-bold text-slate-900">{metric.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input 
            type="text" 
            placeholder="Search by Case Number, Title, Jurisdiction..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)] transition-all"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="under investigation">Under Investigation</option>
            <option value="on hold">On Hold</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>

          <select 
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="recent">Sort by: Recent</option>
            <option value="priority">Sort by: Priority</option>
            <option value="title">Sort by: Title</option>
          </select>

          <button 
            onClick={clearFilters}
            className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-slate-600 hover:text-slate-900 hover:border-[var(--text-secondary)] transition-colors"
            title="Clear Filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((skeleton) => (
            <div key={skeleton} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 h-[320px] animate-pulse flex flex-col">
              <div className="flex justify-between mb-4">
                <div className="h-6 w-24 bg-[var(--bg-primary)] rounded"></div>
                <div className="h-6 w-16 bg-[var(--bg-primary)] rounded-full"></div>
              </div>
              <div className="h-6 w-3/4 bg-[var(--bg-primary)] rounded mb-2"></div>
              <div className="h-4 w-full bg-[var(--bg-primary)] rounded mb-4"></div>
              <div className="space-y-2 mb-6">
                <div className="h-4 w-1/2 bg-[var(--bg-primary)] rounded"></div>
                <div className="h-4 w-2/3 bg-[var(--bg-primary)] rounded"></div>
              </div>
              <div className="mt-auto grid grid-cols-3 gap-2">
                <div className="h-10 bg-[var(--bg-primary)] rounded"></div>
                <div className="h-10 bg-[var(--bg-primary)] rounded"></div>
                <div className="h-10 bg-[var(--bg-primary)] rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <Database className="w-16 h-16 text-slate-600 mb-6 opacity-40" />
          <h3 className="text-xl font-bold text-slate-900 mb-3">No cases have been created yet</h3>
          <p className="text-base text-slate-600 max-w-md mb-8">
            Get started by initializing a new investigation dossier. It will appear here once created.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary)] text-white hover:opacity-90 font-bold text-sm uppercase tracking-wider transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Create First Case</span>
          </button>
        </div>
      ) : filteredAndSortedCases.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <ListFilter className="w-12 h-12 text-slate-600 mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No matching cases</h3>
          <p className="text-sm text-slate-600">
            Try adjusting your search or filters to find what you're looking for.
          </p>
          <button 
            onClick={clearFilters}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-slate-900 hover:border-[var(--text-secondary)] text-sm font-medium transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCases.map(c => (
            <div
              key={c.caseId}
              className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl p-6 hover:shadow-md transition-all flex flex-col h-full group"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-mono font-bold text-[var(--primary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-md border border-[var(--border)]">
                    {c.caseNumber}
                  </span>
                  <div className="flex gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border \${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border \${getPriorityColor(c.priority)}`}>
                      {c.priority}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-4 leading-tight group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                  {c.title}
                </h3>
                <p className="text-sm text-slate-600 mt-2 font-medium">
                  {c.caseType}
                </p>
                
                {/* Case Details */}
                <div className="mt-5 space-y-2.5 text-xs text-slate-600 bg-[var(--bg-primary)] p-3 rounded-lg border border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-600" />
                    <span className="truncate"><strong className="text-slate-900 font-semibold">Jurisdiction:</strong> {c.jurisdiction || 'N/A'} - {c.policeStation || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span className="truncate"><strong className="text-slate-900 font-semibold">Lead:</strong> {c.assignedInvestigator || 'Unassigned'}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-[var(--warning)]" />
                      <span className="font-medium">{c.teamCount || 0} Members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      <span className="font-medium">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Ribbon */}
              <div className="grid grid-cols-6 gap-1 p-2 mt-5 rounded-lg bg-slate-100 border border-slate-200 text-center font-mono text-slate-800">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-600 font-semibold mb-0.5">ENT</span>
                  <span className="text-xs font-bold text-slate-900">{c.entityCount || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-600 font-semibold mb-0.5">REL</span>
                  <span className="text-xs font-bold text-slate-900">{c.relationshipCount || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-600 font-semibold mb-0.5">EVD</span>
                  <span className="text-xs font-bold text-slate-900">{c.evidenceCount || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-600 font-semibold mb-0.5">DOC</span>
                  <span className="text-xs font-bold text-slate-900">{c.importCount || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-600 font-semibold mb-0.5">ALR</span>
                  <span className="text-xs font-bold text-slate-900">{c.alertCount || 0}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-600 font-semibold mb-0.5">NOT</span>
                  <span className="text-xs font-bold text-slate-900">{c.noteCount || 0}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 grid grid-cols-1 gap-2">
                <button
                  onClick={() => { openCase(c.caseId); navigate('/cases/' + c.caseId); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white font-bold text-sm uppercase tracking-wider transition-opacity hover:opacity-90"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Enter Workspace</span>
                </button>
                <div className="flex gap-2">
                  {c.status?.toLowerCase() !== 'closed' && c.status?.toLowerCase() !== 'archived' && (
                    <button
                      onClick={() => handleClose(c.caseId)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm font-semibold text-slate-600 hover:text-[var(--danger)] hover:border-rose-200 transition-colors"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Close</span>
                    </button>
                  )}
                  {c.status?.toLowerCase() !== 'archived' && (
                    <button
                      onClick={() => handleArchive(c.caseId)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm font-semibold text-slate-600 hover:text-[var(--text-muted)] hover:border-slate-300 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Archive</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CASE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 max-w-xl w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-5">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--primary)]" />
                Initialize New Case
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-600 hover:text-slate-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Case Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operation Blue Tide"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Case Number
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={newCaseNumber}
                    onChange={(e) => setNewCaseNumber(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Description / Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe the objective or initial facts of this case..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)] transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-1.5">
                    Case Type *
                  </label>
                  <select
                    required
                    value={newCaseType}
                    onChange={(e) => setNewCaseType(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)] font-medium"
                  >
                    <option value="Financial Crime">Financial Crime</option>
                    <option value="Cyber Crime">Cyber Crime</option>
                    <option value="Organized Crime">Organized Crime</option>
                    <option value="Fraud">Fraud</option>
                    <option value="Narcotics">Narcotics</option>
                    <option value="Human Trafficking">Human Trafficking</option>
                    <option value="Theft">Theft</option>
                    <option value="Violent Crime">Violent Crime</option>
                    <option value="Extortion">Extortion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-1.5">
                    Priority Level *
                  </label>
                  <select
                    required
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)] font-medium"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-1.5">
                    Status *
                  </label>
                  <select
                    required
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)] font-medium"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--primary)] mb-1.5">
                    Jurisdiction *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. National Cyber Crime Zone"
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Police Station
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cyber Cell HQ"
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Assigned Team
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special Task Force Alpha"
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Lead Investigator Email
                  </label>
                  <input
                    type="email"
                    placeholder="lead@police.gov"
                    value={newLeadInvestigator}
                    onChange={(e) => setNewLeadInvestigator(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Additional Investigators (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="inv1@police.gov, inv2@police.gov"
                  value={newAdditionalInvestigators}
                  onChange={(e) => setNewAdditionalInvestigators(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Analysts (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="ana1@police.gov, ana2@police.gov"
                  value={newAnalysts}
                  onChange={(e) => setNewAnalysts(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 mt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] hover:bg-slate-200 text-slate-900 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Case</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};



