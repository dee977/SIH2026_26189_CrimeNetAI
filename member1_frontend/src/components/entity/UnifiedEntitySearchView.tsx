import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigationStore } from '../../store/navigationStore';
import { EntityType, AnyEntity } from '../../types/entities';
import { searchEntities, fetchEntityById, fetchEntities } from '../../services/entityService';
import { PersonProfile } from './PersonProfile';
import { GenericEntityProfile } from './GenericEntityProfile';
import { 
  Users, 
  Phone, 
  Landmark, 
  Truck, 
  MapPin, 
  Building2, 
  FileText, 
  ShieldAlert, 
  ArrowLeftRight, 
  PhoneCall, 
  FileCheck,
  Search,
  Filter,
  ArrowRight,
  Database
} from 'lucide-react';

export const UnifiedEntitySearchView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedEntityId, selectEntity, selectedCaseId, setView, globalSearchQuery, setGlobalSearchQuery } = useNavigationStore();
  
  const [activeTab, setActiveTab] = useState<EntityType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || globalSearchQuery || '');
  const [liveEntities, setLiveEntities] = useState<AnyEntity[]>([]);
  const [liveDetail, setLiveDetail] = useState<AnyEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync searchQuery and selectedEntityId when URL params change
  useEffect(() => {
    const qParam = searchParams.get('q');
    if (qParam !== null) {
      setSearchQuery(qParam);
    } else if (globalSearchQuery) {
      setSearchQuery(globalSearchQuery);
    }

    const entId = searchParams.get('entityId');
    if (entId) {
      selectEntity(entId);
    }
  }, [searchParams, globalSearchQuery, selectEntity]);

  // Fetch results when search query, active tab, or case ID changes
  useEffect(() => {
    let isMounted = true;
    
    const activeCase = searchParams.get('caseId') || selectedCaseId || 'CASE-2026-011';

    setIsLoading(true);
    setError(null);
    
    const filter = activeTab === 'ALL' ? undefined : activeTab;
    const q = searchQuery.trim();

    searchEntities(q, activeCase, { type: filter })
      .then(res => {
        if (isMounted) {
          if (res.success && res.data && res.data.length > 0) {
            setLiveEntities(res.data);
            if (!selectedEntityId || !res.data.some((e: AnyEntity) => e.id === selectedEntityId)) {
              selectEntity(res.data[0].id);
            }
          } else {
            // Direct query fallback with client-side case-insensitive partial matching
            fetchEntities(activeCase, filter)
              .then(entRes => {
                if (isMounted && entRes.success && entRes.data) {
                  let results = entRes.data;
                  if (q) {
                    const lq = q.toLowerCase();
                    results = results.filter((e: unknown) => {
                      const ent = e as Record<string, unknown>;
                      const name = String(ent.canonicalName || ent.label || ent.fullName || ent.name || ent.locationName || '').toLowerCase();
                      const id = String(ent.id || ent.entityId || '').toLowerCase();
                      const type = String(ent.entityType || ent.type || '').toLowerCase();
                      const propsStr = JSON.stringify(ent.properties || {}).toLowerCase();
                      const metaStr = JSON.stringify(ent.metadata || {}).toLowerCase();
                      return name.includes(lq) || id.includes(lq) || type.includes(lq) || propsStr.includes(lq) || metaStr.includes(lq);
                    });
                  }
                  setLiveEntities(results);
                  if (results.length > 0) {
                    if (!selectedEntityId || !results.some((e: AnyEntity) => e.id === selectedEntityId)) {
                      selectEntity(results[0].id);
                    }
                  } else {
                    setLiveDetail(null);
                  }
                } else if (isMounted) {
                  setLiveEntities(res.data || []);
                }
              })
              .catch(() => {
                if (isMounted) setLiveEntities(res.data || []);
              });
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          fetchEntities(activeCase, filter)
            .then(entRes => {
              if (isMounted && entRes.success && entRes.data) {
                let results = entRes.data;
                if (q) {
                  const lq = q.toLowerCase();
                  results = results.filter((e: unknown) => {
                    const ent = e as Record<string, unknown>;
                    const name = String(ent.canonicalName || ent.label || ent.fullName || ent.name || ent.locationName || '').toLowerCase();
                    const id = String(ent.id || ent.entityId || '').toLowerCase();
                    const type = String(ent.entityType || ent.type || '').toLowerCase();
                    const propsStr = JSON.stringify(ent.properties || {}).toLowerCase();
                    const metaStr = JSON.stringify(ent.metadata || {}).toLowerCase();
                    return name.includes(lq) || id.includes(lq) || type.includes(lq) || propsStr.includes(lq) || metaStr.includes(lq);
                  });
                }
                setLiveEntities(results);
                if (results.length > 0) {
                  if (!selectedEntityId || !results.some((e: AnyEntity) => e.id === selectedEntityId)) {
                    selectEntity(results[0].id);
                  }
                } else {
                  setLiveDetail(null);
                }
              } else if (isMounted) {
                setLiveEntities([]);
                setError("Unable to load search results.");
              }
            })
            .catch(() => {
              if (isMounted) {
                setLiveEntities([]);
                setError("Unable to load search results.");
              }
            });
        }
      })
      .finally(() => { if (isMounted) setIsLoading(false); });

    return () => { isMounted = false; };
  }, [activeTab, searchQuery, selectedCaseId]);

  // Fetch detail when entity is selected
  useEffect(() => {
    let isMounted = true;
    const targetId = selectedEntityId || searchParams.get('entityId');
    const caseToUse = selectedCaseId || searchParams.get('caseId') || 'CASE-2026-011';
    if (!targetId) {
      setLiveDetail(null);
      return;
    }
    
    setIsLoading(true);
    fetchEntityById(targetId, caseToUse).then(res => {
      if (isMounted && res.success && res.data) {
        setLiveDetail(res.data);
        // Ensure the selected entity is also present in liveEntities list
        setLiveEntities(prev => {
          if (!prev.some(e => e.id === res.data.id)) {
            return [res.data, ...prev];
          }
          return prev;
        });
      }
    }).finally(() => {
      if (isMounted) setIsLoading(false);
    });
    return () => { isMounted = false; };
  }, [selectedEntityId, selectedCaseId, searchParams]);

  // Clear selected entity only when case actually changes from a previous case
  const prevCaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevCaseRef.current && prevCaseRef.current !== selectedCaseId && !searchParams.get('entityId')) {
      selectEntity('');
    }
    prevCaseRef.current = selectedCaseId;
  }, [selectedCaseId, selectEntity, searchParams]);

  const tabs: { type: EntityType | 'ALL'; label: string }[] = [
    { type: 'ALL', label: 'All Entities' },
    { type: 'Person', label: 'Persons' },
    { type: 'Phone', label: 'Phones' },
    { type: 'BankAccount', label: 'Bank Accounts' },
    { type: 'Vehicle', label: 'Vehicles' },
    { type: 'Location', label: 'Locations' },
    { type: 'Organization', label: 'Organizations' },
    { type: 'FIR', label: 'FIRs' },
    { type: 'Crime', label: 'Crimes' },
    { type: 'Transaction', label: 'Transactions' },
    { type: 'Communication', label: 'Communications' },
    { type: 'Evidence', label: 'Evidence' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Search & Entity Explorer</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
              LIVE GRAPH (NEO4J)
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Search, filter, and inspect entities and relational dossiers within the current active case.
          </p>
        </div>
      </div>

      {/* Search Bar & Tabs Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 shrink-0">
        <div className="relative">
          <Search className="w-5 h-5 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              setGlobalSearchQuery(val);
              setSearchParams(val.trim() ? { q: val } : {});
            }}
            placeholder="Search entities by name, ID, location, or metadata..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setGlobalSearchQuery('');
                setSearchParams({});
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] hover:text-slate-600 font-medium cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-100 pt-3 scrollbar-none">
          {tabs.map(tab => {
            const isActive = activeTab === tab.type;
            return (
              <button
                key={tab.type}
                onClick={() => setActiveTab(tab.type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--text-primary)] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split: Left Selector Drawer, Right Detailed Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left: Entity Quick Selector */}
        <div className="lg:col-span-1 space-y-2 h-[640px] overflow-y-auto pr-2 custom-scrollbar">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] mb-2 font-bold flex justify-between px-1">
            <span>Search Results</span>
            <span>({liveEntities.length})</span>
          </div>

          {!selectedCaseId ? (
            <div className="text-sm text-[var(--text-muted)] text-center py-10 bg-white border border-slate-200 rounded-xl p-6">
              Select a case first to search entities.
            </div>
          ) : isLoading && liveEntities.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)] text-center py-10 bg-white border border-slate-200 rounded-xl p-6">
              Searching entities...
            </div>
          ) : error ? (
            <div className="text-sm text-[var(--danger)] text-center py-10 bg-white border border-rose-200 rounded-xl p-6">
              {error}
            </div>
          ) : liveEntities.length === 0 ? (
            <div className="text-sm text-[var(--text-muted)] text-center py-10 bg-white border border-slate-200 rounded-xl p-6">
              {searchQuery ? "No entities found matching your search." : "No entities available for this filter."}
            </div>
          ) : (
            liveEntities.map(item => {
              const isSelected = item.id === selectedEntityId;
              return (
                <div
                  key={item.id}
                  onClick={() => selectEntity(item.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--primary)] border-blue-600 text-[var(--text-primary)] shadow-md ring-2 ring-blue-300/40'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      isSelected
                        ? 'bg-blue-700 text-[var(--text-primary)]'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {item.type}
                    </span>
                    <span className={`truncate ml-2 max-w-[110px] font-mono ${
                      isSelected ? 'text-blue-100' : 'text-[var(--text-secondary)]'
                    }`}>
                      {item.id}
                    </span>
                  </div>
                  <div className={`text-xs font-bold truncate ${
                    isSelected ? 'text-[var(--text-primary)]' : 'text-slate-900'
                  }`}>
                    {item.label}
                  </div>
                  <div className={`text-[10px] truncate mt-1 ${
                    isSelected ? 'text-blue-200' : 'text-[var(--text-secondary)]'
                  }`}>
                    {item.source || 'Graph Database'}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Entity Detailed Profile */}
        <div className="lg:col-span-3 h-[640px] overflow-y-auto custom-scrollbar">
          {!selectedEntityId ? (
            <div className="bg-white border border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center text-[var(--text-secondary)] p-12">
              <Database className="w-12 h-12 mb-3 text-[var(--text-secondary)]" />
              <p className="text-sm font-medium text-slate-600">Select an entity from the search results to inspect dossier</p>
            </div>
          ) : liveDetail ? (
            <div>
              {liveDetail.type === 'Person' ? (
                <PersonProfile 
                  person={liveDetail as any} 
                  onSelectLinkedEntity={(id) => selectEntity(id)}
                  caseId={selectedCaseId || undefined}
                />
              ) : (
                <GenericEntityProfile 
                  entity={liveDetail} 
                  onSelectLinkedEntity={(id) => selectEntity(id)}
                  caseId={selectedCaseId || undefined}
                />
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center text-[var(--text-secondary)] p-12">
              <p className="text-sm text-[var(--text-muted)]">{isLoading ? 'Loading entity details...' : 'Entity not found in this case.'}</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
