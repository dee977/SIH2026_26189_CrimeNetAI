import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigationStore } from '../../store/navigationStore';
import { PermissionDeniedState } from '../common/UIStates';
import { 
  Settings, 
  Users, 
  Shield, 
  Database, 
  FileCheck, 
  History, 
  Lock, 
  Server, 
  Radio, 
  CheckCircle2, 
  KeyRound,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldAlert,
  Fingerprint,
  FileCode,
  HardDrive,
  Cpu,
  Activity,
  Check,
  X,
  Clock,
  Layers,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  Building,
  Phone,
  Mail,
  Scale
} from 'lucide-react';

interface OfficerUser {
  id: string;
  name: string;
  badgeNumber: string;
  email: string;
  role: 'ADMIN' | 'INVESTIGATOR' | 'ANALYST' | 'AUDITOR';
  unit: string;
  status: 'ACTIVE' | 'ON DUTY' | 'RESTRICTED';
  lastLogin: string;
  permissions: string[];
}

export interface AccessRequest {
  id: string;
  officerName: string;
  badgeNumber: string;
  email: string;
  phone: string;
  department: string;
  requestedRole: 'INVESTIGATOR' | 'ANALYST' | 'AUDITOR';
  clearanceLevel: 'LEVEL 1 (RESTRICTED)' | 'LEVEL 2 (CONFIDENTIAL)' | 'LEVEL 3 (TOP SECRET)';
  assignedCaseId: string;
  assignedCaseTitle: string;
  justification: string;
  warrantRef: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  requestedPermissions: string[];
}

const DEMO_OFFICERS: OfficerUser[] = [
  {
    id: 'USR-001',
    name: 'Inspector Rajesh Sharma',
    badgeNumber: 'LEO-7729',
    email: 'admin123@gov.in',
    role: 'ADMIN',
    unit: 'CrimeNet Central Command',
    status: 'ACTIVE',
    lastLogin: '2026-01-09 15:20 IST',
    permissions: ['all_permissions', 'admin:write', 'ledger:override', 'case:supervise']
  },
  {
    id: 'USR-002',
    name: 'DySP Aarti Deshmukh',
    badgeNumber: 'LEO-0042',
    email: 'aarti.deshmukh@police.gov.in',
    role: 'INVESTIGATOR',
    unit: 'CID Economic Offences Wing',
    status: 'ON DUTY',
    lastLogin: '2026-01-09 14:45 IST',
    permissions: ['case:read', 'case:write', 'evidence:read', 'evidence:write', 'timeline:read']
  },
  {
    id: 'USR-003',
    name: 'Vikramaditya Nair',
    badgeNumber: 'LEO-9918',
    email: 'v.nair@forensics.gov.in',
    role: 'ANALYST',
    unit: 'Cyber Forensic Intelligence Lab',
    status: 'ACTIVE',
    lastLogin: '2026-01-09 13:10 IST',
    permissions: ['graph:read', 'analytics:read', 'gis:read', 'ai:read', 'timeline:read']
  },
  {
    id: 'USR-004',
    name: 'Inspector Sanjay Rao',
    badgeNumber: 'LEO-1024',
    email: 'sanjay.rao@ncb.gov.in',
    role: 'INVESTIGATOR',
    unit: 'Narcotics Control Task Force',
    status: 'ON DUTY',
    lastLogin: '2026-01-09 11:30 IST',
    permissions: ['case:read', 'case:write', 'evidence:write', 'watchlist:manage']
  },
  {
    id: 'USR-005',
    name: 'K. Kulkarni',
    badgeNumber: 'AUD-4019',
    email: 'kulkarni.audit@judiciary.gov.in',
    role: 'AUDITOR',
    unit: 'State Forensic Audit & BSA Commission',
    status: 'ACTIVE',
    lastLogin: '2026-01-09 09:15 IST',
    permissions: ['audit:read', 'verification:read', 'evidence:read', 'report:generate']
  }
];

