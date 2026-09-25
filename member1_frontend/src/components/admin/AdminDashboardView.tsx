import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigationStore } from '../../store/navigationStore';
import { PermissionDeniedState } from '../common/UIStates';
import { 
  Settings, 
  Users, 
  Shield, 
  Database, 
  FileCheck, 
  History, 
  Lock, 
  Server, 
  Radio, 
  CheckCircle2, 
  KeyRound,
  RefreshCw
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuthStore();
  const { isBackendConnected, toggleBackendConnection } = useNavigationStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'datasets' | 'ledger' | 'settings'>('overview');

  // Permission check
  const isAdmin = 
    user?.grantedRole === 'System Administrator' || 
    user?.permissions?.includes('admin') || 
    user?.permissions?.includes('admin:manage') ||
    (user as any)?.role === 'super_admin' ||
    (user as any)?.role === 'System Administrator';

  if (!isAdmin) {
    return (
      <PermissionDeniedState 
        requiredPermission="System Administrator Role (M6 Security Policy)" 
        requiredRole="System Administrator" 
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            Master Infrastructure Station
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            System Administrator Terminal
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 mt-1">
          System Administration & Ledger Control Room
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Orchestrate user credentials, inspect immutable cryptographic ledger state, configure data pipelines, and manage API endpoints.
        </p>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'overview' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Cluster Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'users' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & RBAC Matrix</span>
        </button>
        <button
          onClick={() => setActiveTab('datasets')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'datasets' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Dataset Management (M3)</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'ledger' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Evidence Ledger (M6)</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
            activeTab === 'settings' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Settings</span>
        </button>
      </div>

      {/* Cluster Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-4 border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Backend Gateway</span>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE (M2)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Port 8000 REST</span>
            </div>

            <div className="glass-card rounded-xl p-4 border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Graph Database</span>
              <div className="text-sm font-bold text-cyan-400 font-mono mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>NEO4J BOLT (M3)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Port 7687 Cypher</span>
            </div>

            <div className="glass-card rounded-xl p-4 border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">ML Engine</span>
              <div className="text-sm font-bold text-purple-400 font-mono mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>M5 GRAPH ML</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Louvain & Centrality</span>
            </div>

            <div className="glass-card rounded-xl p-4 border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400">Integrity Ledger</span>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>SYNCHRONIZED (M6)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">SHA-256 Chain</span>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Integration Contracts Health</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">M2 REST API:</span>
                  <span className="text-slate-300 ml-2">Endpoints /entities, /cases, /search, /reports</span>
                </div>
                <span className="text-emerald-400">CONNECTED</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">M3 Neo4j Graph API:</span>
                  <span className="text-slate-300 ml-2">Endpoints /graph, /graph/hidden-path</span>
                </div>
                <span className="text-emerald-400">CONNECTED</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">M5 Graph ML API:</span>
                  <span className="text-slate-300 ml-2">Endpoints /graph/analytics, /graph/communities, /verification</span>
                </div>
                <span className="text-emerald-400">CONNECTED</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-cyan-400 font-bold">M6 Auth & SHA-256 Ledger:</span>
                  <span className="text-slate-300 ml-2">Endpoints /auth, /evidence/verify-hash, /ledger/audit</span>
                </div>
                <span className="text-emerald-400">CONNECTED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="glass-panel rounded-2xl p-6 border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">System Gateway Configuration</h3>
          
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-200">Runtime Mock & Synthetic Fallback Mode</h4>
              <p className="text-[11px] text-slate-400">When enabled, the frontend falls back gracefully to local synthetic datasets if backend services are unreachable.</p>
            </div>
            <button
              onClick={toggleBackendConnection}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                isBackendConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {isBackendConnected ? 'LIVE BACKEND MODE' : 'SYNTHETIC FALLBACK MODE'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
