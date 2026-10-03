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
  if (user?.status === 'PENDING') {
    return <PendingApprovalView />;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden select-none">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-7xl mx-auto pb-20">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
      {isSessionExpired && <SessionExpiredModal />}
    </div>
  );
};
