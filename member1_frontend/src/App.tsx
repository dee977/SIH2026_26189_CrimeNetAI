import React from 'react';
import { useNavigationStore } from './store/navigationStore';
import { useAuthStore } from './store/authStore';

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

// Main Application Modules
import { InvestigatorDashboard } from './components/dashboard/InvestigatorDashboard';
import { GlobalSearch } from './components/search/GlobalSearch';
import { CaseManagementView } from './components/cases/CaseManagementView';
import { InvestigationWorkspace } from './components/cases/InvestigationWorkspace';
import { EntityExplorer } from './components/entity/EntityExplorer';
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

export const App: React.FC = () => {
  const { currentView, setView } = useNavigationStore();
  const { isAuthenticated, isSessionExpired } = useAuthStore();

  // Public standalone views
  if (currentView === 'landing') return <LandingPage />;
  if (currentView === 'about') return <AboutPage />;
  if (currentView === 'login') return <LoginPage />;
  if (currentView === 'register') return <RegisterPage />;
  if (currentView === 'forgot-password') return <ForgotPasswordPage />;

  // If not authenticated and trying to view app, redirect to login
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated Main Investigator Application Layout
  return (
    <div className="flex h-screen bg-[#080d1a] text-slate-100 overflow-hidden select-none">
      
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
            {currentView === 'search' && <GlobalSearch />}
            {currentView === 'cases' && <CaseManagementView />}
            {currentView === 'case-workspace' && <InvestigationWorkspace />}
            {currentView === 'entity' && <EntityExplorer />}
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

      {/* Interactive Continuous Demo Walkthrough Floating Ribbon */}
      <DemoWalkthroughBar />

      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Cryptographic Session Expiration Modal Simulation */}
      {isSessionExpired && <SessionExpiredModal />}

    </div>
  );
};

export default App;
