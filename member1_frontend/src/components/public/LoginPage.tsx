import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    icon: <ShieldCheck className="w-5 h-5 text-rose-500" />,
    color: 'text-rose-600',
    activeBorder: 'border-rose-500 ring-2 ring-rose-500/60',
    activeBg: 'bg-rose-50'
  },
  {
    id: 'INVESTIGATOR',
    title: 'INVESTIGATOR',
    badge: 'Case Operations',
    desc: 'Case file creation, evidence ingestion, and knowledge graph querying.',
    icon: <Briefcase className="w-5 h-5 text-blue-500" />,
    color: 'text-blue-600',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/60',
    activeBg: 'bg-blue-50'
  },
  {
    id: 'ANALYST',
    title: 'ANALYST',
    badge: 'Intelligence & ML',
    desc: 'Louvain community analysis, multi-hop discovery, and report generation.',
    icon: <BarChart3 className="w-5 h-5 text-teal-500" />,
    color: 'text-teal-600',
    activeBorder: 'border-teal-500 ring-2 ring-teal-500/60',
    activeBg: 'bg-teal-50'
  },
  {
    id: 'AUDITOR',
    title: 'AUDITOR',
    badge: 'Statutory Review',
    desc: 'BSA §63 compliance, Merkle evidence audit ledger, and reports.',
    icon: <FileCheck className="w-5 h-5 text-amber-500" />,
    color: 'text-amber-600',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/60',
    activeBg: 'bg-amber-50'
  }
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    const finalEmail = identifier.trim();
    const finalPassword = password;

    if (!finalEmail || !finalPassword) {
      setErrorMessage('Please enter both Officer Email Address and Access Password.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: finalPassword,
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
      let beUserData: any = null;

      if (!isDemoAccount) {
        // Authoritative Check with backend /auth/me to verify status and role
        try {
          const token = session.access_token;
          const meRes = await apiRequest<any>('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (meRes.success && meRes.data) {
            beUserData = meRes.data;
          }
        } catch (meErr: any) {
          // Strictly clear session and reject entry
          await supabase.auth.signOut();
          try {
            localStorage.removeItem('crimenet_auth_token');
            localStorage.removeItem('crimenet_user_profile');
            localStorage.removeItem('crimenet_active_role');
          } catch (_) {}

          const msg = (meErr.message || meErr.data?.error?.message || '').toLowerCase();
          const code = meErr.code || meErr.data?.error?.code;
          const isPending = meErr.status === 403 || code === 'PENDING_APPROVAL' || msg.includes('pending') || msg.includes('clearance') || msg.includes('approval');
          
          if (isPending) {
            setErrorMessage('Your enrolment is pending Admin approval. You cannot access CrimeNet AI until clearance is granted.');
            return;
          } else if (msg.includes('rejected')) {
            setErrorMessage('Your enrolment request was rejected by Admin. Contact your supervising officer.');
            return;
          } else {
            setErrorMessage(meErr.message || 'Access verification failed. Contact administrator.');
            return;
          }
        }

        if (!beUserData || beUserData.isActive === false) {
          await supabase.auth.signOut();
          try {
            localStorage.removeItem('crimenet_auth_token');
            localStorage.removeItem('crimenet_user_profile');
            localStorage.removeItem('crimenet_active_role');
          } catch (_) {}
          setErrorMessage('Your enrolment is pending Admin approval. You cannot access CrimeNet AI until clearance is granted.');
          return;
        }

        const approvedRole = (beUserData.grantedRole || beUserData.role || '').toUpperCase();
        if (approvedRole && approvedRole !== selectedRole.toUpperCase()) {
          setErrorMessage(`Access Denied: Your account is provisioned for the ${approvedRole} role. Please select ${approvedRole} to login.`);
          await supabase.auth.signOut();
          try {
            localStorage.removeItem('crimenet_auth_token');
            localStorage.removeItem('crimenet_user_profile');
            localStorage.removeItem('crimenet_active_role');
          } catch (_) {}
          return;
        }
        effectiveRole = normalizeRole(approvedRole || selectedRole);
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

      // 3. Update local auth context ONLY for approved users
      const permissions = (beUserData?.permissions && beUserData.permissions.length > 0)
        ? beUserData.permissions
        : getPermissionsForRole(effectiveRole);

      setSession(session.access_token, {
        id: session.user.id,
        email: beUserData?.email || session.user.email || identifier,
        name: beUserData?.fullName || session.user.user_metadata?.name || (identifier.split('@')[0].replace('.', ' ').toUpperCase()),
        phone: session.user.user_metadata?.phone || '',
        officerId: beUserData?.badgeNumber || session.user.user_metadata?.officerId || (effectiveRole === 'ADMIN' ? 'ADM-001' : 'LEO-7729'),
        organization: beUserData?.agencyUnit || session.user.user_metadata?.organization || 'CrimeNet State Bureau',
        requestedRole: effectiveRole,
        grantedRole: effectiveRole,
        status: 'APPROVED',
        permissions: permissions,
        createdAt: session.user.created_at,
        lastLogin: new Date().toISOString()
      });

      // 4. Navigate to dashboard
      navigate('/dashboard');
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
              <img src="/logo.png" alt="CrimeNet AI" className="h-14 sm:h-16 w-auto object-contain" />
              <div>
                <span className="block text-[10px] text-cyan-400 font-mono mt-1">SIH2026 • SIH26189</span>
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
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-slate-200 border border-slate-700 font-semibold">
                  {r.badge}
                </span>
              </div>
              <p className={`text-[11px] mt-1 leading-snug ${selectedRole === r.id ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>{r.desc}</p>
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
                   RBAC Clearance
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ROLE_OPTIONS.map(r => {
                  const isSelected = selectedRole === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSelectRole(r.id)}
                      className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer min-w-0 flex flex-col justify-between min-h-[108px] ${
                        isSelected
                          ? `border-2 ${r.activeBorder} ${r.activeBg} shadow-lg shadow-black/20`
                          : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <div className="mb-2">{r.icon}</div>
                        <div className="font-black text-xs sm:text-[13px] text-slate-900 tracking-tight">
                          {r.title}
                        </div>
                      </div>
                      <div className={`text-[11px] font-semibold mt-1.5 leading-snug ${
                        isSelected
                          ? 'text-slate-900'
                          : 'text-slate-600'
                      }`}>
                        {r.badge}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Role Indicator Badge */}
              <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between text-xs font-mono shadow-sm">
                <span className="text-slate-800 font-bold">Selected role:</span>
                <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {selectedRole}
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed font-semibold shadow-md ${
                errorMessage.includes('pending') || errorMessage.includes('clearance')
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-950'
                  : 'bg-red-500/15 border-red-500/50 text-red-950'
              }`}>
                <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  errorMessage.includes('pending') || errorMessage.includes('clearance')
                    ? 'text-amber-600'
                    : 'text-red-600'
                }`} />
                <div>
                  <div className="font-extrabold text-xs uppercase tracking-wider mb-0.5">
                    {errorMessage.includes('pending') || errorMessage.includes('clearance')
                      ? 'Clearance Gate • Action Required'
                      : 'Authentication Alert'}
                  </div>
                  <div className="font-medium">{errorMessage}</div>
                </div>
              </div>
            )}

            {/* Step 2: Credentials Form */}
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Step 2: Officer Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="off"
                    required
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                    placeholder="Enter officer email address"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                    placeholder="Enter access password"
                  />
                </div>
              </div>

              <div className="flex justify-end text-xs pt-1">
                <button 
                  type="button" 
                  onClick={() => navigate('/forgot-password')}
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
              <button onClick={() => navigate('/register')} className="text-blue-400 font-semibold hover:underline">
                Submit Clearance Request
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};