import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, getPermissionsForRole } from './store/authStore';
import { supabase } from './services/supabaseClient';
import { apiRequest } from './services/apiClient';

// Public Pages
import { LandingPage } from './components/public/LandingPage';
import { AboutPage } from './components/public/AboutPage';
import { LoginPage } from './components/public/LoginPage';
import { RegisterPage } from './components/public/RegisterPage';
import { ForgotPasswordPage } from './components/public/ForgotPasswordPage';
import { ResetPasswordPage } from './components/public/ResetPasswordPage';

// Layout & Common
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { NotFoundView } from './components/common/NotFoundView';
import { AccessDeniedView } from './components/common/AccessDeniedView';
import { canAccessView, VIEW_REQUIRED_PERMISSIONS, normalizeRole } from './utils/rbac';
import { AppView } from './store/navigationStore';

// Main Application Modules
import { InvestigatorDashboard } from './components/dashboard/InvestigatorDashboard';
import { UnifiedEntitySearchView } from './components/entity/UnifiedEntitySearchView';
import { CaseManagementView } from './components/cases/CaseManagementView';
import { InvestigationWorkspace } from './components/cases/InvestigationWorkspace';
import { NetworkGraphView } from './components/graph/NetworkGraphView';
import { HiddenRelationshipDiscovery } from './components/graph/HiddenRelationshipDiscovery';
import { GraphAnalyticsView } from './components/graph/GraphAnalyticsView';
import { CommunityView } from './components/graph/CommunityView';
import { GISMapView } from './components/gis/GISMapView';
import { EvidenceView } from './components/evidence/EvidenceView';
import { WatchlistView } from './components/watchlist/WatchlistView';
import { AlertsView } from './components/alerts/AlertsView';
import { ReportView } from './components/reports/ReportView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { AIAssistantView } from './components/assistant/AIAssistantView';

import { ImportCenterView } from './components/ingestion/ImportCenterView';
import { TimelineView } from './components/timeline/TimelineView';
import { CrossVerificationView } from './components/verification/CrossVerificationView';

async function syncUserWithBackend(session: any, setSession: any) {
  if (!session) return;
  const userEmail = (session.user.email || '').toLowerCase();
  const isDemoAccount = ['admin123@gov.in', 'investigator123@gov.in', 'analyst123@gov.in', 'auditor123@gov.in'].includes(userEmail);
  const localActiveRole = typeof localStorage !== 'undefined' ? localStorage.getItem('crimenet_active_role') : null;
  const defaultRole = (localActiveRole || session.user.user_metadata?.role || 'INVESTIGATOR').toUpperCase();
  const defaultPerms = getPermissionsForRole(defaultRole as any);

  try {
    const resp = await apiRequest<any>('/auth/me');
    if (resp.success && resp.data) {
       const beUser = resp.data;
       const grantedRole = (beUser.grantedRole || beUser.role || defaultRole).toUpperCase();
       setSession(session.access_token, {
          id: session.user.id,
          email: beUser.email || session.user.email,
          name: beUser.fullName || session.user.user_metadata?.name || 'Officer',
          phone: session.user.user_metadata?.phone || '',
          officerId: beUser.badgeNumber || session.user.user_metadata?.officerId || 'LEO-7729',
          organization: beUser.agencyUnit || 'CrimeNet State Bureau',
          requestedRole: (beUser.role || defaultRole).toUpperCase(),
          grantedRole: grantedRole,
          status: beUser.isActive !== false ? 'APPROVED' : 'SUSPENDED',
          permissions: (beUser.permissions && beUser.permissions.length > 0) ? beUser.permissions : getPermissionsForRole(grantedRole as any),
          createdAt: session.user.created_at,
          lastLogin: new Date().toISOString()
       });
       return;
    }
  } catch (err: any) {
    const errMsg = (err.message || '').toLowerCase();
    const isPending = err.status === 403 || errMsg.includes('pending') || errMsg.includes('clearance') || errMsg.includes('approval');
    
    if (isPending || err.status === 401 || err.status === 403) {
      await supabase.auth.signOut();
      try {
        localStorage.removeItem('crimenet_auth_token');
        localStorage.removeItem('crimenet_user_profile');
        localStorage.removeItem('crimenet_active_role');
      } catch (_) {}
      setSession(null, null);
      return;
    }
  }

  // Fallback for demo accounts
  if (isDemoAccount) {
    setSession(session.access_token, {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || 'Officer',
      phone: session.user.user_metadata?.phone || '',
      officerId: session.user.user_metadata?.officerId || 'LEO-7729',
      organization: session.user.user_metadata?.organization || 'CrimeNet State Bureau',
      requestedRole: defaultRole,
      grantedRole: defaultRole,
      status: 'APPROVED',
      permissions: defaultPerms,
      createdAt: session.user.created_at,
      lastLogin: new Date().toISOString()
    });
  }
}

