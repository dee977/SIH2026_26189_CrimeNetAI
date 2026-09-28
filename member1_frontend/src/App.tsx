import React from 'react';
import { useNavigationStore } from './store/navigationStore';
import { useAuthStore, getPermissionsForRole } from './store/authStore';
import { supabase } from './services/supabaseClient';
import { apiRequest } from './services/apiClient';

// Layout & Common
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { ToastContainer } from './components/common/ToastContainer';
import { SessionExpiredModal } from './components/common/UIStates';
import { DemoWalkthroughBar } from './components/demo/DemoWalkthroughBar';

// Public Pages
import { LandingPage } from './components/public/LandingPage';
import { AboutPage } from './components/public/AboutPage';
import { LoginPage } from './components/public/LoginPage';
import { RegisterPage } from './components/public/RegisterPage';
import { ForgotPasswordPage } from './components/public/ForgotPasswordPage';
import { ResetPasswordPage } from './components/public/ResetPasswordPage';

// Main Application Modules
import { InvestigatorDashboard } from './components/dashboard/InvestigatorDashboard';
import { UnifiedEntitySearchView } from './components/entity/UnifiedEntitySearchView';
import { CaseManagementView } from './components/cases/CaseManagementView';
import { InvestigationWorkspace } from './components/cases/InvestigationWorkspace';
import { NetworkGraphView } from './components/graph/NetworkGraphView';
import { HiddenRelationshipDiscovery } from './components/graph/HiddenRelationshipDiscovery';
import { GraphAnalyticsView } from './components/graph/GraphAnalyticsView';
import { CommunityView } from './components/graph/CommunityView';
import { TimelineView } from './components/timeline/TimelineView';
import { GISMapView } from './components/gis/GISMapView';
import { CrossVerificationView } from './components/verification/CrossVerificationView';
import { EvidenceView } from './components/evidence/EvidenceView';
import { WatchlistView } from './components/watchlist/WatchlistView';
import { AlertsView } from './components/alerts/AlertsView';
import { AIAssistantView } from './components/assistant/AIAssistantView';
import { AuthorityDashboardView } from './components/authority/AuthorityDashboardView';
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { ReportView } from './components/reports/ReportView';
import { ImportCenterView } from './components/ingestion/ImportCenterView';


async function syncUserWithBackend(session: any, setSession: any) {
  if (!session) return;
  
  const defaultRole = (session.user.user_metadata?.role || 'INVESTIGATOR').toUpperCase();
  const defaultPerms = getPermissionsForRole(defaultRole as any);

  // Set active session immediately so that views and auth guards do not bounce to login
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
    }
  } catch (err) {
    console.warn("Backend profile sync warning, maintaining active session:", err);
  }
}

export const App: React.FC = () => {
  const { currentView, setView } = useNavigationStore();
  const { isAuthenticated, isSessionExpired, setSession } = useAuthStore();
  const currentViewRef = React.useRef(currentView);
  currentViewRef.current = currentView;

  React.useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        syncUserWithBackend(session, setSession);
      } else {
        const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('crimenet_auth_token') : null;
        if (!storedToken) {
          setSession(null, null);
        }
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        syncUserWithBackend(session, setSession);
        
        if (event === 'PASSWORD_RECOVERY') {
          setView('reset-password');
        } else if (['login', 'register', 'forgot-password'].includes(currentViewRef.current)) {
          setView('dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null, null);
        if (!['landing', 'about', 'login', 'register', 'forgot-password', 'reset-password'].includes(currentViewRef.current)) {
          setView('login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setView, setSession]);

  // Public standalone views
  if (currentView === 'landing') return <LandingPage />;
  if (currentView === 'about') return <AboutPage />;
  if (currentView === 'login') return <LoginPage />;
  if (currentView === 'register') return <RegisterPage />;
  if (currentView === 'forgot-password') return <ForgotPasswordPage />;
  if (currentView === 'reset-password') return <ResetPasswordPage />;

  // If not authenticated and trying to view app, redirect to login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated Main Investigator Application Layout
  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden select-none">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Navigation */}
        <TopNav />

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-7xl mx-auto pb-20">
            {currentView === 'dashboard' && <InvestigatorDashboard />}
            {currentView === 'search' && <UnifiedEntitySearchView />}
            {currentView === 'cases' && <CaseManagementView />}
            {currentView === 'case-workspace' && <InvestigationWorkspace />}
            {currentView === 'entity' && <UnifiedEntitySearchView />}
            {currentView === 'graph' && <NetworkGraphView />}
            {currentView === 'hidden-discovery' && <HiddenRelationshipDiscovery />}
            {currentView === 'analytics' && <GraphAnalyticsView />}
            {currentView === 'community' && <CommunityView />}
            {currentView === 'timeline' && <TimelineView />}
            {currentView === 'gis' && <GISMapView />}
            {currentView === 'verification' && <CrossVerificationView />}
            {currentView === 'evidence' && <EvidenceView />}
            {currentView === 'watchlist' && <WatchlistView />}
            {currentView === 'alerts' && <AlertsView />}
            {currentView === 'assistant' && <AIAssistantView />}
            {currentView === 'authority' && <AuthorityDashboardView />}
            {currentView === 'admin' && <AdminDashboardView />}
            {currentView === 'ingestion' && <ImportCenterView />}
            {currentView === 'reports' && <ReportView />}
          </div>
        </main>

      </div>

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Cryptographic Session Expiration Modal Simulation */}
      {isSessionExpired && <SessionExpiredModal />}

    </div>
  );
};

export default App;
