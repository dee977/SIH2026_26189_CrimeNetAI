import React from 'react';
import { useNavigationStore, AppView } from '../../store/navigationStore';
import { useAuthStore } from '../../store/authStore';
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  Database, 
  Share2, 
  Clock, 
  MapPin, 
  Bot, 
  FileCheck, 
  Bell, 
  Eye, 
  FileText, 
  GitMerge, 
  BarChart3, 
  AlertOctagon, 
  ShieldCheck, 
  Settings,
  ChevronRight,
  Shield,
  Layers,
  UploadCloud
} from 'lucide-react';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ReactNode;
  category: 'core' | 'intelligence' | 'governance';
  badge?: string;
  requiredPermission?: string;
}

export const Sidebar: React.FC = () => {
  const { currentView, setView } = useNavigationStore();
  const { user } = useAuthStore();

  const userPermissions = user?.permissions || [];
  const userRole = user?.grantedRole || ((user as any)?.role === 'super_admin' ? 'System Administrator' : 'Senior Investigator');

  const isSysAdmin = 
    userRole === 'System Administrator' || 
    user?.grantedRole === 'System Administrator' || 
    (user as any)?.role === 'super_admin' || 
    userPermissions.includes('admin') ||
    userPermissions.includes('admin:manage');

  const isSeniorAuthority =
    isSysAdmin ||
    userRole === 'Senior Authority' ||
    user?.grantedRole === 'Senior Authority' ||
    (user as any)?.role === 'senior_authority' ||
    userPermissions.includes('authority') ||
    userPermissions.includes('authority:manage') ||
    userPermissions.includes('authority:approve');

  const navItems: NavItem[] = [
    // Core Investigation
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'core' },
    { id: 'search', label: 'Global Search', icon: <Search className="w-4 h-4" />, category: 'core' },
    { id: 'cases', label: 'Cases & Dossiers', icon: <Briefcase className="w-4 h-4" />, category: 'core', badge: '2 Active' },
    { id: 'entity', label: 'Entity Explorer', icon: <Database className="w-4 h-4" />, category: 'core', badge: '11 Types' },
    { id: 'ingestion', label: 'Import Center', icon: <UploadCloud className="w-4 h-4" />, category: 'core', badge: 'CSV / PDF' },

    // Intelligence & Network Analysis
    { id: 'graph', label: 'Network Graph', icon: <Share2 className="w-4 h-4" />, category: 'intelligence' },
    { id: 'hidden-discovery', label: 'Hidden Relationships', icon: <GitMerge className="w-4 h-4" />, category: 'intelligence', badge: 'Multi-hop' },
    { id: 'analytics', label: 'Graph Analytics', icon: <BarChart3 className="w-4 h-4" />, category: 'intelligence' },
    { id: 'community', label: 'Community Clusters', icon: <Layers className="w-4 h-4" />, category: 'intelligence' },
    { id: 'timeline', label: 'Timeline Explorer', icon: <Clock className="w-4 h-4" />, category: 'intelligence' },
    { id: 'gis', label: 'GIS Tactical Map', icon: <MapPin className="w-4 h-4" />, category: 'intelligence' },
    { id: 'verification', label: 'Cross-Verification', icon: <AlertOctagon className="w-4 h-4" />, category: 'intelligence', badge: 'Conflict!' },

    // Law Enforcement Governance
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" />, category: 'governance', badge: 'Grounded' },
    { id: 'evidence', label: 'Evidence & SHA-256', icon: <FileCheck className="w-4 h-4" />, category: 'governance', badge: 'BSA §63' },
    { id: 'alerts', label: 'Alerts & Anomalies', icon: <Bell className="w-4 h-4" />, category: 'governance', badge: '4 New' },
    { id: 'watchlist', label: 'Watchlist Monitor', icon: <Eye className="w-4 h-4" />, category: 'governance' },
    { id: 'reports', label: 'Investigation Reports', icon: <FileText className="w-4 h-4" />, category: 'governance' },
    { id: 'authority', label: 'Authority Console', icon: <ShieldCheck className="w-4 h-4" />, category: 'governance', requiredPermission: 'authority', badge: '3 Pending' },
    { id: 'admin', label: 'System Admin', icon: <Settings className="w-4 h-4" />, category: 'governance', requiredPermission: 'admin' },
  ];

  const hasAccess = (item: NavItem) => {
    if (isSysAdmin) return true;
    if (item.id === 'authority' && isSeniorAuthority) return true;
    if (!item.requiredPermission) return true;
    return userPermissions.includes(item.requiredPermission) || 
           userPermissions.includes(`${item.requiredPermission}:manage`);
  };

  return (
    <aside className="w-64 bg-[#0a101f] border-r border-slate-800/80 flex flex-col shrink-0 min-h-screen select-none">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-100 tracking-tight">CrimeNet AI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono font-semibold">M1</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">SIH26189 Investigator Support</p>
          </div>
        </div>
      </div>

      {/* Role / Officer Card */}
      <div className="px-3.5 py-2.5 bg-slate-900/60 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-semibold">Active Session</p>
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || 'Authorized Officer'}</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800/60">
            {userRole}
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        
        {/* Section: Core */}
        <div>
          <div className="px-2 text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold mb-1">
            Case Operations
          </div>
          <div className="space-y-0.5">
            {navItems.filter(i => i.category === 'core').map(item => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    active 
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Intelligence */}
        <div>
          <div className="px-2 text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold mb-1">
            Graph & Intelligence
          </div>
          <div className="space-y-0.5">
            {navItems.filter(i => i.category === 'intelligence').map(item => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    active 
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      item.badge === 'Conflict!' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse' 
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section: Governance */}
        <div>
          <div className="px-2 text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold mb-1">
            Evidence & Governance
          </div>
          <div className="space-y-0.5">
            {navItems.filter(i => i.category === 'governance').map(item => {
              const active = currentView === item.id;
              const accessible = hasAccess(item);

              if (!accessible) {
                return (
                  <div
                    key={item.id}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-slate-600 cursor-not-allowed opacity-50"
                    title={`Requires ${item.requiredPermission} permission`}
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-600">Locked</span>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    active 
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700/50">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[10px] text-slate-400 space-y-1 font-mono">
        <div className="flex justify-between items-center">
          <span>Security Ledger:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            SYNCHRONIZED
          </span>
        </div>
        <div className="text-slate-400 text-[9px] leading-tight">
          Investigator Support Mode • No Legal Accusations Generated
        </div>
      </div>

    </aside>
  );
};
