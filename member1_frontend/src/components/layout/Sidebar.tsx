import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNavigationStore } from '../../store/navigationStore';
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
  path: string;
  label: string;
  icon: React.ReactNode;
  category: 'core' | 'intelligence' | 'governance';
  badge?: string;
  requiredPermission?: string;
}

export const Sidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar } = useNavigationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const userRole = normalizeRole(user?.grantedRole);
  const roleConfig = ROLE_CONFIGS[userRole] || ROLE_CONFIGS.INVESTIGATOR;

  const navItems: NavItem[] = [
    // Core Investigation
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'core', requiredPermission: 'dashboard:read' },
    { path: '/entities', label: 'Search & Entities', icon: <Search className="w-4 h-4" />, category: 'core', requiredPermission: 'dashboard:read' },
    { path: '/cases', label: 'Cases & Dossiers', icon: <Briefcase className="w-4 h-4" />, category: 'core', requiredPermission: 'dashboard:read' },
    { path: '/import', label: 'Import Center', icon: <UploadCloud className="w-4 h-4" />, category: 'core', requiredPermission: 'evidence:write' },

    // Intelligence & Network Analysis
    { path: '/graph', label: 'Network Graph', icon: <Share2 className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'graph:read' },
    { path: '/graph/hidden', label: 'Hidden Relationships', icon: <GitMerge className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'graph:read' },
    { path: '/graph/analytics', label: 'Graph Analytics', icon: <BarChart3 className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'analytics:read' },
    { path: '/graph/communities', label: 'Community Clusters', icon: <Layers className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'analytics:read' },
    { path: '/timeline', label: 'Timeline Explorer', icon: <Clock className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'timeline:read' },
    { path: '/gis', label: 'GIS Tactical Map', icon: <MapPin className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'graph:read' },
    { path: '/verification', label: 'Cross-Verification', icon: <AlertOctagon className="w-4 h-4" />, category: 'intelligence', requiredPermission: 'verification:read' },

    // Law Enforcement Governance
    { path: '/assistant', label: 'AI Assistant', icon: <Bot className="w-4 h-4" />, category: 'governance', requiredPermission: 'dashboard:read' },
    { path: '/evidence', label: 'Evidence & SHA-256', icon: <FileCheck className="w-4 h-4" />, category: 'governance', requiredPermission: 'verification:read' },
    { path: '/alerts', label: 'Alerts & Anomalies', icon: <Bell className="w-4 h-4" />, category: 'governance', requiredPermission: 'dashboard:read' },
    { path: '/watchlist', label: 'Watchlist Monitor', icon: <Eye className="w-4 h-4" />, category: 'governance', requiredPermission: 'dashboard:read' },
    { path: '/reports', label: 'Investigation Reports', icon: <FileText className="w-4 h-4" />, category: 'governance', requiredPermission: 'report:generate' },
    { path: '/admin', label: 'Admin Console', icon: <Settings className="w-4 h-4" />, category: 'governance', requiredPermission: 'admin:write' },
  ];

  const hasAccess = (item: NavItem) => {
    if (userRole === 'ADMIN') return true;
    if (!item.requiredPermission) return true;
    return hasPermission(userRole, item.requiredPermission);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (typeof window !== 'undefined' && window.innerWidth < 768 && !isSidebarCollapsed) {
      toggleSidebar();
    }
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
            const active = location.pathname === item.path || (location.pathname.startsWith(`${item.path}/`) && !['/graph'].includes(item.path));
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  active 
                    ? 'bg-[var(--primary)] text-white shadow-sm font-semibold' 
                    : 'text-[var(--sidebar-text-muted)] hover:text-white hover:bg-[var(--sidebar-hover)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!isSidebarCollapsed && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 print:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 md:z-10 flex flex-col shrink-0 min-h-screen bg-[var(--sidebar-bg)] border-[var(--sidebar-hover)] select-none whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out shadow-2xl md:shadow-none ${
          isSidebarCollapsed
            ? 'w-0 -translate-x-full md:translate-x-0 md:w-0 border-r-0 opacity-0 pointer-events-none'
            : 'w-64 translate-x-0 border-r opacity-100'
        }`}
      >
        {/* Fixed 256px internal wrapper so contents remain aligned without squishing during width transition */}
        <div className="w-64 flex flex-col h-full min-h-screen">
          
          {/* Brand Header */}
          <div className="p-4 border-b border-[var(--sidebar-hover)] flex items-center justify-between">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <img src="/logo.png" alt="CrimeNet AI" className="h-10 w-auto max-w-[210px] object-contain object-left" />
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-[10px] text-[var(--sidebar-text-muted)] font-mono">SIH26189 Statutory Engine</p>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/20 text-[var(--accent)] font-mono font-semibold ml-auto">RBAC</span>
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

        </div>
      </aside>
    </>
  );
};


