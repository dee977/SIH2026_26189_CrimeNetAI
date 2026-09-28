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
  const userRole = user?.grantedRole || 'RESTRICTED';

  const isSysAdmin = userRole === 'ADMIN';

  const navItems: NavItem[] = [
    // Core Investigation
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'core' },
    { id: 'search', label: 'Search & Entities', icon: <Search className="w-4 h-4" />, category: 'core', badge: 'Unified' },
    { id: 'cases', label: 'Cases & Dossiers', icon: <Briefcase className="w-4 h-4" />, category: 'core', badge: '2 Active' },
    { id: 'ingestion', label: 'Import Center', icon: <UploadCloud className="w-4 h-4" />, category: 'core', badge: 'CSV / PDF', requiredPermission: 'ingest:upload' },

    // Intelligence & Network Analysis
    { id: 'graph', label: 'Network Graph', icon: <Share2 className="w-4 h-4" />, category: 'intelligence' },
    { id: 'hidden-discovery', label: 'Hidden Relationships', icon: <GitMerge className="w-4 h-4" />, category: 'intelligence', badge: 'Multi-hop' },
    { id: 'analytics', label: 'Graph Analytics', icon: <BarChart3 className="w-4 h-4" />, category: 'intelligence' },
    { id: 'community', label: 'Community Clusters', icon: <Layers className="w-4 h-4" />, category: 'intelligence' },
    { id: 'timeline', label: 'Timeline Explorer', icon: <Clock className="w-4 h-4" />, category: 'intelligence' },
    { id: 'gis', label: 'GIS Tactical Map', icon: <MapPin className="w-4 h-4" />, category: 'intelligence' },
    { id: 'verification', label: 'Cross-Verification', icon: <AlertOctagon className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'verification:read', badge: 'Conflict!' },

    // Law Enforcement Governance
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" />, category: 'governance', badge: 'Grounded' },
    { id: 'evidence', label: 'Evidence & SHA-256', icon: <FileCheck className="w-4 h-4" />, category: 'governance', badge: 'BSA §63' },
    { id: 'alerts', label: 'Alerts & Anomalies', icon: <Bell className="w-4 h-4" />, category: 'governance', badge: '4 New', requiredPermission: 'alert:read' },
    { id: 'watchlist', label: 'Watchlist Monitor', icon: <Eye className="w-4 h-4" />, category: 'governance' },
    
    { id: 'reports', label: 'Investigation Reports', icon: <FileText className="w-4 h-4" />, category: 'governance' },
    { id: 'admin', label: 'Admin Console', icon: <Settings className="w-4 h-4" />, category: 'governance', requiredPermission: 'admin:read' },
    { id: 'authority', label: 'System Admin', icon: <Settings className="w-4 h-4" />, category: 'governance', requiredPermission: 'admin:read' },
  ];


  const hasAccess = (item: NavItem) => {
    if (isSysAdmin) return true;
    if (!item.requiredPermission) return true;
    return userPermissions.includes(item.requiredPermission) || (item.requiredPermission === 'admin:read' && userPermissions.includes('admin'));
  };

  return (
    <aside className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-hover)] flex flex-col shrink-0 min-h-screen select-none">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-[var(--sidebar-hover)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--accent)] shadow-sm shadow-[var(--primary)]/10">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-[var(--sidebar-text)] tracking-tight">CrimeNet AI</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/20 text-[var(--accent)] font-mono font-semibold">M1</span>
            </div>
            <p className="text-[10px] text-[var(--sidebar-text-muted)] font-mono">SIH26189 Investigator Support</p>
          </div>
        </div>
      </div>

      {/* Role / Officer Card */}
      <div className="px-3.5 py-2.5 bg-[var(--sidebar-hover)]/40 border-b border-[var(--sidebar-hover)]">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sidebar-text-muted)] font-mono font-semibold">Active Session</p>
            <p className="text-xs font-semibold text-[var(--sidebar-text)] truncate">{user?.name || 'Authorized Officer'}</p>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[var(--sidebar-active)]/20 text-[var(--accent)] border border-[var(--sidebar-active)]/40">
            {userRole}
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        
        {/* Section: Core */}
        <div>
          <div className="px-2 text-[10px] uppercase font-mono tracking-wider text-[var(--sidebar-text-muted)] font-semibold mb-1">
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
                      ? 'bg-[var(--sidebar-active)] text-white shadow-sm' 
                      : 'text-[var(--sidebar-text-muted)] hover:text-white hover:bg-[var(--sidebar-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white border border-white/20">
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
          <div className="px-2 text-[10px] uppercase font-mono tracking-wider text-[var(--sidebar-text-muted)] font-semibold mb-1">
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
                      ? 'bg-[var(--sidebar-active)] text-white shadow-sm' 
                      : 'text-[var(--sidebar-text-muted)] hover:text-white hover:bg-[var(--sidebar-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      item.badge === 'Conflict!' 
                        ? 'bg-[var(--danger)] text-white border border-[var(--danger)] animate-pulse' 
                        : 'bg-white/10 text-white border border-white/20'
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
          <div className="px-2 text-[10px] uppercase font-mono tracking-wider text-[var(--sidebar-text-muted)] font-semibold mb-1">
            Evidence & Governance
          </div>
          <div className="space-y-0.5">
            {navItems.filter(i => i.category === 'governance').map(item => {
              const active = currentView === item.id;
              const accessible = hasAccess(item);

              if (!accessible) return null;

              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    active 
                      ? 'bg-[var(--sidebar-active)] text-white shadow-sm' 
                      : 'text-[var(--sidebar-text-muted)] hover:text-white hover:bg-[var(--sidebar-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white border border-white/20">
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
      <div className="p-3 border-t border-[var(--sidebar-hover)] bg-[var(--sidebar-hover)]/30 text-[10px] text-[var(--sidebar-text-muted)] space-y-1 font-mono">
        <div className="flex justify-between items-center">
          <span>Security Ledger:</span>
          <span className="text-[var(--success)] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-ping" />
            SYNCHRONIZED
          </span>
        </div>
        <div className="text-[var(--sidebar-text-muted)] text-[9px] leading-tight opacity-70">
          Investigator Support Mode
        </div>
      </div>

    </aside>
  );
};
