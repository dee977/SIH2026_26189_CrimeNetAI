import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { supabase } from '../../services/supabaseClient';
import { Mail, Lock, ArrowRight, Shield, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { setView } = useNavigationStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        // App.tsx auth listener handles redirect / state update, but we can setView here to ensure UI navigates
        setView('dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex overflow-hidden select-none">
      
      {/* Left side abstract visual treatment */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-hover)]">
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
            <span className="font-bold text-xl text-white tracking-tight">CrimeNet AI</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white leading-tight mb-4 max-w-lg">
            Advanced Intelligence & Investigation Platform
          </h1>
          <p className="text-lg text-[var(--sidebar-text-muted)] max-w-md font-medium">
            Secure, centralized tracking of financial networks, hidden relationships, and forensic evidence for law enforcement professionals.
          </p>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/30 text-[var(--accent)] text-xs font-mono mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
            System Online • Secure Environment
          </div>
          <p className="text-[10px] text-[var(--sidebar-text-muted)] font-mono">
            UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED AND WILL BE PROSECUTED.
          </p>
        </div>
      </div>

      {/* Right side login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-[var(--surface-blue)] border border-[var(--primary)]/20 rounded-2xl flex items-center justify-center text-[var(--primary)] mb-4 shadow-lg shadow-[var(--primary)]/10">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-[var(--text-primary)]">CrimeNet Login</h1>
          </div>

          <div className="bg-[var(--bg-card)] shadow-lg shadow-black/5 border border-[var(--border)] rounded-2xl p-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 text-center lg:text-left">Sign In to Dashboard</h2>
            
            {errorMessage && (
              <div className="mb-6 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-center gap-2 text-xs text-[var(--danger)]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-white border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                    placeholder="officer@agency.gov"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]" />
                  <span className="text-[var(--text-secondary)] font-medium">Remember me</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => setView('forgot-password')}
                  className="text-[var(--primary)] hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-2 rounded-xl bg-[var(--primary)] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            
            <div className="mt-6 text-center text-xs text-[var(--text-secondary)]">
              Don't have an account?{' '}
              <button onClick={() => setView('register')} className="text-[var(--primary)] font-semibold hover:underline">
                Request Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
