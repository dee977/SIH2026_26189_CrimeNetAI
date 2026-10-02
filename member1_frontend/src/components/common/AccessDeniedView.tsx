import React, { useState } from 'react';
import { ShieldAlert, ArrowLeft, KeyRound, CheckCircle2, AlertTriangle, Send } from 'lucide-react';
import { useNavigationStore } from '../../store/navigationStore';
import { useAuthStore } from '../../store/authStore';
import { apiRequest } from '../../services/apiClient';
import { UserRole } from '../../utils/rbac';

interface AccessDeniedViewProps {
  view: string;
  requiredPermission?: string;
  currentRole: string;
  onBackToDashboard?: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  view,
  requiredPermission = 'Administrative Clearance',
  currentRole,
  onBackToDashboard
}) => {
  const { setView } = useNavigationStore();
  const { user } = useAuthStore();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestedRole, setRequestedRole] = useState<UserRole>('INVESTIGATOR');
  const [justification, setJustification] = useState('');
  const [warrantRef, setWarrantRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/access-requests', {
        method: 'POST',
        body: JSON.stringify({
          requestedRole,
          justification: justification || `Operational necessity to access ${view} module`,
          warrantRef: warrantRef || 'WARRANT-PENDING',
          assignedCaseId: 'CASE-2025-M3-DATASET',
          officerName: user?.name,
          badgeNumber: user?.officerId,
          department: user?.organization
        })
      });

      if (res.success) {
        setSubmittedNotice(`Access request submitted successfully! (ID: ${(res.data as any)?.id || 'SUBMITTED'}). Pending administrator approval.`);
        setTimeout(() => {
          setIsRequestModalOpen(false);
          setSubmittedNotice(null);
        }, 3000);
      } else {
        alert(res.error || 'Failed to submit clearance request');
      }
    } catch (err: any) {
      alert(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-[var(--bg-card)] shadow-2xl border border-rose-500/30 rounded-3xl p-8 max-w-xl w-full text-center relative overflow-hidden">
        
        {/* Ambient warning background effect */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-rose-500 to-red-500" />
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-[var(--danger)] shadow-lg shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-[var(--danger)] border border-rose-500/20 text-xs font-mono font-bold uppercase tracking-wider mb-3">
          <span>HTTP 403 • Statutory Access Denied</span>
        </div>

        <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Insufficient Clearance Level
        </h2>

        <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto leading-relaxed">
          Your current active statutory role does not hold authorization to access the <span className="text-[var(--text-primary)] font-mono font-bold uppercase">{view}</span> module.
        </p>

        {/* Diagnostic Metadata Grid */}
        <div className="mt-6 p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border)] text-left text-xs font-mono space-y-2">
          <div className="flex justify-between items-center text-[var(--text-secondary)]">
            <span>Your Active Role:</span>
            <span className="font-bold text-[var(--warning)] uppercase">{currentRole}</span>
          </div>
          <div className="flex justify-between items-center text-[var(--text-secondary)]">
            <span>Required Clearance:</span>
            <span className="font-bold text-[var(--danger)]">{requiredPermission}</span>
          </div>
          <div className="flex justify-between items-center text-[var(--text-secondary)]">
            <span>Enforcement Framework:</span>
            <span className="text-cyan-400">Bharatiya Sakshya Adhiniyam §63 / BNSS</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onBackToDashboard || (() => setView('dashboard'))}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--bg-card)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] border border-slate-600 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>

          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)] text-[var(--text-primary)] font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
          >
            <KeyRound className="w-4 h-4" />
            <span>Request Elevated Clearance</span>
          </button>
        </div>

        {/* Request Modal */}
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 max-w-lg w-full text-left shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Submit Role Clearance Request</h3>
                </div>
                <button 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-mono"
                >
                  ✕ Close
                </button>
              </div>

              {submittedNotice ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0" />
                  <span>{submittedNotice}</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">
                      Requested Role Upgrade
                    </label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 font-mono text-xs"
                    >
                      <option value="INVESTIGATOR">INVESTIGATOR (Case creation, Evidence write & Graph read)</option>
                      <option value="ANALYST">ANALYST (Graph read, Analytics & Community clusters)</option>
                      <option value="AUDITOR">AUDITOR (Statutory audit, BSA verification & reports)</option>
                      <option value="ADMIN">ADMIN (Full supervisory clearance & user management)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">
                      Operational Justification / Reason
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      placeholder="Specify investigation necessity, court order, or mandate..."
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl p-3 text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] font-semibold mb-1">
                      Warrant Reference / Requisition ID
                    </label>
                    <input
                      type="text"
                      value={warrantRef}
                      onChange={(e) => setWarrantRef(e.target.value)}
                      placeholder="e.g. Subpoena #CR-2026-WZ-901 or Panchnama #09"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsRequestModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)] text-[var(--text-primary)] font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Submitting...' : 'Submit to Admin'}</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
