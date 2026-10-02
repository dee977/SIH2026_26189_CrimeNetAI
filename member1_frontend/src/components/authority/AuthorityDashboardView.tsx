import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { UserProfile, UserRole } from '../../types/auth';
import { 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  BadgeCheck, 
  Building, 
  Mail, 
  Phone,
  ShieldAlert,
  History,
  Lock
} from 'lucide-react';

export const AuthorityDashboardView: React.FC = () => {
  const { pendingOfficers, approveOfficer, rejectOfficer, suspendOfficer, reactivateOfficer } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(pendingOfficers[0]?.id || '');
  const [assignedRole, setAssignedRole] = useState<UserRole>('INVESTIGATOR');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'cases', 'graph', 'evidence', 'timeline', 'ai', 'search'
  ]);

  const activeOfficer = pendingOfficers.find(o => o.id === selectedOfficerId) || pendingOfficers[0];

  const handleApprove = (officer: UserProfile) => {
    approveOfficer(officer.id, assignedRole, selectedPermissions);
    addToast({
      type: 'success',
      title: 'Officer Access Approved',
      message: `${officer.name} granted ${assignedRole} status with selected permissions.`
    });
  };

  const handleReject = (officer: UserProfile) => {
    rejectOfficer(officer.id);
    addToast({
      type: 'warning',
      title: 'Officer Access Rejected',
      message: `Enrolment request for ${officer.name} declined.`
    });
  };

  const availablePermissions = [
    { id: 'cases', label: 'Case Dossiers & Management' },
    { id: 'graph', label: 'Network Graph & Cytoscape Canvas' },
    { id: 'evidence', label: 'Evidence & SHA-256 Ledger' },
    { id: 'timeline', label: 'Temporal Timeline Explorer' },
    { id: 'ai', label: 'Grounded AI Assistant' },
    { id: 'gis', label: 'GIS Tactical Map' },
    { id: 'export', label: 'Export Formal Reports' },
    { id: 'authority', label: 'Authority Approval Station' },
    { id: 'admin', label: 'System Administrative Terminal' }
  ];

  const togglePermission = (permId: string) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--warning)] font-semibold">
            Senior Authority Access Control Station
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-[var(--warning)] border border-amber-800">
            M6 Hierarchical RBAC Gatekeeper
          </span>
        </div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] mt-1">
          Pending Officer Enrolment & Role Grants
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Senior Authorities inspect applicant police unit affiliations, assign actual granted roles, and grant fine-grained permissions.
        </p>
      </div>

      {/* Mandatory M6 Disclosure Banner */}
      <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-amber-500/30 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>M6 RBAC Enforcement: Requested Role ≠ Granted Role ≠ Actual Permissions</span>
        </div>
        <span className="text-[var(--text-muted)] text-[11px] hidden sm:inline">Authority Approval Required</span>
      </div>

      {/* Main Grid: Pending Queue vs Review & Grant Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Pending Requests Queue (1 Col) */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
            Enrolment Queue ({pendingOfficers.length})
          </div>

          {pendingOfficers.map(officer => {
            const isSelected = officer.id === activeOfficer?.id;
            return (
              <div
                key={officer.id}
                onClick={() => {
                  setSelectedOfficerId(officer.id);
                  setAssignedRole(officer.requestedRole);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl bg-[var(--bg-card)] border-[var(--primary)] shadow-md'
                    : 'bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-xl bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--border)]'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-mono text-[var(--primary)] font-bold">{officer.officerId}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    officer.status === 'APPROVED' 
                      ? 'bg-emerald-500/10 text-[var(--success)] border border-emerald-500/30'
                      : officer.status === 'REJECTED'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/10 text-[var(--warning)] border border-amber-500/30'
                  }`}>
                    {officer.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">{officer.name}</h4>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">{officer.organization}</div>
                <div className="text-[10px] font-mono text-[var(--text-muted)] mt-2">
                  Requested: <span className="text-[var(--warning)]">{officer.requestedRole}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Review Officer Details & Assign Permissions (2 Cols) */}
        {activeOfficer && (
          <div className="lg:col-span-2 bg-[var(--bg-card)] shadow-sm border border-[var(--border)] rounded-2xl rounded-2xl p-6 border-[var(--border)] space-y-6">
            
            {/* Officer Details */}
            <div className="border-b border-[var(--border)] pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-bold text-[var(--primary)] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Officer Badge ID: {activeOfficer.officerId}
                </span>
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  Enrolled: {activeOfficer.createdAt}
                </span>
              </div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{activeOfficer.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-[var(--text-secondary)] mt-3">
                <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {activeOfficer.email}</div>
                <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {activeOfficer.phone}</div>
                <div className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-[var(--text-muted)]" /> {activeOfficer.organization}</div>
              </div>
            </div>

            {/* Role Grant Decision */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                Designate Granted Role (Senior Authority Prerogative)
              </label>
              <select
                value={assignedRole}
                onChange={(e) => setAssignedRole(e.target.value as UserRole)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] font-semibold cursor-pointer"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="INVESTIGATOR">INVESTIGATOR</option>
                <option value="ANALYST">ANALYST</option>
                <option value="AUDITOR">AUDITOR</option>
                <option value="System Administrator">System Administrator (Master Control)</option>
              </select>
              <p className="text-[10px] text-[var(--text-muted)] italic">
                Applicant requested: "{activeOfficer.requestedRole}". Authority may confirm or override.
              </p>
            </div>

            {/* Fine-Grained Permissions Toggle Matrix */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                Cryptographic Module Permissions Matrix
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {availablePermissions.map(perm => {
                  const isChecked = selectedPermissions.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                        isChecked 
                          ? 'bg-[var(--surface-cyan)] border-[var(--primary)] text-cyan-200' 
                          : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      <span className="font-medium">{perm.label}</span>
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                        isChecked ? 'bg-[var(--primary)] text-[var(--text-primary)] text-slate-950' : 'border border-[var(--border)]'
                      }`}>
                        {isChecked ? '✓' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decision Actions */}
            <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => suspendOfficer(activeOfficer.id)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-slate-50 text-[var(--warning)] border border-[var(--border)] text-xs font-medium transition-colors"
                >
                  Suspend Badge
                </button>
                <button
                  onClick={() => reactivateOfficer(activeOfficer.id)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] hover:bg-slate-50 text-[var(--success)] border border-[var(--border)] text-xs font-medium transition-colors"
                >
                  Reactivate
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReject(activeOfficer)}
                  className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
                >
                  Decline Enrolment
                </button>
                <button
                  onClick={() => handleApprove(activeOfficer)}
                  className="px-5 py-2 rounded-xl bg-[var(--primary)] text-[var(--text-primary)] hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow"
                >
                  Grant Authorization & Key
                </button>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
