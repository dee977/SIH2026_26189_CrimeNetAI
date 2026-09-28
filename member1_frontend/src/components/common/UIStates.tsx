import React from 'react';
import { AlertTriangle, ShieldAlert, Clock, Inbox, RefreshCw, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Retrieving intelligence records...' }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="relative mb-4">
      <div className="w-12 h-12 rounded-full border-2 border-[var(--primary)] border-t-cyan-400 animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4 h-4 rounded-full bg-cyan-400/40 animate-ping" />
      </div>
    </div>
    <p className="text-sm font-medium text-[var(--text-secondary)] tracking-wide">{message}</p>
    <p className="text-xs text-slate-500 mt-1">Cross-referencing indexed crime databases</p>
  </div>
);

export const ErrorState: React.FC<{ 
  title?: string; 
  message?: string; 
  onRetry?: () => void 
}> = ({ 
  title = 'Service Query Interrupted', 
  message = 'Failed to load live data records from backend services.', 
  onRetry 
}) => (
  <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-xl p-8 max-w-lg mx-auto text-center border-red-500/30 my-8">
    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
    <p className="text-sm text-[var(--text-secondary)] mt-2 mb-6">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold uppercase tracking-wider transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry Operation
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ 
  title?: string; 
  message?: string; 
  actionLabel?: string; 
  onAction?: () => void 
}> = ({ 
  title = 'No Records Found', 
  message = 'No entities or evidentiary records match the specified query filters.',
  actionLabel,
  onAction
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-[var(--border)] flex items-center justify-center mb-3 text-[var(--text-secondary)]">
      <Inbox className="w-6 h-6" />
    </div>
    <h4 className="text-base font-semibold text-[var(--text-secondary)]">{title}</h4>
    <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{message}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-3.5 py-1.5 rounded-lg bg-[var(--surface-cyan)] hover:bg-[var(--surface-cyan)] text-[var(--primary)] border border-[var(--primary)] text-xs font-medium transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const PermissionDeniedState: React.FC<{ 
  requiredPermission?: string;
  requiredRole?: string;
}> = ({ 
  requiredPermission = 'Administrative Authorization', 
  requiredRole = 'Senior Authority / Administrator' 
}) => (
  <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-xl p-10 max-w-xl mx-auto text-center border-amber-500/30 my-12">
    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-400">
      <ShieldAlert className="w-7 h-7" />
    </div>
    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-mono font-semibold uppercase tracking-wider">
      403 Access Restricted
    </span>
    <h3 className="text-xl font-bold text-[var(--text-primary)] mt-3">Access Clearance Insufficient</h3>
    <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-md mx-auto">
      Your assigned badge does not possess the cryptographic permissions required to view this module ({requiredPermission}).
    </p>
    <div className="mt-6 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-left text-xs space-y-1.5 font-mono">
      <div className="text-slate-500">M6 RBAC Access Policy:</div>
      <div className="text-[var(--text-secondary)]">Required Role: <span className="text-amber-300 font-semibold">{requiredRole}</span></div>
      <div className="text-[var(--text-secondary)]">Policy Reference: <span className="text-[var(--text-secondary)]">POL-CRIMENET-SEC-09</span></div>
    </div>
  </div>
);

export const SessionExpiredModal: React.FC = () => {
  const { restoreSession, login } = useAuthStore();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-8 max-w-md w-full border-[var(--primary)] text-center shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-[var(--surface-cyan)] border border-[var(--primary)] flex items-center justify-center mx-auto mb-4 text-[var(--primary)]">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Investigator Session Expired</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-2 mb-6">
          To comply with CJIS and law enforcement cryptographic session security standards, credentials must be re-verified after inactivity.
        </p>
        <button
          onClick={() => {
            restoreSession();
            login('v.rao@cid.police.gov.in', 'INVESTIGATOR');
          }}
          className="w-full py-2.5 rounded-lg bg-[var(--primary)] text-white hover:bg-cyan-400 text-slate-950 font-semibold text-xs uppercase tracking-wider transition-colors"
        >
          Re-authenticate Credentials
        </button>
      </div>
    </div>
  );
};
