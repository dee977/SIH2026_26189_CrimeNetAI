import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Shield, Mail, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { setView } = useNavigationStore();
  const { addToast } = useNotificationStore();

  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('verify');
    addToast({
      type: 'info',
      title: 'Reset Token Dispatched',
      message: `A secure 6-digit recovery code has been sent to your verified police email.`
    });
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('success');
    addToast({
      type: 'success',
      title: 'Password Re-encrypted',
      message: 'New credentials registered in M6 security ledger.'
    });
  };

  return (
    <div className="min-h-screen bg-[#080d1a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-cyan-500/30">
      <div className="absolute inset-0 grid-bg opacity-25 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        
        <div className="text-center mb-6">
          <button
            onClick={() => setView('login')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Credential Recovery</h2>
          <p className="text-xs text-slate-400 mt-1">Law Enforcement Identity Recovery Portal</p>
        </div>

        <div className="glass-panel bg-slate-950/85 rounded-2xl border-slate-800 p-7 shadow-2xl backdrop-blur-xl">
          
          {step === 'request' && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Official Police Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="v.rao@cid.police.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
              >
                Send Recovery Code
              </button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
                Demo Token sent! Enter any 6-digit code (e.g. 772901) to simulate verification.
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Recovery Token (6 Digits)
                </label>
                <input
                  type="text"
                  required
                  placeholder="772901"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono tracking-widest text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  New Secure Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Reset Password & Re-encrypt
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Password Successfully Updated</h3>
              <p className="text-xs text-slate-400">
                Your cryptographic token credentials have been refreshed. You can now access your investigator terminal.
              </p>
              <button
                onClick={() => setView('login')}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Proceed to Login
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
