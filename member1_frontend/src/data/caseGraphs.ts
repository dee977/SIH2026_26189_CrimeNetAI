import { GraphNode, GraphEdge, HiddenPathResult } from '../types/graph';
import { EntityType } from '../types/entities';

// ============================================================================
// CASE-SPECIFIC GRAPH DATASETS FOR ALL 5 INVESTIGATIONS
// ============================================================================

export interface CaseGraphBundle {
  caseId: string;
  title: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  candidateSources: { id: string; name: string; type: EntityType }[];
  candidateTargets: { id: string; name: string; type: EntityType }[];
  defaultHiddenPath: HiddenPathResult;
}

// ----------------------------------------------------------------------------
// 1. CASE-2025-M3-DATASET: Falcon Web - National Contraband & Telecom Syndicate
// ----------------------------------------------------------------------------
const M3_NODES: GraphNode[] = [
  {
    id: 'P00004',
    label: 'Vikramaditya Rao (P00004)',
    entityType: 'Person',
    entityId: 'P00004',
    degree: 5,
    analytics: {
      degreeCentrality: 0.65,
      betweennessCentrality: 0.58,
      pagerank: 0.22,
      communityId: 1,
      isBridge: true,
      clusteringCoefficient: 0.45,
      analyticalLeadNote: 'High betweenness indicates cross-regional conduit role between Southern and Western cells.'
    }
  },
  {
    id: 'P00001',
    label: 'Aarav Patel (P00001 - Kingpin)',
    entityType: 'Person',
    entityId: 'P00001',
    degree: 6,
    analytics: {
      degreeCentrality: 0.78,
      betweennessCentrality: 0.72,
      pagerank: 0.31,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.60,
      analyticalLeadNote: 'Syndicate apex controller coordinating Hawala transactions and international freight manifests.'
    }
  },
  {
    id: 'P00002',
    label: 'Rohan Sharma (P00002 - Operative)',
    entityType: 'Person',
    entityId: 'P00002',
    degree: 4,
    analytics: {
      degreeCentrality: 0.48,
      betweennessCentrality: 0.35,
      pagerank: 0.14,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.50
    }
  },
  {
    id: 'P00003',
    label: 'Priya Nair (P00003 - Financial Broker)',
    entityType: 'Person',
    entityId: 'P00003',
    degree: 4,
    analytics: {
      degreeCentrality: 0.52,
      betweennessCentrality: 0.42,
      pagerank: 0.17,
      communityId: 2,
      isBridge: true,
      clusteringCoefficient: 0.38
    }
  },
  {
    id: 'P00005',
    label: 'Suresh Verma (P00005 - Ground Clearing)',
    entityType: 'Person',
    entityId: 'P00005',
    degree: 3,
    analytics: {
      degreeCentrality: 0.38,
      betweennessCentrality: 0.25,
      pagerank: 0.11,
      communityId: 2,
      isBridge: false,
      clusteringCoefficient: 0.40
    }
  },
  {
    id: 'PHO-M3-004',
    label: '+91-98490-11223 (Encrypted Burner)',
    entityType: 'Phone',
    entityId: 'PHO-M3-004',
    degree: 3,
    analytics: {
      degreeCentrality: 0.35,
      betweennessCentrality: 0.30,
      pagerank: 0.09,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.20
    }
  },
  {
    id: 'PHO-M3-001',
    label: '+91-98200-44556 (Apex Dispatch)',
    entityType: 'Phone',
    entityId: 'PHO-M3-001',
    degree: 3,
    analytics: {
      degreeCentrality: 0.40,
      betweennessCentrality: 0.32,
      pagerank: 0.12,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.25
    }
  },
  {
    id: 'ACC-M3-8821',
    label: 'HDFC Escrow 99214482',
    entityType: 'BankAccount',
    entityId: 'ACC-M3-8821',
    degree: 3,
    analytics: {
      degreeCentrality: 0.35,
      betweennessCentrality: 0.28,
      pagerank: 0.10,
      communityId: 2,
      isBridge: false,
      clusteringCoefficient: 0.30
    }
  },
  {
    id: 'ACC-M3-9914',
    label: 'ICICI Dispersal 44018892',
    entityType: 'BankAccount',
    entityId: 'ACC-M3-9914',
    degree: 3,
    analytics: {
      degreeCentrality: 0.35,
      betweennessCentrality: 0.31,
      pagerank: 0.10,
      communityId: 2,
      isBridge: false,
      clusteringCoefficient: 0.30
    }
  },
  {
    id: 'TXN-M3-551',
    label: 'RTGS ₹42,00,000 (Hawala Funnel)',
    entityType: 'Transaction',
    entityId: 'TXN-M3-551',
    degree: 2,
    analytics: {
      degreeCentrality: 0.25,
      betweennessCentrality: 0.22,
      pagerank: 0.08,
      communityId: 2,
      isBridge: false,
      clusteringCoefficient: 0.0
    }
  },
  {
    id: 'ORG-M3-01',
    label: 'Falcon Cargo Logistics Ltd',
    entityType: 'Organization',
    entityId: 'ORG-M3-01',
    degree: 4,
    analytics: {
      degreeCentrality: 0.50,
      betweennessCentrality: 0.45,
      pagerank: 0.19,
      communityId: 1,
      isBridge: true,
      clusteringCoefficient: 0.55
    }
  },
  {
    id: 'LOC-M3-01',
    label: 'Inland Container Depot Tughlakabad',
    entityType: 'Location',
    entityId: 'LOC-M3-01',
    degree: 3,
    analytics: {
      degreeCentrality: 0.35,
      betweennessCentrality: 0.28,
      pagerank: 0.11,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.40
    }
  },
  {
    id: 'FIR-M3-001',
    label: 'FIR No. 104/2025 (Organized Syndicate)',
    entityType: 'FIR',
    entityId: 'FIR-M3-001',
    degree: 3,
    analytics: {
      degreeCentrality: 0.38,
      betweennessCentrality: 0.30,
      pagerank: 0.12,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.35
    }
  }
];

