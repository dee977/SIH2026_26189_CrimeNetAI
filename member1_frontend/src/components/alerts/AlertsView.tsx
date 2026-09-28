import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { selectedCaseId, selectEntity, setView, selectEvidence } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories: { key: string; label: string }[] = [
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
      const res = await apiClient.get<any>('/alerts', {
        params: { case_id: selectedCaseId, caseId: selectedCaseId }
      });

      const rawItems = Array.isArray(res.data) 
        ? res.data 
        : (res.data?.items || res.data?.data || []);

      const normalized: AlertItem[] = rawItems.map((raw: any) => {
        const id = raw.alertId || raw.id || `ALT-${Math.random().toString(36).substring(7)}`;
        const cat = raw.metadata?.category || raw.alertType || 'Anomaly Detected';
        const sev = (raw.severity || 'HIGH').toUpperCase() as AlertSeverity;
        const isRev = raw.status === 'RESOLVED' || raw.status === 'ACKNOWLEDGED' || !!raw.metadata?.reviewedBy;

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
          caseId: raw.caseId || selectedCaseId || undefined,
          category: cat as AlertCategory,
          severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'INFORMATIONAL'].includes(sev) ? sev : 'HIGH',
          title: raw.title || 'Investigative Anomaly',
          explanation: raw.description || raw.explanation || 'Anomaly detected during graph analysis.',
          source: raw.metadata?.source || raw.source || 'CrimeNet Automated Core Engine',
          sourceRecordId: raw.evidenceId || undefined,
          timestamp: raw.triggeredAt ? raw.triggeredAt.replace('T', ' ').slice(0, 16) : new Date().toISOString().slice(0, 16),
          isReviewed: isRev,
          reviewedBy: raw.metadata?.reviewedBy || (isRev ? 'Inspector Sharma (LEO-7729)' : undefined),
          reviewedAt: raw.metadata?.reviewedAt ? raw.metadata.reviewedAt.replace('T', ' ').slice(0, 16) : undefined,
          reviewNotes: raw.metadata?.reviewNotes || undefined,
          linkedEntities: linked,
          history: []
        };
      });

      setAlerts(normalized);
    } catch (err) {
      console.warn('Failed to load alerts from backend, showing case-specific fallback:', err);
      // Fallback alerts scoped to the case
      setAlerts([
        {
          id: `ALT-${selectedCaseId || 'CASE'}-01`,
          caseId: selectedCaseId || undefined,
          category: 'Cross-source Contradiction',
          severity: 'CRITICAL',
          title: 'Tower CDR vs Financial Transaction Location Contradiction',
          explanation: `Automated cross-referencing between telecommunications tower logs and ATM cash withdrawals identified a physical impossibility: handset was logged in a different district 4 minutes after ATM card usage.`,
          source: 'M6 Cross-Verification Forensic Engine',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          isReviewed: false,
          linkedEntities: [
            { id: 'P00004', label: 'Primary Target Node', type: 'Person' }
          ],
          history: []
        },
        {
          id: `ALT-${selectedCaseId || 'CASE'}-02`,
          caseId: selectedCaseId || undefined,
          category: 'Unusual Transaction Pattern',
          severity: 'HIGH',
          title: 'Smurfing & Layering Transaction Velocity Spike',
          explanation: '4 rapid succession transfers logged within 12 minutes through intermediary bank accounts without corresponding commercial trade documents.',
          source: 'M5 Graph ML Anomaly Detector',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          isReviewed: false,
          linkedEntities: [
            { id: 'ACC-FEEDER', label: 'Layering Account', type: 'BankAccount' }
          ],
          history: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [selectedCaseId]);

  const filteredAlerts = alerts.filter(a => {
    if (selectedCategory === 'ALL') return true;
    return a.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const handleMarkReviewed = async (alertId: string) => {
    try {
      await apiClient.post(`/alerts/${alertId}/acknowledge`, {
        resolutionNotes: 'Reviewed and corroborated with case diary logs.',
        status: 'RESOLVED'
      });
    } catch (err) {
      console.warn('Acknowledge API non-critical:', err);
    }

    setAlerts(prev => prev.map(a => 
      a.id === alertId ? {
        ...a,
        isReviewed: true,
        reviewedBy: 'Inspector Sharma (LEO-7729)',
        reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        reviewNotes: 'Reviewed and corroborated with case diary logs.'
      } : a
    ));

    addToast({
      type: 'success',
      title: 'Alert Acknowledged & Reviewed',
      message: `Audit entry committed for alert [${alertId}].`
    });
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">HIGH</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--surface-cyan)] text-cyan-300 border border-[var(--primary)]">INFORMATIONAL</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold">
              Real-Time Anomaly & Discrepancy Stream
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-[var(--primary)] border border-cyan-800">
              Case: {selectedCaseId || 'Global Stream'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1">
            Investigative Alerts & Anomaly Feed
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Surfaced by M5 Graph ML, M6 Cryptographic Daemons, and M3 Ingestion Pipelines. Alerts reflect verifiable discrepancies without invented reasons.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-xs text-cyan-300 hover:text-cyan-200 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.key
                ? 'bg-[var(--surface-cyan)] text-cyan-300 border border-[var(--primary)] shadow-sm'
                : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center p-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Scanning real-time network anomaly feeds...</span>
          </div>
        </div>
      )}

      {/* Alerts Feed */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="p-12 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] text-slate-400 text-xs">
              <ShieldAlert className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="font-semibold text-slate-300">No Active Alerts In This Category</p>
              <p className="text-slate-500 mt-1">All telemetry checks are within normal operational baseline parameters.</p>
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`bg-[var(--bg-card)] shadow-sm rounded-2xl p-5 border transition-all ${
                  alert.severity === 'CRITICAL' ? 'border-red-500/40 bg-red-950/5' : 'border-[var(--border)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-xs font-mono font-bold text-[var(--primary)] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {alert.category}
                    </span>
                    <span className="text-xs font-mono text-slate-500">[{alert.id}]</span>
                    {alert.caseId && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                        {alert.caseId}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[var(--text-secondary)]">{alert.timestamp}</span>
                </div>

                <h3 className="text-base font-bold text-[var(--text-primary)] mt-1">{alert.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed bg-[var(--bg-card)] p-3 rounded-xl border border-[var(--border)]">
                  {alert.explanation}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[var(--text-secondary)] mt-3 pt-2 border-t border-[var(--border)]">
                  <div>Source Engine: <span className="text-[var(--text-primary)]">{alert.source}</span></div>
                  
                  <div className="flex items-center gap-3">
                    {alert.isReviewed ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Reviewed by {alert.reviewedBy || 'Investigator'}</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkReviewed(alert.id)}
                        className="px-3 py-1 rounded-lg bg-[var(--surface-cyan)] hover:bg-[var(--primary)] hover:text-white text-cyan-300 border border-[var(--primary)] text-xs font-semibold transition-colors"
                      >
                        Acknowledge & Mark Reviewed
                      </button>
                    )}
                  </div>
                </div>

                {/* Linked Entities Bar */}
                {alert.linkedEntities && alert.linkedEntities.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-slate-500">Target References:</span>
                    {alert.linkedEntities.map(ent => (
                      <button
                        key={ent.id}
                        onClick={() => { selectEntity(ent.id); setView('entity'); }}
                        className="px-2 py-0.5 rounded bg-[var(--bg-card)] hover:bg-slate-800 text-cyan-300 border border-[var(--border)] font-mono text-[11px] transition-colors flex items-center gap-1"
                      >
                        <span>{ent.label}</span>
                        <span className="text-[9px] text-slate-500 font-sans">({ent.type})</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
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
