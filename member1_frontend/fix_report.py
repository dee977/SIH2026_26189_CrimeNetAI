import re

with open('src/components/reports/ReportView.tsx', 'r', encoding='utf-8') as f:
    old_content = f.read()

new_content = """import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useCaseStore } from '../../store/caseStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { apiClient } from '../../services/apiClient';
import { 
  Download, 
  Printer, 
  ArrowLeft,
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Lock,
  GitMerge,
  Building,
  User,
  Phone,
  Landmark,
  RefreshCw,
  ExternalLink,
  MapPin,
  Calendar,
  EyeOff
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const { selectedCaseId, setView, selectEntity, selectEvidence } = useNavigationStore();
  const { cases, fetchMembers, fetchNotes } = useCaseStore();
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [activeCase, setActiveCase] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (selectedCaseId) {
      loadData(selectedCaseId);
    } else {
      setIsLoading(false);
    }
  }, [selectedCaseId]);

  const loadData = async (caseId: string) => {
    setIsLoading(true);
    try {
      // Find case
      const currentCase = cases.find(c => c.caseId === caseId);
      setActiveCase(currentCase);

      // Fetch parallel data
      const [evRes, entRes, discRes, anRes, membersRes, notesRes] = await Promise.allSettled([
        apiClient.get(/cases//documents),
        apiClient.get(/entities?case_id=),
        apiClient.get(/verification/discrepancies?case_id=),
        apiClient.get(/graph/analytics?case_id=),
        fetchMembers(caseId),
        fetchNotes(caseId)
      ]);

      if (evRes.status === 'fulfilled') {
        const evData = evRes.value.data;
        setEvidence(Array.isArray(evData) ? evData : evData?.items || []);
      }
      
      if (entRes.status === 'fulfilled') {
        const entData = entRes.value.data;
        setEntities(Array.isArray(entData) ? entData : entData?.items || []);
      }

      if (discRes.status === 'fulfilled') {
        const discData = discRes.value.data;
        setDiscrepancies(Array.isArray(discData) ? discData : discData?.items || []);
      }

      if (anRes.status === 'fulfilled') {
        setAnalytics(anRes.value.data?.data || anRes.value.data);
      }

      setTeamMembers(useCaseStore.getState().members[caseId] || []);
      setNotes(useCaseStore.getState().notes[caseId] || []);

    } catch (err) {
      console.error('Failed to load report data:', err);
      addToast({ type: 'error', title: 'Data Load Failed', message: 'Could not fetch case report data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      window.print();
      setIsExporting(false);
    }, 1000);
  };

  if (!selectedCaseId) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-[var(--text-secondary)]">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">No Case Selected</h3>
        <p className="text-sm mt-1">Please select a case to generate an investigation report.</p>
        <button
          onClick={() => setView('cases')}
          className="mt-6 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold text-xs uppercase"
        >
          Select a Case
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] mt-4 font-mono font-medium animate-pulse">Compiling Evidence Dossier...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <button 
          onClick={() => setView('case-workspace')}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dossier
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--primary)] font-medium text-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white font-bold text-xs uppercase tracking-wider shadow hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Official Report Container */}
      <div className="bg-white text-slate-900 shadow-xl border border-slate-200 rounded-sm print:shadow-none print:border-none p-10 md:p-14 font-sans print:p-0">
        
        {/* Cover / Letterhead */}
        <div className="border-b-4 border-[#0a192f] pb-8 mb-8 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#0a192f] flex items-center justify-center rounded-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0a192f] tracking-tight uppercase">CrimeNet Investigative Intelligence</h1>
              <h2 className="text-sm font-bold text-slate-500 tracking-widest uppercase mt-1">Official Case Dossier</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono font-bold text-slate-600">CONFIDENTIAL / CLASSIFIED</p>
            <p className="text-xs font-mono text-slate-500 mt-1">Generated: {new Date().toLocaleString()}</p>
            <p className="text-xs font-mono text-slate-500 mt-1">Requestor: {user?.name || user?.email}</p>
          </div>
        </div>

        {/* Case Meta block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 bg-slate-50 p-6 rounded-lg border border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Case Number</p>
            <p className="font-mono font-bold text-slate-800">{activeCase?.caseId || selectedCaseId}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <p className="font-bold text-slate-800 uppercase">{activeCase?.status || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Priority</p>
            <p className="font-bold text-slate-800 uppercase">{activeCase?.priority || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date Created</p>
            <p className="font-bold text-slate-800">{activeCase?.createdAt ? new Date(activeCase.createdAt).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Case Title</p>
            <p className="font-bold text-slate-800">{activeCase?.title || 'Untitled Case'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jurisdiction</p>
            <p className="font-bold text-slate-800">{activeCase?.jurisdiction || 'N/A'}</p>
          </div>
        </div>

        {/* 1. Incident Summary */}
        <section className="mb-10">
          <h3 className="text-sm font-bold text-[#0a192f] uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> 1. Incident Summary
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {activeCase?.description || 'No description provided for this case.'}
          </p>
        </section>

        {/* 2. Chain of Custody & Evidence */}
        <section className="mb-10">
          <h3 className="text-sm font-bold text-[#0a192f] uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" /> 2. Evidentiary Assets & Chain of Custody (BSA Compliant)
          </h3>
          {evidence.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="p-3 font-bold uppercase">Evidence ID</th>
                    <th className="p-3 font-bold uppercase">Description</th>
                    <th className="p-3 font-bold uppercase">Acquisition</th>
                    <th className="p-3 font-bold uppercase w-1/3">SHA-256 Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {evidence.map((ev: any, idx: number) => (
                    <tr key={ev.documentId || idx}>
                      <td className="p-3 font-mono font-bold text-slate-800">{ev.evidenceCode || ev.documentId?.substring(0, 8) || EV-}</td>
                      <td className="p-3 text-slate-700">{ev.title || ev.filename || 'Unnamed Evidence'}</td>
                      <td className="p-3 text-slate-600">{ev.seizureDate ? new Date(ev.seizureDate).toLocaleDateString() : (ev.createdAt ? new Date(ev.createdAt).toLocaleDateString() : 'Unknown')}</td>
                      <td className="p-3 font-mono text-[10px] text-slate-500 break-all">{ev.sha256Hash || ev.checksum || 'Pending Analysis'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No evidence has been catalogued for this case.</p>
          )}
        </section>

        {/* 3. Persons & Entities of Interest */}
        <section className="mb-10">
          <h3 className="text-sm font-bold text-[#0a192f] uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> 3. Extracted Entities of Interest
          </h3>
          {entities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {entities.map((ent: any) => (
                <div key={ent.entity_id} className="border border-slate-200 rounded p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {ent.entity_type === 'Person' ? <User className="w-4 h-4 text-slate-400" /> : 
                     ent.entity_type === 'BankAccount' ? <Landmark className="w-4 h-4 text-slate-400" /> : 
                     ent.entity_type === 'Phone' ? <Phone className="w-4 h-4 text-slate-400" /> : 
                     ent.entity_type === 'Organization' ? <Building className="w-4 h-4 text-slate-400" /> : 
                     <Globe className="w-4 h-4 text-slate-400" />}
                    <span className="text-xs font-bold text-slate-800 uppercase truncate">{ent.canonical_name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Type: {ent.entity_type}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">ID: {ent.identifier_value || ent.entity_id}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No entities have been extracted or linked yet.</p>
          )}
        </section>

        {/* 4. Network Analytics */}
        <section className="mb-10">
          <h3 className="text-sm font-bold text-[#0a192f] uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <GitMerge className="w-4 h-4" /> 4. Network & Link Discovery Analytics
          </h3>
          {analytics ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-800">{analytics.totalNodes || 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Total Nodes</div>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-800">{analytics.totalEdges || 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Relationships</div>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-800">{analytics.connectedComponents || 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Sub-Networks</div>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <div className="text-2xl font-black text-slate-800">{analytics.density ? parseFloat(analytics.density).toFixed(3) : 0}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-1">Density Score</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No active network data found for this case. Run graph ingestion to map topologies.</p>
          )}
        </section>

        {/* 5. Cross-Verification & Alerts */}
        <section className="mb-10">
          <h3 className="text-sm font-bold text-[#0a192f] uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> 5. Data Discrepancies & Analytical Alerts
          </h3>
          {discrepancies.length > 0 ? (
            <div className="space-y-3">
              {discrepancies.map((d: any, idx: number) => (
                <div key={idx} className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-red-900">{d.title || 'Anomaly Detected'}</h4>
                      <p className="text-xs text-red-700 mt-1">{d.analyticalNotes || d.conflictingField || 'Review required for conflicting records.'}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-red-200 text-red-800 px-2 py-1 rounded">High Severity</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 p-4 rounded flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">No cross-verification discrepancies or active alerts detected.</p>
            </div>
          )}
        </section>

        {/* 6. Investigator Notes */}
        <section className="mb-10">
          <h3 className="text-sm font-bold text-[#0a192f] uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> 6. Investigator Notes & Observations
          </h3>
          {notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map((n: any, idx: number) => (
                <div key={idx} className="border-l-2 border-slate-300 pl-4 py-1">
                  <p className="text-xs text-slate-800 whitespace-pre-wrap">{n.content}</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-mono">- {n.authorEmail || n.author_email} on {new Date(n.createdAt || n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No notes have been added to this case.</p>
          )}
        </section>

        {/* 7. Assigned Taskforce */}
        <section className="mb-4">
          <h3 className="text-sm font-bold text-[#0a192f] uppercase tracking-widest border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" /> 7. Assigned Taskforce
          </h3>
          {teamMembers.length > 0 ? (
            <ul className="text-xs text-slate-700 space-y-2">
              {teamMembers.map((tm: any, idx: number) => (
                <li key={idx} className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold">{tm.userEmail || tm.user_email}</span>
                  <span className="font-mono text-[10px] uppercase">{tm.role || 'Investigator'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 italic">No taskforce assigned.</p>
          )}
        </section>

        <div className="mt-16 pt-8 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400 font-mono">END OF REPORT</p>
          <p className="text-[10px] text-slate-400 font-mono mt-1">Generated by CrimeNet AI Intelligence Engine</p>
        </div>
      </div>
    </div>
  );
};
"""

with open('src/components/reports/ReportView.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Updated ReportView")