const M3_EDGES: GraphEdge[] = [
  { id: 'E-M3-01', source: 'P00004', target: 'PHO-M3-004', relationType: 'USES_PHONE', confidence: 0.98, sourceDocument: 'Telecom CDR Register' },
  { id: 'E-M3-02', source: 'PHO-M3-004', target: 'PHO-M3-001', relationType: 'ENCRYPTED_CALL', confidence: 0.95, sourceDocument: 'CDR Switch Log (148 Calls)' },
  { id: 'E-M3-03', source: 'PHO-M3-001', target: 'P00001', relationType: 'REGISTERED_TO', confidence: 0.99, sourceDocument: 'Subscriber CAF & KYC' },
  { id: 'E-M3-04', source: 'P00001', target: 'ORG-M3-01', relationType: 'BENEFICIAL_OWNER', confidence: 0.96, sourceDocument: 'MCA Registrar of Companies' },
  { id: 'E-M3-05', source: 'P00004', target: 'ACC-M3-8821', relationType: 'SIGNATORY_AUTHORITY', confidence: 0.97, sourceDocument: 'Bank KYC Mandate' },
  { id: 'E-M3-06', source: 'ACC-M3-8821', target: 'TXN-M3-551', relationType: 'ORIGINATING_DEBIT', confidence: 0.99, transactionAmount: 4200000, sourceDocument: 'Core Banking RTGS Slip' },
  { id: 'E-M3-07', source: 'TXN-M3-551', target: 'ACC-M3-9914', relationType: 'BENEFICIARY_CREDIT', confidence: 0.99, transactionAmount: 4200000, sourceDocument: 'Bank Statement Ledger' },
  { id: 'E-M3-08', source: 'ACC-M3-9914', target: 'P00003', relationType: 'PASS_THROUGH_ROUTED', confidence: 0.94, sourceDocument: 'Forensic Audit Report' },
  { id: 'E-M3-09', source: 'P00003', target: 'P00001', relationType: 'FINANCIAL_REMITTANCE_BROKER', confidence: 0.95, sourceDocument: 'Hawala Ledger Seizure' },
  { id: 'E-M3-10', source: 'P00001', target: 'P00002', relationType: 'SYNDICATE_OPERATIONAL_LINK', confidence: 0.92, sourceDocument: 'Intelligence Informant Report' },
  { id: 'E-M3-11', source: 'P00002', target: 'LOC-M3-01', relationType: 'DISPATCH_INSPECTION_SUPERVISED', confidence: 0.94, sourceDocument: 'Gate Entry Logs' },
  { id: 'E-M3-12', source: 'ORG-M3-01', target: 'LOC-M3-01', relationType: 'MAINTAINS_BONDED_WAREHOUSE', confidence: 0.98, sourceDocument: 'Customs License #ICD-882' },
  { id: 'E-M3-13', source: 'FIR-M3-001', target: 'P00004', relationType: 'NAMES_ACCUSED', confidence: 1.0, sourceDocument: 'Certified FIR Copy' },
  { id: 'E-M3-14', source: 'FIR-M3-001', target: 'P00001', relationType: 'NAMES_CONSPIRATOR', confidence: 1.0, sourceDocument: 'Certified FIR Copy' },
  { id: 'E-M3-15', source: 'P00005', target: 'ORG-M3-01', relationType: 'GROUND_LOGISTICS_COORDINATOR', confidence: 0.91, sourceDocument: 'Employment Roster' }
];

const M3_HIDDEN_PATH: HiddenPathResult = {
  pathId: 'M3-PATH-001',
  pathLength: 5,
  startEntity: { id: 'P00004', name: 'Vikramaditya Rao (P00004)', type: 'Person' },
  targetEntity: { id: 'P00001', name: 'Aarav Patel (P00001 - Kingpin)', type: 'Person' },
  nodes: [
    M3_NODES.find(n => n.id === 'P00004')!,
    M3_NODES.find(n => n.id === 'PHO-M3-004')!,
    M3_NODES.find(n => n.id === 'PHO-M3-001')!,
    M3_NODES.find(n => n.id === 'ORG-M3-01')!,
    M3_NODES.find(n => n.id === 'P00001')!
  ],
  edges: [
    M3_EDGES.find(e => e.id === 'E-M3-01')!,
    M3_EDGES.find(e => e.id === 'E-M3-02')!,
    M3_EDGES.find(e => e.id === 'E-M3-03')!,
    M3_EDGES.find(e => e.id === 'E-M3-04')!
  ],
  explanation: 'Multi-Hop Intelligence Discovery: Subject P00004 operates burner device +91-98490-11223, which engaged in 148 frequency-clustered calls with apex dispatch line +91-98200-44556 registered to Falcon Cargo Logistics Ltd. Corporate MCA records show Kingpin Aarav Patel (P00001) as the 98% beneficial owner and financial controller.',
  supportingEvidenceIds: ['EVD-M3-CDR-01', 'EVD-M3-BANK-02', 'EVD-M3-MCA-03']
};

