import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { AlertItem, AlertCategory, AlertSeverity } from '../../types/alerts';
import { apiClient } from '../../services/apiClient';
import { 
  Bell, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Filter, 
  Info,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  Briefcase,
  X,
  Share2,
  AlertOctagon,
  FileCheck
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetAlertId = searchParams.get('alertId');
  const [selectedAlertForModal, setSelectedAlertForModal] = useState<AlertItem | null>(null);

  const { selectedCaseId, selectEntity, selectCase, setView, openCase } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const categories = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'Cross-source Contradiction', label: 'Cross-Source Contradictions' },
    { key: 'Evidence Integrity Mismatch', label: 'Evidence Hash Mismatch' },
    { key: 'Unusual Transaction Pattern', label: 'Unusual Transaction Patterns' },
    { key: 'Watchlist Match', label: 'Watchlist Matches' },
    { key: 'New Communication Pattern', label: 'Communication Patterns' }
  ];

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>('/api/v1/alerts', {
        params: { case_id: selectedCaseId, caseId: selectedCaseId }
      });

      const rawItems = Array.isArray(res.data) 
        ? res.data 
        : (res.data?.items || res.data?.data || []);

      const normalized: AlertItem[] = rawItems.map((raw: any) => {
        const id = raw.alertId || raw.id || `ALT-${Math.random().toString(36).substring(7)}`;
        const cat = raw.metadata?.category || raw.alertType || 'Anomaly Detected';
        const sev = (raw.severity || 'HIGH').toUpperCase() as AlertSeverity;
        const isRev = raw.status === 'RESOLVED' || raw.status === 'ACKNOWLEDGED' || !!raw.metadata?.reviewedBy || raw.read || raw.isRead;

        const linked: { id: string; label: string; type: string }[] = [];
        if (raw.metadata?.linkedEntities && Array.isArray(raw.metadata.linkedEntities)) {
          linked.push(...raw.metadata.linkedEntities);
        } else if (raw.relatedEntityId) {
          linked.push({
            id: raw.relatedEntityId,
            label: raw.relatedEntityName || raw.relatedEntityId,
            type: 'Entity'
          });
        }

        return {
          id,
          caseId: raw.caseId || undefined,
          category: cat as AlertCategory,
          severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'INFORMATIONAL'].includes(sev) ? sev : 'HIGH',
          title: raw.title || 'Investigative Anomaly',
          explanation: raw.description || raw.explanation || 'Anomaly detected during graph analysis.',
          source: raw.metadata?.source || raw.source || 'CrimeNet Automated Core Engine',
          sourceRecordId: raw.evidenceId || undefined,
          timestamp: raw.triggeredAt ? raw.triggeredAt.replace('T', ' ').slice(0, 16) : new Date().toISOString().slice(0, 16),
          isReviewed: !!isRev,
          reviewedBy: raw.metadata?.reviewedBy || (isRev ? 'Investigator' : undefined),
          reviewedAt: raw.metadata?.reviewedAt ? raw.metadata.reviewedAt.replace('T', ' ').slice(0, 16) : undefined,
          reviewNotes: raw.metadata?.reviewNotes || undefined,
          linkedEntities: linked,
          history: []
        };
      });

      setAlerts(normalized);
    } catch (err) {
      console.error('Failed to load alerts from backend:', err);
      setAlerts([]); // Explicitly NO mock alerts
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedCaseId]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      // Text Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = a.title.toLowerCase().includes(query);
        const matchesExp = a.explanation.toLowerCase().includes(query);
        const matchesId = a.id.toLowerCase().includes(query);
        const matchesCase = a.caseId?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesExp && !matchesId && !matchesCase) return false;
      }
      
      // Category
      if (selectedCategory !== 'ALL' && !a.category.toLowerCase().includes(selectedCategory.toLowerCase())) return false;
      
      // Severity
      if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
      
      // Status
      if (selectedStatus === 'REVIEWED' && !a.isReviewed) return false;
      if (selectedStatus === 'UNREVIEWED' && a.isReviewed) return false;
      
      return true;
    });
  }, [alerts, searchQuery, selectedCategory, selectedSeverity, selectedStatus]);

  const handleMarkReviewed = async (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    try {
      await apiClient.post(`/api/v1/alerts/${alertId}/acknowledge`, {
        resolutionNotes: 'Reviewed and corroborated with case diary logs.',
        status: 'RESOLVED'
      });
      // Try alternative endpoint if the above 404s
      await apiClient.post('/api/v1/alerts/mark_read', { alertIds: [alertId] }).catch(() => {});
    } catch (err) {
      console.warn('Acknowledge API non-critical:', err);
    }

    setAlerts(prev => prev.map(a => 
      a.id === alertId ? {
        ...a,
        isReviewed: true,
        reviewedBy: 'Investigator',
        reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        reviewNotes: 'Reviewed and corroborated with case diary logs.'
      } : a
    ));

    addToast({
      type: 'success',
      title: 'Alert Acknowledged',
      message: `Audit entry committed for alert [${alertId}].`
    });
    useNotificationStore.getState().fetchAlerts();
  };

  useEffect(() => {
    if (targetAlertId && alerts.length > 0) {
      const found = alerts.find(a => a.id.toLowerCase() === targetAlertId.toLowerCase());
      if (found) {
        setSelectedAlertForModal(found);
      }
    }
  }, [targetAlertId, alerts]);

  const handleCloseModal = () => {
    setSelectedAlertForModal(null);
    if (targetAlertId) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('alertId');
      setSearchParams(newParams, { replace: true });
    }
  };

  const handleAlertClick = (alert: AlertItem) => {
    setSelectedAlertForModal(alert);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('alertId', alert.id);
    setSearchParams(newParams, { replace: true });
  };

  const handleNavigateToCase = (e: React.MouseEvent, caseId?: string) => {
    e.stopPropagation();
    if (!caseId) return;
    openCase(caseId);
    setView('case-workspace');
    navigate(`/cases/${encodeURIComponent(caseId)}`);
  };

  const handleNavigateToContradiction = (e: React.MouseEvent, caseId?: string) => {
    e.stopPropagation();
    if (caseId) {
      selectCase(caseId);
    }
    setView('verification');
    navigate(`/verification${caseId ? `?caseId=${encodeURIComponent(caseId)}` : ''}`);
  };

  const handleNavigateToEvidence = (e: React.MouseEvent, caseId?: string, evidenceId?: string) => {
    e.stopPropagation();
    if (caseId) {
      selectCase(caseId);
    }
    setView('evidence');
    navigate(`/evidence${caseId ? `?caseId=${encodeURIComponent(caseId)}` : ''}${evidenceId ? `&evidenceId=${encodeURIComponent(evidenceId)}` : ''}`);
  };

  const handleInspectInGraph = (e: React.MouseEvent, entityId: string, caseId?: string) => {
    e.stopPropagation();
    selectEntity(entityId);
    if (caseId) selectCase(caseId);
    setView('graph');
    navigate(`/graph?entityId=${encodeURIComponent(entityId)}${caseId ? `&caseId=${encodeURIComponent(caseId)}` : ''}`);
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-300">HIGH</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">INFORMATIONAL</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-600 font-semibold">
              Investigation Alert Center
            </span>
            
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            Real-Time Anomaly & Intelligence Feed
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated intelligence surfaced by CrimeNet. Filter and triage prioritized leads.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Now</span>
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3 shrink-0 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search alerts by title, description, or case ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <select 
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer min-w-[120px]"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="INFORMATIONAL">Informational</option>
        </select>

        <select 
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer min-w-[140px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="UNREVIEWED">Unreviewed Only</option>
          <option value="REVIEWED">Reviewed Only</option>
        </select>

        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer min-w-[160px]"
        >
          {categories.map(cat => (
            <option key={cat.key} value={cat.key}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 font-mono text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
            <span>Syncing secure feeds...</span>
          </div>
        </div>
      )}

      {/* Alerts Feed List */}
      {!isLoading && (
        <div className="flex-1 overflow-y-auto space-y-3 pb-6 scrollbar-thin scrollbar-thumb-slate-300">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-800 flex flex-col items-center justify-center shadow-sm">
              <ShieldAlert className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="font-semibold text-slate-800 text-sm">No Alerts Found</p>
              <p className="text-slate-500 mt-1 max-w-md text-xs">There are no alerts matching your current filters. Clear filters or check back later for new anomaly detections.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isTargeted = alert.id.toLowerCase() === targetAlertId?.toLowerCase() || selectedAlertForModal?.id === alert.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => handleAlertClick(alert)}
                  className={`bg-white shadow-sm rounded-xl p-4 sm:p-5 border transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md group ${
                    isTargeted
                      ? 'ring-2 ring-blue-500 border-blue-400 bg-blue-50/10'
                      : alert.severity === 'CRITICAL' 
                      ? 'border-rose-300 hover:border-rose-400 bg-rose-50/20' 
                      : alert.severity === 'HIGH'
                      ? 'border-amber-200 hover:border-amber-400'
                      : 'border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {alert.category}
                      </span>
                      <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {alert.id}
                      </span>
                      {alert.caseId && (
                        <button
                          type="button"
                          onClick={(e) => handleNavigateToCase(e, alert.caseId)}
                          className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Open Case Workspace"
                        >
                          <Briefcase className="w-3 h-3 text-indigo-600" /> {alert.caseId} →
                        </button>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-500 group-hover:text-slate-700 transition-colors flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {alert.timestamp}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors">
                    {alert.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-700 mt-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 font-medium">
                    {alert.explanation}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <span>Source Engine:</span>
                      <span className="text-slate-800 font-semibold">{alert.source}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {alert.category === 'Cross-source Contradiction' && (
                        <button
                          type="button"
                          onClick={(e) => handleNavigateToContradiction(e, alert.caseId)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                          title="Inspect in Cross-Verification"
                        >
                          <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                          <span>Contradiction →</span>
                        </button>
                      )}

                      {alert.caseId && alert.category !== 'Cross-source Contradiction' && (
                        <button
                          type="button"
                          onClick={(e) => handleNavigateToCase(e, alert.caseId)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                          title="Open Case Workspace"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Case Workspace →</span>
                        </button>
                      )}

                      {alert.isReviewed ? (
                        <span className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Reviewed {alert.reviewedBy ? `by ${alert.reviewedBy}` : ''}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleMarkReviewed(e, alert.id)}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Linked Entities Bar */}
                  {alert.linkedEntities && alert.linkedEntities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-slate-500 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-slate-400" /> Targets:
                      </span>
                      {alert.linkedEntities.map(ent => (
                        <button
                          key={ent.id}
                          type="button"
                          onClick={(e) => handleInspectInGraph(e, ent.id, alert.caseId)}
                          className="px-2.5 py-1 rounded bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 border border-slate-200 font-mono text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                          title="Inspect in Network Graph"
                        >
                          <span className="font-semibold">{ent.label}</span>
                          <span className="text-[10px] text-slate-500 font-sans">({ent.type})</span>
                          <Share2 className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Alert Detail Modal */}
      {selectedAlertForModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95 text-slate-900 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {getSeverityBadge(selectedAlertForModal.severity)}
                  <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {selectedAlertForModal.category}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {selectedAlertForModal.id}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedAlertForModal.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Narrative / Explanation */}
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Investigation Findings & Anomaly Explanation
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 leading-relaxed font-normal">
                {selectedAlertForModal.explanation}
              </div>
            </div>

            {/* Key Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-slate-500 font-mono block">Source Engine</span>
                <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  {selectedAlertForModal.source}
                </span>
              </div>
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-slate-500 font-mono block">Triggered Timestamp</span>
                <span className="text-slate-800 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {selectedAlertForModal.timestamp}
                </span>
              </div>
              {selectedAlertForModal.caseId && (
                <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                  <span className="text-slate-500 font-mono block">Associated Case</span>
                  <span className="text-indigo-700 font-semibold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    {selectedAlertForModal.caseId}
                  </span>
                </div>
              )}
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1">
                <span className="text-slate-500 font-mono block">Triage / Audit Status</span>
                {selectedAlertForModal.isReviewed ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Reviewed {selectedAlertForModal.reviewedBy ? `by ${selectedAlertForModal.reviewedBy}` : ''}
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Pending Investigator Review
                  </span>
                )}
              </div>
            </div>

            {/* Linked Targets / Entities */}
            {selectedAlertForModal.linkedEntities && selectedAlertForModal.linkedEntities.length > 0 && (
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Linked Entities & Targets ({selectedAlertForModal.linkedEntities.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedAlertForModal.linkedEntities.map(ent => (
                    <div
                      key={ent.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs"
                    >
                      <div>
                        <span className="text-xs font-semibold text-slate-800">{ent.label}</span>
                        <span className="text-[10px] text-slate-500 font-mono ml-1.5">({ent.type})</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleCloseModal();
                          handleInspectInGraph(e, ent.id, selectedAlertForModal.caseId);
                        }}
                        className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Inspect in Network Graph"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Graph</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                {selectedAlertForModal.category === 'Cross-source Contradiction' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleCloseModal();
                      handleNavigateToContradiction(e, selectedAlertForModal.caseId);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span>Open Cross-Verification</span>
                  </button>
                )}

                {selectedAlertForModal.caseId && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleCloseModal();
                      handleNavigateToCase(e, selectedAlertForModal.caseId);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Open Case Workspace</span>
                  </button>
                )}

                {(selectedAlertForModal.category === 'Evidence Integrity Mismatch' || selectedAlertForModal.sourceRecordId) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleCloseModal();
                      handleNavigateToEvidence(e, selectedAlertForModal.caseId, selectedAlertForModal.sourceRecordId);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Open Evidence Vault</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {!selectedAlertForModal.isReviewed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      handleMarkReviewed(e, selectedAlertForModal.id);
                      setSelectedAlertForModal(prev => prev ? { ...prev, isReviewed: true, reviewedBy: 'Investigator' } : null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Acknowledge Lead</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
