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
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { searchEntities, fetchEntities } from '../../services/entityService';
import { AnyEntity } from '../../types/entities';

const formatRelativeTime = (ts?: string) => {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return ts.slice(0, 10);
  } catch {
    return ts;
  }
};

export const TopNav: React.FC = () => {
  const navigate = useNavigate();
  const { 
    setView, 
    setGlobalSearchQuery, 
    globalSearchQuery,
    selectedCaseId,
    selectCase,
    openCase,
    selectEntity,
    isSidebarCollapsed,
    toggleSidebar
  } = useNavigationStore();

  const { user, logout } = useAuthStore();
  const { cases, fetchCases } = useCaseStore();
  const { 
    alerts,
    unreadAlertCount,
    isLoadingAlerts,
    isNotificationDropdownOpen, 
    toggleNotificationDropdown,
    closeNotificationDropdown,
    fetchAlerts,
    markAllAsRead
  } = useNotificationStore();

  useEffect(() => {
    if (user && cases.length === 0) {
      fetchCases();
    }
  }, [user, cases.length, fetchCases]);

  // Initial fetch of alerts and refetch when selected case changes
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const [searchInput, setSearchInput] = useState(globalSearchQuery || '');
  const [searchResults, setSearchResults] = useState<AnyEntity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'case'>('all');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationsContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  // Sync internal searchInput if globalSearchQuery changes externally
  useEffect(() => {
    if (globalSearchQuery && globalSearchQuery !== searchInput) {
      setSearchInput(globalSearchQuery);
    }
  }, [globalSearchQuery]);

  // Click outside listener to dismiss search, alerts, and profile dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (notificationsContainerRef.current && !notificationsContainerRef.current.contains(target)) {
        closeNotificationDropdown();
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(target)) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeNotificationDropdown]);

  // Escape key listener to close all dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        closeNotificationDropdown();
        setIsRoleDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeNotificationDropdown]);

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

  const handleToggleNotifications = () => {
    setIsRoleDropdownOpen(false);
    setIsDropdownOpen(false);
    toggleNotificationDropdown();
  };

  const handleToggleProfile = () => {
    closeNotificationDropdown();
    setIsDropdownOpen(false);
    setIsRoleDropdownOpen(prev => !prev);
  };

  const handleViewAllFeed = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeNotificationDropdown();
    setView('alerts');
    navigate('/alerts');
    useNotificationStore.getState().fetchAlerts();
  };

  const handleOpenAlert = (alt: any, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeNotificationDropdown();

    // 1. Cross-source contradiction -> Open Cross-Verification module
    if (
      alt.category === 'Cross-source Contradiction' ||
      alt.title?.toLowerCase().includes('contradiction')
    ) {
      if (alt.caseId) {
        selectCase(alt.caseId);
      }
      setView('verification');
      navigate(`/verification${alt.caseId ? `?caseId=${encodeURIComponent(alt.caseId)}` : ''}`);
      return;
    }

    // 2. Evidence Integrity Mismatch -> Open Evidence module
    if (alt.category === 'Evidence Integrity Mismatch' || alt.sourceRecordId) {
      if (alt.caseId) {
        selectCase(alt.caseId);
      }
      setView('evidence');
      navigate(`/evidence${alt.caseId ? `?caseId=${encodeURIComponent(alt.caseId)}` : ''}${alt.sourceRecordId ? `&evidenceId=${encodeURIComponent(alt.sourceRecordId)}` : ''}`);
      return;
    }

    // 3. Case workspace lead -> Open related Case Workspace
    if (alt.caseId) {
      openCase(alt.caseId);
      setView('case-workspace');
      navigate(`/cases/${encodeURIComponent(alt.caseId)}`);
      return;
    }

    // 4. Default: Open full detailed alert view
    setView('alerts');
    navigate(`/alerts?alertId=${encodeURIComponent(alt.id)}`);
  };

  // Filtered alerts for the dropdown display
  const displayedAlerts = (alertFilter === 'case' && selectedCaseId)
    ? alerts.filter(a => a.caseId === selectedCaseId)
    : alerts;

  return (
    <header className="h-16 bg-[var(--bg-primary)] border-b border-[var(--border)] px-4 sm:px-6 flex items-center justify-between gap-3 sm:gap-4 z-30 shrink-0 select-none print:hidden">
      
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
          onChange={(e) => {
            selectCase(e.target.value);
            fetchAlerts();
          }}
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
        <div ref={notificationsContainerRef} className="relative">
          <button
            type="button"
            onClick={handleToggleNotifications}
            className={`p-2 rounded-xl border transition-all relative shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              isNotificationDropdownOpen 
                ? 'bg-blue-50 border-blue-400 text-blue-600' 
                : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200'
            }`}
            title="Investigative Alerts & Cross-Verification Logs"
            aria-label="Investigative Alerts"
            aria-expanded={isNotificationDropdownOpen}
          >
            <Bell className="w-4 h-4" />
            {unreadAlertCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
              </span>
            ) : alerts.length > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-slate-600 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-sm">
                {alerts.length > 99 ? '99+' : alerts.length}
              </span>
            ) : null}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs select-text">
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">
                    Investigative Alerts ({displayedAlerts.length})
                  </span>
                  {unreadAlertCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-mono font-bold">
                      {unreadAlertCount} unread
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadAlertCount > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="text-[10px] text-slate-500 hover:text-slate-800 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleViewAllFeed}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View All Feed</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Case Filter Tabs if a case is selected */}
              {selectedCaseId && (
                <div className="flex items-center gap-1 mb-2 bg-slate-100 p-0.5 rounded-lg text-[10px] font-medium">
                  <button
                    type="button"
                    onClick={() => setAlertFilter('all')}
                    className={`flex-1 py-1 rounded-md transition-colors text-center cursor-pointer ${
                      alertFilter === 'all' 
                        ? 'bg-white text-slate-900 font-bold shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All System ({alerts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertFilter('case')}
                    className={`flex-1 py-1 rounded-md transition-colors text-center truncate px-1 cursor-pointer ${
                      alertFilter === 'case' 
                        ? 'bg-white text-slate-900 font-bold shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={`Active Case: ${selectedCaseId}`}
                  >
                    Active Case ({alerts.filter(a => a.caseId === selectedCaseId).length})
                  </button>
                </div>
              )}

              {/* Alert List Content */}
              {isLoadingAlerts ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px]">Loading investigative alerts...</span>
                </div>
              ) : displayedAlerts.length === 0 ? (
                <div className="py-8 text-center space-y-1.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-semibold text-slate-700">No active alerts</div>
                  <div className="text-[11px] text-slate-400">
                    {alertFilter === 'case' && alerts.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setAlertFilter('all')}
                        className="text-blue-600 hover:underline mt-1 font-medium cursor-pointer"
                      >
                        Show {alerts.length} alerts from other cases →
                      </button>
                    ) : (
                      'All intelligence feeds and forensic checks normal'
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {displayedAlerts.slice(0, 6).map((alt) => (
                    <div
                      key={alt.id}
                      onClick={(e) => handleOpenAlert(alt, e)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:bg-slate-50 hover:border-blue-300 group text-left ${
                        !alt.isRead ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded uppercase ${
                            alt.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                            alt.severity === 'HIGH' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {alt.severity}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {alt.category}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatRelativeTime(alt.timestamp)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-1 line-clamp-1">
                        {alt.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                        {alt.explanation}
                      </p>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="truncate max-w-[170px] text-slate-500 font-medium">
                          {alt.caseId || alt.source}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleOpenAlert(alt, e)}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] border border-blue-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs"
                          title={
                            alt.category === 'Cross-source Contradiction'
                              ? 'Open in Cross-Verification'
                              : alt.caseId
                              ? `Open Case ${alt.caseId}`
                              : 'Open Alert Details'
                          }
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {displayedAlerts.length > 6 && (
                    <button
                      type="button"
                      onClick={handleViewAllFeed}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-full py-2 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 rounded-xl transition-colors cursor-pointer"
                    >
                      View all {displayedAlerts.length} alerts in Alerts Center →
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role Switcher & Profile Dropdown */}
        <div ref={profileContainerRef} className="relative">
          <button
            type="button"
            onClick={handleToggleProfile}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl border transition-all shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              isRoleDropdownOpen 
                ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900'
            }`}
            aria-label="User Profile"
            aria-expanded={isRoleDropdownOpen}
          >
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-600">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[11px] font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                <span>{user?.name || user?.email?.split('@')[0] || 'Officer'}</span>
              </div>
              <div className="text-[10px] font-mono flex items-center gap-1">
                <span className="text-slate-500">Logged in as:</span>
                <span className={`font-bold px-1.5 py-0.2 rounded text-[9px] uppercase ${
                  (user?.grantedRole || 'INVESTIGATOR') === 'ADMIN' ? 'bg-rose-500/20 text-rose-700 border border-rose-500/40' :
                  (user?.grantedRole || 'INVESTIGATOR') === 'INVESTIGATOR' ? 'bg-blue-500/20 text-blue-700 border border-blue-500/40' :
                  (user?.grantedRole || 'INVESTIGATOR') === 'ANALYST' ? 'bg-cyan-500/20 text-cyan-700 border border-cyan-500/40' :
                  'bg-amber-500/20 text-amber-700 border border-amber-500/40'
                }`}>
                  {user?.grantedRole || 'INVESTIGATOR'}
                </span>
              </div>
            </div>
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs select-text">
              <div className="pb-3 border-b border-slate-100">
                <p className="font-bold text-slate-900 text-sm">{user?.name || 'Officer'}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{user?.email}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">Statutory Role:</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    (user?.grantedRole || 'INVESTIGATOR') === 'ADMIN' ? 'bg-rose-100 text-rose-700 border-rose-300' :
                    (user?.grantedRole || 'INVESTIGATOR') === 'INVESTIGATOR' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                    (user?.grantedRole || 'INVESTIGATOR') === 'ANALYST' ? 'bg-cyan-100 text-cyan-700 border-cyan-300' :
                    'bg-amber-100 text-amber-700 border-amber-300'
                  }`}>
                    {user?.grantedRole || 'INVESTIGATOR'}
                  </span>
                </div>
              </div>

              <div className="py-2.5 border-b border-slate-100 space-y-1">
                <div className="text-[10px] font-mono text-slate-600 flex items-center justify-between">
                  <span className="text-slate-400">Badge ID:</span>
                  <span className="font-bold">{user?.officerId || 'LEO-7729'}</span>
                </div>
                <div className="text-[10px] font-mono text-slate-600 flex items-center justify-between">
                  <span className="text-slate-400">Unit:</span>
                  <span className="font-bold truncate max-w-[160px]">{user?.organization || 'CrimeNet State Bureau'}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRoleDropdownOpen(false);
                    logout();
                    setView('login');
                    navigate('/login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer font-medium"
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
