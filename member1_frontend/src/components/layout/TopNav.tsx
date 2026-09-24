import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { SYNTHETIC_ALERTS } from '../../data/syntheticData';
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
    isBackendConnected, 
    toggleBackendConnection,
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

  const handleRoleChange = (role: UserRole) => {
    switchRole(role);
    setIsRoleDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-[#0a101f]/90 backdrop-blur-md border-b border-slate-800/80 px-6 flex items-center justify-between z-30 shrink-0 select-none">
      
      {/* Left: Global Search Quick Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Global search persons, phones, bank accounts, vehicles, FIRs, evidence, aliases..."
            className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500/60 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none transition-all focus:ring-1 focus:ring-cyan-500/40"
          />
          <span className="hidden sm:inline absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 border border-slate-800 rounded px-1.5 py-0.5">
            ENTER
          </span>
        </form>

        {/* Active Case Selector */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-300">
          <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-slate-400">Case:</span>
          <select
            value={selectedCaseId || 'CASE-2024-MH-092'}
            onChange={(e) => selectCase(e.target.value)}
            className="bg-transparent text-xs font-semibold text-cyan-300 focus:outline-none cursor-pointer"
          >
            <option value="CASE-2024-MH-092" className="bg-slate-900 text-slate-200">
              CASE-2024-MH-092 (Op. Blue Tide)
            </option>
            <option value="CASE-2024-GJ-041" className="bg-slate-900 text-slate-200">
              CASE-2024-GJ-041 (Surat Hawala)
            </option>
          </select>
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        
        {/* Backend / Synthetic Mode Switch */}
        <button
          onClick={toggleBackendConnection}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
            isBackendConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
          }`}
          title="Toggle between live M2 API endpoints and synthetic/demo fallback"
        >
          <Radio className="w-3 h-3 animate-pulse" />
          <span className="hidden md:inline">Mode:</span>
          <span className="font-semibold">{isBackendConnected ? 'LIVE M2' : 'SYNTHETIC DEMO'}</span>
        </button>

        {/* Public Website Links */}
        <div className="hidden md:flex items-center gap-1 border-l border-slate-800 pl-3">
          <button
            onClick={() => setView('landing')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentView === 'landing' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Public Site
          </button>
          <button
            onClick={() => setView('about')}
            className={`px-2.5 py-1 rounded text-xs transition-colors ${
              currentView === 'about' ? 'text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            About
          </button>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={toggleNotificationDropdown}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800 transition-colors relative"
            title="System Alerts & Cross-Verification Logs"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse">
                {unreadAlertCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl glass-panel bg-slate-950/95 border-slate-700 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span className="text-xs font-semibold text-slate-200">Investigative Alerts ({SYNTHETIC_ALERTS.length})</span>
                <button
                  onClick={() => {
                    setView('alerts');
                    toggleNotificationDropdown();
                  }}
                  className="text-[11px] text-cyan-400 hover:underline font-mono"
                >
                  View All Feed →
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {SYNTHETIC_ALERTS.map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => {
                      setView('alerts');
                      toggleNotificationDropdown();
                    }}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className={`font-semibold ${
                        alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {alert.category}
                      </span>
                      <span className="text-slate-400">{alert.timestamp.slice(11, 16)}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-200 leading-snug line-clamp-1">{alert.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alert.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher & Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-semibold text-slate-200 leading-tight">
                {user?.officerId || 'LEO-7729'}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono">
                {user?.grantedRole || 'Senior Investigator'}
              </div>
            </div>
          </button>

          {/* Role Switching Menu (M6 RBAC Simulator) */}
          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl glass-panel bg-slate-950/95 border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400">
                <p className="font-semibold text-slate-200">{user?.name}</p>
                <p className="text-[10px] text-slate-500 font-mono">{user?.organization}</p>
              </div>

              <div className="py-1">
                <p className="px-3 py-1 text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold">
                  Switch Active Role (RBAC Demo)
                </p>
                {(['Senior Investigator', 'Senior Authority', 'System Administrator', 'Investigator', 'Analyst / Viewer'] as UserRole[]).map(role => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      user?.grantedRole === role ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <span>{role}</span>
                    {user?.grantedRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>

              <div className="pt-1 border-t border-slate-800 space-y-1">
                <button
                  onClick={() => {
                    setIsRoleDropdownOpen(false);
                    triggerSessionExpiry();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-amber-400 hover:bg-amber-500/10 flex items-center gap-2 transition-colors"
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
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
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
