import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiRequest } from '../../services/apiClient';
import { ShieldAlert, Clock, RefreshCw, LogOut, FileCheck2, User, Building, AlertCircle } from 'lucide-react';

export const PendingApprovalView: React.FC = () => {
  const { user, logout, setSession } = useAuthStore();
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setCheckMessage(null);
    try {
      const res = await apiRequest<any>('/auth/me');
      if (res.success && res.data) {
        const beUser = res.data;
        const grantedRole = (beUser.grantedRole || beUser.role || 'INVESTIGATOR').toUpperCase();
        // User has been approved!
        setSession(localStorage.getItem('crimenet_auth_token') || '', {
          id: beUser.id || user?.id || 'usr-1',
          email: beUser.email || user?.email || '',
          name: beUser.fullName || user?.name || 'Officer',
          phone: user?.phone || '',
          officerId: beUser.badgeNumber || user?.officerId || 'LEO-7729',
          organization: beUser.agencyUnit || user?.organization || 'CrimeNet State Bureau',
          requestedRole: grantedRole,
          grantedRole: grantedRole,
          status: 'APPROVED',
          permissions: beUser.permissions || [],
          createdAt: user?.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        window.location.href = '/dashboard';
      } else {
        setCheckMessage('Enrolment status is still PENDING administrator clearance. Please check back shortly.');
      }
    } catch (err: any) {
      setCheckMessage('Enrolment status is still PENDING administrator clearance. Please check back shortly.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 select-none">
      {/* Background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-md text-center space-y-6">
        
        {/* CrimeNet AI Header */}
        <div className="flex items-center justify-center gap-3">
          <img src="/logo.png" alt="CrimeNet AI" className="h-12 w-auto object-contain" />
          <div className="text-left">
            <span className="text-sm font-black tracking-wider uppercase text-white block">CrimeNet AI</span>
            <span className="text-[10px] font-mono text-cyan-400 block">SIH26189 • Statutory Clearance Gate</span>
          </div>
        </div>

        {/* Warning Icon Badge */}
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10 animate-pulse">
          <Clock className="w-10 h-10" />
        </div>

        {/* Heading & Notice */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            Access Pending Approval
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Clearance Verification Underway
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            Your officer enrolment request is currently under review by the System Administrator. 
            In compliance with statutory evidentiary governance, operational access to cases, network intelligence, 
            and evidence repositories is restricted until supervisory approval is granted.
          </p>
        </div>

        {/* User Enrolment Details Card */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 text-left space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" /> Account:
            </span>
            <span className="font-bold text-slate-200">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-500" /> Requested Role:
            </span>
            <span className="font-bold text-amber-400">{user?.requestedRole || user?.grantedRole || 'INVESTIGATOR'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-slate-500" /> Clearance Status:
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-widest text-[10px]">
              Pending Clearance
            </span>
          </div>
        </div>

        {checkMessage && (
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{checkMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking Clearance Status...' : 'Check Approval Status'}
          </button>

          <button
            onClick={logout}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        <p className="text-[10px] text-slate-500 font-mono">
          Need urgent access? Contact your supervisory clearance officer or the State Police Cyber Cell Administrator.
        </p>

      </div>
    </div>
  );
};
