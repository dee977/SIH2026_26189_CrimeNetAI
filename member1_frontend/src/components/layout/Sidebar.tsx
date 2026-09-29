import React from 'react';
import { useNavigationStore, AppView } from '../../store/navigationStore';
import { useAuthStore } from '../../store/authStore';
import { hasPermission, normalizeRole, ROLE_CONFIGS } from '../../utils/rbac';
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
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
  Settings,
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

  const userRole = normalizeRole(user?.grantedRole);
  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.INVESTIGATOR;

  const navItems: NavItem[] = [
    // Core Investigation
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'core', requiredPermission: 'dashboard:read' },
    { id: 'search', label: 'Search & Entities', icon: <Search className="w-4 h-4" />, category: 'core', badge: 'Unified', requiredPermission: 'dashboard:read' },
    { id: 'cases', label: 'Cases & Dossiers', icon: <Briefcase className="w-4 h-4" />, category: 'core', badge: '2 Active', requiredPermission: 'dashboard:read' },
    { id: 'ingestion', label: 'Import Center', icon: <UploadCloud className="w-4 h-4" />, category: 'core', badge: 'CSV / PDF', requiredPermission: 'evidence:write' },

    // Intelligence & Network Analysis
    { id: 'graph', label: 'Network Graph', icon: <Share2 className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'graph:read' },
    { id: 'hidden-discovery', label: 'Hidden Relationships', icon: <GitMerge className="w-4 h-4" />, category: 'intelligence', badge: 'Multi-hop', requiredPermission: 'graph:read' },
    { id: 'analytics', label: 'Graph Analytics', icon: <BarChart3 className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'analytics:read' },
    { id: 'community', label: 'Community Clusters', icon: <Layers className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'analytics:read' },
    { id: 'timeline', label: 'Timeline Explorer', icon: <Clock className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'timeline:read' },
    { id: 'gis', label: 'GIS Tactical Map', icon: <MapPin className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'graph:read' },
    { id: 'verification', label: 'Cross-Verification', icon: <AlertOctagon className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'verification:read', badge: 'Conflict!' },

    // Law Enforcement Governance
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" />, category: 'governance', badge: 'Grounded', requiredPermission: 'dashboard:read' },
    { id: 'evidence', label: 'Evidence & SHA-256', icon: <FileCheck className="w-4 h-4" />, category: 'governance', badge: 'BSA §63', requiredPermission: 'verification:read' },
    { id: 'alerts', label: 'Alerts & Anomalies', icon: <Bell className="w-4 h-4" />, category: 'governance', badge: '4 New', requiredPermission: 'dashboard:read' },
    { id: 'watchlist', label: 'Watchlist Monitor', icon: <Eye className="w-4 h-4" />, category: 'governance', requiredPermission: 'dashboard:read' },
    { id: 'reports', label: 'Investigation Reports', icon: <FileText className="w-4 h-4" />, category: 'governance', requiredPermission: 'report:generate' },
    { id: 'admin', label: 'Admin Console', icon: <Settings className="w-4 h-4" />, category: 'governance', requiredPermission: 'admin:write' },
  ];

  const hasAccess = (item: NavItem) => {
    if (userRole === 'ADMIN') return true;
    if (!item.requiredPermission) return true;
    return hasPermission(userRole, item.requiredPermission);
  };

  const renderNavSection = (category: 'core' | 'intelligence' | 'governance', title: string) => {
    const accessibleItems = navItems.filter(i => i.category === category && hasAccess(i));
    if (accessibleItems.length === 0) return null;

    return (
      <div>
        <div className="px-2 text-[10px] uppercase font-mono tracking-wider text-[var(--sidebar-text-muted)] font-semibold mb-1">
          {title}
        </div>
        <div className="space-y-0.5">
          {accessibleItems.map(item => {
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
    );
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
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/20 text-[var(--accent)] font-mono font-semibold">RBAC</span>
            </div>
            <p className="text-[10px] text-[var(--sidebar-text-muted)] font-mono">SIH26189 Statutory Engine</p>
          </div>
        </div>
      </div>

      {/* Role / Officer Card */}
      <div className="px-3.5 py-3 bg-[var(--sidebar-hover)]/40 border-b border-[var(--sidebar-hover)]">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--sidebar-text-muted)] font-mono font-semibold">Active Clearance</p>
            <p className="text-xs font-semibold text-[var(--sidebar-text)] truncate">{user?.name || user?.email || 'Authorized Officer'}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase border shadow-sm ${roleConfig.badgeClass}`}>
            Role: {userRole}
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {renderNavSection('core', 'Case Operations')}
        {renderNavSection('intelligence', 'Graph & Intelligence')}
        {renderNavSection('governance', 'Evidence & Governance')}
      </div>

      {/* Security Status Footer */}
      <div className="p-3 border-t border-[var(--sidebar-hover)] bg-[var(--sidebar-hover)]/20 text-[10px] font-mono text-[var(--sidebar-text-muted)] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Statutory RBAC Active</span>
        </span>
        <span className="text-cyan-400 font-bold uppercase">{userRole}</span>
      </div>

    </aside>
  );
};