// ----------------------------------------------------------------------------
// 2. CASE-VIDEO-001: Operation Kuber - Surat-Mumbai Hawala & Shell Laundering
// ----------------------------------------------------------------------------
const V001_NODES: GraphNode[] = [
  {
    id: 'FIN-PER-01',
    label: 'Rajesh K. Sharma (Hawala Intermediary)',
    entityType: 'Person',
    entityId: 'FIN-PER-01',
    degree: 4,
    analytics: { degreeCentrality: 0.60, betweennessCentrality: 0.55, pagerank: 0.25, communityId: 1, isBridge: true, clusteringCoefficient: 0.5 }
  },
  {
    id: 'FIN-PER-02',
    label: 'Vikram Malhotra (Shell Director)',
    entityType: 'Person',
    entityId: 'FIN-PER-02',
    degree: 4,
    analytics: { degreeCentrality: 0.58, betweennessCentrality: 0.50, pagerank: 0.22, communityId: 1, isBridge: false, clusteringCoefficient: 0.4 }
  },
  {
    id: 'FIN-BNK-01',
    label: 'HDFC Vashi Corporate 992144',
    entityType: 'BankAccount',
    entityId: 'FIN-BNK-01',
    degree: 3,
    analytics: { degreeCentrality: 0.35, betweennessCentrality: 0.30, pagerank: 0.12, communityId: 1, isBridge: false, clusteringCoefficient: 0.3 }
  },
  {
    id: 'FIN-BNK-02',
    label: 'Axis Surat Bullion Escrow 44102',
    entityType: 'BankAccount',
    entityId: 'FIN-BNK-02',
    degree: 3,
    analytics: { degreeCentrality: 0.35, betweennessCentrality: 0.28, pagerank: 0.11, communityId: 2, isBridge: false, clusteringCoefficient: 0.3 }
  },
  {
    id: 'FIN-TXN-01',
    label: 'RTGS ₹3,85,00,000 (Pass-Through)',
    entityType: 'Transaction',
    entityId: 'FIN-TXN-01',
    degree: 2,
    analytics: { degreeCentrality: 0.25, betweennessCentrality: 0.20, pagerank: 0.08, communityId: 1, isBridge: false, clusteringCoefficient: 0.0 }
  },
  {
    id: 'FIN-ORG-01',
    label: 'BlueSea Logistics & Trading Pvt Ltd',
    entityType: 'Organization',
    entityId: 'FIN-ORG-01',
    degree: 4,
    analytics: { degreeCentrality: 0.52, betweennessCentrality: 0.48, pagerank: 0.20, communityId: 1, isBridge: true, clusteringCoefficient: 0.45 }
  },
  {
    id: 'FIN-ORG-02',
    label: 'Apex Gems & Bullion DMCC (Dubai)',
    entityType: 'Organization',
    entityId: 'FIN-ORG-02',
    degree: 2,
    analytics: { degreeCentrality: 0.30, betweennessCentrality: 0.25, pagerank: 0.10, communityId: 2, isBridge: false, clusteringCoefficient: 0.2 }
  },
  {
    id: 'FIN-LOC-01',
    label: 'Zaveri Bazaar Remittance Vault',
    entityType: 'Location',
    entityId: 'FIN-LOC-01',
    degree: 2,
    analytics: { degreeCentrality: 0.25, betweennessCentrality: 0.15, pagerank: 0.07, communityId: 2, isBridge: false, clusteringCoefficient: 0.1 }
  },
  {
    id: 'FIN-FIR-01',
    label: 'FIR-2025-EOW-401 (PMLA Inquiry)',
    entityType: 'FIR',
    entityId: 'FIN-FIR-01',
    degree: 3,
    analytics: { degreeCentrality: 0.35, betweennessCentrality: 0.25, pagerank: 0.10, communityId: 1, isBridge: false, clusteringCoefficient: 0.2 }
  }
];