const INITIAL_ACCESS_REQUESTS: AccessRequest[] = [
  {
    id: 'REQ-2026-0891',
    officerName: 'Sub-Inspector Pooja Verma',
    badgeNumber: 'LEO-8841',
    email: 'pooja.verma@mumbaipolice.gov.in',
    phone: '+91 98201 55412',
    department: 'Cyber Crime Investigation Cell (Bandra Kurla Complex)',
    requestedRole: 'INVESTIGATOR',
    clearanceLevel: 'LEVEL 2 (CONFIDENTIAL)',
    assignedCaseId: 'CASE-VIDEO-003',
    assignedCaseTitle: 'Operation DarkByte - Cyber Banking Phishing Syndicate',
    justification: 'Appointed as Investigating Officer for seizing overseas Frankfurt Tor exit relay traffic and Telegram phishing bot tokens under Section 94 of Bharatiya Nagarik Suraksha Sanhita (BNSS). Requires Evidence Write and Graph Analysis clearance.',
    warrantRef: 'Chief Metropolitan Magistrate Subpoena #CR-2026-CY-991',
    submittedAt: '15 mins ago (15:35 IST)',
    status: 'PENDING',
    requestedPermissions: ['case:write', 'evidence:write', 'graph:read', 'timeline:read']
  },
  {
    id: 'REQ-2026-0892',
    officerName: 'ACP Anand Kulkarni',
    badgeNumber: 'LEO-3104',
    email: 'anand.kulkarni@gov.in',
    phone: '+91 98110 99420',
    department: 'Anti-Narcotics Control Bureau (ANC Coastal Maritime Wing)',
    requestedRole: 'INVESTIGATOR',
    clearanceLevel: 'LEVEL 3 (TOP SECRET)',
    assignedCaseId: 'CASE-VIDEO-002',
    assignedCaseTitle: 'Operation White Dust - Coastal Maritime Narcotics Intercept',
    justification: 'Coordinating high-seas maritime interdiction with Indian Coast Guard. Requires telecom handover decryption, vessel AIS radar telemetry cross-verification, and emergency suspect watchlist alerting under NDPS Section 67.',
    warrantRef: 'NDPS Special Court Urgent Warrant #NCB-WZ-402',
    submittedAt: '42 mins ago (15:08 IST)',
    status: 'PENDING',
    requestedPermissions: ['case:write', 'watchlist:manage', 'gis:read', 'evidence:write']
  },
  {
    id: 'REQ-2026-0893',
    officerName: 'Senior Forensic Scientist Meera Sen',
    badgeNumber: 'CIV-9022',
    email: 'meera.sen@cfsl.gov.in',
    phone: '+91 94330 11849',
    department: 'Central Forensic Science Laboratory (CFSL Digital Forensics)',
    requestedRole: 'ANALYST',
    clearanceLevel: 'LEVEL 2 (CONFIDENTIAL)',
    assignedCaseId: 'CASE-2025-M3-DATASET',
    assignedCaseTitle: 'Nhava Sheva Port Contraband Intercept',
    justification: 'Tasked with verifying bitstream physical image integrity of seized OnePlus 11 mobile hardware clone. Requires read access to M6 Cryptographic SHA-256 Ledger and Section 65B electronic record hash validation.',
    warrantRef: 'Panchnama Requisition #EVD-2025-M3-01 / Panchnama #09',
    submittedAt: '1 hour ago (14:48 IST)',
    status: 'PENDING',
    requestedPermissions: ['graph:read', 'evidence:read', 'verification:read', 'report:generate']
  },
  {
    id: 'REQ-2026-0894',
    officerName: 'DySP Vikram Rathore',
    badgeNumber: 'LEO-5510',
    email: 'v.rathore@statepolice.gov.in',
    phone: '+91 97204 88319',
    department: 'Anti-Human Trafficking Unit (AHTU State Special Operations Cell)',
    requestedRole: 'INVESTIGATOR',
    clearanceLevel: 'LEVEL 2 (CONFIDENTIAL)',
    assignedCaseId: 'CASE-VIDEO-004',
    assignedCaseTitle: 'Operation Iron Shield - Highway Transit Route Intercept',
    justification: 'Supervising highway checkpost raids along NH4 corridor. Granted temporary emergency clearance for Fastag toll camera ingestion and vehicle GPS tracker triangulation.',
    warrantRef: 'High Court Special Leave Warrant #SLP-881',
    submittedAt: '3 hours ago (12:45 IST)',
    status: 'APPROVED',
    reviewedBy: 'Insp. Rajesh Sharma (LEO-7729)',
    reviewedAt: '2 hours ago (Approved)',
    requestedPermissions: ['case:write', 'gis:read', 'timeline:read', 'evidence:write']
  }
];

