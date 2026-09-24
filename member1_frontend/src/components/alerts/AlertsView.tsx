import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { SYNTHETIC_ALERTS } from '../../data/syntheticData';
import { AlertItem, AlertCategory, AlertSeverity } from '../../types/alerts';
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
  ArrowRight
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { selectEntity, setView, selectEvidence } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [alerts, setAlerts] = useState<AlertItem[]>(SYNTHETIC_ALERTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories: { key: string; label: string }[] = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'Cross-source Contradiction', label: 'Cross-Source Contradictions' },
    { key: 'Evidence Integrity Mismatch', label: 'Evidence Hash Mismatch' },
    { key: 'Unusual Transaction Pattern', label: 'Unusual Transaction Patterns' },
    { key: 'Watchlist Match', label: 'Watchlist Matches' }
  ];

  const filteredAlerts = alerts.filter(a => {
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
    return true;
  });

  const handleMarkReviewed = (alertId: string) => {
    setAlerts(alerts.map(a => 
      a.id === alertId ? {
        ...a,
        isReviewed: true,
        reviewedBy: 'Inspector Vikramaditya Rao',
        reviewedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        reviewNotes: 'Reviewed and corroborated with case diary logs.'
      } : a
    ));
    addToast({
      type: 'success',
      title: 'Alert Marked Reviewed',
      message: 'Investigator acknowledgment committed to audit ledger.'
    });
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">HIGH</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">INFORMATIONAL</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            Real-Time Anomaly & Discrepancy Stream
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            Automated Audit Feeds
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 mt-1">
          Investigative Alerts & Anomaly Feed
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Surfaced by M5 Graph ML, M6 Cryptographic Daemons, and M3 Ingestion Pipelines. Alerts reflect verifiable discrepancies without invented reasons.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat.key
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => (
          <div
            key={alert.id}
            className={`glass-panel rounded-2xl p-5 border transition-all ${
              alert.severity === 'CRITICAL' ? 'border-red-500/30' : 'border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                {getSeverityBadge(alert.severity)}
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {alert.category}
                </span>
                <span className="text-xs font-mono text-slate-500">[{alert.id}]</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{alert.timestamp}</span>
            </div>

            <h3 className="text-base font-bold text-slate-100 mt-1">{alert.title}</h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              {alert.explanation}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800">
              <div>Source Engine: <span className="text-slate-200">{alert.source}</span></div>
              
              <div className="flex items-center gap-3">
                {alert.isReviewed ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reviewed by {alert.reviewedBy}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleMarkReviewed(alert.id)}
                    className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-colors"
                  >
                    Acknowledge & Mark Reviewed
                  </button>
                )}
              </div>
            </div>

            {/* Linked Entities Bar */}
            {alert.linkedEntities && alert.linkedEntities.length > 0 && (
              <div className="mt-3 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-slate-500">Target References:</span>
                {alert.linkedEntities.map(ent => (
                  <button
                    key={ent.id}
                    onClick={() => { selectEntity(ent.id); setView('entity'); }}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-850 text-cyan-300 border border-slate-700 font-mono text-[11px] transition-colors"
                  >
                    {ent.label} ({ent.type}) →
                  </button>
                ))}
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
};