const V001_EDGES: GraphEdge[] = [
  { id: 'E-V1-01', source: 'FIN-PER-01', target: 'FIN-BNK-02', relationType: 'OPERATES_ESCROW', confidence: 0.98, sourceDocument: 'Bank Signature Card' },
  { id: 'E-V1-02', source: 'FIN-BNK-02', target: 'FIN-TXN-01', relationType: 'WIRE_DISPATCH', confidence: 0.99, transactionAmount: 38500000, sourceDocument: 'SWIFT & RTGS Audit' },
  { id: 'E-V1-03', source: 'FIN-TXN-01', target: 'FIN-BNK-01', relationType: 'CREDITED_TO', confidence: 0.99, transactionAmount: 38500000, sourceDocument: 'HDFC Statement' },
  { id: 'E-V1-04', source: 'FIN-BNK-01', target: 'FIN-ORG-01', relationType: 'CORPORATE_ACCOUNT_OF', confidence: 0.99, sourceDocument: 'MCA Filing BS-22' },
  { id: 'E-V1-05', source: 'FIN-PER-02', target: 'FIN-ORG-01', relationType: 'MANAGING_DIRECTOR', confidence: 0.99, sourceDocument: 'DIN Register #082194' },
  { id: 'E-V1-06', source: 'FIN-ORG-01', target: 'FIN-ORG-02', relationType: 'OVERSEAS_REMITTANCE_CONDUIT', confidence: 0.94, sourceDocument: 'FIU STR Intelligence #8812' },
  { id: 'E-V1-07', source: 'FIN-PER-01', target: 'FIN-LOC-01', relationType: 'PHYSICAL_VAULT_MEETING', confidence: 0.91, sourceDocument: 'Surveillance Memo CID' },
  { id: 'E-V1-08', source: 'FIN-FIR-01', target: 'FIN-PER-01', relationType: 'NAMES_ACCUSED', confidence: 1.0, sourceDocument: 'Certified FIR Copy' },
  { id: 'E-V1-09', source: 'FIN-FIR-01', target: 'FIN-PER-02', relationType: 'NAMES_ACCUSED', confidence: 1.0, sourceDocument: 'Certified FIR Copy' }
];

const V001_HIDDEN_PATH: HiddenPathResult = {
  pathId: 'V1-PATH-001',
  pathLength: 5,
  startEntity: { id: 'FIN-PER-01', name: 'Rajesh K. Sharma (Hawala Intermediary)', type: 'Person' },
  targetEntity: { id: 'FIN-ORG-02', name: 'Apex Gems & Bullion DMCC (Dubai)', type: 'Organization' },
  nodes: [
    V001_NODES.find(n => n.id === 'FIN-PER-01')!,
    V001_NODES.find(n => n.id === 'FIN-BNK-02')!,
    V001_NODES.find(n => n.id === 'FIN-TXN-01')!,
    V001_NODES.find(n => n.id === 'FIN-ORG-01')!,
    V001_NODES.find(n => n.id === 'FIN-ORG-02')!
  ],
  edges: [
    V001_EDGES.find(e => e.id === 'E-V1-01')!,
    V001_EDGES.find(e => e.id === 'E-V1-02')!,
    V001_EDGES.find(e => e.id === 'E-V1-03')!,
    V001_EDGES.find(e => e.id === 'E-V1-06')!
  ],
  explanation: 'Financial Laundering Pathway: Rajesh K. Sharma funneled ₹3,85,00,000 from domestic bullion escrow into BlueSea Logistics & Trading Pvt Ltd via rapid RTGS remittance, which then executed international trade settlements to Apex Gems & Bullion DMCC in Dubai within 45 minutes.',
  supportingEvidenceIds: ['EVD-V1-RTGS-01', 'EVD-V1-FIU-02', 'EVD-V1-MCA-03']
};

// ----------------------------------------------------------------------------
// 3. CASE-VIDEO-002: Operation Blue Tide - Maritime Narcotics Intercept
// ----------------------------------------------------------------------------
const V002_NODES: GraphNode[] = [
  {
    id: 'NAR-PER-01',
    label: 'Tariq Al-Mansoor (Consignor)',
    entityType: 'Person',
    entityId: 'NAR-PER-01',
    degree: 3,
    analytics: { degreeCentrality: 0.50, betweennessCentrality: 0.45, pagerank: 0.20, communityId: 1, isBridge: false, clusteringCoefficient: 0.3 }
  },
  {
    id: 'NAR-PER-02',
    label: 'Devendra K. Patil (Clearing Agent)',
    entityType: 'Person',
    entityId: 'NAR-PER-02',
    degree: 4,
    analytics: { degreeCentrality: 0.55, betweennessCentrality: 0.50, pagerank: 0.22, communityId: 1, isBridge: true, clusteringCoefficient: 0.4 }
  },
  {
    id: 'NAR-PHO-01',
    label: 'Thuraya Sat-Phone (+88216-9941)',
    entityType: 'Phone',
    entityId: 'NAR-PHO-01',
    degree: 2,
    analytics: { degreeCentrality: 0.30, betweennessCentrality: 0.28, pagerank: 0.10, communityId: 1, isBridge: false, clusteringCoefficient: 0.1 }
  },
  {
    id: 'NAR-VEH-01',
    label: 'Reefer Container #MRKU-982141-0',
    entityType: 'Vehicle',
    entityId: 'NAR-VEH-01',
    degree: 4,
    analytics: { degreeCentrality: 0.52, betweennessCentrality: 0.48, pagerank: 0.19, communityId: 1, isBridge: true, clusteringCoefficient: 0.45 }
  },
  {
    id: 'NAR-LOC-01',
    label: 'Nhava Sheva Yard 4B Cold Storage',
    entityType: 'Location',
    entityId: 'NAR-LOC-01',
    degree: 3,
    analytics: { degreeCentrality: 0.40, betweennessCentrality: 0.32, pagerank: 0.14, communityId: 1, isBridge: false, clusteringCoefficient: 0.3 }
  },
  {
    id: 'NAR-CRM-01',
    label: 'Seizure of 42.5kg Heroin Contraband',
    entityType: 'Crime',
    entityId: 'NAR-CRM-01',
    degree: 3,
    analytics: { degreeCentrality: 0.42, betweennessCentrality: 0.35, pagerank: 0.16, communityId: 1, isBridge: false, clusteringCoefficient: 0.35 }
  },
  {
    id: 'NAR-FIR-01',
    label: 'FIR-2025-NAR-104 (NDPS Special)',
    entityType: 'FIR',
    entityId: 'NAR-FIR-01',
    degree: 3,
    analytics: { degreeCentrality: 0.38, betweennessCentrality: 0.28, pagerank: 0.12, communityId: 1, isBridge: false, clusteringCoefficient: 0.3 }
  }
];