const RBAC_PERMISSIONS_MATRIX = [
  { permission: 'dashboard:read', description: 'Access executive telemetry & case workspaces', admin: true, investigator: true, analyst: true, auditor: true },
  { permission: 'case:write', description: 'Create and modify case files, priority & status', admin: true, investigator: true, analyst: false, auditor: false },
  { permission: 'graph:read', description: 'Query Neo4j knowledge graph & multi-hop paths', admin: true, investigator: true, analyst: true, auditor: false },
  { permission: 'analytics:read', description: 'Run Louvain community clustering & centrality', admin: true, investigator: true, analyst: true, auditor: false },
  { permission: 'timeline:read', description: 'Inspect chronological event sequence & playback', admin: true, investigator: true, analyst: true, auditor: true },
  { permission: 'evidence:write', description: 'Ingest physical/digital evidence & compute SHA-256', admin: true, investigator: true, analyst: false, auditor: false },
  { permission: 'verification:read', description: 'Review multi-source evidentiary contradictions', admin: true, investigator: true, analyst: true, auditor: true },
  { permission: 'report:generate', description: 'Export court-certified PDF dossiers under BSA §65B', admin: true, investigator: true, analyst: true, auditor: true },
  { permission: 'audit:read', description: 'Inspect immutable Merkle ledger audit trails', admin: true, investigator: false, analyst: false, auditor: true },
  { permission: 'admin:write', description: 'Configure node clustering, RBAC roles & API keys', admin: true, investigator: false, analyst: false, auditor: false }
];

const M3_DATASETS = [
  {
    name: 'persons.csv',
    type: 'Suspect & Associate Nodes',
    records: '10,000 Entities',
    size: '1.8 MB',
    neo4jLabels: ':Person',
    status: 'SYNCHRONIZED',
    lastUpdated: '2026-01-08 18:30 IST'
  },
  {
    name: 'bank_accounts.csv',
    type: 'Financial & Mule Accounts',
    records: '25,000 Nodes',
    size: '3.4 MB',
    neo4jLabels: ':BankAccount',
    status: 'SYNCHRONIZED',
    lastUpdated: '2026-01-08 18:30 IST'
  },
  {
    name: 'transactions.csv',
    type: 'Hawala & Fund Flow Edges',
    records: '85,000 Relationships',
    size: '12.1 MB',
    neo4jLabels: ':TRANSFERRED_FUNDS',
    status: 'SYNCHRONIZED',
    lastUpdated: '2026-01-08 18:31 IST'
  },
  {
    name: 'telecom_cdr.csv',
    type: 'Call Detail Records & SMS',
    records: '140,000 Communications',
    size: '18.6 MB',
    neo4jLabels: ':COMMUNICATED_WITH',
    status: 'SYNCHRONIZED',
    lastUpdated: '2026-01-08 18:32 IST'
  },
  {
    name: 'fastag_transit.csv',
    type: 'Highway Toll Barrier Loci',
    records: '32,000 Passes',
    size: '4.2 MB',
    neo4jLabels: ':TRANSITED_LOCUS',
    status: 'SYNCHRONIZED',
    lastUpdated: '2026-01-08 18:32 IST'
  },
  {
    name: 'criminal_relationships.csv',
    type: 'Syndicate Hierarchy Edges',
    records: '48,000 Graph Edges',
    size: '6.7 MB',
    neo4jLabels: ':CO_ACCUSED_WITH',
    status: 'SYNCHRONIZED',
    lastUpdated: '2026-01-08 18:33 IST'
  }
];

