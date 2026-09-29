import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useAuthStore, getPermissionsForRole } from '../../store/authStore';
import { supabase } from '../../services/supabaseClient';
import { apiRequest } from '../../services/apiClient';
import { UserRole, normalizeRole } from '../../utils/rbac';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Shield, 
  AlertCircle, 
  Briefcase, 
  BarChart3, 
  FileCheck, 
  ShieldCheck, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface RoleOption {
  id: UserRole;
  title: string;
  badge: string;
  desc: string;
  icon: React.ReactNode;
  demoEmail: string;
  color: string;
  activeBorder: string;
  activeBg: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'ADMIN',
    title: 'ADMIN',
    badge: 'Supervisory Control',
    desc: 'Full administrative access, user RBAC promotion, and audit authority.',
    icon: <ShieldCheck className="w-5 h-5 text-rose-400" />,
    demoEmail: 'admin123@gov.in',
    color: 'text-rose-400',
    activeBorder: 'border-rose-500 shadow-rose-500/20',
    activeBg: 'bg-rose-500/10'
  },
  {
    id: 'INVESTIGATOR',
    title: 'INVESTIGATOR',
    badge: 'Case Operations',
    desc: 'Case file creation, evidence ingestion, and knowledge graph querying.',
    icon: <Briefcase className="w-5 h-5 text-blue-400" />,
    demoEmail: 'investigator123@gov.in',
    color: 'text-blue-400',
    activeBorder: 'border-blue-500 shadow-blue-500/20',
    activeBg: 'bg-blue-500/10'
  },
  {
    id: 'ANALYST',
    title: 'ANALYST',
    badge: 'Intelligence & ML',
    desc: 'Louvain community analysis, multi-hop discovery, and report generation.',
    icon: <BarChart3 className="w-5 h-5 text-cyan-400" />,
    demoEmail: 'analyst123@gov.in',
    color: 'text-cyan-400',
    activeBorder: 'border-cyan-500 shadow-cyan-500/20',
    activeBg: 'bg-cyan-500/10'
  },
  {
    id: 'AUDITOR',
    title: 'AUDITOR',
    badge: 'Statutory Review',
    desc: 'BSA §63 compliance, Merkle evidence audit ledger, and reports.',
    icon: <FileCheck className="w-5 h-5 text-amber-400" />,
    demoEmail: 'auditor123@gov.in',
    color: 'text-amber-400',
    activeBorder: 'border-amber-500 shadow-amber-500/20',
    activeBg: 'bg-amber-500/10'
  }
];

