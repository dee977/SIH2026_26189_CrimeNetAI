import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../services/supabaseClient';
import { Sidebar } from '../layout/Sidebar';
import { TopNav } from '../layout/TopNav';
import { ToastContainer } from '../common/ToastContainer';
import { SessionExpiredModal } from '../common/UIStates';
import { canAccessView, normalizeRole } from '../../utils/rbac';

import { PendingApprovalView } from './PendingApprovalView';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isSessionExpired, user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      setIsInitialized(true);
    });
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-primary)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-color)]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Block unapproved users from accessing the app routes
  if (user?.status === 'PENDING' || user?.status === 'PENDING_APPROVAL') {
    return <PendingApprovalView />;
  }

  const isFullBleed = location.pathname === '/gis';

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden select-none print:h-auto print:overflow-visible print:block print:select-auto print:bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out print:overflow-visible print:block print:h-auto print:transition-none">
        <TopNav />
        {isFullBleed ? (
          <main className="flex-1 min-h-0 min-w-0 relative overflow-hidden flex flex-col print:p-0 print:overflow-visible print:block print:h-auto print:static">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 overflow-y-auto p-6 relative print:p-0 print:overflow-visible print:block print:h-auto print:static">
            <div className="max-w-7xl mx-auto pb-20 print:max-w-full print:p-0 print:m-0 print:pb-0">
              <Outlet />
            </div>
          </main>
        )}
      </div>
      <div className="print:hidden">
        <ToastContainer />
      </div>
      {isSessionExpired && <SessionExpiredModal />}
    </div>
  );
};
