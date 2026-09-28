import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { supabase } from '../../services/supabaseClient';
import { Mail, Phone, Lock, User, Building, BadgeCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types/auth';

export const RegisterPage: React.FC = () => {
  const { setView } = useNavigationStore();
  
  const [formData, setFormData] = useState({
    userName: '',
    employeeId: '',
    email: '',
    phoneNumber: '',
    organization: '',
    requestedRole: 'Investigator' as UserRole,
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.userName,
            phone: formData.phoneNumber,
            officerId: formData.employeeId,
            organization: formData.organization,
            role: formData.requestedRole
          }
        }
      });
      
      if (signUpError) {
        setError(signUpError.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-4">
      {isSuccess ? (
         <div className="w-full max-w-md text-center p-8 bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Registration Successful</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Your account has been created. Please sign in to continue.</p>
            <button onClick={() => setView('login')} className="bg-[var(--primary)] text-white text-slate-950 px-6 py-2 rounded-xl font-bold">Return to Login</button>
         </div>
      ) : (
        <div className="w-full max-w-xl z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-1 text-[var(--text-primary)]">Officer Enrolment Portal</h1>
            <p className="text-xs text-[var(--text-secondary)]">Request access to the CrimeNet AI Platform</p>
          </div>

          <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl bg-[var(--bg-card)] rounded-2xl border-[var(--border)] p-6 shadow-2xl backdrop-blur-xl">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic subset to not spend too much space */}
              <div>
                <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)]" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)]" />
                </div>
              </div>
              
              <div>
                <label className="block text-[11px] font-mono text-[var(--text-secondary)] mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)]" />
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setView('login')} className="w-1/3 py-2 rounded-xl border border-[var(--border)] text-xs hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="w-2/3 py-2 rounded-xl bg-[var(--primary)] text-white hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors">{isLoading ? 'Registering...' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
