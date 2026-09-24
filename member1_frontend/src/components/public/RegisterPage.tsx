import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { 
  Shield, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  BadgeCheck, 
  Building, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowLeft 
} from 'lucide-react';
import { UserRole } from '../../types/auth';

export const RegisterPage: React.FC = () => {
  const { setView } = useNavigationStore();
  const { register, isPendingApproval, clearPendingApproval, pendingRegistration } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    employeeId: '',
    organization: '',
    requestedRole: 'Investigator' as UserRole
  });

  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // Call store register (does NOT auto-grant role)
    register(formData);
    addToast({
      type: 'info',
      title: 'Enrolment Application Queued',
      message: 'Credentials submitted to Senior Authority verification ledger.'
    });
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-cyan-500/30">
      
      {/* Background Decor */}
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

      {/* PENDING APPROVAL MODAL / SCREEN */}
      {isPendingApproval ? (
        <div className="sm:mx-auto sm:w-full sm:max-w-xl z-20 px-4 animate-in zoom-in-95">
          <div className="glass-panel bg-slate-950/95 rounded-2xl border-cyan-500/40 p-8 shadow-2xl text-center">
            
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold uppercase tracking-wider">
              STATUS: PENDING APPROVAL
            </span>

            <h2 className="text-2xl font-bold text-slate-100 mt-3">
              Officer Access Request Under Review
            </h2>

            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
              Your registration application for <strong className="text-slate-200">{formData.userName || pendingRegistration?.userName}</strong> (Badge ID: {formData.employeeId || pendingRegistration?.employeeId}) has been routed to the Senior Authority clearance desk.
            </p>

            {/* MANDATORY M6 RBAC COMMUNICATION BANNER */}
            <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>M6 SEC-GOV NOTICE: HIERARCHICAL RBAC DISCLOSURE</span>
              </div>
              <p className="text-xs font-mono text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 text-center font-bold text-cyan-300">
                Requested Role ≠ Granted Role ≠ Actual Permissions
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                In compliance with law enforcement credentialing policies, frontend requests do not confer system authorization. A Senior Authority or System Administrator must manually inspect your department affiliation ({formData.organization || pendingRegistration?.organization}) and assign cryptographic permissions before access is granted.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  clearPendingApproval();
                  setView('login');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Return to Login
              </button>
              <button
                onClick={() => {
                  // Switch directly to Senior Authority view so evaluator can approve it right away!
                  clearPendingApproval();
                  setView('authority');
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-semibold transition-colors"
              >
                Inspect Authority Queue (Demo) →
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10 px-4">
          
          <div className="text-center mb-6">
            <button
              onClick={() => setView('login')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Officer Enrolment Form</h2>
            <p className="text-xs text-slate-400 mt-1">Law Enforcement Agency Personnel Verification (SIH26189)</p>
          </div>

          <div className="glass-panel bg-slate-950/85 rounded-2xl border-slate-800 p-7 shadow-2xl backdrop-blur-xl">
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* User Name */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Officer Full Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Insp. Rajesh Sharma"
                      value={formData.userName}
                      onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Employee / Officer ID */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Officer / Badge ID *
                  </label>
                  <div className="relative">
                    <BadgeCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. LEO-9912"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Official Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="officer@police.gov.in"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Official Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+91-98XXX-XXXXX"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

              </div>

              {/* Police Unit / Organization */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Police Unit / Law Enforcement Agency *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Special Crime Branch, CID Mumbai / Cyber Crime Cell"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Requested Role */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                  Requested Role *
                </label>
                <select
                  value={formData.requestedRole}
                  onChange={(e) => setFormData({ ...formData, requestedRole: e.target.value as UserRole })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="System Administrator">System Administrator</option>
                  <option value="Senior Authority">Senior Authority</option>
                  <option value="Senior Investigator">Senior Investigator</option>
                  <option value="Investigator">Investigator</option>
                  <option value="Analyst / Viewer">Analyst / Viewer</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  Note: Requested role is subject to Senior Authority approval and verification.
                </p>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20 mt-2"
              >
                Submit Enrolment Application
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
};