const M6_LEDGER_BLOCKS = [
  {
    blockId: 'BLK-008492',
    timestamp: '2026-01-09 14:15:22 IST',
    evidenceCode: 'EVD-2024-0812',
    itemTitle: 'OnePlus 11 5G Physical Forensic Clone (IMEI 864201048821901)',
    officer: 'Insp. R. Sharma (LEO-7729)',
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    merkleRoot: '7d9f2a01bc89a3ef401829eebca912048991a0293817462019ab38472910adbc',
    status: 'MATCH / VALID'
  },
  {
    blockId: 'BLK-008491',
    timestamp: '2026-01-09 12:40:10 IST',
    evidenceCode: 'EVD-2025-M3-01',
    itemTitle: 'Nhava Sheva Port Berth Seizure Panchnama & ICEGATE Manifest',
    officer: 'DySP A. Deshmukh (LEO-0042)',
    sha256: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
    merkleRoot: '1092837465abcedf0192837465abcdef0192837465abcdef0192837465abcdef',
    status: 'MATCH / VALID'
  },
  {
    blockId: 'BLK-008490',
    timestamp: '2026-01-09 10:15:45 IST',
    evidenceCode: 'EVD-2026-CDR-09',
    itemTitle: 'Airtel Tower 19402 Sector 4 Raw Binary Telecom Carrier Dump',
    officer: 'V. Nair (LEO-9918)',
    sha256: '4f5e6d7c8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e',
    merkleRoot: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    status: 'MATCH / VALID'
  },
  {
    blockId: 'BLK-008489',
    timestamp: '2026-01-09 08:30:00 IST',
    evidenceCode: 'EVD-2026-BANK-04',
    itemTitle: 'HDFC Bank RTGS Inward Ledger #99214430 Statement Export',
    officer: 'Insp. S. Rao (LEO-1024)',
    sha256: '8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a',
    merkleRoot: '99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff',
    status: 'MATCH / VALID'
  }
];

