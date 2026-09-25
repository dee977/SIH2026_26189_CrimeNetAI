import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Shield, Lock, Mail, Phone, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types/auth';

export const LoginPage: React.FC = () => {
  const { setView } = useNavigationStore();
  const { login } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('v.rao@cid.police.gov.in');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Senior Investigator');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      login(identifier, selectedRole);
      addToast({
        type: 'success',
        title: 'Authentication Successful',
        message: `Welcome, ${identifier}. Authenticated as ${selectedRole}.`
      });
      setView('dashboard');
    }, 600);
  };

  const handleQuickDemoLogin = (role: UserRole, email: string) => {
    setIdentifier(email);
    setSelectedRole(role);
    login(email, role);
    addToast({
      type: 'success',
      title: 'Demo Persona Activated',
      message: `Logged in as ${role} for testing.`
    });
    setView('dashboard');
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
                setIdentifier('v.rao@cid.police.gov.in');
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
                setIdentifier('+91-98200-11223');
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
                <option value="Senior Investigator">Senior Investigator (Lead Case Officer)</option>
                <option value="Senior Authority">Senior Authority (Review & Approvals)</option>
                <option value="System Administrator">System Administrator (Master Control)</option>
                <option value="Investigator">Investigator (Field Operations)</option>
                <option value="Analyst / Viewer">Analyst / Viewer (Read-only)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span>Verifying Token...</span>
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
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Senior Investigator', 'v.rao@cid.police.gov.in')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-300 text-left transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Sr. Investigator</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('Senior Authority', 'r.verma@cid.police.gov.in')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-300 text-left transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Sr. Authority</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('System Administrator', 'admin@cid.police.gov.in')}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] text-slate-300 text-left transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">System Admin</span>
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