const V002_EDGES: GraphEdge[] = [
  { id: 'E-V2-01', source: 'NAR-PER-01', target: 'NAR-PHO-01', relationType: 'OPERATES_SAT_PHONE', confidence: 0.98, sourceDocument: 'Naval SIGINT Intercept' },
  { id: 'E-V2-02', source: 'NAR-PHO-01', target: 'NAR-PER-02', relationType: 'COORDINATED_MANIFEST', confidence: 0.95, sourceDocument: 'Intercept Transcripts' },
  { id: 'E-V2-03', source: 'NAR-PER-02', target: 'NAR-VEH-01', relationType: 'SUBMITTED_BILL_OF_ENTRY', confidence: 0.99, sourceDocument: 'ICEGATE Customs Manifest' },
  { id: 'E-V2-04', source: 'NAR-VEH-01', target: 'NAR-LOC-01', relationType: 'DISCHARGED_AT_YARD', confidence: 0.99, sourceDocument: 'Port Authority Gate Ingress' },
  { id: 'E-V2-05', source: 'NAR-LOC-01', target: 'NAR-CRM-01', relationType: 'INTERCEPTION_LOCATION', confidence: 1.0, sourceDocument: 'Customs Seizure Memo #8841' },
  { id: 'E-V2-06', source: 'NAR-FIR-01', target: 'NAR-CRM-01', relationType: 'FORMAL_INVESTIGATION_OF', confidence: 1.0, sourceDocument: 'Certified FIR Copy' },
  { id: 'E-V2-07', source: 'NAR-FIR-01', target: 'NAR-PER-02', relationType: 'NAMES_CUSTODIAL_ARREST', confidence: 1.0, sourceDocument: 'Certified FIR Copy' }
];

const V002_HIDDEN_PATH: HiddenPathResult = {
  pathId: 'V2-PATH-001',
  pathLength: 5,
  startEntity: { id: 'NAR-PER-01', name: 'Tariq Al-Mansoor (Consignor)', type: 'Person' },
  targetEntity: { id: 'NAR-CRM-01', name: 'Seizure of 42.5kg Heroin Contraband', type: 'Crime' },
  nodes: [
    V002_NODES.find(n => n.id === 'NAR-PER-01')!,
    V002_NODES.find(n => n.id === 'NAR-PHO-01')!,
    V002_NODES.find(n => n.id === 'NAR-PER-02')!,
    V002_NODES.find(n => n.id === 'NAR-VEH-01')!,
    V002_NODES.find(n => n.id === 'NAR-CRM-01')!
  ],
  edges: [
    V002_EDGES.find(e => e.id === 'E-V2-01')!,
    V002_EDGES.find(e => e.id === 'E-V2-02')!,
    V002_EDGES.find(e => e.id === 'E-V2-03')!,
    V002_EDGES.find(e => e.id === 'E-V2-05')!
  ],
  explanation: 'Contraband Interception Path: Foreign consignor Tariq Al-Mansoor communicated via Thuraya satellite terminal with port broker Devendra Patil, who lodged fraudulent customs clearance for Reefer Container MRKU-982141-0 containing 42.5 kg concealed illicit heroin at Yard 4B.',
  supportingEvidenceIds: ['EVD-V2-SEIZURE-01', 'EVD-V2-SIGINT-02', 'EVD-V2-MANIFEST-03']
};

