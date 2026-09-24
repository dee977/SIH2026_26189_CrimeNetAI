import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { ALL_ENTITIES, SYNTHETIC_CASES } from '../../data/syntheticData';
import { EntityType, AnyEntity } from '../../types/entities';
import { 
  Search, 
  Filter, 
  Database, 
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
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

export const GlobalSearch: React.FC = () => {
  const { globalSearchQuery, setGlobalSearchQuery, selectEntity, setView } = useNavigationStore();

  const [searchQuery, setSearchQuery] = useState(globalSearchQuery || '');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  const entityTypes: { type: string; label: string }[] = [
    { type: 'ALL', label: 'All Entities' },
    { type: 'Person', label: 'Person' },
    { type: 'Phone', label: 'Phone' },
    { type: 'BankAccount', label: 'Bank Account' },
    { type: 'Vehicle', label: 'Vehicle' },
    { type: 'Location', label: 'Location' },
    { type: 'Organization', label: 'Organization' },
    { type: 'FIR', label: 'FIR' },
    { type: 'Crime', label: 'Crime' },
    { type: 'Transaction', label: 'Transaction' },
    { type: 'Communication', label: 'Communication' },
    { type: 'Evidence', label: 'Evidence' }
  ];

  // Search filtering logic
  const filteredEntities = ALL_ENTITIES.filter(entity => {
    // Type filter
    if (selectedType !== 'ALL' && entity.type !== selectedType) {
      return false;
    }

    // Source filter
    if (selectedSource !== 'ALL' && !entity.source.toLowerCase().includes(selectedSource.toLowerCase())) {
      return false;
    }

    // Date filter
    if (dateFilter && entity.firstObserved && !entity.firstObserved.includes(dateFilter)) {
      return false;
    }

    // Text query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchLabel = entity.label.toLowerCase().includes(q);
      const matchId = entity.id.toLowerCase().includes(q);
      const matchSource = entity.source.toLowerCase().includes(q);
      const matchNotes = entity.notes?.toLowerCase().includes(q) || false;
      
      // Check aliases if Person
      const matchAlias = entity.type === 'Person' && 
        (entity as any).aliases?.some((a: string) => a.toLowerCase().includes(q));

      // Check phone number or account number if applicable
      const matchPhone = entity.type === 'Phone' && (entity as any).phoneNumber?.includes(q);
      const matchBank = entity.type === 'BankAccount' && (entity as any).accountNumber?.includes(q);

      return matchLabel || matchId || matchSource || matchNotes || matchAlias || matchPhone || matchBank;
    }

    return true;
  });

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'Person': return <Users className="w-4 h-4 text-blue-400" />;
      case 'Phone': return <Phone className="w-4 h-4 text-emerald-400" />;
      case 'BankAccount': return <Landmark className="w-4 h-4 text-amber-400" />;
      case 'Vehicle': return <Truck className="w-4 h-4 text-indigo-400" />;
      case 'Location': return <MapPin className="w-4 h-4 text-red-400" />;
      case 'Organization': return <Building2 className="w-4 h-4 text-purple-400" />;
      case 'FIR': return <FileText className="w-4 h-4 text-cyan-400" />;
      case 'Crime': return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'Transaction': return <ArrowLeftRight className="w-4 h-4 text-yellow-400" />;
      case 'Communication': return <PhoneCall className="w-4 h-4 text-teal-400" />;
      case 'Evidence': return <FileCheck className="w-4 h-4 text-emerald-400" />;
      default: return <Database className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Cross-Jurisdictional Global Search</h1>
        <p className="text-xs text-slate-400 mt-1">
          Unified multi-criteria index across persons, communication endpoints, financial ledgers, locations, crimes, and evidence records.
        </p>
      </div>

      {/* Search Input & Filters Box */}
      <div className="glass-panel rounded-2xl p-5 border-slate-800 space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setGlobalSearchQuery(e.target.value);
            }}
            placeholder="Search by Person name, Alias, Phone, Bank Account, Vehicle Plate, FIR Number, Crime ID..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setGlobalSearchQuery(''); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Row: Type, Source, Date */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          
          {/* Entity Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {entityTypes.map(t => (
                <option key={t.type} value={t.type}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Source:</span>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Sources</option>
              <option value="FIR">CCTNS FIR Records</option>
              <option value="CDR">Telecom CDR Dumps</option>
              <option value="Bank">Banking Subpoenas</option>
              <option value="Panchnama">Customs Panchnama</option>
              <option value="FASTag">FASTag Toll Logs</option>
              <option value="MCA">MCA Corporate Registry</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="ml-auto text-xs font-mono text-slate-400">
            Found <span className="text-cyan-400 font-bold">{filteredEntities.length}</span> matching records
          </div>

        </div>

      </div>

      {/* Results List */}
      <div className="space-y-3">
        {filteredEntities.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center border-slate-800">
            <Database className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-300">No records found matching criteria</h4>
            <p className="text-xs text-slate-500 mt-1">Try broadening your search query or removing active filters.</p>
          </div>
        ) : (
          filteredEntities.map(entity => (
            <div
              key={entity.id}
              onClick={() => {
                selectEntity(entity.id);
                setView('entity');
              }}
              className="glass-card glass-card-hover rounded-xl p-4 border-slate-800 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0">
                  {getEntityIcon(entity.type)}
                </div>
                
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {entity.type}
                    </span>
                    <span className="text-xs font-mono text-slate-500">[{entity.id}]</span>
                    {entity.type === 'Person' && (entity as any).aliases?.length > 0 && (
                      <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        Alias: {(entity as any).aliases.join(', ')}
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 truncate">{entity.label}</h4>
                  
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 mt-1.5">
                    <div>Source: <span className="text-slate-300">{entity.source}</span></div>
                    {entity.firstObserved && (
                      <div>Logged: <span className="font-mono text-slate-300">{entity.firstObserved}</span></div>
                    )}
                    <div>Case Ref: <span className="text-cyan-400 font-mono">{entity.caseIds.join(', ')}</span></div>
                  </div>
                </div>
              </div>

              {/* Right metadata badge & action */}
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                <div className="text-right hidden sm:block">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {entity.evidenceCount} Evidentiary Items
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Verified Chain</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80 text-slate-400 group-hover:text-cyan-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
