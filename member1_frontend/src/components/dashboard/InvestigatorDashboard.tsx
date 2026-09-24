import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useAuthStore } from '../../store/authStore';
import { 
  ALL_ENTITIES, 
  SYNTHETIC_CASES, 
  SYNTHETIC_ALERTS, 
  SYNTHETIC_EVIDENCE_RECORDS, 
  SYNTHETIC_WATCHLIST,
  GRAPH_NODES,
  GRAPH_EDGES
} from '../../data/syntheticData';
import { 
  Users, 
  Phone, 
  Landmark, 
  Truck, 
  MapPin, 
  FileText, 
  AlertTriangle, 
  Building2, 
  PhoneCall, 
  ArrowLeftRight, 
  ShieldAlert, 
  FileCheck, 
  Activity, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Share2,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const InvestigatorDashboard: React.FC = () => {
  const { setView, selectEntity, selectCase, selectEvidence, isBackendConnected } = useNavigationStore();
  const { user } = useAuthStore();

  // Metrics computation from data
  const counts = {
    persons: ALL_ENTITIES.filter(e => e.type === 'Person').length,
    phones: ALL_ENTITIES.filter(e => e.type === 'Phone').length,
    bankAccounts: ALL_ENTITIES.filter(e => e.type === 'BankAccount').length,
    vehicles: ALL_ENTITIES.filter(e => e.type === 'Vehicle').length,
    locations: ALL_ENTITIES.filter(e => e.type === 'Location').length,
    firs: ALL_ENTITIES.filter(e => e.type === 'FIR').length,
    crimes: ALL_ENTITIES.filter(e => e.type === 'Crime').length,
    organizations: ALL_ENTITIES.filter(e => e.type === 'Organization').length,
    communications: ALL_ENTITIES.filter(e => e.type === 'Communication').length,
    transactions: ALL_ENTITIES.filter(e => e.type === 'Transaction').length,
    activeCases: SYNTHETIC_CASES.filter(c => c.status === 'Active').length,
    evidenceItems: SYNTHETIC_EVIDENCE_RECORDS.length,
    watchlistAlerts: SYNTHETIC_ALERTS.filter(a => a.category === 'Watchlist Match').length,
    criticalAlerts: SYNTHETIC_ALERTS.filter(a => a.severity === 'CRITICAL').length
  };

  // Sparkline data for temporal activity
  const activityGraphData = [
    { time: '00:00', events: 14 },
    { time: '01:00', events: 88 }, // Peak during call & transaction
    { time: '02:00', events: 45 },
    { time: '03:00', events: 62 },
    { time: '04:00', events: 31 },
    { time: '05:00', events: 19 },
    { time: '06:00', events: 40 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-6 border-cyan-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Operational Command Console
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isBackendConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
            }`}>
              {isBackendConnected ? 'LIVE BACKEND (M2)' : 'VERIFIED SYNTHETIC DATASET'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Investigator Workspace • CID Maharashtra
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoring active syndicate movements, indirect remittances, and cryptographic evidence trails across western ports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('assistant')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI Investigator Assistant</span>
          </button>
          <button
            onClick={() => setView('graph')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
          >
            <Share2 className="w-4 h-4" />
            <span>Network Canvas</span>
          </button>
        </div>
      </div>

      {/* 12 Operational Indicators Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Indexed Multi-Modal Intelligence Entities (10 Types + Cases & Evidence)
          </h3>
          <span className="text-[11px] text-cyan-400 font-mono">
            Total Entities: {ALL_ENTITIES.length}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          
          {/* 1. Persons */}
          <div 
            onClick={() => { selectEntity('ENT-PERS-001'); setView('entity'); }}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Persons</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.persons}</div>
            <span className="text-[10px] text-slate-400">Target & Associates</span>
          </div>

          {/* 2. Phones */}
          <div 
            onClick={() => { selectEntity('ENT-PHON-001'); setView('entity'); }}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Phones</span>
              <Phone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.phones}</div>
            <span className="text-[10px] text-slate-400">CDR Monitored</span>
          </div>

          {/* 3. Bank Accounts */}
          <div 
            onClick={() => { selectEntity('ENT-BANK-001'); setView('entity'); }}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Accounts</span>
              <Landmark className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.bankAccounts}</div>
            <span className="text-[10px] text-slate-400">Subpoenaed Ledgers</span>
          </div>

          {/* 4. Vehicles */}
          <div 
            onClick={() => { selectEntity('ENT-VEH-001'); setView('entity'); }}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Vehicles</span>
              <Truck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.vehicles}</div>
            <span className="text-[10px] text-slate-400">FASTag Tracked</span>
          </div>

          {/* 5. Locations */}
          <div 
            onClick={() => setView('gis')}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Locations</span>
              <MapPin className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.locations}</div>
            <span className="text-[10px] text-slate-400">Crime & Towers</span>
          </div>

          {/* 6. FIRs */}
          <div 
            onClick={() => { selectEntity('ENT-FIR-001'); setView('entity'); }}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">FIRs</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.firs}</div>
            <span className="text-[10px] text-slate-400">CCTNS Ingested</span>
          </div>

          {/* 7. Crimes */}
          <div 
            onClick={() => { selectEntity('ENT-CRIM-001'); setView('entity'); }}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Crimes</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.crimes}</div>
            <span className="text-[10px] text-slate-400">Incidents Linked</span>
          </div>

          {/* 8. Organizations */}
          <div 
            onClick={() => { selectEntity('ENT-ORG-001'); setView('entity'); }}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Shell Orgs</span>
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.organizations}</div>
            <span className="text-[10px] text-slate-400">Corporate Shells</span>
          </div>

          {/* 9. Communications */}
          <div 
            onClick={() => setView('timeline')}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Calls / CDR</span>
              <PhoneCall className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.communications}</div>
            <span className="text-[10px] text-slate-400">Intercept Logs</span>
          </div>

          {/* 10. Transactions */}
          <div 
            onClick={() => { selectEntity('ENT-TXN-001'); setView('entity'); }}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Transactions</span>
              <ArrowLeftRight className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">{counts.transactions}</div>
            <span className="text-[10px] text-slate-400">Wire & Hawala</span>
          </div>

          {/* 11. Active Investigations */}
          <div 
            onClick={() => setView('cases')}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Active Cases</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-bold text-cyan-300 font-mono">{counts.activeCases}</div>
            <span className="text-[10px] text-slate-400">Multi-Agency</span>
          </div>

          {/* 12. Verified Evidence */}
          <div 
            onClick={() => setView('evidence')}
            className="glass-card glass-card-hover rounded-xl p-3.5 border-slate-800 cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-medium">Evidence</span>
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">{counts.evidenceItems}</div>
            <span className="text-[10px] text-slate-400">SHA-256 Validated</span>
          </div>

        </div>
      </div>

      {/* Main Split: Cases & Network Activity vs Alerts & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols): Active Cases & Temporal Burst Chart */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Cases Dossiers */}
          <div className="glass-panel rounded-2xl p-5 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">Active Investigations</h3>
              </div>
              <button
                onClick={() => setView('cases')}
                className="text-xs text-cyan-400 hover:underline font-mono"
              >
                All Dossiers →
              </button>
            </div>

            <div className="space-y-3">
              {SYNTHETIC_CASES.map(c => (
                <div
                  key={c.id}
                  onClick={() => selectCase(c.id)}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">{c.caseNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {c.priority} Priority
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Updated: {c.lastUpdated}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 mt-1">{c.title}</h4>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {c.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">{c.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <div>Lead: <span className="text-slate-200">{c.leadInvestigator}</span></div>
                    <div>Entities: <span className="text-cyan-400 font-mono font-semibold">{c.entityCount}</span></div>
                    <div>Evidence: <span className="text-emerald-400 font-mono font-semibold">{c.evidenceCount} items</span></div>
                    <div>Alerts: <span className="text-amber-400 font-mono font-semibold">{c.alertCount}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Temporal Intercept Activity Burst */}
          <div className="glass-panel rounded-2xl p-5 border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Critical Locus Activity Bursts (August 14 Operation Window)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Peak: 01:04 AM - 01:18 AM Intercepts
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityGraphData}>
                  <defs>
                    <linearGradient id="colorBurst" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                  <YAxis stroke="#475569" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="events" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorBurst)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 italic text-center">
              Spike corresponds directly to Vikram Malhotra CDR call (01:04 AM) followed by ₹15L NEFT transfer (01:18 AM).
            </p>
          </div>

        </div>

        {/* Right Column (1 Col): Alerts, Watchlist, Evidence Verification */}
        <div className="space-y-6">
          
          {/* Real-time Alerts */}
          <div className="glass-panel rounded-2xl p-5 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-slate-100">Active Investigative Alerts</h3>
              </div>
              <button
                onClick={() => setView('alerts')}
                className="text-xs text-cyan-400 hover:underline font-mono"
              >
                View ({SYNTHETIC_ALERTS.length})
              </button>
            </div>

            <div className="space-y-2.5">
              {SYNTHETIC_ALERTS.slice(0, 3).map(alert => (
                <div
                  key={alert.id}
                  onClick={() => setView('alerts')}
                  className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className={`font-semibold ${
                      alert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {alert.category}
                    </span>
                    <span className="text-slate-400">{alert.timestamp.slice(11, 16)}</span>
                  </div>
                  <h5 className="text-xs font-semibold text-slate-200">{alert.title}</h5>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{alert.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Watchlist Monitor */}
          <div className="glass-panel rounded-2xl p-5 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">Active Watchlist Matches</h3>
              </div>
              <button
                onClick={() => setView('watchlist')}
                className="text-xs text-cyan-400 hover:underline font-mono"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {SYNTHETIC_WATCHLIST.slice(0, 3).map(entry => (
                <div
                  key={entry.id}
                  className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{entry.targetName || entry.value}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{entry.entryType}: {entry.value}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] border border-cyan-800">
                    {entry.matchCount} Matches
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Integrity Status (BSA §63) */}
          <div className="glass-panel rounded-2xl p-5 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">Evidence SHA-256 Ledger</h3>
              </div>
              <button
                onClick={() => setView('evidence')}
                className="text-xs text-cyan-400 hover:underline font-mono"
              >
                Inspect
              </button>
            </div>

            <div className="space-y-2.5">
              {SYNTHETIC_EVIDENCE_RECORDS.slice(0, 3).map(evd => (
                <div
                  key={evd.id}
                  onClick={() => selectEvidence(evd.id)}
                  className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-slate-200 truncate max-w-[170px]">{evd.title}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      evd.integrityStatus === 'MATCH'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}>
                      {evd.integrityStatus}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    Hash: {evd.currentHashSHA256}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