export const LoginPage: React.FC = () => {
  const { setView } = useNavigationStore();
  const { setSession } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('INVESTIGATOR');
  const [identifier, setIdentifier] = useState('investigator123@gov.in');
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const match = ROLE_OPTIONS.find(r => r.id === role);
    if (match) {
      setIdentifier(match.demoEmail);
      setPassword('Password123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const session = data?.session;
      if (!session) {
        setErrorMessage('Authentication succeeded but session token was not returned.');
        return;
      }

      const userEmail = (session.user.email || identifier || '').toLowerCase();
      const isDemoAccount = ['admin123@gov.in', 'investigator123@gov.in', 'analyst123@gov.in', 'auditor123@gov.in'].includes(userEmail);
      
      let effectiveRole: UserRole = selectedRole;

      if (!isDemoAccount) {
        // Read existing approved role from metadata or backend profile
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
          if (meRes.success && meRes.data?.grantedRole) {
            userStoredRole = meRes.data.grantedRole;
          }
        } catch (meErr) {
          console.warn('Backend /auth/me lookup notice:', meErr);
        }

        if (userStoredRole) {
          effectiveRole = normalizeRole(userStoredRole);
        }
      } else {
        // For demo accounts, sync the selectedRole
        try {
          await supabase.auth.updateUser({
            data: { role: selectedRole }
          });
          await apiRequest('/auth/select-role', {
            method: 'POST',
            body: JSON.stringify({ role: selectedRole })
          });
        } catch (_) {}
      }

      // 2. Persist in local storage for instant sync across tabs
      try {
        localStorage.setItem('crimenet_active_role', effectiveRole);
      } catch (_) {}

      // 3. Update local auth context
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
        status: 'APPROVED',
        permissions: permissions,
        createdAt: session.user.created_at,
        lastLogin: new Date().toISOString()
      });

      // 4. Navigate to dashboard (sidebar and actions will be restricted according to matrix)
      setView('dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex overflow-hidden select-none">
      
      {/* Left side abstract visual treatment */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-hover)]">
        {/* Abstract shapes / glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.15),transparent_50%)]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[100%] bg-[radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.1),transparent_40%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--accent)] shadow-sm shadow-[var(--primary)]/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xl text-white tracking-tight">CrimeNet AI</span>
              <span className="block text-[10px] text-cyan-400 font-mono">SIH2026 • SIH26189</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white leading-tight mb-4 max-w-lg">
            Statutory RBAC & Multi-Role Investigative Command
          </h1>
          <p className="text-sm text-[var(--sidebar-text-muted)] max-w-md font-medium leading-relaxed">
            Role-based operational clearance compliant with Bharatiya Sakshya Adhiniyam §63 and BNSS evidentiary standards.
          </p>
        </div>

        {/* Roles overview pill list */}
        <div className="relative z-10 space-y-2.5 my-auto py-6">
          <p className="text-[11px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
            Statutory Clearance Profiles:
          </p>
          {ROLE_OPTIONS.map(r => (
            <div 
              key={r.id}
              onClick={() => handleSelectRole(r.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedRole === r.id 
                  ? `${r.activeBg} ${r.activeBorder} shadow-lg` 
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r.icon}
                  <span className={`text-xs font-bold ${r.color}`}>{r.title}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-700">
                  {r.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{r.desc}</p>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/30 text-[var(--accent)] text-xs font-mono mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            Statutory Permission Matrix Active
          </div>
          <p className="text-[10px] text-[var(--sidebar-text-muted)] font-mono">
            UNAUTHORIZED ACCESS IS STRICTLY MONITORED UNDER BSA & BNSS.
          </p>
        </div>
      </div>

      {/* Right side login form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-10 bg-[var(--bg-primary)] overflow-y-auto">
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
          
          <div className="bg-[var(--bg-card)] shadow-xl shadow-black/10 border border-[var(--border)] rounded-3xl p-6 sm:p-8 space-y-6">
            
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Sign In with Statutory Role</h2>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  M6 RBAC Clearance
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Select your assigned jurisdictional clearance profile before authentication.
              </p>
            </div>

            {/* Role Selector Cards */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-primary)] mb-2">
                Step 1: Choose Operational Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROLE_OPTIONS.map(r => {
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectRole(r.id)}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? `border-2 ${r.activeBorder} ${r.activeBg} shadow-md`
                          : 'border-slate-800 bg-[var(--bg-primary)] hover:border-slate-700'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                      )}
                      <div className="mb-2">{r.icon}</div>
                      <div className="font-bold text-xs text-white">{r.title}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{r.badge}</div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Role Indicator Badge */}
              <div className="mt-3 p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-medium">Selected role:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-cyan-300 border border-blue-500/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  {selectedRole}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 2: Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Step 2: Officer Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                    placeholder="officer@agency.gov"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Access Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  Default password: <code className="text-cyan-400">Password123!</code>
                </span>
                <button 
                  type="button" 
                  onClick={() => setView('forgot-password')}
                  className="text-blue-400 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Authenticating Role Clearance...</span>
                ) : (
                  <>
                    <span>Sign In as {selectedRole}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            
            <div className="pt-2 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--border)]">
              Need new credentials or clearance upgrade?{' '}
              <button onClick={() => setView('register')} className="text-blue-400 font-semibold hover:underline">
                Submit Clearance Request
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