// ----------------------------------------------------------------------------
// 4. CASE-VIDEO-003: Operation Phishnet - Cyber Banking Fraud Syndicate
// ----------------------------------------------------------------------------
const V003_NODES: GraphNode[] = [
  {
    id: 'CYB-PER-01',
    label: 'Kabir Sen (Hacker "NullByte")',
    entityType: 'Person',
    entityId: 'CYB-PER-01',
    degree: 3,
    analytics: { degreeCentrality: 0.50, betweennessCentrality: 0.42, pagerank: 0.18, communityId: 1, isBridge: false, clusteringCoefficient: 0.2 }
  },
  {
    id: 'CYB-PHO-01',
    label: 'SIM Box Gateway (64 IMSIs)',
    entityType: 'Phone',
    entityId: 'CYB-PHO-01',
    degree: 3,
    analytics: { degreeCentrality: 0.40, betweennessCentrality: 0.35, pagerank: 0.13, communityId: 1, isBridge: false, clusteringCoefficient: 0.2 }
  },
  {
    id: 'CYB-BNK-01',
    label: 'Student Mule Account SBI Bangalore',
    entityType: 'BankAccount',
    entityId: 'CYB-BNK-01',
    degree: 3,
    analytics: { degreeCentrality: 0.42, betweennessCentrality: 0.38, pagerank: 0.15, communityId: 1, isBridge: true, clusteringCoefficient: 0.3 }
  },
  {
    id: 'CYB-TXN-01',
    label: 'Layered UPI Funnel ₹85,00,000',
    entityType: 'Transaction',
    entityId: 'CYB-TXN-01',
    degree: 2,
    analytics: { degreeCentrality: 0.28, betweennessCentrality: 0.22, pagerank: 0.09, communityId: 1, isBridge: false, clusteringCoefficient: 0.0 }
  },
  {
    id: 'CYB-ORG-01',
    label: 'Telegram Cashout "ShadowPayouts"',
    entityType: 'Organization',
    entityId: 'CYB-ORG-01',
    degree: 3,
    analytics: { degreeCentrality: 0.48, betweennessCentrality: 0.44, pagerank: 0.19, communityId: 1, isBridge: true, clusteringCoefficient: 0.4 }
  },
  {
    id: 'CYB-CRM-01',
    label: 'Banking Portal Impersonation Attack',
    entityType: 'Crime',
    entityId: 'CYB-CRM-01',
    degree: 3,
    analytics: { degreeCentrality: 0.45, betweennessCentrality: 0.40, pagerank: 0.17, communityId: 1, isBridge: false, clusteringCoefficient: 0.3 }
  },
  {
    id: 'CYB-FIR-01',
    label: 'FIR-2025-CYB-201 (IT Act 66D)',
    entityType: 'FIR',
    entityId: 'CYB-FIR-01',
    degree: 3,
    analytics: { degreeCentrality: 0.35, betweennessCentrality: 0.25, pagerank: 0.11, communityId: 1, isBridge: false, clusteringCoefficient: 0.2 }
  }
];

const V003_EDGES: GraphEdge[] = [
  { id: 'E-V3-01', source: 'CYB-PER-01', target: 'CYB-CRM-01', relationType: 'DEPLOYED_EXPLOIT_KIT', confidence: 0.99, sourceDocument: 'CERT-In Incident Report #CY-902' },
  { id: 'E-V3-02', source: 'CYB-CRM-01', target: 'CYB-PHO-01', relationType: 'TRIGGERED_SMISHING_BLAST', confidence: 0.97, sourceDocument: 'Telecom CDR Gateway Logs' },
  { id: 'E-V3-03', source: 'CYB-CRM-01', target: 'CYB-BNK-01', relationType: 'SIPHONED_VICTIM_FUNDS', confidence: 0.99, sourceDocument: 'NPCI UPI Dispute Log' },
  { id: 'E-V3-04', source: 'CYB-BNK-01', target: 'CYB-TXN-01', relationType: 'RAPID_UPI_DISPERSAL', confidence: 0.99, transactionAmount: 8500000, sourceDocument: 'SBI Mule Account Audit' },
  { id: 'E-V3-05', source: 'CYB-TXN-01', target: 'CYB-ORG-01', relationType: 'CRYPTO_CONVERTED_CASHOUT', confidence: 0.94, sourceDocument: 'Binance P2P Subpoena Memo' },
  { id: 'E-V3-06', source: 'CYB-FIR-01', target: 'CYB-CRM-01', relationType: 'REGISTERS_CYBER_CRIME', confidence: 1.0, sourceDocument: 'Certified FIR Copy' },
  { id: 'E-V3-07', source: 'CYB-FIR-01', target: 'CYB-PER-01', relationType: 'ACCUSES_PRIMARY_SUSPECT', confidence: 1.0, sourceDocument: 'Certified FIR Copy' }
];

const V003_HIDDEN_PATH: HiddenPathResult = {
  pathId: 'V3-PATH-001',
  pathLength: 5,
  startEntity: { id: 'CYB-PER-01', name: 'Kabir Sen (Hacker "NullByte")', type: 'Person' },
  targetEntity: { id: 'CYB-ORG-01', name: 'Telegram Cashout "ShadowPayouts"', type: 'Organization' },
  nodes: [
    V003_NODES.find(n => n.id === 'CYB-PER-01')!,
    V003_NODES.find(n => n.id === 'CYB-CRM-01')!,
    V003_NODES.find(n => n.id === 'CYB-BNK-01')!,
    V003_NODES.find(n => n.id === 'CYB-TXN-01')!,
    V003_NODES.find(n => n.id === 'CYB-ORG-01')!
  ],
  edges: [
    V003_EDGES.find(e => e.id === 'E-V3-01')!,
    V003_EDGES.find(e => e.id === 'E-V3-03')!,
    V003_EDGES.find(e => e.id === 'E-V3-04')!,
    V003_EDGES.find(e => e.id === 'E-V3-05')!
  ],
  explanation: 'Cyber Fraud Infrastructure Chain: Operator Kabir Sen deployed banking credential harvester, funneling ₹85,00,000 into rented college student mule accounts in Bangalore, which immediately converted funds via Telegram crypto OTC escrows.',
  supportingEvidenceIds: ['EVD-V3-CERT-01', 'EVD-V3-NPCI-02', 'EVD-V3-P2P-03']
};

