import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { supabase } from '../../services/supabaseClient';
import { apiRequest } from '../../services/apiClient';
import { Mail, Phone, Lock, User, Building, BadgeCheck, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { UserRole } from '../../types/auth';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    userName: '',
    employeeId: '',
    email: '',
    phoneNumber: '',
    organization: '',
    requestedRole: 'INVESTIGATOR' as UserRole,
    password: '',
    confirmPassword: ''
  });
  
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Register user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.userName || formData.email.split('@')[0],
            phone: formData.phoneNumber,
            officerId: formData.employeeId || 'LEO-NEW',
            organization: formData.organization || 'CrimeNet State Bureau',
            role: formData.requestedRole
          }
        }
      });
      
      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // 2. Automatically dispatch Access & Clearance Request to Backend
      try {
        const reqPayload = {
          user_id: data.user?.id || '',
          userId: data.user?.id || '',
          user_email: formData.email.trim(),
          email: formData.email.trim(),
          requested_role: formData.requestedRole,
          requestedRole: formData.requestedRole,
          officer_name: formData.userName || formData.email.split('@')[0].replace('.', ' ').toUpperCase(),
          badge_number: formData.employeeId || 'LEO-NEW',
          department: formData.organization || 'State Police Cyber Crime Division',
          phone: formData.phoneNumber || '+91 98000 00000',
          reason: 'New user registration',
          justification: `New officer registration for ${formData.userName || formData.email} (${formData.employeeId || 'LEO-NEW'}) at ${formData.organization || 'CrimeNet Command'}. Operational clearance requested for ${formData.requestedRole}.`,
          warrant_ref: 'ENROLMENT-VERIFICATION-PENDING',
          assigned_case_id: 'CASE-2025-M3-DATASET',
          assigned_case_title: 'Operation Falcon Web - Contraband Intercept'
        };

        const res = await apiRequest<any>('/access-requests', {
          method: 'POST',
          body: JSON.stringify(reqPayload)
        });

        if (res.success && res.data?.id) {
          setCreatedRequestId(res.data.id);
        }
      } catch (reqErr: any) {
        console.warn('Access request registration notice:', reqErr);
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex items-center justify-center p-4">
      {isSuccess ? (
         <div className="w-full max-w-lg text-center p-8 bg-[var(--bg-card)] shadow-xl border border-[var(--border)] rounded-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-[var(--success)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-[var(--text-primary)]">Officer Enrolment Ticket Queued</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Your account for <strong className="text-[var(--text-primary)]">{formData.email}</strong> has been registered and an Access Clearance Request ({formData.requestedRole}) has been forwarded to the Administrator console.
            </p>

            {createdRequestId && (
              <div className="mb-6 p-3 rounded-xl bg-[var(--surface-cyan)] border border-[var(--primary)] text-xs font-mono text-cyan-300 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Clearance Tracking ID: <strong>{createdRequestId}</strong> (Status: PENDING)</span>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-500/10 border border-slate-500/20 text-[11px] text-[var(--text-secondary)] text-left mb-6 space-y-1">
              <div>• <strong>Assigned Jurisdiction:</strong> {formData.organization || 'CrimeNet State Bureau'}</div>
              <div>• <strong>Requested Clearance:</strong> {formData.requestedRole}</div>
              <div>• <strong>Statutory Process:</strong> Administrator approval promotes your clearance level in the immutable directory.</div>
            </div>

            <button 
              onClick={() => navigate('/login')} 
              className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20"
            >
              Proceed to Sign In
            </button>
         </div>
      ) : (
        <div className="w-full max-w-xl z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 my-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-cyan)] border border-[var(--primary)] text-cyan-300 text-xs font-mono mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Bharatiya Nagarik Suraksha Sanhita (BNSS) Protocol</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1 text-[var(--text-primary)]">Officer Enrolment Portal</h1>
            <p className="text-xs text-[var(--text-secondary)]">Request access to the CrimeNet AI National Intelligence Grid</p>
          </div>

          <div className="bg-[var(--bg-card)] shadow-2xl border border-[var(--border)] rounded-2xl p-6 md:p-8 backdrop-blur-xl">
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Officer Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. Sub-Inspector A. Sharma"
                      value={formData.userName} 
                      onChange={e => setFormData({...formData, userName: e.target.value})} 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" 
                    />
                  </div>
                </div>

                {/* Badge Number */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Badge / Service ID *
                  </label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. LEO-8841"
                      value={formData.employeeId} 
                      onChange={e => setFormData({...formData, employeeId: e.target.value})} 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Official Police / Gov Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="email" 
                      required 
                      placeholder="officer@police.gov.in"
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" 
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Official Mobile / Contact *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="tel" 
                      required 
                      placeholder="+91 98201 00000"
                      value={formData.phoneNumber} 
                      onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Agency / Police Department *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. CID Special Crime Branch"
                      value={formData.organization} 
                      onChange={e => setFormData({...formData, organization: e.target.value})} 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" 
                    />
                  </div>
                </div>

                {/* Requested Role */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">
                    Requested Clearance Role *
                  </label>
                  <select 
                    value={formData.requestedRole} 
                    onChange={e => setFormData({...formData, requestedRole: e.target.value as UserRole})}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-mono"
                  >
                    <option value="INVESTIGATOR">INVESTIGATOR (Case Dossiers & Evidence Upload)</option>
                    <option value="ANALYST">ANALYST (Graph Intelligence & Analytics)</option>
                    <option value="AUDITOR">AUDITOR (BSA Ledger & Judicial Compliance)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      value={formData.password} 
                      onChange={e => setFormData({...formData, password: e.target.value})} 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" 
                    />
                  </div>
                </div>
                
                {/* Confirm Password */}
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[var(--text-secondary)] mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                    <input 
                      type="password" 
                      required 
                      placeholder="••••••••"
                      value={formData.confirmPassword} 
                      onChange={e => setFormData({...formData, confirmPassword: e.target.value})} 
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => navigate('/login')} 
                  className="w-1/3 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold hover:bg-slate-500/10 transition-colors"
                >
                  Back to Sign In
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-2/3 py-2.5 rounded-xl bg-[var(--primary)] text-slate-950 font-bold text-xs uppercase tracking-wider hover:bg-cyan-400 transition-colors disabled:opacity-50 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Enrolment...</span>
                    </>
                  ) : (
                    <span>Submit Enrolment Request</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