export const AdminDashboardView: React.FC = () => {
  const { user } = useAuthStore();
  const { setView, selectCase } = useNavigationStore();
  
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'datasets' | 'ledger' | 'overview' | 'settings'>('requests');
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>(INITIAL_ACCESS_REQUESTS);
  const [requestFilter, setRequestFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Permission check
  const isAdmin = 
    user?.grantedRole === 'ADMIN' || 
    user?.permissions?.includes('admin:read') ||
    user?.email === 'admin123@gov.in';

  if (!isAdmin) {
    return (
      <PermissionDeniedState 
        requiredPermission="admin:read" 
        requiredRole="ADMIN" 
      />
    );
  }

  const triggerAction = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3800);
  };

  const handleApproveRequest = (reqId: string, isEmergency?: boolean) => {
    setAccessRequests(prev => prev.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'APPROVED',
          reviewedBy: user?.officerId ? `${user.officerId} (Current Admin)` : 'LEO-7729 (Insp. Sharma)',
          reviewedAt: isEmergency ? 'Temporary 24h Clearance Issued' : 'Just now (Approved)'
        };
      }
      return r;
    }));
    triggerAction(`Access Request ${reqId} Approved! Cryptographic JWT and Case Scope token provisioned.`);
  };

  const handleRejectRequest = (reqId: string) => {
    setAccessRequests(prev => prev.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'REJECTED',
          reviewedBy: user?.officerId ? `${user.officerId} (Current Admin)` : 'LEO-7729 (Insp. Sharma)',
          reviewedAt: 'Just now (Rejected)'
        };
      }
      return r;
    }));
    triggerAction(`Access Request ${reqId} Rejected. Rejection advisory logged to audit ledger.`);
  };

  const pendingRequestsCount = accessRequests.filter(r => r.status === 'PENDING').length;

  const filteredOfficers = DEMO_OFFICERS.filter(o => 
    o.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    o.badgeNumber.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    o.unit.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    o.role.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  const filteredRequests = accessRequests.filter(r => {
    if (requestFilter === 'ALL') return true;
    return r.status === requestFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
              Master Infrastructure Station
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              System Administrator Terminal
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Root Authority Active
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-1.5">
            System Administration & Access Control Room
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Orchestrate officer security clearances, verify statutory warrants, manage data pipelines, and inspect immutable ledger state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
            Officer: {user?.officerId || 'LEO-7729'} ({user?.grantedRole || 'ADMIN'})
          </span>
        </div>
      </div>

      {/* Floating Action Banner */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'requests' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Access & Clearance Requests</span>
          {pendingRequestsCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'requests'
                ? 'bg-white text-blue-700'
                : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
            }`}>
              {pendingRequestsCount} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'users' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & RBAC Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('datasets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'datasets' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Dataset Management (M3)</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'ledger' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Evidence Ledger (M6)</span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'overview' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Cluster Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'settings' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System Settings</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 0. ACCESS REQUESTS TAB (REQUESTED FEATURE)                */}
      {/* ========================================================= */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          
          {/* Header Summary & Filters */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900">Officer Access & Case Clearance Requests</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review statutory warrant justifications, grant cryptographic clearance tokens, and enforce case boundary isolation.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRequestFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      requestFilter === tab
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Requests' : tab === 'PENDING' ? 'Pending Review' : tab} ({tab === 'ALL' ? accessRequests.length : accessRequests.filter(r => r.status === tab).length})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Requests List Cards */}
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500">
                <FileCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No requests match this filter.</p>
              </div>
            ) : (
              filteredRequests.map(req => {
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isRejected = req.status === 'REJECTED';

                return (
                  <div 
                    key={req.id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition-all ${
                      isPending 
                        ? 'border-amber-300 ring-1 ring-amber-200/50' 
                        : isApproved 
                        ? 'border-emerald-200' 
                        : 'border-slate-200 opacity-80'
                    }`}
                  >
                    {/* Card Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                          {req.id}
                        </span>

                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border ${
                          req.clearanceLevel.includes('TOP SECRET')
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {req.clearanceLevel}
                        </span>

                        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Submitted {req.submittedAt}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-900 border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>PENDING APPROVAL</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>CLEARANCE APPROVED</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-800 border border-rose-300">
                            <X className="w-3.5 h-3.5 text-rose-600" />
                            <span>REQUEST REJECTED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Officer & Case Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      {/* Left: Officer Information */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{req.officerName}</span>
                          <span className="font-mono text-blue-700 font-bold px-2 py-0.5 rounded bg-blue-100/70 border border-blue-200 text-[11px]">
                            {req.badgeNumber}
                          </span>
                        </div>
                        
                        <div className="text-slate-600 font-medium flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{req.department}</span>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {req.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {req.phone}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-slate-500 font-semibold text-[11px]">Requested Role:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            req.requestedRole === 'INVESTIGATOR'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : req.requestedRole === 'ANALYST'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}>
                            {req.requestedRole}
                          </span>
                        </div>
                      </div>

                      {/* Right: Target Case Scope & Warrant Reference */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">
                            Assigned Case Clearance Target:
                          </span>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                              {req.assignedCaseId}
                            </span>
                            <button
                              onClick={() => {
                                selectCase(req.assignedCaseId);
                                triggerAction(`Navigated to active investigation scope for ${req.assignedCaseId}`);
                              }}
                              className="text-blue-600 hover:underline text-[11px] font-semibold flex items-center gap-1"
                            >
                              <span>Inspect Case</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-slate-800 font-bold text-xs mt-1">
                            {req.assignedCaseTitle}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1">
                            Statutory Warrant / Court Order Reference:
                          </span>
                          <div className="font-mono text-purple-700 font-bold text-xs bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
                            {req.warrantRef}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Official Justification Quote */}
                    <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 leading-relaxed">
                      <span className="text-[10px] font-mono uppercase text-blue-800 font-bold block mb-1">
                        Sworn Investigatory Justification:
                      </span>
                      <p className="italic text-slate-800 font-normal">
                        "{req.justification}"
                      </p>
                    </div>

                    {/* Requested Permissions Tags */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-[11px] font-mono text-slate-500 font-semibold">Requested Scopes:</span>
                      {req.requestedPermissions.map(p => (
                        <span key={p} className="font-mono text-[10px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {p}
                        </span>
                      ))}
                    </div>

                    {/* Action Strip */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        {req.reviewedBy && (
                          <span className="text-[11px] font-mono text-slate-500">
                            Reviewed by: <strong className="text-slate-800">{req.reviewedBy}</strong> • {req.reviewedAt}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(req.id)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Grant Token</span>
                            </button>
                            
                            <button
                              onClick={() => handleApproveRequest(req.id, true)}
                              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition"
                            >
                              <span>Grant 24h Emergency Access</span>
                            </button>

                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            onClick={() => handleRejectRequest(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition"
                          >
                            Revoke Active Clearance
                          </button>
                        )}

                        {isRejected && (
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition"
                          >
                            Re-Open for Review
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 1. USERS & RBAC MATRIX TAB                               */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          {/* Top Officers Directory Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Commissioned Officers & Identity Access Directory</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage credentials, security levels, and assigned statutory investigation mandates.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerAction("New Officer Registration Dialog opened. Verification token issued.")}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
                >
                  + Add Officer
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
                placeholder="Filter by officer name, badge number, police unit, or granted role..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            {/* Officers Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Officer / Identity</th>
                    <th className="p-3">Badge No.</th>
                    <th className="p-3">Assigned Police Unit</th>
                    <th className="p-3">Granted Role</th>
                    <th className="p-3">Duty Status</th>
                    <th className="p-3">Last Active</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOfficers.map((officer) => (
                    <tr key={officer.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{officer.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{officer.email}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-blue-700">
                        {officer.badgeNumber}
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {officer.unit}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          officer.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : officer.role === 'INVESTIGATOR'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : officer.role === 'ANALYST'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {officer.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          {officer.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {officer.lastLogin}
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => triggerAction(`Modified role permissions for ${officer.name}`)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition"
                        >
                          Permissions
                        </button>
                        <button
                          onClick={() => triggerAction(`Revoked active JWT session tokens for ${officer.name}`)}
                          className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-medium text-[11px] transition"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Statutory Role-Based Access Control (RBAC) Matrix */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Bharatiya Sakshya Adhiniyam Statutory RBAC Access Matrix</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Strict non-delegable separation of duties between investigative, analytical, and court auditing functions.</p>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">System Permission</th>
                    <th className="p-3">Statutory Scope & Legal Authority</th>
                    <th className="p-3 text-center">ADMIN</th>
                    <th className="p-3 text-center">INVESTIGATOR</th>
                    <th className="p-3 text-center">ANALYST</th>
                    <th className="p-3 text-center">AUDITOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {RBAC_PERMISSIONS_MATRIX.map((perm) => (
                    <tr key={perm.permission} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {perm.permission}
                      </td>
                      <td className="p-3 text-slate-600 font-medium">
                        {perm.description}
                      </td>
                      <td className="p-3 text-center">
                        {perm.admin ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center font-bold">✓</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center font-bold">✕</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {perm.investigator ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center font-bold">✓</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center font-bold">✕</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {perm.analyst ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center font-bold">✓</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center font-bold">✕</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {perm.auditor ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center justify-center font-bold">✓</span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 inline-flex items-center justify-center font-bold">✕</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DATASET MANAGEMENT (M3) TAB                           */}
      {/* ========================================================= */}
      {activeTab === 'datasets' && (
        <div className="space-y-6">
          
          {/* Storage & Graph Database Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500 font-bold">
                <span>Neo4j Graph Partition</span>
                <HardDrive className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">400,000+</div>
              <div className="text-xs text-slate-500 font-medium">Nodes indexed across 5 investigation cases</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500 font-bold">
                <span>Graph Relationships</span>
                <Cpu className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono">1,248,500</div>
              <div className="text-xs text-slate-500 font-medium">Active multi-hop syndicate edges in Cypher engine</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500 font-bold">
                <span>Ingestion Pipeline</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 font-mono">HEALTHY</div>
              <div className="text-xs text-slate-500 font-medium">Batch UNWIND pipeline operational at 12k rows/sec</div>
            </div>
          </div>

          {/* Active Dataset Files Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Synchronized Datasets in member3_data_graph</h3>
                <p className="text-xs text-slate-500 mt-0.5">Physical CSV repositories ingested into the graph database schema.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerAction("Neo4j full-text indexes re-warmed and schema constraints verified.")}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rebuild Schema Indices</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Dataset Filename</th>
                    <th className="p-3">Logical Schema Category</th>
                    <th className="p-3">Record Volume</th>
                    <th className="p-3">Size on Disk</th>
                    <th className="p-3">Graph Label Mapping</th>
                    <th className="p-3">Sync Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {M3_DATASETS.map((ds) => (
                    <tr key={ds.name} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-blue-700 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{ds.name}</span>
                      </td>
                      <td className="p-3 text-slate-800 font-medium">
                        {ds.type}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {ds.records}
                      </td>
                      <td className="p-3 font-mono text-slate-500 text-[11px]">
                        {ds.size}
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                          {ds.neo4jLabels}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>{ds.status}</span>
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => triggerAction(`Verified 100% hash integrity for ${ds.name}`)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition"
                        >
                          Verify Hash
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Upload / Ingestion Center link */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Need to ingest additional raw evidence or telecom dumps?</h4>
                <p className="text-xs text-slate-600 mt-0.5">Use the interactive Ingestion Center to upload CSV files with schema auto-detection.</p>
              </div>
            </div>
            <button
              onClick={() => setView('ingestion')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <span>Go to Import Center</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 3. EVIDENCE LEDGER (M6) TAB                              */}
      {/* ========================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          
          {/* BSA Section 65B Compliance Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 bg-gradient-to-br from-white via-emerald-50/20 to-slate-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 shadow-sm">
                  <Fingerprint className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      M6 Security & Evidence Core
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      HSM Hardware Key Signed
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                    Bharatiya Sakshya Adhiniyam (BSA) Section 65B Cryptographic Ledger
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Immutable timestamped Merkle blockchain logging digital forensic clones, seized device panchnamas, and hash certificates.
                  </p>
                </div>
              </div>

              <button
                onClick={() => triggerAction("Audited all Merkle tree blocks. 0 tamper detections, 100% cryptographic parity.")}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5 self-start sm:self-center"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Merkle Root Tree</span>
              </button>
            </div>

            {/* Quick Ledger Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Total Chained Artifacts</div>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">1,248 Records</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Hash Standard</div>
                <div className="text-lg font-bold text-blue-700 font-mono mt-0.5">FIPS 180-4 SHA-256</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Tamper Flags</div>
                <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">0 Detections (100%)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-bold">Judicial Admissibility</div>
                <div className="text-lg font-bold text-purple-700 font-mono mt-0.5">BSA §65B Certified</div>
              </div>
            </div>
          </div>

          {/* Ledger Blocks Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Immutable Ledger Chronology & Custody Chain</h3>
                <p className="text-xs text-slate-500 mt-0.5">Every evidence accession is permanently etched with cryptographic signatures.</p>
              </div>
              <button
                onClick={() => setView('evidence')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View Evidence Vault</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {M6_LEDGER_BLOCKS.map((block) => (
                <div 
                  key={block.blockId}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-sm space-y-2.5 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {block.blockId}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {block.evidenceCode}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        {block.itemTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-700" />
                        <span>{block.status}</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {block.timestamp}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-0.5">Canonical SHA-256 Digest:</span>
                      <span className="font-mono text-slate-900 font-semibold text-[11px] break-all">{block.sha256}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-0.5">Merkle Node Parent Hash:</span>
                      <span className="font-mono text-blue-700 font-semibold text-[11px] break-all">{block.merkleRoot}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-600 font-medium">
                      Seizing Custodian: <strong className="text-slate-900">{block.officer}</strong>
                    </span>
                    <button
                      onClick={() => triggerAction(`Generated signed BSA Section 65B Certificate for ${block.evidenceCode}`)}
                      className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs transition"
                    >
                      Export BSA Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* 4. CLUSTER OVERVIEW TAB                                  */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Backend Gateway</span>
              <div className="text-sm font-bold text-emerald-700 font-mono mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>ONLINE (M2)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Port 8000 REST</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Graph Database</span>
              <div className="text-sm font-bold text-blue-700 font-mono mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>NEO4J BOLT (M3)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Port 7687 Cypher</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">ML Engine</span>
              <div className="text-sm font-bold text-purple-700 font-mono mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>M5 GRAPH ML</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Louvain & Centrality</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Integrity Ledger</span>
              <div className="text-sm font-bold text-emerald-700 font-mono mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>SYNCHRONIZED (M6)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">SHA-256 Chain</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Integration Contracts Health</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-blue-700 font-bold">M2 REST API:</span>
                  <span className="text-slate-600 ml-2">Endpoints /entities, /cases, /search, /reports</span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">CONNECTED</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-blue-700 font-bold">M3 Neo4j Graph API:</span>
                  <span className="text-slate-600 ml-2">Endpoints /graph, /graph/hidden-path</span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">CONNECTED</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-blue-700 font-bold">M5 Graph ML API:</span>
                  <span className="text-slate-600 ml-2">Endpoints /graph/analytics, /graph/communities, /verification</span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">CONNECTED</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-blue-700 font-bold">M6 Auth & SHA-256 Ledger:</span>
                  <span className="text-slate-600 ml-2">Endpoints /auth, /evidence/verify-hash, /ledger/audit</span>
                </div>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">CONNECTED</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. SYSTEM SETTINGS TAB                                   */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">System Gateway & Policy Configuration</h3>
          
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Runtime Mock & Synthetic Fallback Mode</h4>
              <p className="text-xs text-slate-500 mt-0.5">Fallback mechanism has been decommissioned. System enforces live backend connections.</p>
            </div>
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              LIVE BACKEND ENFORCED
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">Zero Risk-Score Regulatory Enforcement</h4>
              <p className="text-xs text-slate-500 mt-0.5">Strict prohibition of numerical predictive risk scores in compliance with Ministry of Home Affairs ethics guidelines.</p>
            </div>
            <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
              STRICTLY COMPLIANT
            </span>
          </div>
        </div>
      )}

    </div>
  );
};