// ----------------------------------------------------------------------------
// 5. CASE-VIDEO-004: Operation Iron Shield - Cross-Border Human Trafficking
// ----------------------------------------------------------------------------
const V004_NODES: GraphNode[] = [
  {
    id: 'TRF-PER-01',
    label: 'Farooq Sheikh (Master Conduit)',
    entityType: 'Person',
    entityId: 'TRF-PER-01',
    degree: 4,
    analytics: { degreeCentrality: 0.62, betweennessCentrality: 0.58, pagerank: 0.24, communityId: 1, isBridge: true, clusteringCoefficient: 0.4 }
  },
  {
    id: 'TRF-PER-02',
    label: 'Sunita Das (Safehouse Warden)',
    entityType: 'Person',
    entityId: 'TRF-PER-02',
    degree: 3,
    analytics: { degreeCentrality: 0.45, betweennessCentrality: 0.38, pagerank: 0.16, communityId: 1, isBridge: false, clusteringCoefficient: 0.3 }
  },
  {
    id: 'TRF-LOC-01',
    label: 'Petrapole Border Transit Checkpoint',
    entityType: 'Location',
    entityId: 'TRF-LOC-01',
    degree: 3,
    analytics: { degreeCentrality: 0.42, betweennessCentrality: 0.35, pagerank: 0.15, communityId: 1, isBridge: false, clusteringCoefficient: 0.3 }
  },
  {
    id: 'TRF-LOC-02',
    label: 'Kolkata Barasat Transit Safehouse',
    entityType: 'Location',
    entityId: 'TRF-LOC-02',
    degree: 3,
    analytics: { degreeCentrality: 0.45, betweennessCentrality: 0.39, pagerank: 0.17, communityId: 1, isBridge: false, clusteringCoefficient: 0.35 }
  },
  {
    id: 'TRF-VEH-01',
    label: 'Ambulance Cover Van WB-02-AK-7712',
    entityType: 'Vehicle',
    entityId: 'TRF-VEH-01',
    degree: 3,
    analytics: { degreeCentrality: 0.38, betweennessCentrality: 0.30, pagerank: 0.12, communityId: 1, isBridge: false, clusteringCoefficient: 0.25 }
  },
  {
    id: 'TRF-ORG-01',
    label: 'Global Manpower Solutions (Front Co.)',
    entityType: 'Organization',
    entityId: 'TRF-ORG-01',
    degree: 3,
    analytics: { degreeCentrality: 0.48, betweennessCentrality: 0.42, pagerank: 0.18, communityId: 1, isBridge: true, clusteringCoefficient: 0.4 }
  },
  {
    id: 'TRF-FIR-01',
    label: 'FIR-2025-TRF-312 (Anti-Trafficking)',
    entityType: 'FIR',
    entityId: 'TRF-FIR-01',
    degree: 3,
    analytics: { degreeCentrality: 0.36, betweennessCentrality: 0.26, pagerank: 0.11, communityId: 1, isBridge: false, clusteringCoefficient: 0.2 }
  }
];

const V004_EDGES: GraphEdge[] = [
  { id: 'E-V4-01', source: 'TRF-PER-01', target: 'TRF-LOC-01', relationType: 'CROSS_BORDER_FACILITATOR', confidence: 0.98, sourceDocument: 'BSF Intelligence Log' },
  { id: 'E-V4-02', source: 'TRF-LOC-01', target: 'TRF-VEH-01', relationType: 'BOARDED_CLANDESTINE_VAN', confidence: 0.96, sourceDocument: 'Highway Toll ANPR Camera' },
  { id: 'E-V4-03', source: 'TRF-VEH-01', target: 'TRF-LOC-02', relationType: 'INGRESS_TO_SAFEHOUSE', confidence: 0.99, sourceDocument: 'CCTV Footage Seizure Memo' },
  { id: 'E-V4-04', source: 'TRF-PER-02', target: 'TRF-LOC-02', relationType: 'OPERATIONAL_WARDEN', confidence: 0.97, sourceDocument: 'Lease Deed & Municipal Tax' },
  { id: 'E-V4-05', source: 'TRF-PER-01', target: 'TRF-ORG-01', relationType: 'PROPRIETOR_OF_FRONT_ENTITY', confidence: 0.99, sourceDocument: 'Trade License Record' },
  { id: 'E-V4-06', source: 'TRF-FIR-01', target: 'TRF-PER-01', relationType: 'NAMES_PRINCIPAL_ACCUSED', confidence: 1.0, sourceDocument: 'Certified FIR Copy' },
  { id: 'E-V4-07', source: 'TRF-FIR-01', target: 'TRF-LOC-02', relationType: 'RAIDED_PREMISES', confidence: 1.0, sourceDocument: 'Certified FIR Copy' }
];

const V004_HIDDEN_PATH: HiddenPathResult = {
  pathId: 'V4-PATH-001',
  pathLength: 4,
  startEntity: { id: 'TRF-PER-01', name: 'Farooq Sheikh (Master Conduit)', type: 'Person' },
  targetEntity: { id: 'TRF-LOC-02', name: 'Kolkata Barasat Transit Safehouse', type: 'Location' },
  nodes: [
    V004_NODES.find(n => n.id === 'TRF-PER-01')!,
    V004_NODES.find(n => n.id === 'TRF-LOC-01')!,
    V004_NODES.find(n => n.id === 'TRF-VEH-01')!,
    V004_NODES.find(n => n.id === 'TRF-LOC-02')!
  ],
  edges: [
    V004_EDGES.find(e => e.id === 'E-V4-01')!,
    V004_EDGES.find(e => e.id === 'E-V4-02')!,
    V004_EDGES.find(e => e.id === 'E-V4-03')!
  ],
  explanation: 'Trafficking Infiltration Route: Farooq Sheikh organized illicit border crossings at Petrapole checkpoint using fake transit documents, transporting individuals inside modified cover ambulance WB-02-AK-7712 directly to the secluded Barasat transit safehouse managed by Sunita Das.',
  supportingEvidenceIds: ['EVD-V4-BSF-01', 'EVD-V4-ANPR-02', 'EVD-V4-RAID-03']
};

