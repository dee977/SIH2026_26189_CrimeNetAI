import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationStore } from '../../store/navigationStore';
import { useAuthStore } from '../../store/authStore';
import { useCaseStore } from '../../store/caseStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  Search, 
  Bell, 
  LogOut, 
  Briefcase, 
  User, 
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { searchEntities, fetchEntities } from '../../services/entityService';
import { AnyEntity } from '../../types/entities';

export const TopNav: React.FC = () => {
  const navigate = useNavigate();
  const { 
    setView, 
    setGlobalSearchQuery, 
    globalSearchQuery,
    selectedCaseId,
    selectCase,
    selectEntity,
    isSidebarCollapsed,
    toggleSidebar
  } = useNavigationStore();

  const { user, logout } = useAuthStore();
  const { cases, fetchCases } = useCaseStore();
  const { unreadAlertCount, isNotificationDropdownOpen, toggleNotificationDropdown } = useNotificationStore();

  useEffect(() => {
    if (user && cases.length === 0) {
      fetchCases();
    }
  }, [user, cases.length, fetchCases]);

  const [searchInput, setSearchInput] = useState(globalSearchQuery || '');
  const [searchResults, setSearchResults] = useState<AnyEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync internal searchInput if globalSearchQuery changes externally
  useEffect(() => {
    if (globalSearchQuery && globalSearchQuery !== searchInput) {
      setSearchInput(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Click outside listener to dismiss search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key listener to close dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live quick search with debouncing
  useEffect(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const activeCase = selectedCaseId || (cases.length > 0 ? cases[0].caseId : 'CASE-2025-M3-DATASET');
      
      try {
        const res = await searchEntities(q, activeCase);
        if (res.success && res.data && res.data.length > 0) {
          setSearchResults(res.data.slice(0, 8));
          setIsDropdownOpen(true);
          setIsSearching(false);
          return;
        }
      } catch {
        // Fallback below
      }

      // Case-insensitive partial matching fallback across all entities in case
      try {
        const entRes = await fetchEntities(activeCase);
        if (entRes.success && entRes.data) {
          const matched = entRes.data.filter((e: unknown) => {
            const ent = e as Record<string, unknown>;
            const name = String(ent.canonicalName || ent.label || ent.fullName || ent.name || ent.locationName || '').toLowerCase();
            const id = String(ent.id || ent.entityId || '').toLowerCase();
            const type = String(ent.entityType || ent.type || '').toLowerCase();
            const propsStr = JSON.stringify(ent.properties || {}).toLowerCase();
            const metaStr = JSON.stringify(ent.metadata || {}).toLowerCase();
            return name.includes(q) || id.includes(q) || type.includes(q) || propsStr.includes(q) || metaStr.includes(q);
          }).map((e: unknown) => {
            const ent = e as Record<string, unknown>;
            return {
              id: (ent.id as string) || (ent.entityId as string),
              type: (ent.entityType as string) || (ent.type as string) || 'Entity',
              label: (ent.label as string) || (ent.canonicalName as string) || (ent.name as string) || (ent.fullName as string) || (ent.id as string),
              source: (ent.source as string) || 'Database',
              caseIds: (ent.caseIds as string[]) || (ent.caseId ? [ent.caseId as string] : []),
              metadata: (ent.properties as Record<string, unknown>) || {}
            } as unknown as AnyEntity;
          });
          setSearchResults(matched.slice(0, 8));
          setIsDropdownOpen(true);
        }
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchInput, selectedCaseId, cases]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;

    setGlobalSearchQuery(q);
    setIsDropdownOpen(false);
    setView('entity');
    navigate(`/entities?q=${encodeURIComponent(q)}`);
  };

  const handleSelectSearchResult = (item: AnyEntity) => {
    selectEntity(item.id);
    setGlobalSearchQuery(item.label || item.id);
    setIsDropdownOpen(false);
    setView('entity');
    navigate(`/entities?q=${encodeURIComponent(item.label || item.id)}`);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchResults([]);
    setIsDropdownOpen(false);
  };

  return (
    <header className="h-16 bg-[var(--bg-primary)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 z-30 shrink-0 select-none">
      
      {/* Left: Hamburger Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarCollapsed ? "Open sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Open sidebar" : "Collapse sidebar"}
          className="p-2 rounded-xl border border-black bg-white hover:bg-slate-100 text-black transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black active:scale-95"
        >
          <Menu className="w-5 h-5 text-black" strokeWidth={2.2} />
        </button>
      </div>

      {/* Center: Global Search Quick Bar (Significantly expanded width) */}
      <div ref={searchContainerRef} className="relative flex-1 min-w-[240px] max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-1 sm:mx-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <button
            type="submit"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 transition-colors p-0.5 focus:outline-none cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              if (!isDropdownOpen && e.target.value.trim()) setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (searchInput.trim()) setIsDropdownOpen(true);
            }}
            placeholder="Global search persons, phones, bank accounts, vehicles, FIRs, evidence, aliases..."
            className="w-full bg-white border border-slate-300 focus:border-blue-500 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all focus:ring-2 focus:ring-blue-500/20 shadow-sm"
          />

          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Live Search Results Dropdown Preview */}
        {isDropdownOpen && searchInput.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-1 select-text">
            <div className="px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-500 border-b border-slate-100">
              <span>Quick Matches ({searchResults.length})</span>
              <span className="text-[10px] truncate max-w-[150px]">Case: {selectedCaseId || 'Active'}</span>
            </div>

            {isSearching ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Searching intelligence records...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-1 space-y-1">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSearchResult(item)}
                    className="px-3 py-2 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                        {item.label}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {item.type}
                        </span>
                        <span className="truncate">{item.id}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleSearchSubmit()}
                  className="w-full mt-2 pt-2 border-t border-slate-100 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1.5 flex items-center justify-center gap-1 hover:underline cursor-pointer"
                >
                  <span>View all results in Entity Explorer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500 space-y-2">
                <p>No exact matches found for "{searchInput}"</p>
                <button
                  type="button"
                  onClick={() => handleSearchSubmit()}
                  className="text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  Press Enter to search entire dataset →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Case Selector */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[var(--border)] text-xs text-[var(--text-primary)] shadow-sm shrink-0">
        <Briefcase className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
        <span className="hidden lg:inline text-[11px] text-[var(--text-secondary)]">Case:</span>
        <select
          value={selectedCaseId || ''}
          onChange={(e) => selectCase(e.target.value)}
          className="bg-transparent text-xs font-semibold text-[var(--primary)] focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[180px] lg:max-w-[220px] truncate"
        >
          <option value="" disabled className="bg-white text-[var(--text-secondary)]">Select Active Case...</option>
          {cases.map((c) => (
            <option key={c.caseId} value={c.caseId} className="bg-white text-[var(--text-primary)]">
              {c.caseNumber} - {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={toggleNotificationDropdown}
            className="p-2 rounded-lg bg-white hover:bg-slate-50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors relative shadow-sm cursor-pointer"
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
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[var(--border)] text-[var(--text-primary)] transition-all shadow-sm cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-cyan-400">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold text-[var(--text-primary)] leading-tight flex items-center gap-1.5">
                <span>{user?.name || user?.email?.split('@')[0] || 'Officer'}</span>
              </div>
              <div className="text-[10px] font-mono flex items-center gap-1">
                <span className="text-[var(--text-secondary)]">Logged in as:</span>
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
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[var(--border)] shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
              <div className="pb-3 border-b border-[var(--border)]">
                <p className="font-bold text-[var(--text-primary)] text-sm">{user?.name || 'Officer'}</p>
                <p className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">{user?.email}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-secondary)] font-mono">Statutory Role:</span>
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

              <div className="py-2 border-b border-[var(--border)] space-y-1">
                <div className="text-[10px] font-mono text-[var(--text-secondary)]">Badge: {user?.officerId || 'LEO-7729'}</div>
                <div className="text-[10px] font-mono text-[var(--text-secondary)]">Unit: {user?.organization || 'CrimeNet State Bureau'}</div>
              </div>

              <div className="pt-2 space-y-1">
                <button
                  onClick={() => {
                    setIsRoleDropdownOpen(false);
                    logout();
                    setView('login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
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
