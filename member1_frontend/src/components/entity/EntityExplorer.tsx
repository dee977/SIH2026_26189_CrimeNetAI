import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { ALL_ENTITIES, PERSON_VIKRAM_MALHOTRA } from '../../data/syntheticData';
import { EntityType, AnyEntity } from '../../types/entities';
import { fetchEntities, searchEntities, fetchEntityById } from '../../services/entityService';
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

export const EntityExplorer: React.FC = () => {
  const { selectedEntityId, selectEntity } = useNavigationStore();
  
  const [activeTab, setActiveTab] = useState<EntityType | 'ALL'>('ALL');
  const [filterQuery, setFilterQuery] = useState('');
  const [liveEntities, setLiveEntities] = useState<AnyEntity[] | null>(null);
  const [liveDetail, setLiveDetail] = useState<AnyEntity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    const filter = activeTab === 'ALL' ? undefined : activeTab;

    if (filterQuery.trim()) {
      searchEntities(filterQuery, { type: activeTab === 'ALL' ? undefined : activeTab })
        .then(res => {
          if (isMounted && res.success && res.data && res.data.length > 0) {
            setLiveEntities(res.data);
          }
        })
        .finally(() => { if (isMounted) setIsLoading(false); });
    } else {
      fetchEntities(filter)
        .then(res => {
          if (isMounted && res.success && res.data && res.data.length > 0) {
            setLiveEntities(res.data);
          }
        })
        .finally(() => { if (isMounted) setIsLoading(false); });
    }

    return () => { isMounted = false; };
  }, [activeTab, filterQuery]);

  useEffect(() => {
    if (!selectedEntityId) return;
    fetchEntityById(selectedEntityId).then(res => {
      if (res.success && res.data) {
        setLiveDetail(res.data);
      }
    }).catch(() => {});
  }, [selectedEntityId]);

  const sourceList = (liveEntities && liveEntities.length > 0) ? liveEntities : ALL_ENTITIES;

  const tabs: { type: EntityType | 'ALL'; label: string; count: number }[] = [
    { type: 'ALL', label: 'All Entities', count: sourceList.length },
    { type: 'Person', label: 'Persons', count: sourceList.filter(e => e.type === 'Person').length },
    { type: 'Phone', label: 'Phones', count: sourceList.filter(e => e.type === 'Phone').length },
    { type: 'BankAccount', label: 'Bank Accounts', count: sourceList.filter(e => e.type === 'BankAccount').length },
    { type: 'Vehicle', label: 'Vehicles', count: sourceList.filter(e => e.type === 'Vehicle').length },
    { type: 'Location', label: 'Locations', count: sourceList.filter(e => e.type === 'Location').length },
    { type: 'Organization', label: 'Organizations', count: sourceList.filter(e => e.type === 'Organization').length },
    { type: 'FIR', label: 'FIRs', count: sourceList.filter(e => e.type === 'FIR').length },
    { type: 'Crime', label: 'Crimes', count: sourceList.filter(e => e.type === 'Crime').length },
    { type: 'Transaction', label: 'Transactions', count: sourceList.filter(e => e.type === 'Transaction').length },
    { type: 'Communication', label: 'Communications', count: sourceList.filter(e => e.type === 'Communication').length },
    { type: 'Evidence', label: 'Evidence', count: sourceList.filter(e => e.type === 'Evidence').length },
  ];

  const displayedList = sourceList.filter(e => {
    if (activeTab !== 'ALL' && e.type !== activeTab) return false;
    if (filterQuery.trim() && !liveEntities) {
      const q = filterQuery.toLowerCase();
      return (e.label || '').toLowerCase().includes(q) || (e.id || '').toLowerCase().includes(q);
    }
    return true;
  });

  const currentEntity = (liveDetail && liveDetail.id === selectedEntityId) 
    ? liveDetail 
    : (sourceList.find(e => e.id === selectedEntityId) || ALL_ENTITIES.find(e => e.id === selectedEntityId) || displayedList[0] || PERSON_VIKRAM_MALHOTRA);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">Multi-Modal Entity Explorer</h1>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              liveEntities 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
            }`}>
              {liveEntities ? 'LIVE GRAPH (NEO4J - 490K RECORDS)' : 'SYNTHETIC FALLBACK'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse and inspect structured profiles across 11 crime network entity types. (Strictly zero risk scoring)
          </p>
        </div>

        {/* Search inside Explorer */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter active entities..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        {tabs.map(tab => {
          const isActive = activeTab === tab.type;
          return (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                isActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Split: Left Selector Drawer, Right Detailed Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left: Entity Quick Selector */}
        <div className="lg:col-span-1 space-y-2 max-h-[750px] overflow-y-auto pr-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
            Select Entity ({displayedList.length})
          </div>

          {displayedList.map(item => {
            const isSelected = item.id === currentEntity.id;
            return (
              <div
                key={item.id}
                onClick={() => selectEntity(item.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/50 shadow-md text-cyan-100'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="font-semibold text-cyan-400">{item.type}</span>
                  <span className="text-slate-400">{item.id}</span>
                </div>
                <div className="text-xs font-bold truncate text-slate-100">{item.label}</div>
                <div className="text-[10px] text-slate-400 truncate mt-1">{item.source}</div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Entity Detailed Profile */}
        <div className="lg:col-span-3">
          {currentEntity.type === 'Person' ? (
            <PersonProfile person={currentEntity as any} />
          ) : (
            <GenericEntityProfile entity={currentEntity} />
          )}
        </div>

      </div>

    </div>
  );
};