// ============================================================================
// MAP OF BUNDLES BY CASE ID
// ============================================================================
export const CASE_GRAPH_BUNDLES: Record<string, CaseGraphBundle> = {
  'CASE-2025-M3-DATASET': {
    caseId: 'CASE-2025-M3-DATASET',
    title: 'Operation Falcon Web - National Contraband & Communications Syndicate',
    nodes: M3_NODES,
    edges: M3_EDGES,
    candidateSources: [
      { id: 'P00004', name: 'Vikramaditya Rao (P00004)', type: 'Person' },
      { id: 'P00002', name: 'Rohan Sharma (P00002)', type: 'Person' },
      { id: 'P00003', name: 'Priya Nair (P00003)', type: 'Person' }
    ],
    candidateTargets: [
      { id: 'P00001', name: 'Aarav Patel (P00001 - Kingpin)', type: 'Person' },
      { id: 'ORG-M3-01', name: 'Falcon Cargo Logistics Ltd', type: 'Organization' },
      { id: 'ACC-M3-9914', name: 'ICICI Dispersal Account', type: 'BankAccount' }
    ],
    defaultHiddenPath: M3_HIDDEN_PATH
  },
  'CASE-VIDEO-001': {
    caseId: 'CASE-VIDEO-001',
    title: 'Operation Kuber - Surat-Mumbai Shell Remittance Syndicate',
    nodes: V001_NODES,
    edges: V001_EDGES,
    candidateSources: [
      { id: 'FIN-PER-01', name: 'Rajesh K. Sharma (Hawala Intermediary)', type: 'Person' },
      { id: 'FIN-BNK-02', name: 'Axis Surat Bullion Escrow', type: 'BankAccount' }
    ],
    candidateTargets: [
      { id: 'FIN-ORG-02', name: 'Apex Gems & Bullion DMCC (Dubai)', type: 'Organization' },
      { id: 'FIN-PER-02', name: 'Vikram Malhotra (Shell Director)', type: 'Person' }
    ],
    defaultHiddenPath: V001_HIDDEN_PATH
  },
  'CASE-VIDEO-002': {
    caseId: 'CASE-VIDEO-002',
    title: 'Operation Blue Tide - Maritime Narcotics Intercept',
    nodes: V002_NODES,
    edges: V002_EDGES,
    candidateSources: [
      { id: 'NAR-PER-01', name: 'Tariq Al-Mansoor (Consignor)', type: 'Person' },
      { id: 'NAR-PER-02', name: 'Devendra K. Patil (Clearing Agent)', type: 'Person' }
    ],
    candidateTargets: [
      { id: 'NAR-CRM-01', name: 'Seizure of 42.5kg Heroin Contraband', type: 'Crime' },
      { id: 'NAR-LOC-01', name: 'Nhava Sheva Yard 4B Cold Storage', type: 'Location' }
    ],
    defaultHiddenPath: V002_HIDDEN_PATH
  },
  'CASE-VIDEO-003': {
    caseId: 'CASE-VIDEO-003',
    title: 'Operation Phishnet - Cyber Banking Fraud Syndicate',
    nodes: V003_NODES,
    edges: V003_EDGES,
    candidateSources: [
      { id: 'CYB-PER-01', name: 'Kabir Sen (Hacker "NullByte")', type: 'Person' },
      { id: 'CYB-BNK-01', name: 'Student Mule Account SBI Bangalore', type: 'BankAccount' }
    ],
    candidateTargets: [
      { id: 'CYB-ORG-01', name: 'Telegram Cashout "ShadowPayouts"', type: 'Organization' },
      { id: 'CYB-CRM-01', name: 'Banking Portal Impersonation Attack', type: 'Crime' }
    ],
    defaultHiddenPath: V003_HIDDEN_PATH
  },
  'CASE-VIDEO-004': {
    caseId: 'CASE-VIDEO-004',
    title: 'Operation Iron Shield - Cross-Border Human Trafficking',
    nodes: V004_NODES,
    edges: V004_EDGES,
    candidateSources: [
      { id: 'TRF-PER-01', name: 'Farooq Sheikh (Master Conduit)', type: 'Person' },
      { id: 'TRF-PER-02', name: 'Sunita Das (Safehouse Warden)', type: 'Person' }
    ],
    candidateTargets: [
      { id: 'TRF-LOC-02', name: 'Kolkata Barasat Transit Safehouse', type: 'Location' },
      { id: 'TRF-ORG-01', name: 'Global Manpower Solutions (Front Co.)', type: 'Organization' }
    ],
    defaultHiddenPath: V004_HIDDEN_PATH
  }
};

export function getCaseGraphBundle(caseId?: string | null): CaseGraphBundle {
  const cid = caseId || 'CASE-2025-M3-DATASET';
  return CASE_GRAPH_BUNDLES[cid] || CASE_GRAPH_BUNDLES['CASE-2025-M3-DATASET'];
}
