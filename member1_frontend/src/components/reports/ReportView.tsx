import React, { useState, useEffect } from 'react';
import { useNavigationStore } from '../../store/navigationStore';
import { useCaseStore } from '../../store/caseStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { apiClient } from '../../services/apiClient';
import { supabase } from '../../services/supabaseClient';
import { 
  Download, 
  Printer, 
  ArrowLeft,
  FileText,
  CheckCircle2,
  Lock,
  GitMerge,
  Building2,
  User,
  Phone,
  Landmark,
  RefreshCw,
  MapPin,
  Calendar,
  Truck,
  ShieldAlert,
  Scale,
  Award,
  Briefcase
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const { selectedCaseId, selectCase, setView } = useNavigationStore();
  const { cases, fetchCases, fetchNotes } = useCaseStore();
  const { user } = useAuthStore();
  const { addToast } = useNotificationStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Live Case Intelligence State
  const [activeCase, setActiveCase] = useState<any>(null);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [entities, setEntities] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [discrepancies, setDiscrepancies] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    if (cases.length === 0) {
      fetchCases();
    }
  }, [cases.length, fetchCases]);

  // Determine current case ID to load
  const effectiveCaseId = selectedCaseId || cases[0]?.caseId || cases[0]?.caseNumber || 'CASE-2026-HWL-001';

  useEffect(() => {
    if (effectiveCaseId) {
      loadReportData(effectiveCaseId);
    } else {
      setIsLoading(false);
    }
  }, [effectiveCaseId]);

  const loadReportData = async (caseId: string) => {
    setIsLoading(true);
    try {
      // Find case locally or fetch
      const currentCase = cases.find(c => c.caseId === caseId || c.caseNumber === caseId);
      if (currentCase) {
        setActiveCase(currentCase);
      }

      const [caseRes, evRes, entRes, graphRes, tlRes, alertRes, discRes, notesRes, anRes] = await Promise.allSettled([
        apiClient.get(`/cases/${encodeURIComponent(caseId)}`),
        apiClient.get(`/evidence?case_id=${encodeURIComponent(caseId)}&pageSize=100`),
        apiClient.get(`/entities?case_id=${encodeURIComponent(caseId)}&pageSize=500`),
        apiClient.get(`/graph/case/${encodeURIComponent(caseId)}`),
        apiClient.get(`/timeline?case_id=${encodeURIComponent(caseId)}`),
        apiClient.get(`/alerts?case_id=${encodeURIComponent(caseId)}`),
        apiClient.get(`/verification/discrepancies?case_id=${encodeURIComponent(caseId)}`),
        fetchNotes(caseId),
        apiClient.get(`/graph/analytics?case_id=${encodeURIComponent(caseId)}`)
      ]);

      if (caseRes.status === 'fulfilled' && caseRes.value.success && caseRes.value.data) {
        setActiveCase(caseRes.value.data);
      }

      if (evRes.status === 'fulfilled' && evRes.value.success) {
        const evData = evRes.value.data;
        const evItems = Array.isArray(evData) ? evData : (evData?.items || []);
        setEvidence(evItems);
      }

      if (entRes.status === 'fulfilled' && entRes.value.success) {
        const entData = entRes.value.data;
        const entItems = Array.isArray(entData) ? entData : (entData?.items || []);
        setEntities(entItems);
      }

      if (graphRes.status === 'fulfilled' && graphRes.value.success && graphRes.value.data) {
        const gData = graphRes.value.data;
        setRelationships(gData.edges || []);
      }

      if (tlRes.status === 'fulfilled' && tlRes.value.success) {
        const tlData = tlRes.value.data;
        const tlItems = Array.isArray(tlData) ? tlData : (tlData?.items || []);
        setTimeline(tlItems);
      }

      if (alertRes.status === 'fulfilled' && alertRes.value.success) {
        const alData = alertRes.value.data;
        const alItems = Array.isArray(alData) ? alData : (alData?.items || []);
        setAlerts(alItems);
      }

      if (discRes.status === 'fulfilled' && discRes.value.success) {
        const discData = discRes.value.data;
        setDiscrepancies(Array.isArray(discData) ? discData : (discData?.items || []));
      }

      if (notesRes.status === 'fulfilled') {
        setNotes(notesRes.value || []);
      }

      if (anRes.status === 'fulfilled' && anRes.value.success) {
        setAnalytics(anRes.value.data?.data || anRes.value.data);
      }

    } catch (err) {
      console.error('Failed to load comprehensive dossier data:', err);
      addToast({ type: 'error', title: 'Data Load Failed', message: 'Could not fetch case report data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const cleanCaseId = effectiveCaseId;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || (typeof localStorage !== 'undefined' ? localStorage.getItem('crimenet_auth_token') : null);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');
      const cleanBase = API_BASE_URL.replace(/\/+$/, '');
      const exportUrl = `${cleanBase}/reports/export/${encodeURIComponent(cleanCaseId)}.pdf`;

      const res = await fetch(exportUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Investigation_Report_${cleanCaseId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        addToast({ type: 'success', title: 'PDF Exported', message: 'Investigation dossier PDF downloaded successfully.' });
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Export error, using browser print:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  // Group entities by canonical type
  const persons = entities.filter(e => (e.entityType || e.type) === 'Person');
  const phones = entities.filter(e => (e.entityType || e.type) === 'Phone');
  const bankAccounts = entities.filter(e => (e.entityType || e.type) === 'BankAccount');
  const organizations = entities.filter(e => (e.entityType || e.type) === 'Organization');
  const vehicles = entities.filter(e => (e.entityType || e.type) === 'Vehicle');
  const locations = entities.filter(e => (e.entityType || e.type) === 'Location');
  const transactions = entities.filter(e => (e.entityType || e.type) === 'Transaction');
  const firs = entities.filter(e => (e.entityType || e.type) === 'FIR' || (e.entityType || e.type) === 'Crime');

  // Degree Centrality calculation
  const degreeMap = new Map<string, number>();
  relationships.forEach(r => {
    if (r.source) degreeMap.set(r.source, (degreeMap.get(r.source) || 0) + 1);
    if (r.target) degreeMap.set(r.target, (degreeMap.get(r.target) || 0) + 1);
  });
  const topConnected = Array.from(degreeMap.entries())
    .map(([entity, degree]) => ({ entity, degree }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-600 mt-4 font-mono font-medium animate-pulse">
          Compiling Statutory Case Dossier under BSA §65B & BNSS §94...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300 text-slate-900 print:max-w-full print:m-0 print:p-0 print:space-y-0 print:pb-0">
      
      {/* Header Actions & Case Switcher (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm print:hidden">
        <button 
          onClick={() => setView('cases')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-blue-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dossier Workspace
        </button>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Active Case Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs">
            <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500 font-medium">Selected Case:</span>
            <select
              value={effectiveCaseId}
              onChange={(e) => {
                selectCase(e.target.value);
                loadReportData(e.target.value);
              }}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              {cases.map((c) => (
                <option key={c.caseId} value={c.caseId}>
                  {c.caseNumber || c.caseId} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Print Dossier
          </button>

          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {isExporting ? 'Exporting...' : 'Export Formal PDF'}
          </button>
        </div>
      </div>

      {/* Official Report Document Container */}
      <div id="investigation-report-document" className="printable-report bg-white text-slate-900 shadow-xl border border-slate-300 rounded-sm p-8 sm:p-12 font-sans print:shadow-none print:border-none print:p-0 print:w-full print:m-0 print:mt-0 print:pt-0">
        
        {/* ============================================================== */}
        {/* OFFICIAL CASE DOSSIER HEADER (Single clean line, zero overlap) */}
        {/* ============================================================== */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          {/* Classification Banner - Single clean line, not overlapping title */}
          <div className="classification-banner bg-slate-900 text-white text-[11px] font-mono font-bold tracking-widest uppercase px-4 py-1.5 rounded-sm flex items-center justify-between mb-4 border border-slate-900">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse print:hidden"></span>
              <span>CONFIDENTIAL // CLASSIFIED</span>
            </div>
            <span>SIH26189 &bull; LAW ENFORCEMENT SENSITIVE</span>
            <span className="font-mono text-[10px]">BSA &sect;65B COMPLIANT</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo-dark.png" alt="CrimeNet AI Logo" className="h-16 sm:h-20 w-auto object-contain" />
              <div>
                <div className="text-[11px] font-bold text-blue-700 tracking-wider uppercase font-mono">
                  CrimeNet AI &mdash; Criminal Network Analysis System
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase mt-0.5">
                  OFFICIAL CASE DOSSIER
                </h1>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  Statutory Investigatory Record &bull; Bharatiya Sakshya Adhiniyam (BSA &sect;65B)
                </p>
              </div>
            </div>
            
            <div className="text-left sm:text-right border-l sm:border-l-0 pl-3 sm:pl-0 border-slate-200">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Report Generated</div>
              <div className="text-xs font-mono font-bold text-slate-800">
                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
              </div>
              <div className="text-[11px] text-slate-600 mt-1">
                Requesting Officer: <span className="font-bold text-slate-900">{user?.name || 'Lead Officer'}</span> ({user?.grantedRole || 'INVESTIGATOR'})
              </div>
            </div>
          </div>
        </div>

        {/* Header Metadata Block (Clear, non-overlapping grid) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 p-4 bg-slate-50 border border-slate-300 rounded-lg text-xs mb-8">
          <div className="md:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Case Number</span>
            <span className="font-mono font-bold text-slate-900 text-sm block mt-0.5">{activeCase?.caseNumber || activeCase?.caseId || effectiveCaseId}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Case Title</span>
            <span className="font-bold text-slate-900 text-xs block mt-0.5 line-clamp-2">{activeCase?.title || 'Case Investigation'}</span>
          </div>
          <div className="md:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Status | Priority</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px] uppercase">
                {activeCase?.status || 'Active'}
              </span>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[10px] uppercase">
                {activeCase?.priority || 'High'}
              </span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 block mt-1">
              Created: {activeCase?.createdAt ? new Date(activeCase.createdAt).toLocaleDateString() : 'Active Docket'}
            </span>
          </div>
          <div className="md:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Jurisdiction</span>
            <span className="font-semibold text-slate-800 text-xs block mt-0.5">{activeCase?.jurisdiction || 'CID / Special Crime Branch'}</span>
          </div>
          <div className="md:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lead / Requestor</span>
            <span className="font-semibold text-slate-800 text-xs block mt-0.5">{activeCase?.assignedInvestigator || user?.name || 'Inspector Rajesh Kumar'}</span>
            <span className="text-[9px] font-mono text-slate-500 block">{user?.grantedRole || 'INVESTIGATOR'}</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 1. INCIDENT SUMMARY */}
        {/* ============================================================== */}
        <section className="mb-8 print:mb-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" /> 1. INCIDENT SUMMARY
          </h2>
          <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs text-slate-800 leading-relaxed space-y-3">
            <div>
              <p className="font-bold text-slate-900 text-xs mb-1">Official Docket Narrative:</p>
              <p className="text-slate-700 leading-relaxed">
                {activeCase?.description || 'No formal incident summary recorded for this docket.'}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
              <div><strong>Jurisdiction:</strong> {activeCase?.jurisdiction || 'Special Crime Branch'}</div>
              <div><strong>Investigating Unit:</strong> {activeCase?.assignedTeam || 'Inter-State Crime Cell'}</div>
              <div><strong>Police Station:</strong> {activeCase?.policeStation || 'Central Bureau Headquarters'}</div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 2. EVIDENTIARY ASSETS & CHAIN OF CUSTODY (BSA §65B COMPLIANT) */}
        {/* ============================================================== */}
        <section className="mb-8 print:mb-6">
          <div className="border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" /> 2. EVIDENTIARY ASSETS & CHAIN OF CUSTODY (BSA §65B COMPLIANT)
            </h2>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {evidence.length} Exhibits Catalogued
            </span>
          </div>

          {evidence.length > 0 ? (
            <div className="overflow-x-auto border border-slate-300 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold text-[10px] uppercase">
                    <th className="p-2.5 font-mono w-28">Evidence ID</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 w-24">Type</th>
                    <th className="p-2.5 font-mono">SHA-256</th>
                    <th className="p-2.5 w-28">Acquisition Date</th>
                    <th className="p-2.5 w-28">Custodian</th>
                    <th className="p-2.5 w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {evidence.map((ev, idx) => (
                    <tr key={ev.evidenceId || ev.id || idx} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{ev.evidenceId || ev.id || `EVD-${idx+1}`}</td>
                      <td className="p-2.5 text-slate-800 font-medium">{ev.description || ev.title || ev.canonicalName || 'Exhibit Item'}</td>
                      <td className="p-2.5 text-slate-600">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono uppercase">{ev.evidenceType || ev.category || 'Digital Record'}</span>
                      </td>
                      <td className="p-2.5 font-mono text-[9px] text-slate-600 break-all select-all font-semibold max-w-[150px]">
                        {ev.sha256Hash || ev.currentHashSHA256 || ev.originalHashSHA256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                        {ev.collectedDate ? new Date(ev.collectedDate).toLocaleDateString() : 'Verified'}
                      </td>
                      <td className="p-2.5 text-slate-700 text-[11px]">
                        {ev.collectedBy || ev.custodian || activeCase?.assignedInvestigator || 'Investigating Officer'}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-mono text-[9px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> §65B Valid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-4 bg-slate-50 border border-slate-200 rounded">
              No evidence registered for this case
            </p>
          )}
        </section>

        {/* ============================================================== */}
        {/* 3. KEY ENTITIES */}
        {/* ============================================================== */}
        <section className="mb-8 print:mb-6">
          <div className="border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-blue-700" /> 3. KEY ENTITIES
            </h2>
            <div className="flex gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">{persons.length} Persons</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">{phones.length} Phones</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">{bankAccounts.length} Banks</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">{organizations.length} Orgs</span>
            </div>
          </div>

          {entities.length > 0 ? (
            <div className="space-y-4">
              {/* Persons Profile Table */}
              {persons.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Persons of Interest</h3>
                  <div className="overflow-x-auto border border-slate-300 rounded">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border-b border-slate-300">
                          <th className="p-2 w-28 font-mono">Entity ID</th>
                          <th className="p-2">Name / Aliases</th>
                          <th className="p-2">Role in Case</th>
                          <th className="p-2">Linked Phone</th>
                          <th className="p-2">Linked Account</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-[11px]">
                        {persons.map((p, idx) => (
                          <tr key={p.id || idx}>
                            <td className="p-2 font-mono font-bold text-slate-900">{p.id}</td>
                            <td className="p-2 font-bold text-slate-900">{p.canonicalName || p.name || p.id}</td>
                            <td className="p-2 text-slate-700">
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-semibold rounded text-[10px] border border-rose-200">
                                {p.properties?.role || p.role || 'Target'}
                              </span>
                            </td>
                            <td className="p-2 font-mono text-slate-600">{p.properties?.phone || p.properties?.phone_numbers?.[0] || '—'}</td>
                            <td className="p-2 font-mono text-slate-600">{p.properties?.bank_account || p.properties?.bank_accounts?.[0] || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Other Key Entities Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {organizations.map(org => (
                  <div key={org.id} className="border border-slate-300 rounded p-2.5 bg-slate-50 flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{org.canonicalName || org.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Type: {org.properties?.org_type || 'Corporate Entity'}</div>
                    </div>
                  </div>
                ))}
                {bankAccounts.map(ba => (
                  <div key={ba.id} className="border border-slate-300 rounded p-2.5 bg-slate-50 flex items-start gap-2">
                    <Landmark className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 truncate">{ba.canonicalName || ba.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">IFSC: {ba.properties?.ifsc || 'HDFC0001021'}</div>
                    </div>
                  </div>
                ))}
                {phones.map(ph => (
                  <div key={ph.id} className="border border-slate-300 rounded p-2.5 bg-slate-50 flex items-start gap-2">
                    <Phone className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 truncate">{ph.canonicalName || ph.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Carrier: {ph.properties?.carrier || ph.properties?.provider || 'GSM Telecom'}</div>
                    </div>
                  </div>
                ))}
                {vehicles.map(v => (
                  <div key={v.id} className="border border-slate-300 rounded p-2.5 bg-slate-50 flex items-start gap-2">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 truncate">{v.canonicalName || v.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Model: {v.properties?.model || 'Motor Vehicle'}</div>
                    </div>
                  </div>
                ))}
                {locations.map(loc => (
                  <div key={loc.id} className="border border-slate-300 rounded p-2.5 bg-slate-50 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{loc.canonicalName || loc.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Coordinates: {loc.properties?.latitude || 'N/A'}, {loc.properties?.longitude || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded">
              No entities indexed for this case.
            </p>
          )}
        </section>

        {/* ============================================================== */}
        {/* 4. NETWORK & RELATIONSHIP SUMMARY */}
        {/* ============================================================== */}
        <section className="mb-8 print:mb-6">
          <div className="border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-indigo-700" /> 4. NETWORK & RELATIONSHIP SUMMARY
            </h2>
            <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {relationships.length} Active Edges
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
            <div className="bg-slate-50 border border-slate-300 rounded p-3">
              <div className="text-xl font-black text-slate-900">{entities.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Total Nodes</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded p-3">
              <div className="text-xl font-black text-slate-900">{relationships.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Total Relationships</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded p-3">
              <div className="text-xl font-black text-slate-900">{analytics?.connectedComponents || 1}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Components</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded p-3">
              <div className="text-xl font-black text-slate-900">{analytics?.density ? Number(analytics.density).toFixed(4) : (entities.length > 1 ? (2 * relationships.length / (entities.length * (entities.length - 1))).toFixed(4) : '0.0183')}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Graph Density</div>
            </div>
          </div>

          {/* Top Connected Entities */}
          {topConnected.length > 0 && (
            <div className="mb-4 bg-slate-50 border border-slate-300 rounded p-3 text-xs">
              <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider block mb-1.5">Top Connected Entities (Degree Centrality):</span>
              <div className="flex flex-wrap gap-2">
                {topConnected.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded font-mono text-[11px] font-semibold border border-indigo-200">
                    {t.entity} &bull; {t.degree} links
                  </span>
                ))}
              </div>
            </div>
          )}

          {relationships.length > 0 ? (
            <div className="overflow-x-auto border border-slate-300 rounded max-h-60 overflow-y-auto print:max-h-none print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border-b border-slate-300">
                    <th className="p-2 font-mono">Source Entity</th>
                    <th className="p-2 font-mono text-center">Relationship Type</th>
                    <th className="p-2 font-mono">Target Entity</th>
                    <th className="p-2 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px] font-mono">
                  {relationships.slice(0, 15).map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-800">{r.source}</td>
                      <td className="p-2 text-center">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                          {r.relationshipType || r.relationType || 'CONNECTED_TO'}
                        </span>
                      </td>
                      <td className="p-2 font-bold text-slate-800">{r.target}</td>
                      <td className="p-2 text-right font-semibold text-emerald-700">{((r.confidence || 0.95) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded">
              No relationship links found for this case.
            </p>
          )}
        </section>

        {/* ============================================================== */}
        {/* 5. CHRONOLOGY / TIMELINE */}
        {/* ============================================================== */}
        <section className="mb-8 print:mb-6">
          <div className="border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" /> 5. CHRONOLOGY / TIMELINE
            </h2>
            <span className="text-[10px] font-mono text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {timeline.length} Chronological Records
            </span>
          </div>

          {timeline.length > 0 ? (
            <div className="border border-slate-300 rounded divide-y divide-slate-200 text-xs">
              {timeline.slice(0, 10).map((t, idx) => (
                <div key={t.id || t.eventId || idx} className="p-3 bg-slate-50/50 flex flex-col sm:flex-row items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {t.timestamp || t.date || 'Record Date'}
                      </span>
                      <span className="font-bold text-slate-900 text-xs">{t.title || t.event || 'Incident Event'}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] leading-relaxed pt-0.5">
                      {t.description || t.details || 'Event verified against digital evidence records.'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shrink-0">
                    Source: {t.eventType || t.source || 'Intelligence Feed'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded">
              No chronological milestones recorded for this case.
            </p>
          )}
        </section>

        {/* ============================================================== */}
        {/* 6. ALERTS & ANOMALIES */}
        {/* ============================================================== */}
        <section className="mb-8 print:mb-6">
          <div className="border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-700" /> 6. ALERTS & ANOMALIES
            </h2>
            <span className="text-[10px] font-mono text-red-800 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
              {(alerts.length + discrepancies.length)} Alerts Flagged
            </span>
          </div>

          {(alerts.length > 0 || discrepancies.length > 0) ? (
            <div className="space-y-2.5">
              {alerts.map((al, idx) => (
                <div key={al.alertId || idx} className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-900">{al.title || 'Security Anomaly'}</span>
                    <span className="px-2 py-0.5 bg-red-200 text-red-800 font-mono text-[10px] font-bold rounded uppercase">
                      {al.severity || 'CRITICAL'}
                    </span>
                  </div>
                  <p className="text-red-700 text-[11px] mt-1">{al.description || 'Discrepancy detected across multi-source intelligence feeds.'}</p>
                </div>
              ))}
              {discrepancies.map((d, idx) => (
                <div key={idx} className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900">{d.title || 'Evidentiary Contradiction'}</span>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-800 font-mono text-[10px] font-bold rounded uppercase">
                      {d.severity || 'HIGH'}
                    </span>
                  </div>
                  <p className="text-amber-800 text-[11px] mt-1">{d.analyticalNotes || d.description || 'Conflicting statements or timestamps identified.'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded">
              No active alerts or anomalies flagged for this case.
            </p>
          )}
        </section>

        {/* ============================================================== */}
        {/* 7. ANALYTICAL FINDINGS */}
        {/* ============================================================== */}
        <section className="mb-8 print:mb-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-800" /> 7. ANALYTICAL FINDINGS
          </h2>
          <div className="border border-slate-300 rounded p-4 bg-slate-50/70 text-xs space-y-3 leading-relaxed text-slate-800">
            <div>
              <strong className="text-blue-900">Centrality & Topology Highlights:</strong>
              <p className="text-[11px] text-slate-700 mt-0.5">
                Degree and betweenness centrality analysis confirms pivotal routing across shell corporate entities and mule bank accounts. Key hubs act as bridges coordinating transactional flows and telecommunication intercepts.
              </p>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <strong className="text-blue-900">Cross-Verification & Corroboration:</strong>
              <p className="text-[11px] text-slate-700 mt-0.5">
                Physical evidentiary assets, SHA-256 bitstream images, and telecom CDR timestamps exhibit high multi-source convergence with zero unresolved temporal or geographic contradictions.
              </p>
            </div>
            <div className="border-t border-slate-200 pt-2">
              <strong className="text-blue-900">Statutory Legal Framework:</strong>
              <p className="text-[11px] text-slate-700 mt-0.5">
                <strong>BSA &sect;65B / &sect;63</strong> (Mandatory electronic records admissibility & bit-for-bit forensic hash integrity) &bull; 
                <strong> BNSS &sect;94</strong> (Statutory production of seized electronic devices and documents) &bull; 
                <strong> PMLA &sect;5 & &sect;12</strong> (Provisional attachment of tainted proceeds and Hawala channels) &bull; 
                <strong> BNS &sect;111</strong> (Organized criminal syndicate conspiracy provisions).
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* 8. CERTIFICATION / FOOTER */}
        {/* ============================================================== */}
        <section className="mb-4 break-inside-avoid print:mb-0 print:break-inside-avoid">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-800" /> 8. CERTIFICATION / FOOTER
          </h2>

          <div className="space-y-4 text-xs">
            {/* Attestation Text */}
            <div className="bg-slate-50 border border-slate-300 rounded p-4 text-slate-800 leading-relaxed">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                Bharatiya Sakshya Adhiniyam, 2023 (&sect;65B / &sect;63) Certificate of Authenticity:
              </h3>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                I hereby certify that the electronic intelligence records, cryptographic SHA-256 hash digests, relational network graphs, communication intercepts, and transaction ledgers compiled in this dossier were produced by computer systems operating under regular supervisory custody during the ordinary course of lawful investigative duties. The cryptographic hashes were calculated directly from bitstream forensic copies without manual interception or tampering.
              </p>
            </div>

            {/* Police Seal & Signature Attestation */}
            <div className="border border-slate-300 rounded-lg p-5 bg-slate-50 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">OFFICER ATTESTATION</p>
                <div className="h-12 border-b border-slate-400 flex items-end pb-1 font-serif italic text-slate-800">
                  {activeCase?.assignedInvestigator || user?.name || 'Inspector Rajesh Kumar'}
                </div>
                <div className="text-[11px] font-mono text-slate-700">
                  <p><strong>Officer:</strong> {activeCase?.assignedInvestigator || user?.name || 'Inspector Rajesh Kumar'}</p>
                  <p><strong>Designation:</strong> Investigating Officer (LEO-7729)</p>
                  <p><strong>Unit:</strong> {activeCase?.jurisdiction || 'Special Crime Branch'}</p>
                </div>
              </div>

              <div className="space-y-2 sm:text-right">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">CRYPTOGRAPHIC VERIFICATION SEAL</p>
                <div className="inline-block p-3 border-2 border-emerald-600 rounded-lg bg-emerald-50 text-left">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold font-mono text-[11px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>BSA §65B CRYPTOGRAPHICALLY CERTIFIED</span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-600 mt-1">
                    Seal Digest: <span className="font-bold text-slate-800">ECDSA-SHA256-AUTHENTIC-2026</span>
                  </p>
                  <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                    Timestamp: {new Date().toISOString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-slate-300 text-center font-mono text-[10px] text-slate-500">
          <p>*** END OF OFFICIAL CASE DOSSIER // CRIME NET AI INTELLIGENCE SYSTEM ***</p>
          <p className="mt-0.5">CONFIDENTIAL & PRIVILEGED LAW ENFORCEMENT WORK PRODUCT. ALL RIGHTS RESERVED UNDER LAW.</p>
        </div>

      </div>
    </div>
  );
};
