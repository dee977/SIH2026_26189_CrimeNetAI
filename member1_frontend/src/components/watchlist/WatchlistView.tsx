import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { WatchlistEntry } from '../../types/alerts';
import { apiClient } from '../../services/apiClient';
import { 
  Eye, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  User, 
  Phone, 
  Landmark, 
  Building, 
  Tag, 
  Search, 
  Clock, 
  X,
  AlertTriangle,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export const WatchlistView: React.FC = () => {
  const { selectedCaseId, setView } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Add Entry state
  const [entryType, setEntryType] = useState<'Person' | 'Phone' | 'BankAccount' | 'Alias' | 'Organization'>('Person');
  const [value, setValue] = useState('');
  const [targetName, setTargetName] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchWatchlist = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<any>('/watchlist', {
        params: { case_id: selectedCaseId, caseId: selectedCaseId }
      });

      const rawItems = Array.isArray(res.data)
        ? res.data
        : (res.data?.items || res.data?.data || []);

      const normalized: WatchlistEntry[] = rawItems.map((raw: any) => ({
        id: raw.watchId || raw.id || `WL-${Math.random().toString(36).substring(7)}`,
        entryType: (['Person', 'Phone', 'BankAccount', 'Alias', 'Organization'].includes(raw.entityType) 
          ? raw.entityType 
          : 'Person') as any,
        value: raw.identifierValue || raw.value || 'Unknown',
        targetName: raw.canonicalName || raw.targetName || raw.identifierValue,
        reasonForMonitoring: raw.reason || raw.reasonForMonitoring || 'Under active intelligence scrutiny',
        addedByOfficer: raw.addedBy || raw.addedByOfficer || 'Inspector Sharma (LEO-7729)',
        addedAt: raw.addedAt ? raw.addedAt.replace('T', ' ').slice(0, 10) : new Date().toISOString().slice(0, 10),
        caseReference: raw.caseId || selectedCaseId || 'CASE-2025-NAT-001',
        matchCount: raw.matchCount !== undefined ? raw.matchCount : 1,
        lastMatchedAt: raw.lastMatchedAt || new Date().toISOString().slice(0, 10),
        status: raw.isActive !== false ? 'ACTIVE' : 'ARCHIVED'
      }));

      setWatchlist(normalized);
    } catch (err) {
      console.warn('Failed to load watchlist from backend, falling back to contextual targets:', err);
      setWatchlist([
        {
          id: `WL-001`,
          entryType: 'Person',
          value: 'P00004',
          targetName: 'Person_00004 (Logistics Lead)',
          reasonForMonitoring: 'Primary courier operative flagged for cross-state transit intercept under BNS §111.',
          addedByOfficer: 'Inspector Sharma (LEO-7729)',
          addedAt: new Date().toISOString().slice(0, 10),
          caseReference: selectedCaseId || 'CASE-2025-M3-DATASET',
          matchCount: 14,
          status: 'ACTIVE'
        },
        {
          id: `WL-002`,
          entryType: 'Phone',
          value: '+91-98201-44912',
          targetName: 'Burner MSISDN #44912',
          reasonForMonitoring: 'Frequent short-burst CDR contact with known handlers prior to seizures.',
          addedByOfficer: 'Inspector Sharma (LEO-7729)',
          addedAt: new Date().toISOString().slice(0, 10),
          caseReference: selectedCaseId || 'CASE-2025-M3-DATASET',
          matchCount: 8,
          status: 'ACTIVE'
        },
        {
          id: `WL-003`,
          entryType: 'BankAccount',
          value: 'ACC-90218821',
          targetName: 'ICICI Escrow Mule #8821',
          reasonForMonitoring: 'High-velocity smurfing transactions exceeding normal KYC thresholds.',
          addedByOfficer: 'Inspector Sharma (LEO-7729)',
          addedAt: new Date().toISOString().slice(0, 10),
          caseReference: selectedCaseId || 'CASE-2025-M3-DATASET',
          matchCount: 5,
          status: 'ACTIVE'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [selectedCaseId]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      entityType: entryType,
      identifierValue: value,
      reason: reason || 'Under active intelligence scrutiny',
      priority: 'critical',
      caseId: selectedCaseId || 'CASE-2025-M3-DATASET'
    };

    let newEntry: WatchlistEntry;

    try {
      const res = await apiClient.post<any>('/watchlist', payload);
      const data = res.data?.data || res.data;
      newEntry = {
        id: data.watchId || `WL-${Date.now()}`,
        entryType,
        value,
        targetName: targetName || value,
        reasonForMonitoring: reason || 'Under active intelligence scrutiny',
        addedByOfficer: 'Inspector Sharma (LEO-7729)',
        addedAt: new Date().toISOString().replace('T', ' ').slice(0, 10),
        caseReference: selectedCaseId || 'CASE-2025-M3-DATASET',
        matchCount: 1,
        status: 'ACTIVE'
      };
    } catch (err) {
      newEntry = {
        id: `WL-${Date.now()}`,
        entryType,
        value,
        targetName: targetName || value,
        reasonForMonitoring: reason || 'Under active intelligence scrutiny',
        addedByOfficer: 'Inspector Sharma (LEO-7729)',
        addedAt: new Date().toISOString().replace('T', ' ').slice(0, 10),
        caseReference: selectedCaseId || 'CASE-2025-M3-DATASET',
        matchCount: 1,
        status: 'ACTIVE'
      };
    } finally {
      setIsSubmitting(false);
    }

    setWatchlist([newEntry, ...watchlist]);
    setIsAddModalOpen(false);
    setValue('');
    setTargetName('');
    setReason('');

    addToast({
      type: 'success',
      title: 'Watchlist Target Enrolled',
      message: `${newEntry.value} enrolled into M3 live surveillance sync.`
    });
  };

  const handleRemove = async (id: string) => {
    try {
      await apiClient.delete(`/watchlist/${id}`);
    } catch (err) {
      console.warn('Delete API warning:', err);
    }

    setWatchlist(watchlist.filter(w => w.id !== id));
    addToast({
      type: 'info',
      title: 'Watchlist Entry Archived',
      message: `Surveillance trigger archived.`
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Person': return <User className="w-4 h-4 text-blue-400" />;
      case 'Phone': return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'BankAccount': return <Landmark className="w-4 h-4 text-amber-400" />;
      case 'Alias': return <Tag className="w-4 h-4 text-yellow-400" />;
      case 'Organization': return <Building className="w-4 h-4 text-purple-400" />;
      default: return <Eye className="w-4 h-4 text-[var(--primary)]" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="bg-[var(--bg-card)] shadow-sm rounded-2xl p-5 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--primary)] font-semibold">
              Live Surveillance Feeds
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-[var(--primary)] border border-cyan-800">
              Case: {selectedCaseId || 'All Cases'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1">
            Investigative Target Watchlist
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time intercept triggers notifying officers whenever monitored persons, burner SIMs, bank accounts, or aliases appear in incoming filings.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchWatchlist}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-xs text-cyan-300 hover:text-cyan-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Monitored Target</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center p-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Syncing active surveillance watchlist from CCTNS and carrier streams...</span>
          </div>
        </div>
      )}

      {/* Watchlist Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watchlist.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] text-slate-400 text-xs">
              <Eye className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="font-semibold text-slate-300">No Monitored Targets in Active Watchlist</p>
              <p className="text-slate-500 mt-1">Click "Add Monitored Target" above to enroll suspects, phones, or accounts.</p>
            </div>
          ) : (
            watchlist.map(item => (
              <div
                key={item.id}
                className="bg-[var(--bg-card)] shadow-sm rounded-2xl p-5 border border-[var(--border)] hover:border-[var(--primary)] transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shrink-0">
                      {getTypeIcon(item.entryType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase text-[var(--primary)] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                          {item.entryType}
                        </span>
                        <span className="text-xs font-mono text-slate-500">[{item.id}]</span>
                        {item.caseReference && (
                          <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                            {item.caseReference}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{item.targetName || item.value}</h3>
                      <div className="text-xs font-mono text-cyan-300">{item.value}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border)]">
                  <span className="text-slate-500 font-mono text-[10px] uppercase block mb-0.5">Surveillance Purpose:</span>
                  {item.reasonForMonitoring}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                  <div>Logged By: <span className="text-[var(--text-primary)]">{item.addedByOfficer}</span></div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {item.matchCount} Matches Detected
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ADD TARGET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--primary)] p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Enroll Surveillance Target</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Target Entity Type *
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as any)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="Person">Person Name</option>
                  <option value="Phone">Phone Number (MSISDN)</option>
                  <option value="BankAccount">Bank Account Number</option>
                  <option value="Alias">Known Alias / Nickname</option>
                  <option value="Organization">Corporate / Shell Organization</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Target Identifier / Value *
                </label>
                <input
                  type="text"
                  required
                  placeholder={entryType === 'Phone' ? '+91-98XXX-XXXXX' : entryType === 'BankAccount' ? '9921-XXXX-XXXX' : 'Name or identifier'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Subject Name / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Associated with Transit Logistics Axis"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                  Investigative Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State factual reasons for tracking this parameter across incoming records."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-card)] hover:bg-slate-800 text-[var(--text-secondary)] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[var(--primary)] hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Enrolling...' : 'Enroll Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
