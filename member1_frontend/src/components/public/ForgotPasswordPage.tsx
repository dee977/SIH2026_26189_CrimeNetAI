import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { supabase } from '../../services/supabaseClient';
import { Shield, Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { setView } = useNavigationStore();

  const [step, setStep] = useState<'request' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');

    // Dynamically get the current frontend URL for the redirect
    const redirectUrl = `${window.location.origin}/`;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setStep('success');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to reach authentication service.');
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
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--accent)] shadow-sm shadow-[var(--primary)]/20">
              <Shield className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">CrimeNet AI</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white leading-tight mb-4 max-w-lg">
            Credential Recovery
          </h1>
          <p className="text-lg text-[var(--sidebar-text-muted)] max-w-md font-medium">
            Reset your access to the secure investigation platform. Authorized law enforcement officers only.
          </p>
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="mb-6">
            <button
              onClick={() => setView('login')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>
            <div className="lg:hidden text-center mb-6">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--surface-blue)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] mb-3 shadow-lg shadow-[var(--primary)]/10">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">Recovery Portal</h2>
            </div>
          </div>

          <div className="bg-[var(--bg-card)] shadow-lg shadow-black/5 border border-[var(--border)] rounded-2xl p-8">
            
            {step === 'request' && (
              <>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 text-center lg:text-left">Forgot Password?</h2>
                
                {errorMessage && (
                  <div className="mb-6 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-center gap-2 text-xs text-[var(--danger)]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleRequest} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
                        placeholder="officer@agency.gov"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 mt-2 rounded-xl bg-[var(--primary)] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[var(--surface-cyan)] border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] mx-auto shadow-lg shadow-[var(--primary)]/10">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Check Your Email</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Password reset link sent. Check your email for further instructions.
                </p>
                <button
                  onClick={() => setView('login')}
                  className="w-full mt-4 py-3 rounded-xl bg-[var(--surface-blue)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white font-semibold text-sm transition-colors shadow-sm"
                >
                  Return to Login
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
