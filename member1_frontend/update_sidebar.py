import re

with open('src/components/layout/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """const userPermissions = user?.permissions || [];
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
  ];

  const hasAccess = (item: NavItem) => {
    if (isSysAdmin) return true;
    if (!item.requiredPermission) return true;
    return userPermissions.includes(item.requiredPermission);
  };"""

pattern = re.compile(r"const userPermissions = user\?\.permissions \|\| \[\];.*?const hasAccess = \(item: NavItem\) => \{.*?\};", re.DOTALL)
content = pattern.sub(replacement.strip(), content)

pattern2 = re.compile(r"if \(\!accessible\) \{\s*return \(\s*<div.*?</div>\s*\);\s*\}", re.DOTALL)
content = pattern2.sub("if (!accessible) return null;", content)

with open('src/components/layout/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
