import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { supabase } from '../../services/supabaseClient';
import { Shield, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Check if we arrived here with an active session (which we should via the recovery link)
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setErrorMessage('Invalid or expired recovery session. Please request a new link.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setIsSuccess(true);
        // Important: log out the recovery session so they must log in manually.
        await supabase.auth.signOut();
        logout();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex overflow-hidden select-none">
      
      {/* Left side abstract visual treatment */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-hover)]">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.15),transparent_50%)]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[100%] bg-[radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.1),transparent_40%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo.png" alt="CrimeNet AI" className="h-12 sm:h-14 w-auto object-contain" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] leading-tight mb-4 max-w-lg">
            Credential Reset
          </h1>
          <p className="text-lg text-[var(--sidebar-text-muted)] max-w-md font-medium">
            Please enter a strong new password. It will be cryptographically updated in the secure ledger.
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="lg:hidden text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--surface-blue)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] mb-3 shadow-lg shadow-[var(--primary)]/10">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Set New Password</h2>
          </div>

          <div className="bg-[var(--bg-card)] shadow-lg shadow-black/5 border border-[var(--border)] rounded-2xl p-8">
            
            {!isSuccess ? (
              <>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 text-center lg:text-left">Set New Password</h2>
                
                {errorMessage && (
                  <div className="mb-6 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-center gap-2 text-xs text-[var(--danger)]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 mt-2 rounded-xl bg-[var(--primary)] hover:bg-[#1D4ED8] text-[var(--text-primary)] font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[var(--surface-cyan)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] mx-auto shadow-lg shadow-[var(--primary)]/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Password Updated</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Password updated successfully. You can now use your new credentials to securely log in.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full mt-4 py-3 rounded-xl bg-[var(--primary)] text-[var(--text-primary)] hover:bg-[#1D4ED8] font-semibold text-sm transition-colors shadow-sm"
                >
                  Back to Login
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

