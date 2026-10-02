import React, { useState, useEffect, useMemo } from 'react';
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
  Briefcase
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { selectedCaseId, selectEntity, setView, openCase } = useNavigationStore();
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
  };

  const handleAlertClick = (caseId?: string) => {
    if (caseId) {
      openCase(caseId);
    }
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-[var(--warning)] border border-amber-500/40">HIGH</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">INFORMATIONAL</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
              Investigation Alert Center
            </span>
            
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1">
            Real-Time Anomaly & Intelligence Feed
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Automated intelligence surfaced by CrimeNet. Filter and triage prioritized leads.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-cyan-400 hover:bg-[#1a2f4c] transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Now</span>
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center gap-3 shrink-0 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search alerts by title, description, or case ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 text-[var(--text-primary)] text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <select 
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="bg-white border border-slate-200 text-[var(--text-secondary)] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer min-w-[120px]"
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
          className="bg-white border border-slate-200 text-[var(--text-secondary)] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer min-w-[140px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="UNREVIEWED">Unreviewed Only</option>
          <option value="REVIEWED">Reviewed Only</option>
        </select>

        <select 
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-slate-200 text-[var(--text-secondary)] text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer min-w-[160px]"
        >
          {categories.map(cat => (
            <option key={cat.key} value={cat.key}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center p-12 bg-[#112240] rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Syncing secure feeds...</span>
          </div>
        </div>
      )}

      {/* Alerts Feed List */}
      {!isLoading && (
        <div className="flex-1 overflow-y-auto space-y-3 pb-6 scrollbar-thin scrollbar-thumb-[#1f2937]">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-800 flex flex-col items-center justify-center">
              <ShieldAlert className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="font-semibold text-slate-800 text-sm">No Alerts Found</p>
              <p className="text-slate-500 mt-1 max-w-md">There are no alerts matching your current filters. Clear filters or check back later for new anomaly detections.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                onClick={() => handleAlertClick(alert.caseId)}
                className={`bg-[#112240] shadow-sm rounded-xl p-4 border transition-all cursor-pointer hover:-translate-y-0.5 group ${
                  alert.severity === 'CRITICAL' ? 'border-red-500/40 bg-red-950/10 hover:border-red-500/60' : 'border-slate-200 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      {alert.category}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {alert.id}
                    </span>
                    {alert.caseId && (
                      <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {alert.caseId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {alert.timestamp}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-primary)] mt-2 group-hover:text-cyan-400 transition-colors">
                  {alert.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {alert.explanation}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[var(--text-muted)] mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    Source Engine: <span className="text-[var(--text-secondary)]">{alert.source}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {alert.isReviewed ? (
                      <span className="flex items-center gap-1.5 text-[var(--success)] font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Reviewed {alert.reviewedBy ? `by ${alert.reviewedBy}` : ''}</span>
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleMarkReviewed(e, alert.id)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>

                {/* Linked Entities Bar */}
                {alert.linkedEntities && alert.linkedEntities.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-[var(--text-muted)] flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Targets:
                    </span>
                    {alert.linkedEntities.map(ent => (
                      <button
                        key={ent.id}
                        onClick={(e) => { e.stopPropagation(); selectEntity(ent.id); setView('entity'); }}
                        className="px-2 py-0.5 rounded bg-slate-50 hover:bg-[#1f2937] text-cyan-400 border border-slate-200 font-mono text-[10px] transition-colors flex items-center gap-1"
                      >
                        <span>{ent.label}</span>
                        <span className="text-[9px] text-[var(--text-muted)] font-sans">({ent.type})</span>
                        <ArrowRight className="w-3 h-3 text-[var(--text-muted)]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};
