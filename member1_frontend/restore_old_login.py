import os

code = """import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useAuthStore, getPermissionsForRole } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Shield, Lock, Mail, Phone, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { UserRole, normalizeRole } from '../../utils/rbac';
import { supabase } from '../../services/supabaseClient';
import { apiRequest } from '../../services/apiClient';

export const LoginPage: React.FC = () => {
  const { setView } = useNavigationStore();
  const { setSession } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('INVESTIGATOR');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      let data: any, error: any, session: any;
      
      const res = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password
      });

      if (res.error) {
        setErrorMessage(res.error.message);
        setIsLoading(false);
        return;
      }
      session = res.data?.session;

      if (!session) {
        setErrorMessage('Failed to establish secure session.');
        setIsLoading(false);
        return;
      }

      let userStoredRole = (
        session.user.user_metadata?.role ||
        session.user.app_metadata?.role
      );

      // Check backend /auth/me to get the true approved role from PostgreSQL database
      try {
        const token = session.access_token;
        const meRes = await apiRequest<any>('/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!meRes.success && (meRes.error === 'Unauthorized' || meRes.error === 'Permission denied' || meRes.error === 'Not found')) {
            setErrorMessage('Your account is pending Admin approval. You cannot log in yet.');
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
        }
        
        if (meRes.success && meRes.data?.grantedRole) {
          userStoredRole = meRes.data.grantedRole;
        }
      } catch (meErr: any) {
          console.warn('Backend /auth/me lookup notice:', meErr);
          if (meErr.message === 'Unauthorized' || meErr.status === 401) {
            setErrorMessage('Your account is pending Admin approval. You cannot log in yet.');
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
      }

      let effectiveRole: UserRole = selectedRole;

      if (userStoredRole) {
        const normalizedStoredRole = userStoredRole.toUpperCase();
        if (normalizedStoredRole !== selectedRole.toUpperCase()) {
          setErrorMessage(`Access Denied: Your account is provisioned for the ${normalizedStoredRole} role. Please select ${normalizedStoredRole} to login.`);
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }
        effectiveRole = normalizeRole(userStoredRole);
      }

      // Update local auth context
      const permissions = getPermissionsForRole(effectiveRole);
      setSession(session.access_token, {
        id: session.user.id,
        email: session.user.email || identifier,
        name: session.user.user_metadata?.name || (identifier.split('@')[0].replace('.', ' ').toUpperCase()),
        phone: session.user.user_metadata?.phone || '',
        officerId: session.user.user_metadata?.officerId || (effectiveRole === 'ADMIN' ? 'ADM-001' : 'LEO-7729'),
        organization: session.user.user_metadata?.organization || 'CrimeNet State Bureau',
        requestedRole: effectiveRole,
        grantedRole: effectiveRole,
        permissions: permissions
      });

      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome back. Clearance Level: ${effectiveRole}`
      });
      // App.tsx AuthListener will catch the session and redirect automatically

    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: UserRole, email: string) => {
    setSelectedRole(role);
    setLoginMethod('email');
    setIdentifier(email);
    setPassword('123456'); // The real dev database password we use for tests
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-cyan-500/30">
      
      {/* Background Decor */}
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3 shadow-lg shadow-cyan-500/10">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Law Enforcement Terminal</h2>
          <p className="text-xs text-slate-400 mt-1">CrimeNet AI Secure Authentication Station (M6 Node)</p>
        </div>

        {/* Card */}
        <div className="glass-panel bg-slate-950/85 rounded-2xl border-slate-800 p-7 shadow-2xl backdrop-blur-xl">
          
          {/* Email / Phone Toggle */}
          <div className="flex rounded-lg bg-slate-900 p-1 mb-5 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email');
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                loginMethod === 'email' ? 'bg-cyan-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Email Address
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('phone');
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                loginMethod === 'phone' ? 'bg-cyan-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Phone Number
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                {loginMethod === 'email' ? 'Officer Email' : 'Authorized Phone'}
              </label>
              <div className="relative">
                {loginMethod === 'email' ? (
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                ) : (
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                )}
                <input
                  type={loginMethod === 'email' ? 'email' : 'text'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setView('forgot-password')}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Active Authorization Profile
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ADMIN">Administrator (Master Control)</option>
                <option value="INVESTIGATOR">Investigator (Field Operations)</option>
                <option value="ANALYST">Analyst (Intelligence & ML)</option>
                <option value="AUDITOR">Auditor (Statutory Review)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>Authenticating Clearance...</span>
              ) : (
                <>
                  <span>Sign In To Workstation</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 text-center">
              Evaluator Quick Access (Hackathon Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMIN', 'yakshvachhani1@gmail.com')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-300 text-left transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Admin Account</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('INVESTIGATOR', 'investigator123@gov.in')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-300 text-left transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Test Investigator</span>
              </button>
            </div>
          </div>

          {/* Link to Register */}
          <div className="mt-5 text-center">
            <span className="text-xs text-slate-400">Need officer enrollment? </span>
            <button
              onClick={() => setView('register')}
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              Register Officer ID
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
"""

with open("src/components/public/LoginPage.tsx", "w", encoding="utf-8") as f:
    f.write(code)
print("Restored!")