const RouteGuard = ({ viewId, children }: { viewId: AppView, children: React.ReactNode }) => {
  const { user } = useAuthStore();
  const userRole = normalizeRole(user?.grantedRole);
  const isAllowed = canAccessView(userRole, viewId);

  if (!isAllowed) {
    return (
      <AccessDeniedView 
        view={viewId}
        requiredPermission={VIEW_REQUIRED_PERMISSIONS[viewId]}
        currentRole={userRole}
        onBackToDashboard={() => { window.location.href = '/dashboard'; }}
      />
    );
  }
  return <>{children}</>;
};

const SettingsPlaceholder = () => (
  <div className="p-6">
    <h2 className="text-2xl font-bold mb-4">Settings</h2>
    <p>Settings configuration goes here.</p>
  </div>
);

const AuthListener = () => {
  const { setSession } = useAuthStore();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        syncUserWithBackend(session, setSession);
      } else if (event === 'SIGNED_OUT') {
        setSession(null, null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return null;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthListener />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<RouteGuard viewId="dashboard"><InvestigatorDashboard /></RouteGuard>} />
          <Route path="/cases" element={<RouteGuard viewId="cases"><CaseManagementView /></RouteGuard>} />
          <Route path="/cases/:caseId" element={<RouteGuard viewId="case-workspace"><InvestigationWorkspace /></RouteGuard>} />
          <Route path="/import" element={<RouteGuard viewId="ingestion"><ImportCenterView /></RouteGuard>} />
          <Route path="/evidence" element={<RouteGuard viewId="evidence"><EvidenceView /></RouteGuard>} />
          <Route path="/entities" element={<RouteGuard viewId="entity"><UnifiedEntitySearchView /></RouteGuard>} />
          
          <Route path="/graph" element={<RouteGuard viewId="graph"><NetworkGraphView /></RouteGuard>} />
          <Route path="/graph/analytics" element={<RouteGuard viewId="analytics"><GraphAnalyticsView /></RouteGuard>} />
          <Route path="/graph/hidden" element={<RouteGuard viewId="hidden-discovery"><HiddenRelationshipDiscovery /></RouteGuard>} />
          <Route path="/graph/communities" element={<RouteGuard viewId="community"><CommunityView /></RouteGuard>} />
          
          <Route path="/gis" element={<RouteGuard viewId="gis"><GISMapView /></RouteGuard>} />
          <Route path="/alerts" element={<RouteGuard viewId="alerts"><AlertsView /></RouteGuard>} />
          <Route path="/timeline" element={<RouteGuard viewId="timeline"><TimelineView /></RouteGuard>} />
          <Route path="/verification" element={<RouteGuard viewId="verification"><CrossVerificationView /></RouteGuard>} />
          <Route path="/watchlist" element={<RouteGuard viewId="watchlist"><WatchlistView /></RouteGuard>} />
          <Route path="/reports" element={<RouteGuard viewId="reports"><ReportView /></RouteGuard>} />
          <Route path="/assistant" element={<RouteGuard viewId="assistant"><AIAssistantView /></RouteGuard>} />
            <Route path="/settings" element={<SettingsPlaceholder />} />
          
          {/* Catch-all 404 inside protected layout? Or outside? The requirements say:
            "Include a `*` catch-all route for a professional 404 page (create `src/components/common/NotFoundView.tsx`)."
          */}
                    <Route path="/admin" element={<RouteGuard viewId="admin"><AdminDashboardView /></RouteGuard>} />
            <Route path="*" element={<NotFoundView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
