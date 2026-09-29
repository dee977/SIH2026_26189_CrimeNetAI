import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  Search, 
  Bell, 
  LogOut, 
  Shield, 
  Briefcase, 
  Radio, 
  User, 
  AlertTriangle,
  Globe,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { UserRole } from '../../types/auth';

export const TopNav: React.FC = () => {
  const { 
    currentView, 
    setView, 
    setGlobalSearchQuery, 
    selectedCaseId,
    selectCase
  } = useNavigationStore();

  const { user, logout, switchRole, triggerSessionExpiry } = useAuthStore();
  const { unreadAlertCount, isNotificationDropdownOpen, toggleNotificationDropdown } = useNotificationStore();

  const [searchInput, setSearchInput] = useState('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setGlobalSearchQuery(searchInput.trim());
      setView('search');
    }
  };



  return (
    <header className="h-16 bg-[var(--bg-primary)] border-b border-[var(--border)] px-6 flex items-center justify-between z-30 shrink-0 select-none">
      
      {/* Left: Global Search Quick Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Global search persons, phones, bank accounts, vehicles, FIRs, evidence, aliases..."
            className="w-full bg-white border border-[var(--border)] focus:border-[var(--primary)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-primary)] placeholder-slate-400 focus:outline-none transition-all focus:ring-1 focus:ring-[var(--primary)] shadow-sm"
          />
          <span className="hidden sm:inline absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[var(--text-secondary)] border border-[var(--border)] bg-slate-50 rounded px-1.5 py-0.5">
            ENTER
          </span>
        </form>

        {/* Active Case Selector */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[var(--border)] text-xs text-[var(--text-primary)] shadow-sm">
          <Briefcase className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span className="text-[11px] text-[var(--text-secondary)]">Case:</span>
          <select
            value={selectedCaseId || 'CASE-2025-M3-DATASET'}
            onChange={(e) => selectCase(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[var(--primary)] focus:outline-none cursor-pointer"
          >
            <option value="CASE-2025-M3-DATASET" className="bg-white text-[var(--text-primary)]">
              CASE-2025-M3-DATASET (Falcon Web - National Dataset)
            </option>
            <option value="CASE-VIDEO-001" className="bg-white text-[var(--text-primary)]">
              CASE-VIDEO-001 (Golden Fleece - Financial)
            </option>
            <option value="CASE-VIDEO-002" className="bg-white text-[var(--text-primary)]">
              CASE-VIDEO-002 (White Dust - Narcotics)
            </option>
            <option value="CASE-VIDEO-003" className="bg-white text-[var(--text-primary)]">
              CASE-VIDEO-003 (Phishnet - Cyber Fraud)
            </option>
            <option value="CASE-VIDEO-004" className="bg-white text-[var(--text-primary)]">
              CASE-VIDEO-004 (Iron Shield - Human Trafficking)
            </option>
          </select>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={toggleNotificationDropdown}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors relative shadow-sm"
            title="System Alerts & Cross-Verification Logs"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--danger)] text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[var(--border)] shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] mb-2">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Investigative Alerts (0)</span>
                <button
                  onClick={() => {
                    setView('alerts');
                    toggleNotificationDropdown();
                  }}
                  className="text-[11px] text-[var(--primary)] hover:underline font-mono"
                >
                  View All Feed ↗
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                <div className="text-xs text-[var(--text-secondary)] text-center py-4">No active alerts</div>
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher & Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-700/80 text-[var(--text-primary)] transition-all shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-cyan-400">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">
                <span>{user?.name || user?.email?.split('@')[0] || 'Officer'}</span>
              </div>
              <div className="text-[10px] font-mono flex items-center gap-1">
                <span className="text-slate-400">Logged in as:</span>
                <span className={`font-bold px-1.5 py-0.2 rounded text-[9px] uppercase ${
                  (user?.grantedRole || 'INVESTIGATOR') === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                  (user?.grantedRole || 'INVESTIGATOR') === 'INVESTIGATOR' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                  (user?.grantedRole || 'INVESTIGATOR') === 'ANALYST' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {user?.grantedRole || 'INVESTIGATOR'}
                </span>
              </div>
            </div>
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <div className="pb-3 border-b border-slate-800">
                <p className="font-bold text-white text-sm">{user?.name || 'Officer'}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{user?.email}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">Statutory Role:</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    (user?.grantedRole || 'INVESTIGATOR') === 'ADMIN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                    (user?.grantedRole || 'INVESTIGATOR') === 'INVESTIGATOR' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                    (user?.grantedRole || 'INVESTIGATOR') === 'ANALYST' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                    'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {user?.grantedRole || 'INVESTIGATOR'}
                  </span>
                </div>
              </div>

              <div className="py-2 border-b border-slate-800 space-y-1">
                <div className="text-[10px] font-mono text-slate-400">Badge: {user?.officerId || 'LEO-7729'}</div>
                <div className="text-[10px] font-mono text-slate-400">Unit: {user?.organization || 'CrimeNet State Bureau'}</div>
              </div>

              <div className="pt-2 space-y-1">
                <button
                  onClick={() => {
                    setIsRoleDropdownOpen(false);
                    triggerSessionExpiry();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-amber-950/30 flex items-center gap-2 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Simulate Session Expiry</span>
                </button>
                
                <button
                  onClick={() => {
                    setIsRoleDropdownOpen(false);
                    logout();
                    setView('login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Session</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
