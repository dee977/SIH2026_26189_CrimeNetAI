import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { SYNTHETIC_WATCHLIST } from '../../data/syntheticData';
import { WatchlistEntry } from '../../types/alerts';
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
  AlertTriangle
} from 'lucide-react';

export const WatchlistView: React.FC = () => {
  const { setView } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>(SYNTHETIC_WATCHLIST);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Add Entry state
  const [entryType, setEntryType] = useState<'Person' | 'Phone' | 'BankAccount' | 'Alias' | 'Organization'>('Person');
  const [value, setValue] = useState('');
  const [targetName, setTargetName] = useState('');
  const [reason, setReason] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: WatchlistEntry = {
      id: `WL-00${watchlist.length + 1}`,
      entryType,
      value,
      targetName: targetName || value,
      reasonForMonitoring: reason || 'Under active intelligence scrutiny',
      addedByOfficer: 'Inspector Vikramaditya Rao',
      addedAt: new Date().toISOString().replace('T', ' ').slice(0, 10),
      caseReference: 'CASE-2024-MH-092',
      matchCount: 1,
      lastMatchedAt: new Date().toISOString().replace('T', ' ').slice(0, 10),
      status: 'ACTIVE'
    };

    setWatchlist([newEntry, ...watchlist]);
    setIsAddModalOpen(false);
    setValue('');
    setTargetName('');
    setReason('');

    addToast({
      type: 'success',
      title: 'Watchlist Target Added',
      message: `${newEntry.value} enrolled into M3 live surveillance sync.`
    });
  };

  const handleRemove = (id: string) => {
    setWatchlist(watchlist.filter(w => w.id !== id));
    addToast({
      type: 'info',
      title: 'Watchlist Entry Removed',
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
      default: return <Eye className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Live Surveillance Feeds
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              CCTNS & Telecom Stream Matcher
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1">
            Investigative Target Watchlist
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time intercept triggers notifying officers whenever monitored persons, burner SIMs, bank accounts, or aliases appear in incoming filings.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Monitored Target</span>
        </button>
      </div>

      {/* Watchlist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {watchlist.map(item => (
          <div
            key={item.id}
            className="glass-panel rounded-xl p-5 border-slate-800 hover:border-slate-700 transition-colors space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                  {getTypeIcon(item.entryType)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {item.entryType}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{item.id}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-0.5">{item.targetName || item.value}</h3>
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

            <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-mono text-[10px] uppercase block mb-0.5">Surveillance Purpose:</span>
              {item.reasonForMonitoring}
            </p>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
              <div>Logged By: <span className="text-slate-200">{item.addedByOfficer}</span></div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {item.matchCount} Matches Detected
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ADD TARGET MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-950 rounded-2xl border-cyan-500/40 p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-100">Enroll Surveillance Target</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Target Entity Type *
                </label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Person">Person Name</option>
                  <option value="Phone">Phone Number (MSISDN)</option>
                  <option value="BankAccount">Bank Account Number</option>
                  <option value="Alias">Known Alias / Nickname</option>
                  <option value="Organization">Corporate / Shell Organization</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Target Identifier / Value *
                </label>
                <input
                  type="text"
                  required
                  placeholder={entryType === 'Phone' ? '+91-98XXX-XXXXX' : entryType === 'BankAccount' ? '9921-XXXX-XXXX' : 'Name or identifier'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Subject Name / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Associated with Surat Hawala Axis"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                  Investigative Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State factual reasons for tracking this parameter across incoming records."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold uppercase tracking-wider shadow"
                >
                  Enroll Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
