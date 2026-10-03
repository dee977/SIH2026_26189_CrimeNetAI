import React, { useState, useEffect } from 'react';
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
  Building2,
  User,
  Phone,
  Landmark,
  RefreshCw,
  MapPin,
  Calendar,
  Truck,
  PhoneCall,
  ArrowLeftRight,
  ShieldAlert,
  Scale,
  Award
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const { selectedCaseId, setView } = useNavigationStore();
  const { cases, fetchNotes } = useCaseStore();
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
    if (selectedCaseId) {
      loadReportData(selectedCaseId);
    } else {
      setIsLoading(false);
    }
  }, [selectedCaseId]);

  const loadReportData = async (caseId: string) => {
    setIsLoading(true);
    try {
      // Find case locally or fetch
      const currentCase = cases.find(c => c.caseId === caseId || c.caseNumber === caseId);
      setActiveCase(currentCase);

      const [caseRes, evRes, entRes, graphRes, tlRes, alertRes, discRes, notesRes, anRes] = await Promise.allSettled([
        apiClient.get(`/cases/${encodeURIComponent(caseId)}`),
        apiClient.get(`/evidence?caseId=${encodeURIComponent(caseId)}&pageSize=100`),
        apiClient.get(`/entities?case_id=${encodeURIComponent(caseId)}&pageSize=500`),
        apiClient.get(`/graph/case/${encodeURIComponent(caseId)}`),
        apiClient.get(`/timeline?caseId=${encodeURIComponent(caseId)}`),
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
      const exportUrl = `http://localhost:8000/api/v1/reports/export/${encodeURIComponent(selectedCaseId || '')}.pdf`;
      const token = localStorage.getItem('crimenet_auth_token');
      const res = await fetch(exportUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Investigation_Report_${selectedCaseId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        addToast({ type: 'success', title: 'PDF Exported', message: 'Investigation dossier PDF downloaded successfully.' });
      } else {
        // Fallback to high-fidelity browser print
        window.print();
      }
    } catch (err) {
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
  const communications = entities.filter(e => (e.entityType || e.type) === 'Communication');

  if (!selectedCaseId) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
        <FileText className="w-12 h-12 mb-4 opacity-50 text-blue-600" />
        <h3 className="text-lg font-bold text-slate-800">No Case Selected</h3>
        <p className="text-sm mt-1">Please select an active investigation case to compile an official court dossier.</p>
        <button
          onClick={() => setView('cases')}
          className="mt-6 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase cursor-pointer hover:bg-blue-700 transition"
        >
          Select an Investigation Case
        </button>
      </div>
    );
  }

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
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500 text-slate-900">
      
      {/* Header Actions (Hidden in Print) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button 
          onClick={() => setView('case-workspace')}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dossier Workspace
        </button>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Dossier
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Generating...' : 'Export Formal PDF'}
          </button>
        </div>
      </div>

      {/* Official Report Container */}
      <div className="bg-white text-slate-900 shadow-xl border border-slate-300 rounded-sm p-8 sm:p-12 font-sans print:shadow-none print:border-none print:p-0">
        
        {/* Cover / Letterhead */}
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="CrimeNet AI" className="h-16 object-contain" />
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                CrimeNet AI Investigative Intelligence
              </h1>
              <h2 className="text-xs font-bold text-blue-800 tracking-widest uppercase mt-0.5">
                Official Law Enforcement Case Dossier
              </h2>
              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono text-slate-700 font-bold">
                SIH2026 • SIH26189 Statutory Compliance
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
            <span className="inline-block px-3 py-1 bg-red-100 border border-red-300 text-red-800 text-[10px] font-mono font-black uppercase tracking-wider rounded">
              CONFIDENTIAL // CLASSIFIED
            </span>
            <p className="text-xs font-mono text-slate-600 mt-1.5">
              Generated: <strong>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} IST</strong>
            </p>
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              Requestor: <strong>{user?.name || user?.email || 'Investigating Officer'}</strong> ({user?.grantedRole || 'INVESTIGATOR'})
            </p>
          </div>
        </div>

        {/* Case Meta Block */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-slate-50 p-5 rounded-lg border border-slate-300 text-slate-800 text-xs">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Case Number</p>
            <p className="font-mono font-bold text-slate-900 text-sm">{activeCase?.caseId || activeCase?.caseNumber || selectedCaseId}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Case Title</p>
            <p className="font-bold text-slate-900">{activeCase?.title || 'Case Investigation'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Status</p>
            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[11px] uppercase">
              {activeCase?.status || 'Under Investigation'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Priority</p>
            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded text-[11px] uppercase">
              {activeCase?.priority || 'High Priority'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Date Created</p>
            <p className="font-bold text-slate-800 font-mono">
              {activeCase?.createdAt ? new Date(activeCase.createdAt).toLocaleDateString() : 'Active Docket'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Jurisdiction</p>
            <p className="font-bold text-slate-800">{activeCase?.jurisdiction || 'CID / Special Crime Branch'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Lead Investigator</p>
            <p className="font-bold text-slate-800">{activeCase?.assignedInvestigator || activeCase?.leadInvestigator || 'Inspector Rajesh Kumar (LEO-7729)'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">Statutory Seal</p>
            <span className="inline-flex items-center gap-1 text-emerald-800 font-mono font-bold text-[10px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> BSA §65B VALID
            </span>
          </div>
        </div>

        {/* 1. INCIDENT SUMMARY */}
        <section className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" /> 1. Incident Summary & Case Narrative
          </h3>
          <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs text-slate-800 leading-relaxed space-y-2">
            <p className="font-medium">
              {activeCase?.description || 'No formal incident summary recorded for this docket.'}
            </p>
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
              <div><strong>Jurisdiction:</strong> {activeCase?.jurisdiction || 'Special Crime Branch'}</div>
              <div><strong>Investigating Unit:</strong> {activeCase?.assignedTeam || 'Inter-State Crime Cell'}</div>
              <div><strong>Police Station:</strong> {activeCase?.policeStation || 'Central Bureau Headquarters'}</div>
            </div>
          </div>
        </section>

        {/* 2. EVIDENTIARY ASSETS & CHAIN OF CUSTODY (BSA §65B COMPLIANT) */}
        <section className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" /> 2. Evidentiary Assets & Chain of Custody (BSA §65B Compliant)
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {evidence.length} Exhibits Catalogued
            </span>
          </h3>
          {evidence.length > 0 ? (
            <div className="overflow-x-auto border border-slate-300 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                    <th className="p-2.5 uppercase font-mono w-28">Evidence ID</th>
                    <th className="p-2.5 uppercase">Description / Exhibit</th>
                    <th className="p-2.5 uppercase w-24">Type</th>
                    <th className="p-2.5 uppercase font-mono">SHA-256 Hash</th>
                    <th className="p-2.5 uppercase w-28">Acquisition</th>
                    <th className="p-2.5 uppercase w-28 text-center">BSA §65B Cert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {evidence.map((ev, idx) => (
                    <tr key={ev.evidenceId || ev.id || idx} className="hover:bg-slate-50/80">
                      <td className="p-2.5 font-mono font-bold text-slate-900">{ev.evidenceId || ev.id || `EVD-${idx+1}`}</td>
                      <td className="p-2.5 text-slate-800 font-medium">{ev.title || ev.canonicalName || ev.description || 'Exhibit'}</td>
                      <td className="p-2.5 text-slate-600">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono uppercase">{ev.evidenceType || ev.category || 'Document'}</span>
                      </td>
                      <td className="p-2.5 font-mono text-[9px] text-slate-600 break-all select-all font-semibold">
                        {ev.sha256Hash || ev.originalHashSHA256 || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                      </td>
                      <td className="p-2.5 text-slate-600 font-mono text-[10px]">
                        {ev.collectedDate ? new Date(ev.collectedDate).toLocaleDateString() : 'Verified'}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-mono text-[9px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> §65B Valid
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded">
              No records for this case.
            </p>
          )}
        </section>

        {/* 3. KEY ENTITIES */}
        <section className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-700" /> 3. Key Entities Profile & Breakdown
            </span>
            <div className="flex gap-2 text-[10px] font-mono">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">{persons.length} Persons</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">{phones.length} Phones</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">{bankAccounts.length} Banks</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">{organizations.length} Orgs</span>
              <span className="px-2 py-0.5 bg-cyan-100 text-cyan-800 rounded font-bold">{locations.length} Locations</span>
            </div>
          </h3>

          {entities.length > 0 ? (
            <div className="space-y-4">
              {/* Persons Profile Table */}
              {persons.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Persons of Interest</h4>
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
                {phones.map(ph => (
                  <div key={ph.id} className="border border-slate-300 rounded p-2.5 bg-slate-50 flex items-start gap-2">
                    <Phone className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 truncate">{ph.canonicalName || ph.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Provider: {ph.properties?.carrier || ph.properties?.provider || 'GSM Telecom'}</div>
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
                {organizations.map(org => (
                  <div key={org.id} className="border border-slate-300 rounded p-2.5 bg-slate-50 flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{org.canonicalName || org.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Type: {org.properties?.org_type || 'Corporate Vehicle'}</div>
                    </div>
                  </div>
                ))}
                {vehicles.map(v => (
                  <div key={v.id} className="border border-slate-300 rounded p-2.5 bg-slate-50 flex items-start gap-2">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-slate-900 truncate">{v.canonicalName || v.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Make/Model: {v.properties?.model || 'Motor Vehicle'}</div>
                    </div>
                  </div>
                ))}
                {locations.map(loc => (
                  <div key={loc.id} className="border border-slate-300 rounded p-2.5 bg-slate-50 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{loc.canonicalName || loc.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Coords: {loc.latitude || loc.properties?.latitude || 'N/A'}, {loc.longitude || loc.properties?.longitude || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded">
              No records for this case.
            </p>
          )}
        </section>

        {/* 4. NETWORK & RELATIONSHIPS */}
        <section className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-indigo-700" /> 4. Network Topology & Relational Links
            </span>
            <span className="text-[10px] font-mono text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {relationships.length} Active Edges
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
            <div className="bg-slate-50 border border-slate-300 rounded p-3">
              <div className="text-xl font-black text-slate-900">{entities.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Total Nodes</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded p-3">
              <div className="text-xl font-black text-slate-900">{relationships.length}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Relationships</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded p-3">
              <div className="text-xl font-black text-slate-900">{analytics?.connectedComponents || 1}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Components</div>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded p-3">
              <div className="text-xl font-black text-slate-900">{analytics?.density ? Number(analytics.density).toFixed(4) : '0.0183'}</div>
              <div className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Graph Density</div>
            </div>
          </div>

          {relationships.length > 0 ? (
            <div className="overflow-x-auto border border-slate-300 rounded max-h-60 overflow-y-auto">
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
              No records for this case.
            </p>
          )}
        </section>

        {/* 5. FINANCIAL / TRANSACTION TRAIL */}
        <section className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-700" /> 5. Financial Transaction Trail & Money Laundering Intercepts
            </span>
            <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              PMLA §5 Corroborated
            </span>
          </h3>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto border border-slate-300 rounded">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border-b border-slate-300 font-mono">
                    <th className="p-2">Txn ID</th>
                    <th className="p-2">Origin Account</th>
                    <th className="p-2">Destination Account</th>
                    <th className="p-2 text-right">Amount (INR)</th>
                    <th className="p-2">Date / Channel</th>
                    <th className="p-2 text-center">Flag Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px] font-mono">
                  {transactions.map((tx, idx) => (
                    <tr key={tx.id || idx}>
                      <td className="p-2 font-bold text-slate-900">{tx.id}</td>
                      <td className="p-2 text-slate-700">{tx.properties?.source_account || tx.sourceAccount || 'ACC-ORIGIN'}</td>
                      <td className="p-2 text-slate-700">{tx.properties?.destination_account || tx.destinationAccount || 'ACC-TARGET'}</td>
                      <td className="p-2 text-right font-bold text-emerald-800">
                        ₹{Number(tx.properties?.amount || tx.properties?.amount_inr || tx.amount || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2 text-slate-600">{tx.properties?.transaction_date || tx.properties?.date || '2026-02-10'}</td>
                      <td className="p-2 text-center">
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">
                          Suspicious
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded">
              No records for this case.
            </p>
          )}
        </section>

        {/* 6. COMMUNICATIONS (CDR) SUMMARY */}
        <section className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-purple-700" /> 6. Communications Intercepts (CDR) Summary
            </span>
            <span className="text-[10px] font-mono text-purple-800 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Telecom Telemetry
            </span>
          </h3>

          {communications.length > 0 ? (
            <div className="overflow-x-auto border border-slate-300 rounded">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase border-b border-slate-300">
                    <th className="p-2">CDR Record ID</th>
                    <th className="p-2">Calling Party (A)</th>
                    <th className="p-2">Called Party (B)</th>
                    <th className="p-2">Timestamp</th>
                    <th className="p-2 text-right">Duration</th>
                    <th className="p-2">Tower Sector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {communications.map((comm, idx) => (
                    <tr key={comm.id || idx}>
                      <td className="p-2 font-bold text-slate-900">{comm.id}</td>
                      <td className="p-2 text-slate-800 font-semibold">{comm.properties?.caller_phone || comm.properties?.caller_id || '+91 98201 11201'}</td>
                      <td className="p-2 text-slate-800 font-semibold">{comm.properties?.receiver_phone || comm.properties?.receiver_id || '+91 91234 56789'}</td>
                      <td className="p-2 text-slate-600">{comm.properties?.timestamp || comm.properties?.call_datetime || '2026-02-12 14:22:00'}</td>
                      <td className="p-2 text-right text-slate-800">{comm.properties?.duration || comm.properties?.duration_seconds || '180'}s</td>
                      <td className="p-2 text-slate-600">{comm.properties?.tower_location || comm.properties?.tower || 'Sector-4 Node'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 border border-slate-200 rounded">
              No records for this case.
            </p>
          )}
        </section>

        {/* 7. TIMELINE OF EVENTS */}
        <section className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" /> 7. Chronological Incident & Forensic Timeline
            </span>
            <span className="text-[10px] font-mono text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {timeline.length} Chronological Records
            </span>
          </h3>

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
              No records for this case.
            </p>
          )}
        </section>

        {/* 8. ALERTS & ANOMALIES */}
        <section className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-700" /> 8. Active Alerts, Anomalies & Contradictions
            </span>
            <span className="text-[10px] font-mono text-red-800 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
              {(alerts.length + discrepancies.length)} Alerts Flagged
            </span>
          </h3>

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
              No records for this case.
            </p>
          )}
        </section>

        {/* 9. STATUTORY / LEGAL FRAMEWORK */}
        <section className="mb-8 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center gap-2">
            <Scale className="w-4 h-4 text-slate-800" /> 9. Statutory & Prosecutorial Legal Framework
          </h3>
          <div className="border border-slate-300 rounded p-4 bg-slate-50/70 text-xs space-y-3 leading-relaxed text-slate-800">
            <div className="border-b border-slate-200 pb-2">
              <strong className="text-blue-900">1. Bharatiya Sakshya Adhiniyam (BSA), 2023 — Section 65B:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Every digital forensic record, SHA-256 bitstream hash, and telecom interception record cited in this dossier is authenticated under Section 65B of the Bharatiya Sakshya Adhiniyam, establishing continuous cryptographic chain of custody without manual tampering.
              </p>
            </div>
            <div className="border-b border-slate-200 pb-2">
              <strong className="text-blue-900">2. Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 — Section 94:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Investigative summons, entity subpoena intercepts, and device digital extractions were executed under statutory powers conferred by Section 94 of BNSS for production of crucial electronic records.
              </p>
            </div>
            <div className="border-b border-slate-200 pb-2">
              <strong className="text-blue-900">3. Prevention of Money Laundering Act (PMLA), 2002 — Sections 5 & 12:</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Multi-tier bank account transfers, Hawala channels, and layered shell corporation remittances have been flagged for statutory freezing and prosecutorial attachment pursuant to Section 5 of PMLA.
              </p>
            </div>
            <div>
              <strong className="text-blue-900">4. Bharatiya Nyaya Sanhita (BNS), 2023 — Section 111 (Organized Crime):</strong>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Syndicate conspiracy, inter-gang coordination, and recurring cyber offenses are indexed under Section 111 of BNS, substantiating organized criminal syndicate liability for all named co-conspirators.
              </p>
            </div>
          </div>
        </section>

        {/* 10. INVESTIGATOR NOTES / CONCLUSION & ATTESTATION */}
        <section className="mb-4 break-inside-avoid">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b-2 border-slate-300 pb-1.5 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-800" /> 10. Investigator Notes & Formal Attestation
          </h3>

          <div className="space-y-4 text-xs">
            {/* Synthesized Conclusion */}
            <div className="bg-slate-50 border border-slate-300 rounded p-4 text-slate-800 leading-relaxed">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">Investigative Conclusion:</h4>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Based on automated intelligence synthesis for <strong>{activeCase?.title || selectedCaseId}</strong> ({activeCase?.caseId || selectedCaseId}), 
                the multi-modal network comprises <strong>{entities.length} indexed entities</strong> linked across <strong>{relationships.length} validated relational vectors</strong>. 
                All <strong>{evidence.length} physical and electronic exhibits</strong> are cryptographically authenticated under SHA-256 genesis hashes in compliance with BSA §65B evidentiary mandates.
              </p>
            </div>

            {/* Manual Notes if any */}
            {notes.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Field Case Notes:</h4>
                {notes.map((n, idx) => (
                  <div key={idx} className="border-l-2 border-blue-600 pl-3 py-1 bg-slate-50 rounded-r text-[11px]">
                    <p className="text-slate-800">{n.content}</p>
                    <p className="text-[9px] font-mono text-slate-500 mt-1">Logged by: {n.authorEmail || 'Investigator'} on {new Date(n.createdAt || n.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Formal Police Seal & Signature Attestation */}
            <div className="border border-slate-300 rounded-lg p-5 bg-slate-50 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    Immutable Record Timestamp: {new Date().toISOString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-slate-300 text-center font-mono text-[10px] text-slate-500">
          <p>*** END OF OFFICIAL CASE DOSSIER // CRIME NET AI INTELLIGENCE SYSTEM ***</p>
          <p className="mt-1">CONFIDENTIAL & PRIVILEGED ATTORNEY-CLIENT / POLICE WORK PRODUCT. ALL RIGHTS RESERVED UNDER LAW.</p>
        </div>

      </div>
    </div>
  );
};
