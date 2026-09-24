import { 
  PersonEntity, 
  PhoneEntity, 
  BankAccountEntity, 
  VehicleEntity, 
  LocationEntity, 
  OrganizationEntity, 
  FIREntity, 
  CrimeEntity, 
  TransactionEntity, 
  CommunicationEntity, 
  EvidenceEntity,
  AnyEntity 
} from '../types/entities';
import { GraphNode, GraphEdge, HiddenPathResult, CommunityDetectionResult } from '../types/graph';
import { EvidenceRecord, CrossVerificationDiscrepancy } from '../types/evidence';
import { TimelineEvent, ActivityBurstMetric } from '../types/timeline';
import { MapMarkerLocation } from '../types/gis';
import { AlertItem, WatchlistEntry } from '../types/alerts';
import { CaseDossier } from '../types/cases';

// ==========================================
// 1. CASES
// ==========================================
export const SYNTHETIC_CASES: CaseDossier[] = [
  {
    id: 'CASE-2024-MH-092',
    caseNumber: 'CASE-2024-MH-092',
    title: 'Operation Blue Tide: Nhava Sheva Illicit Logistics & Hawala Nexus',
    description: 'Investigation into organized contraband import through fictitious shipping manifests, shell clearing companies, and offshore hawala conduits along the Mumbai-Surat maritime corridor.',
    leadInvestigator: 'Inspector Vikramaditya Rao (LEO-7729)',
    assignedTeam: ['Insp. V. Rao', 'SI Priyanka Sen', 'Analyst K. Nair'],
    status: 'Active',
    priority: 'Critical',
    openedDate: '2024-08-10',
    lastUpdated: '2024-08-25',
    policeStation: 'Special Crime Branch, CID Mumbai',
    jurisdiction: 'Maharashtra Maritime & Cyber Zone',
    entityCount: 11,
    evidenceCount: 5,
    alertCount: 4,
    associatedFIRs: ['FIR-2024-8841'],
    accessClassification: 'CONFIDENTIAL',
    auditHistory: [
      {
        timestamp: '2024-08-10 09:30:00',
        officer: 'Insp. Vikramaditya Rao',
        action: 'CASE_CREATION',
        details: 'Initiated case based on intelligence report from customs liaison.'
      },
      {
        timestamp: '2024-08-14 18:22:00',
        officer: 'SI Priyanka Sen',
        action: 'EVIDENCE_INGESTION',
        details: 'Seized mobile device forensics ingested under SHA-256 verification.'
      },
      {
        timestamp: '2024-08-20 14:15:00',
        officer: 'Analyst K. Nair',
        action: 'GRAPH_ANALYTICS_RUN',
        details: 'Louvain community analysis detected 3 distinct sub-clusters.'
      }
    ]
  },
  {
    id: 'CASE-2024-GJ-041',
    caseNumber: 'CASE-2024-GJ-041',
    title: 'Surat Hawala Relay Network (Parallel Inquiry)',
    description: 'Cross-jurisdictional inquiry into unmapped remittance accounts funneling funds to overseas logistics operators.',
    leadInvestigator: 'DySP Amitav Desai',
    assignedTeam: ['DySP A. Desai', 'Insp. R. Joshi'],
    status: 'Under Review',
    priority: 'High',
    openedDate: '2024-07-28',
    lastUpdated: '2024-08-19',
    policeStation: 'Economic Offences Wing, Surat',
    jurisdiction: 'Gujarat Commercial Zone',
    entityCount: 6,
    evidenceCount: 3,
    alertCount: 2,
    associatedFIRs: ['FIR-2024-4112'],
    accessClassification: 'RESTRICTED',
    auditHistory: [
      {
        timestamp: '2024-07-28 11:00:00',
        officer: 'DySP Amitav Desai',
        action: 'CASE_CREATION',
        details: 'Inquiry registered after suspicious transaction reports from FIU-IND.'
      }
    ]
  }
];

// ==========================================
// 2. THE 11 ENTITY PROFILES (NO RISK SCORES)
// ==========================================

export const PERSON_VIKRAM_MALHOTRA: PersonEntity = {
  id: 'ENT-PERS-001',
  type: 'Person',
  label: 'Vikram Malhotra',
  fullName: 'Vikram Malhotra',
  aliases: ['Vicky Cargo', 'V.M. Logistics'],
  dateOfBirth: '1982-04-14',
  gender: 'Male',
  nationality: 'Indian',
  nationalIdNumber: 'XXXX-XXXX-9142',
  phoneNumbers: ['+91-98201-99412', '+91-98201-88123'],
  bankAccounts: ['HDFC-9921-4820', 'ICICI-1049-5501'],
  vehicles: ['MH-04-AZ-9921', 'MH-01-CV-4412'],
  addresses: ['Flat 402, Sea Green Apts, Worli, Mumbai', 'Yard 4B Office, Nhava Sheva, Navi Mumbai'],
  organizations: ['BlueSea Logistics Shell Co.', 'Oceanic Freight Linkers'],
  associatedFIRs: ['FIR-2024-8841'],
  crimesReferenced: ['CR-2024-0912'],
  knownAssociates: [
    { personId: 'ENT-PERS-002', name: 'Rajesh K. Sharma', relationType: 'Frequent Co-Transactor & CDR Contact', confidence: '0.94' },
    { personId: 'ENT-PERS-003', name: 'Devendra Patel', relationType: 'Customs Clearing Agent', confidence: '0.88' }
  ],
  analyticalSummary: 'Identified as principal on-ground logistics coordinator in container handling at Nhava Sheva. CDR indicates repeated burst calls prior to consignment arrivals. No prior convictions recorded; analytical focus centered on multi-hop remittances and discrepancies in cargo declaration documents.',
  source: 'FIR-2024-8841 & Port Clearance Register',
  sourceDocument: 'Nhava Sheva Special CID Seizure Memo 2024/09',
  firstObserved: '2024-08-01',
  lastUpdated: '2024-08-24',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 4,
  anomalyIndicators: [
    'Discrepancy: Alibi statement states presence in Pune; CDR records show active Nhava Sheva tower pings at 02:40 AM.',
    'Rapid fund dissipation: ₹15,00,000 withdrawn within 38 minutes of receipt.',
    'Multi-sim switching across identical IMEI.'
  ]
};

export const PERSON_RAJESH_SHARMA: PersonEntity = {
  id: 'ENT-PERS-002',
  type: 'Person',
  label: 'Rajesh K. Sharma',
  fullName: 'Rajesh Kumar Sharma',
  aliases: ['Sharma Ji', 'RK Hawala', 'Bhaiya Surat'],
  dateOfBirth: '1976-11-20',
  gender: 'Male',
  nationality: 'Indian',
  nationalIdNumber: 'XXXX-XXXX-6029',
  phoneNumbers: ['+91-98791-22440'],
  bankAccounts: ['HDFC-9921-4820', 'AXIS-3011-8942'],
  vehicles: ['GJ-05-BX-1190'],
  addresses: ['Shop 12, Diamond Market, Ring Road, Surat', 'Vesu Heights, Surat'],
  organizations: ['BlueSea Logistics Shell Co.', 'Shree Ganesh Bullion'],
  associatedFIRs: ['FIR-2024-8841', 'FIR-2024-4112'],
  crimesReferenced: ['CR-2024-0912'],
  knownAssociates: [
    { personId: 'ENT-PERS-001', name: 'Vikram Malhotra', relationType: 'Financial Intermediary & Shell Shareholder', confidence: '0.96' }
  ],
  analyticalSummary: 'Documented financial intermediary operating out of Surat diamond bazaar. Banking audit reveals high-velocity pass-through transfers between bullion accounts and logistics firms.',
  source: 'FIU-IND Suspicious Transaction Report STR-2024-09',
  sourceDocument: 'FIU-IND Referral Memo Ref #9921',
  firstObserved: '2024-07-28',
  lastUpdated: '2024-08-23',
  caseIds: ['CASE-2024-MH-092', 'CASE-2024-GJ-041'],
  evidenceCount: 3,
  anomalyIndicators: [
    'Round-tripping financial ledger patterns detected across 4 private accounts.',
    'Multiple dormant shell company directorships activated in June 2024.'
  ]
};

export const PHONE_VIKRAM: PhoneEntity = {
  id: 'ENT-PHON-001',
  type: 'Phone',
  label: '+91-98201-99412',
  phoneNumber: '+91-98201-99412',
  imei: '864201048821901',
  imsi: '404450912847102',
  serviceProvider: 'Bharti Airtel Maharashtra',
  registeredSubscriber: 'Vikram Malhotra',
  associatedPersonId: 'ENT-PERS-001',
  cdrCallCount: 184,
  frequentTowerLocations: ['Nhava Sheva Port Sector 4', 'Belapur CBD', 'Worli Sea Face'],
  lastActiveTower: 'Nhava Sheva Port Sector 4 (Cell ID: 404-45-19402)',
  source: 'Telecom CDR Carrier Dump via Lawful Interception Request',
  sourceDocument: 'Carrier File AIRTEL-CDR-20240815.csv',
  firstObserved: '2024-08-01',
  lastUpdated: '2024-08-24',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 2,
  anomalyIndicators: [
    'Spike in late-night communications (01:00 AM - 04:00 AM) coinciding with vessel berthing schedules.',
    'Frequent encrypted VoIP app pings recorded in IP data records.'
  ]
};

export const BANK_HDFC_9921: BankAccountEntity = {
  id: 'ENT-BANK-001',
  type: 'BankAccount',
  label: 'HDFC Bank (A/C: 9921-4820)',
  accountNumber: '9921-4820-1102',
  bankName: 'HDFC Bank Ltd',
  branch: 'Fort Financial Hub, Mumbai',
  ifscCode: 'HDFC0000060',
  accountHolderName: 'BlueSea Logistics & Trading Pvt Ltd',
  accountType: 'Current',
  associatedPersonId: 'ENT-PERS-001',
  associatedOrgId: 'ENT-ORG-001',
  totalTransactionsLogged: 42,
  swiftCode: 'HDFCINBBXXX',
  source: 'Bank Statement Ingestion via Law Enforcement Subpoena',
  sourceDocument: 'HDFC Certified Ledger Stmt #B24-911',
  firstObserved: '2024-06-15',
  lastUpdated: '2024-08-22',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 2,
  anomalyIndicators: [
    'Zero balance maintained until large batch deposits occur, immediately followed by NEFT/RTGS disbursements.',
    'Discrepancy: KYC registered address found to be non-operational virtual office upon physical police verification.'
  ]
};

export const VEHICLE_CONTAINER_TRUCK: VehicleEntity = {
  id: 'ENT-VEH-001',
  type: 'Vehicle',
  label: 'Truck MH-04-AZ-9921',
  registrationNumber: 'MH-04-AZ-9921',
  makeModel: 'Tata Prima 4028.S Container Tractor',
  vehicleType: 'Container',
  registeredOwner: 'Oceanic Freight Linkers (Vikram Malhotra)',
  chassisNumber: 'MAT628410L9M02914',
  tollPingsCount: 14,
  lastSightedLocation: 'JNPT Port Gate No. 3 (2024-08-14 03:15 AM)',
  source: 'FASTag National Highway Electronic Toll Collection Log',
  sourceDocument: 'FASTag API Audit Pull NHAI-MH-2024',
  firstObserved: '2024-08-10',
  lastUpdated: '2024-08-20',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 1,
  anomalyIndicators: [
    'Toll transit timestamp conflicts with registered GPS tracking log by 2 hours and 15 minutes.'
  ]
};

export const LOCATION_NHAVA_SHEVA: LocationEntity = {
  id: 'ENT-LOC-001',
  type: 'Location',
  label: 'Nhava Sheva Port, Yard 4B',
  locationName: 'Nhava Sheva Port Terminal 2, Yard 4B Customs Enclosure',
  address: 'JNPT Port Area, Uran, Navi Mumbai, Maharashtra 400707',
  city: 'Navi Mumbai',
  state: 'Maharashtra',
  latitude: 18.9498,
  longitude: 72.9512,
  locationCategory: 'Port / Terminal',
  associatedCrimeIds: ['CR-2024-0912'],
  source: 'Port Authority GIS & Police Seizure Record',
  sourceDocument: 'JNPT Terminal Berth Manifest 2024/T2',
  firstObserved: '2024-08-10',
  lastUpdated: '2024-08-22',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 3,
  anomalyIndicators: [
    'High density of off-hours communications mapped to cell tower 404-45-19402 within 250m radius.'
  ]
};

export const ORGANIZATION_BLUESEA: OrganizationEntity = {
  id: 'ENT-ORG-001',
  type: 'Organization',
  label: 'BlueSea Logistics Shell Co.',
  orgName: 'BlueSea Logistics & Trading Private Limited',
  registrationNumber: 'U63090MH2021PTC368921',
  orgType: 'Shell Company',
  directors: ['Rajesh Kumar Sharma (DIN: 08921044)', 'Ramesh Patil (Nominee Director)'],
  registeredAddress: 'Unit 304, Navjeevan Commercial Centre, Lamington Road, Mumbai',
  bankAccountNumbers: ['9921-4820-1102 (HDFC Bank Fort)'],
  source: 'Ministry of Corporate Affairs (MCA21) Registry & EOW Audit',
  sourceDocument: 'MCA Incorporation Certificate & Form DIR-12',
  firstObserved: '2024-07-15',
  lastUpdated: '2024-08-22',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 2,
  anomalyIndicators: [
    'Nominee director Ramesh Patil confirmed to be an untraceable person / identity theft victim.',
    'No turnover reported in FY22-23; sudden ₹4.8 Crore transaction volume in Q2 FY24.'
  ]
};

export const FIR_8841: FIREntity = {
  id: 'ENT-FIR-001',
  type: 'FIR',
  label: 'FIR No. 2024/8841',
  firNumber: 'FIR-2024-8841',
  policeStation: 'Special Crime Cell, Nhava Sheva Police Station',
  registrationDate: '2024-08-14 06:30:00',
  sectionsApplied: ['Section 8(c) NDPS Act', 'Section 20(b)(ii)(C) NDPS Act', 'Section 120-B IPC / Sec 61 BNS (Criminal Conspiracy)', 'Section 132 Customs Act'],
  complainantName: 'Sunil G. Shinde, Superintendent of Customs (Preventive)',
  accusedNames: ['Vikram Malhotra', 'Rajesh K. Sharma', 'Unknown Conspirators'],
  investigatingOfficer: 'Insp. Vikramaditya Rao',
  status: 'Under Investigation',
  briefFacts: 'Interception of refrigerated cargo container #MRKU-982141-0 originating from Jebel Ali. Hidden false cavity revealed 42kg illicit contraband concealed behind legitimate dates and polymer consignments. Documented consignee found to be BlueSea Logistics Shell Co.',
  source: 'CCTNS (Crime & Criminal Tracking Network & Systems) Database',
  sourceDocument: 'CCTNS Certified FIR Copy IIF-1',
  firstObserved: '2024-08-14',
  lastUpdated: '2024-08-25',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 4,
  anomalyIndicators: [
    'Import bill of entry was amended twice within 48 hours prior to vessel docking.'
  ]
};

export const CRIME_CONTRABAND_SEIZURE: CrimeEntity = {
  id: 'ENT-CRIM-001',
  type: 'Crime',
  label: 'Seizure CR-2024-0912',
  crimeId: 'CR-2024-0912',
  crimeCategory: 'Organized Contraband Smuggling & Customs Fraud',
  dateOfOccurrence: '2024-08-14 02:30:00',
  locationId: 'ENT-LOC-001',
  firNumber: 'FIR-2024-8841',
  modusOperandi: 'Use of falsified import documentation and shell customs broker entities to route illicit cargo through designated green-channel container yards without physical inspection.',
  seizedMaterials: [
    '42.5 kg Contraband Bricks in tamper-evident foil',
    'Satellite Communication Handset (Inmarsat IsatPhone 2)',
    'Logistics clearing stamp sets for fictitious clearing agency',
    'Container Chassis Truck MH-04-AZ-9921'
  ],
  source: 'CID Joint Seizure Panchnama',
  sourceDocument: 'Panchnama Memo Ref #SZ-2024-08-14',
  firstObserved: '2024-08-14',
  lastUpdated: '2024-08-20',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 4,
  anomalyIndicators: [
    'Consignment seal matched fake secondary customs tamper band.'
  ]
};

export const TRANSACTION_90214: TransactionEntity = {
  id: 'ENT-TXN-001',
  type: 'Transaction',
  label: 'TXN-90214 (₹15,00,000)',
  transactionId: 'TXN-90214-NEFT',
  sourceAccount: 'HDFC-9921-4820',
  destinationAccount: 'AXIS-3011-8942',
  sourceHolder: 'BlueSea Logistics (Auth Signatory: Vikram Malhotra)',
  destinationHolder: 'Rajesh K. Sharma',
  amountINR: 1500000,
  timestamp: '2024-08-14 01:18:22',
  channel: 'NEFT',
  anomalyNote: 'High value transfer executed at 01:18 AM, exactly 72 minutes prior to container interception at port yard.',
  source: 'HDFC Core Banking Transaction Ledger',
  sourceDocument: 'Bank NEFT Settlement Batch Log #90214',
  firstObserved: '2024-08-14',
  lastUpdated: '2024-08-20',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 2,
  anomalyIndicators: [
    'Pre-operation liquidity relay: Immediate clearance without customary trade invoice documentation.'
  ]
};

export const COMMUNICATION_CALL_01: CommunicationEntity = {
  id: 'ENT-COMM-001',
  type: 'Communication',
  label: 'Call: Vikram → Rajesh (01:04 AM)',
  callId: 'CDR-CALL-8841-01',
  callerNumber: '+91-98201-99412',
  receiverNumber: '+91-98791-22440',
  callerName: 'Vikram Malhotra',
  receiverName: 'Rajesh K. Sharma',
  callType: 'Voice',
  durationSeconds: 342,
  timestamp: '2024-08-14 01:04:10',
  originTower: 'Nhava Sheva Sector 4 Tower (Cell ID 19402)',
  destinationTower: 'Ring Road Diamond Bazaar Tower Surat',
  source: 'Bharti Airtel Telecom CDR Server',
  sourceDocument: 'AIRTEL-CDR-EXTRACT-20240815.txt',
  firstObserved: '2024-08-14',
  lastUpdated: '2024-08-18',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 1,
  anomalyIndicators: [
    'Call duration of 5m 42s concluded 14 minutes before NEFT transfer TXN-90214 was triggered.'
  ]
};

export const EVIDENCE_SEIZED_PHONE: EvidenceEntity = {
  id: 'ENT-EVD-001',
  type: 'Evidence',
  label: 'EVD-2024-0812 (Mobile Forensic Image)',
  evidenceId: 'EVD-2024-0812',
  title: 'Forensic Physical Clone: OnePlus 11 5G (IMEI 864201048821901)',
  category: 'Digital Forensic Image',
  originalHashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  currentHashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  isIntegrityVerified: true,
  seizureDate: '2024-08-14 04:00:00',
  seizingOfficer: 'Inspector Vikramaditya Rao',
  chainOfCustodyCurrentHolder: 'Cyber Forensic Division, FSL Kalina, Mumbai',
  bsaSection63CertificateId: 'BSA-63-FSL-2024-8841',
  fileSizeBytes: 24891240000, // ~24.8 GB
  mimeType: 'application/octet-stream (RAW E01 Forensic Image)',
  source: 'FSL Kalina Digital Forensic Repository',
  sourceDocument: 'Forensic Extraction Report FSL-D-2024-8841',
  firstObserved: '2024-08-14',
  lastUpdated: '2024-08-25',
  caseIds: ['CASE-2024-MH-092'],
  evidenceCount: 1
};

export const ALL_ENTITIES: AnyEntity[] = [
  PERSON_VIKRAM_MALHOTRA,
  PERSON_RAJESH_SHARMA,
  PHONE_VIKRAM,
  BANK_HDFC_9921,
  VEHICLE_CONTAINER_TRUCK,
  LOCATION_NHAVA_SHEVA,
  ORGANIZATION_BLUESEA,
  FIR_8841,
  CRIME_CONTRABAND_SEIZURE,
  TRANSACTION_90214,
  COMMUNICATION_CALL_01,
  EVIDENCE_SEIZED_PHONE
];

// ==========================================
// 3. NETWORK GRAPH & CYTOSCAPE DATA
// ==========================================

export const GRAPH_NODES: GraphNode[] = [
  {
    id: 'ENT-PERS-001',
    label: 'Vikram Malhotra',
    entityType: 'Person',
    entityId: 'ENT-PERS-001',
    degree: 7,
    analytics: {
      degreeCentrality: 0.70,
      betweennessCentrality: 0.82,
      pagerank: 0.31,
      communityId: 1,
      isBridge: true,
      clusteringCoefficient: 0.45,
      analyticalLeadNote: 'High betweenness centrality indicates key liaison position connecting maritime operations to financial conduit.'
    }
  },
  {
    id: 'ENT-PERS-002',
    label: 'Rajesh K. Sharma',
    entityType: 'Person',
    entityId: 'ENT-PERS-002',
    degree: 5,
    analytics: {
      degreeCentrality: 0.50,
      betweennessCentrality: 0.68,
      pagerank: 0.24,
      communityId: 2,
      isBridge: true,
      clusteringCoefficient: 0.50,
      analyticalLeadNote: 'Financial intermediary hub linking multiple account holders across Surat-Mumbai jurisdiction.'
    }
  },
  {
    id: 'ENT-PHON-001',
    label: '+91-98201-99412',
    entityType: 'Phone',
    entityId: 'ENT-PHON-001',
    degree: 3,
    analytics: {
      degreeCentrality: 0.30,
      betweennessCentrality: 0.41,
      pagerank: 0.12,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.60
    }
  },
  {
    id: 'ENT-BANK-001',
    label: 'HDFC (9921-4820)',
    entityType: 'BankAccount',
    entityId: 'ENT-BANK-001',
    degree: 4,
    analytics: {
      degreeCentrality: 0.40,
      betweennessCentrality: 0.58,
      pagerank: 0.18,
      communityId: 2,
      isBridge: true,
      clusteringCoefficient: 0.35
    }
  },
  {
    id: 'ENT-TXN-001',
    label: 'TXN-90214 (₹15L)',
    entityType: 'Transaction',
    entityId: 'ENT-TXN-001',
    degree: 2,
    analytics: {
      degreeCentrality: 0.20,
      betweennessCentrality: 0.35,
      pagerank: 0.08,
      communityId: 2,
      isBridge: false,
      clusteringCoefficient: 0.0
    }
  },
  {
    id: 'ENT-ORG-001',
    label: 'BlueSea Logistics',
    entityType: 'Organization',
    entityId: 'ENT-ORG-001',
    degree: 4,
    analytics: {
      degreeCentrality: 0.40,
      betweennessCentrality: 0.52,
      pagerank: 0.16,
      communityId: 1,
      isBridge: true,
      clusteringCoefficient: 0.40
    }
  },
  {
    id: 'ENT-LOC-001',
    label: 'Nhava Sheva Yard 4B',
    entityType: 'Location',
    entityId: 'ENT-LOC-001',
    degree: 4,
    analytics: {
      degreeCentrality: 0.40,
      betweennessCentrality: 0.38,
      pagerank: 0.14,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.50
    }
  },
  {
    id: 'ENT-CRIM-001',
    label: 'Crime CR-2024-0912',
    entityType: 'Crime',
    entityId: 'ENT-CRIM-001',
    degree: 3,
    analytics: {
      degreeCentrality: 0.30,
      betweennessCentrality: 0.29,
      pagerank: 0.10,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.40
    }
  },
  {
    id: 'ENT-FIR-001',
    label: 'FIR-2024-8841',
    entityType: 'FIR',
    entityId: 'ENT-FIR-001',
    degree: 4,
    analytics: {
      degreeCentrality: 0.40,
      betweennessCentrality: 0.32,
      pagerank: 0.15,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.42
    }
  },
  {
    id: 'ENT-VEH-001',
    label: 'Truck MH-04-AZ-9921',
    entityType: 'Vehicle',
    entityId: 'ENT-VEH-001',
    degree: 2,
    analytics: {
      degreeCentrality: 0.20,
      betweennessCentrality: 0.18,
      pagerank: 0.06,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.50
    }
  },
  {
    id: 'ENT-COMM-001',
    label: 'CDR Call (01:04 AM)',
    entityType: 'Communication',
    entityId: 'ENT-COMM-001',
    degree: 2,
    analytics: {
      degreeCentrality: 0.20,
      betweennessCentrality: 0.25,
      pagerank: 0.07,
      communityId: 1,
      isBridge: false,
      clusteringCoefficient: 0.0
    }
  }
];

export const GRAPH_EDGES: GraphEdge[] = [
  // Vikram to Phone
  {
    id: 'EDGE-01',
    source: 'ENT-PERS-001',
    target: 'ENT-PHON-001',
    relationType: 'REGISTERED_SUBSCRIBER',
    sourceDocument: 'Airtel KYC CAF Form',
    confidence: 0.99,
    timestamp: '2024-08-01'
  },
  // Phone to Call
  {
    id: 'EDGE-02',
    source: 'ENT-PHON-001',
    target: 'ENT-COMM-001',
    relationType: 'CALL_ORIGINATED',
    sourceDocument: 'AIRTEL-CDR-EXTRACT-20240815.txt',
    confidence: 0.95,
    timestamp: '2024-08-14 01:04:10',
    callDuration: 342
  },
  // Call to Rajesh
  {
    id: 'EDGE-03',
    source: 'ENT-COMM-001',
    target: 'ENT-PERS-002',
    relationType: 'CALL_RECEIVED_BY',
    sourceDocument: 'Vodafone-Idea CDR Ingestion',
    confidence: 0.95,
    timestamp: '2024-08-14 01:04:10'
  },
  // Rajesh to Bank Account
  {
    id: 'EDGE-04',
    source: 'ENT-PERS-002',
    target: 'ENT-BANK-001',
    relationType: 'BENEFICIARY_MANDATE',
    sourceDocument: 'Bank KYC Record',
    confidence: 0.92,
    timestamp: '2024-06-15'
  },
  // Bank Account to Transaction
  {
    id: 'EDGE-05',
    source: 'ENT-BANK-001',
    target: 'ENT-TXN-001',
    relationType: 'SOURCE_DEBIT',
    sourceDocument: 'HDFC Core Banking Ledger',
    confidence: 0.99,
    timestamp: '2024-08-14 01:18:22',
    transactionAmount: 1500000
  },
  // Transaction to Org
  {
    id: 'EDGE-06',
    source: 'ENT-TXN-001',
    target: 'ENT-ORG-001',
    relationType: 'COMMERCIAL_SETTLEMENT_FOR',
    sourceDocument: 'Inward Invoice Manifest #BS-88',
    confidence: 0.91,
    timestamp: '2024-08-14 01:18:22'
  },
  // Org to Location
  {
    id: 'EDGE-07',
    source: 'ENT-ORG-001',
    target: 'ENT-LOC-001',
    relationType: 'LEASED_CONCESSION_YARD',
    sourceDocument: 'Port Authority Concession Agreement',
    confidence: 0.96,
    timestamp: '2024-05-10'
  },
  // Location to Crime
  {
    id: 'EDGE-08',
    source: 'ENT-LOC-001',
    target: 'ENT-CRIM-001',
    relationType: 'SCENE_OF_CRIME',
    sourceDocument: 'Police Panchnama',
    confidence: 0.99,
    timestamp: '2024-08-14 02:30:00'
  },
  // FIR to Person A
  {
    id: 'EDGE-09',
    source: 'ENT-FIR-001',
    target: 'ENT-PERS-001',
    relationType: 'NAMED_ACCUSED',
    sourceDocument: 'FIR Copy IIF-1',
    confidence: 0.99,
    timestamp: '2024-08-14 06:30:00'
  },
  // FIR to Crime
  {
    id: 'EDGE-10',
    source: 'ENT-FIR-001',
    target: 'ENT-CRIM-001',
    relationType: 'REGISTERS_INCIDENT',
    sourceDocument: 'FIR Copy IIF-1',
    confidence: 0.99,
    timestamp: '2024-08-14 06:30:00'
  },
  // Vikram to Truck
  {
    id: 'EDGE-11',
    source: 'ENT-PERS-001',
    target: 'ENT-VEH-001',
    relationType: 'REGISTERED_OPERATOR',
    sourceDocument: 'RTO Vehicle Registration',
    confidence: 0.94,
    timestamp: '2024-03-12'
  },
  // Truck to Location
  {
    id: 'EDGE-12',
    source: 'ENT-VEH-001',
    target: 'ENT-LOC-001',
    relationType: 'TERMINAL_INGRESS',
    sourceDocument: 'FASTag & JNPT Gate Entry',
    confidence: 0.98,
    timestamp: '2024-08-14 03:15:00'
  }
];

// ==========================================
// 4. HIDDEN RELATIONSHIP DISCOVERY
// ==========================================
export const SYNTHETIC_HIDDEN_PATH: HiddenPathResult = {
  pathId: 'PATH-DISCOVERY-001',
  pathLength: 6,
  startEntity: { id: 'ENT-PERS-001', name: 'Vikram Malhotra', type: 'Person' },
  targetEntity: { id: 'ENT-ORG-001', name: 'BlueSea Logistics Shell Co.', type: 'Organization' },
  nodes: [
    GRAPH_NODES.find(n => n.id === 'ENT-PERS-001')!,
    GRAPH_NODES.find(n => n.id === 'ENT-PHON-001')!,
    GRAPH_NODES.find(n => n.id === 'ENT-COMM-001')!,
    GRAPH_NODES.find(n => n.id === 'ENT-PERS-002')!,
    GRAPH_NODES.find(n => n.id === 'ENT-BANK-001')!,
    GRAPH_NODES.find(n => n.id === 'ENT-TXN-001')!,
    GRAPH_NODES.find(n => n.id === 'ENT-ORG-001')!
  ],
  edges: [
    GRAPH_EDGES.find(e => e.id === 'EDGE-01')!,
    GRAPH_EDGES.find(e => e.id === 'EDGE-02')!,
    GRAPH_EDGES.find(e => e.id === 'EDGE-03')!,
    GRAPH_EDGES.find(e => e.id === 'EDGE-04')!,
    GRAPH_EDGES.find(e => e.id === 'EDGE-05')!,
    GRAPH_EDGES.find(e => e.id === 'EDGE-06')!
  ],
  explanation: 'Factual Multi-Hop Trace: Person Vikram Malhotra holds phone (+91-98201-99412) which initiated call CDR-CALL-8841-01 to Rajesh K. Sharma at 01:04 AM. Rajesh K. Sharma maintains signatory authority on HDFC Account (9921-4820), from which ₹15,00,000 was debited via TXN-90214 at 01:18 AM to fund settlement operations for BlueSea Logistics Shell Co.',
  supportingEvidenceIds: ['EVD-2024-0812', 'EVD-2024-0813', 'EVD-2024-0814']
};

// ==========================================
// 5. COMMUNITIES (LOUVAIN)
// ==========================================
export const SYNTHETIC_COMMUNITIES: CommunityDetectionResult[] = [
  {
    communityId: 1,
    label: 'Cluster 1: Maritime Port Operations & Consignment Logistics',
    size: 6,
    memberEntityIds: ['ENT-PERS-001', 'ENT-PHON-001', 'ENT-LOC-001', 'ENT-CRIM-001', 'ENT-FIR-001', 'ENT-VEH-001'],
    dominantEntityTypes: ['Person', 'Location', 'Crime', 'Vehicle'],
    interCommunityConnections: 4,
    centralHubEntityId: 'ENT-PERS-001',
    analyticalSummary: 'Operational cluster situated around Nhava Sheva container terminal handling physical clearance and ground transport.'
  },
  {
    communityId: 2,
    label: 'Cluster 2: Surat-Mumbai Financial Relay & Hawala Clearance',
    size: 5,
    memberEntityIds: ['ENT-PERS-002', 'ENT-BANK-001', 'ENT-TXN-001', 'ENT-ORG-001', 'ENT-COMM-001'],
    dominantEntityTypes: ['Person', 'BankAccount', 'Transaction', 'Organization'],
    interCommunityConnections: 4,
    centralHubEntityId: 'ENT-PERS-002',
    analyticalSummary: 'Financial conduit cluster responsible for pre-operation liquidity transfers and shell account management.'
  }
];

// ==========================================
// 6. TIMELINE EVENTS & BURSTS
// ==========================================
export const SYNTHETIC_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'TLE-01',
    timestamp: '2024-08-10 14:00:00',
    category: 'Event',
    title: 'Cargo Vessel MSC Aruna Berths at Nhava Sheva Terminal 2',
    description: 'Vessel carrying refrigerated container #MRKU-982141-0 clears customs anchorage.',
    primaryEntity: { id: 'ENT-LOC-001', label: 'Nhava Sheva Yard 4B', type: 'Location' },
    locationName: 'JNPT Port Terminal 2',
    source: 'Port Trust Berthing Log',
    sourceEvidenceId: 'EVD-2024-0815'
  },
  {
    id: 'TLE-02',
    timestamp: '2024-08-14 01:04:10',
    category: 'Communication',
    title: 'Encrypted Call: Vikram Malhotra to Rajesh K. Sharma',
    description: 'Duration: 342 seconds. Origin Tower: Nhava Sheva Port Sector 4; Terminating Tower: Ring Road, Surat.',
    primaryEntity: { id: 'ENT-PERS-001', label: 'Vikram Malhotra', type: 'Person' },
    secondaryEntity: { id: 'ENT-PERS-002', label: 'Rajesh K. Sharma', type: 'Person' },
    locationName: 'Nhava Sheva Sector 4',
    source: 'Airtel Telecom CDR Dump',
    sourceEvidenceId: 'EVD-2024-0812',
    isBurstPoint: true
  },
  {
    id: 'TLE-03',
    timestamp: '2024-08-14 01:18:22',
    category: 'Transaction',
    title: 'High-Value Relay Transfer TXN-90214 (₹15,00,000)',
    description: 'NEFT debit from HDFC-9921-4820 into Axis Bank Surat account.',
    primaryEntity: { id: 'ENT-BANK-001', label: 'HDFC (9921-4820)', type: 'BankAccount' },
    secondaryEntity: { id: 'ENT-ORG-001', label: 'BlueSea Logistics', type: 'Organization' },
    source: 'HDFC Core Banking Ledger',
    sourceEvidenceId: 'EVD-2024-0814',
    isBurstPoint: true
  },
  {
    id: 'TLE-04',
    timestamp: '2024-08-14 02:30:00',
    category: 'Crime',
    title: 'Container Interception & 42.5kg Contraband Discovery',
    description: 'Joint preventive raid conducted at Yard 4B. Seizure panchnama executed.',
    primaryEntity: { id: 'ENT-CRIM-001', label: 'Seizure CR-2024-0912', type: 'Crime' },
    secondaryEntity: { id: 'ENT-LOC-001', label: 'Nhava Sheva Yard 4B', type: 'Location' },
    locationName: 'Nhava Sheva Port, Yard 4B',
    source: 'CID Joint Seizure Panchnama',
    sourceEvidenceId: 'EVD-2024-0811'
  },
  {
    id: 'TLE-05',
    timestamp: '2024-08-14 03:15:00',
    category: 'Location',
    title: 'Truck MH-04-AZ-9921 Ingress FastTag Ping',
    description: 'Container tractor arrived at JNPT Gate No. 3 for container pickup.',
    primaryEntity: { id: 'ENT-VEH-001', label: 'Truck MH-04-AZ-9921', type: 'Vehicle' },
    locationName: 'JNPT Port Gate 3',
    source: 'NHAI FASTag Real-Time Feed'
  },
  {
    id: 'TLE-06',
    timestamp: '2024-08-14 06:30:00',
    category: 'Relationship',
    title: 'FIR No. 2024/8841 Lodged at Nhava Sheva Police Station',
    description: 'Criminal conspiracy and NDPS sections formally booked against accused individuals.',
    primaryEntity: { id: 'ENT-FIR-001', label: 'FIR-2024-8841', type: 'FIR' },
    secondaryEntity: { id: 'ENT-PERS-001', label: 'Vikram Malhotra', type: 'Person' },
    source: 'CCTNS Police Ledger'
  }
];

export const SYNTHETIC_ACTIVITY_BURSTS: ActivityBurstMetric[] = [
  { date: '2024-08-10', communicationCount: 12, transactionVolumeINR: 250000, locationPings: 8, totalEvents: 21 },
  { date: '2024-08-11', communicationCount: 18, transactionVolumeINR: 120000, locationPings: 14, totalEvents: 33 },
  { date: '2024-08-12', communicationCount: 22, transactionVolumeINR: 480000, locationPings: 19, totalEvents: 45 },
  { date: '2024-08-13', communicationCount: 38, transactionVolumeINR: 850000, locationPings: 32, totalEvents: 72 },
  { date: '2024-08-14', communicationCount: 84, transactionVolumeINR: 1950000, locationPings: 61, totalEvents: 148, anomalyFlag: true },
  { date: '2024-08-15', communicationCount: 29, transactionVolumeINR: 50000, locationPings: 22, totalEvents: 52 },
  { date: '2024-08-16', communicationCount: 14, transactionVolumeINR: 10000, locationPings: 9, totalEvents: 24 }
];

// ==========================================
// 7. GIS LOCATIONS
// ==========================================
export const SYNTHETIC_MAP_MARKERS: MapMarkerLocation[] = [
  {
    id: 'MARKER-01',
    name: 'Nhava Sheva Port Terminal 2, Yard 4B',
    category: 'Port / Terminal',
    latitude: 18.9498,
    longitude: 72.9512,
    accuracyRadiusMeters: 50,
    timestamp: '2024-08-14 02:30:00',
    address: 'JNPT Port Area, Uran, Navi Mumbai',
    associatedEntities: [
      { id: 'ENT-LOC-001', label: 'Yard 4B', type: 'Location' },
      { id: 'ENT-CRIM-001', label: 'CR-2024-0912', type: 'Crime' },
      { id: 'ENT-PERS-001', label: 'Vikram Malhotra', type: 'Person' }
    ],
    notes: 'Primary seizure locus where refrigerated container was inspected.'
  },
  {
    id: 'MARKER-02',
    name: 'Nhava Sheva Sector 4 Cell Tower (Cell ID 19402)',
    category: 'Cell Tower',
    latitude: 18.9535,
    longitude: 72.9480,
    accuracyRadiusMeters: 450,
    timestamp: '2024-08-14 01:04:00',
    address: 'Sector 4 Tower Mast, JNPT Port Road, Uran',
    associatedEntities: [
      { id: 'ENT-PHON-001', label: '+91-98201-99412', type: 'Phone' }
    ],
    cellTowerDetails: {
      towerId: 'TOW-NS-19402',
      lac: '40445',
      azimuthDegrees: 120,
      cdrCount: 68
    },
    notes: 'Tower azimuth sector directly blankets Yard 4B container staging yard.'
  },
  {
    id: 'MARKER-03',
    name: 'BlueSea Logistics Registered Office',
    category: 'Financial Branch',
    latitude: 18.9620,
    longitude: 72.8180,
    accuracyRadiusMeters: 20,
    timestamp: '2024-08-15 11:00:00',
    address: 'Navjeevan Commercial Centre, Lamington Road, Mumbai',
    associatedEntities: [
      { id: 'ENT-ORG-001', label: 'BlueSea Logistics', type: 'Organization' }
    ],
    notes: 'Physical police spot check on 2024-08-15 verified locked premises and non-operational shell office.'
  },
  {
    id: 'MARKER-04',
    name: 'Surat Diamond Market Hawala Hub',
    category: 'Suspect Location',
    latitude: 21.1959,
    longitude: 72.8302,
    accuracyRadiusMeters: 100,
    timestamp: '2024-08-14 01:04:00',
    address: 'Ring Road Diamond Bazaar, Surat, Gujarat',
    associatedEntities: [
      { id: 'ENT-PERS-002', label: 'Rajesh K. Sharma', type: 'Person' }
    ],
    notes: 'Location of recipient phone handset during critical 01:04 AM pre-transfer call.'
  }
];

// ==========================================
// 8. CROSS-VERIFICATION DISCREPANCY
// ==========================================
export const SYNTHETIC_DISCREPANCIES: CrossVerificationDiscrepancy[] = [
  {
    id: 'DISCREPANCY-001',
    caseId: 'CASE-2024-MH-092',
    title: 'Contradiction: Accused Alibi Statement vs Telecom CDR Tower Ping',
    status: 'DATA DISCREPANCY DETECTED',
    conflictingField: 'Physical Location Coordinates at 2024-08-14 02:40 AM',
    sourceA: {
      sourceName: 'Accused Statement (Recorded in FIR-2024-8841 Case Diary Vol I)',
      documentRef: 'Case Diary Entry #14-B dated 2024-08-15',
      timestamp: '2024-08-14 02:40:00',
      recordedValue: 'Hotel Blue Diamond, Koregaon Park, Pune, Maharashtra',
      excerpt: '"I retired to my room at Hotel Blue Diamond, Pune by 11:30 PM on August 13 and did not travel anywhere until the afternoon of August 14."'
    },
    sourceB: {
      sourceName: 'Airtel Telecom Tower Carrier Dump (Certified BSA Sec 63)',
      documentRef: 'Carrier Audit File AIRTEL-CDR-20240815.csv',
      timestamp: '2024-08-14 02:40:18',
      recordedValue: 'Nhava Sheva Sector 4 Tower (Cell ID: 19402, Lat: 18.9535, Lng: 72.9480)',
      excerpt: 'Subscriber +91-98201-99412 registered incoming SMS delivery receipt and data session handover at Nhava Sheva Port Sector 4 tower, 120km away from Pune.'
    },
    analyticalNotes: 'Physical alibi statement is mathematically irreconcilable with radio propagation range of Sector 4 cell tower. System flags this for investigator follow-up without drawing definitive legal conclusions.',
    investigatorActions: [
      'Subpoena Hotel Blue Diamond guest register and CCTV footage for August 13-14.',
      'Request cell tower LAC timing advance records for precise 50m distance estimation.',
      'Re-interview accused with corroborated telecom timeline.'
    ]
  },
  {
    id: 'DISCREPANCY-002',
    caseId: 'CASE-2024-MH-092',
    title: 'Discrepancy: Shipping Cargo Declaration vs Physical Customs Panchnama',
    status: 'DATA DISCREPANCY DETECTED',
    conflictingField: 'Declared Consignment Weight & Commodity Code',
    sourceA: {
      sourceName: 'Import General Manifest (IGM #239104)',
      documentRef: 'Customs ICEGATE Electronic Manifest Filing',
      timestamp: '2024-08-10 16:00:00',
      recordedValue: 'HS Code 08041020: Fresh Dates, Gross Weight 18,200 kg',
      excerpt: 'Commercial importer declares 800 cartons of premium packaging dates in cold container.'
    },
    sourceB: {
      sourceName: 'Customs Preventive Physical Weighbridge & Chemical Lab Assay',
      documentRef: 'JNPT Central Weighbridge Receipt #WB-99120',
      timestamp: '2024-08-14 03:00:00',
      recordedValue: 'Gross Weight 19,450 kg (+1,250 kg surplus including concealed cavity)',
      excerpt: 'Actual weight exceeds declared manifest by 1,250 kg. Cavity behind refrigeration coils contained 42.5 kg narcotic substance and 1,207 kg lead-alloy ballast sheets.'
    },
    analyticalNotes: 'Weight discrepancy confirms secondary unmanifested payload concealed within container structure.',
    investigatorActions: [
      'Issue summons to container freight station clearing agent.',
      'Preserve weighbridge calibration certificate for trial ledger.'
    ]
  }
];

// ==========================================
// 9. EVIDENCE & SHA-256 INTEGRITY (M6 CONTRACT)
// ==========================================
export const SYNTHETIC_EVIDENCE_RECORDS: EvidenceRecord[] = [
  {
    id: 'EVD-2024-0812',
    evidenceCode: 'EVD-2024-0812',
    title: 'Physical Extraction Image: Mobile Phone (+91-98201-99412)',
    category: 'Digital Forensic Image',
    caseId: 'CASE-2024-MH-092',
    caseTitle: 'Operation Blue Tide',
    seizureDate: '2024-08-14 04:00:00',
    seizingOfficer: 'Inspector Vikramaditya Rao (LEO-7729)',
    custodian: 'FSL Kalina Cyber Forensic Lab',
    fileSizeBytes: 24891240000,
    originalHashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    currentHashSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    integrityStatus: 'MATCH',
    lastVerifiedAt: '2024-08-25 10:15:00',
    verifiedBy: 'System Automated Integrity Daemon (M6 Node)',
    chainOfCustody: [
      { timestamp: '2024-08-14 04:00:00', action: 'SEIZURE_AND_FARADAY_BAG', officer: 'Insp. Vikramaditya Rao', notes: 'Seized from person of Vikram Malhotra. Placed in sealed RF-shielded bag.' },
      { timestamp: '2024-08-14 11:30:00', action: 'FORENSIC_IMAGING_E01', officer: 'Scientific Officer V. Kulkarni', notes: 'Bitstream image created on Tableau TD3 forensic duplicator.' },
      { timestamp: '2024-08-25 10:15:00', action: 'PERIODIC_SHA256_VERIFICATION', officer: 'M6 Evidence Daemon', notes: 'Automated ledger checksum verification: MATCH confirmed.' }
    ],
    bsaSection63Certificate: {
      certificateId: 'BSA-63-FSL-2024-8841',
      issuer: 'Forensic Science Laboratory, Government of Maharashtra',
      hashAlgorithm: 'SHA-256',
      signedAt: '2024-08-14 16:00:00',
      status: 'VALID'
    },
    associatedEntities: [
      { entityId: 'ENT-PERS-001', entityType: 'Person', label: 'Vikram Malhotra' },
      { entityId: 'ENT-PHON-001', entityType: 'Phone', label: '+91-98201-99412' }
    ],
    description: 'Forensic bit-stream physical image of suspect smartphone containing WhatsApp chat databases, call logs, and geo-location cache.'
  },
  {
    id: 'EVD-2024-0813',
    evidenceCode: 'EVD-2024-0813',
    title: 'Certified Bank Ledger: HDFC Account 9921-4820',
    category: 'Bank Statement',
    caseId: 'CASE-2024-MH-092',
    caseTitle: 'Operation Blue Tide',
    seizureDate: '2024-08-15 14:00:00',
    seizingOfficer: 'SI Priyanka Sen',
    custodian: 'CID Economic Intelligence Unit Locker',
    fileSizeBytes: 4219000,
    originalHashSHA256: '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
    currentHashSHA256: '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
    integrityStatus: 'MATCH',
    lastVerifiedAt: '2024-08-25 10:15:00',
    verifiedBy: 'System Automated Integrity Daemon (M6 Node)',
    chainOfCustody: [
      { timestamp: '2024-08-15 14:00:00', action: 'BANK_SUBPOENA_COLLECTION', officer: 'SI Priyanka Sen', notes: 'Obtained via certified digital token from HDFC Fort Branch Manager.' },
      { timestamp: '2024-08-25 10:15:00', action: 'PERIODIC_SHA256_VERIFICATION', officer: 'M6 Evidence Daemon', notes: 'Checksum verification MATCH.' }
    ],
    bsaSection63Certificate: {
      certificateId: 'BSA-63-BNK-2024-1102',
      issuer: 'HDFC Bank Compliance Department',
      hashAlgorithm: 'SHA-256',
      signedAt: '2024-08-15 13:45:00',
      status: 'VALID'
    },
    associatedEntities: [
      { entityId: 'ENT-BANK-001', entityType: 'BankAccount', label: 'HDFC (9921-4820)' },
      { entityId: 'ENT-TXN-001', entityType: 'Transaction', label: 'TXN-90214' }
    ],
    description: 'Bank certified transaction records showing incoming hawala credits and immediate outgoing NEFT wire to shell logistics account.'
  },
  {
    id: 'EVD-2024-0814',
    evidenceCode: 'EVD-2024-0814',
    title: 'Tampered CDR Audit File (Demonstration of Mismatch Alert)',
    category: 'CDR Dump',
    caseId: 'CASE-2024-MH-092',
    caseTitle: 'Operation Blue Tide',
    seizureDate: '2024-08-16 09:00:00',
    seizingOfficer: 'Inspector Vikramaditya Rao',
    custodian: 'Sub-Inspector Desk Terminal (Under Integrity Audit)',
    fileSizeBytes: 1845000,
    originalHashSHA256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    currentHashSHA256: 'f9e8d7c6b5a403928172635443322110ffeeddccbbaa99887766554433221100',
    integrityStatus: 'MISMATCH',
    lastVerifiedAt: '2024-08-25 10:15:00',
    verifiedBy: 'System Automated Integrity Daemon (M6 Node)',
    chainOfCustody: [
      { timestamp: '2024-08-16 09:00:00', action: 'INITIAL_INGESTION', officer: 'Insp. Vikramaditya Rao', notes: 'Initial CDR file logged with SHA-256.' },
      { timestamp: '2024-08-24 16:30:00', action: 'HASH_MISMATCH_TRIGGERED', officer: 'M6 Evidence Daemon', notes: 'ALERT: Current hash differs from Genesis Hash. Possible unauthorized byte modification!' }
    ],
    bsaSection63Certificate: {
      certificateId: 'BSA-63-TEL-2024-0091',
      issuer: 'Airtel Nodal Officer',
      hashAlgorithm: 'SHA-256',
      signedAt: '2024-08-16 08:30:00',
      status: 'REVOKED'
    },
    associatedEntities: [
      { entityId: 'ENT-PHON-001', entityType: 'Phone', label: '+91-98201-99412' }
    ],
    description: 'Demonstration evidence item showcasing CrimeNet AI cryptographic tamper-evidence detection. File integrity mismatch alerts investigators immediately.'
  }
];

// ==========================================
// 10. ALERTS & WATCHLIST
// ==========================================
export const SYNTHETIC_ALERTS: AlertItem[] = [
  {
    id: 'ALT-2024-001',
    caseId: 'CASE-2024-MH-092',
    category: 'Cross-source Contradiction',
    severity: 'CRITICAL',
    title: 'Location Alibi Contradiction: Accused vs CDR Pings',
    explanation: 'Accused statement claimed presence in Pune at 02:40 AM, while certified telecom records register active radio transmission at Nhava Sheva Port Sector 4 tower.',
    source: 'Automated Cross-Verification Engine (M5)',
    sourceRecordId: 'DISCREPANCY-001',
    timestamp: '2024-08-24 11:20:00',
    isReviewed: false,
    linkedEntities: [
      { id: 'ENT-PERS-001', label: 'Vikram Malhotra', type: 'Person' },
      { id: 'ENT-LOC-001', label: 'Nhava Sheva Yard 4B', type: 'Location' }
    ],
    history: [
      { timestamp: '2024-08-24 11:20:00', action: 'ALERT_GENERATED', performedBy: 'M5 Cross-Verification Engine' }
    ]
  },
  {
    id: 'ALT-2024-002',
    caseId: 'CASE-2024-MH-092',
    category: 'Evidence Integrity Mismatch',
    severity: 'CRITICAL',
    title: 'Evidence SHA-256 Checksum Mismatch Alert',
    explanation: 'Cryptographic hash mismatch detected on evidence file EVD-2024-0814. File has been locked from court submission until re-verified.',
    source: 'M6 Cryptographic Integrity Daemon',
    sourceRecordId: 'EVD-2024-0814',
    timestamp: '2024-08-24 16:30:00',
    isReviewed: true,
    reviewedBy: 'SI Priyanka Sen',
    reviewedAt: '2024-08-24 17:10:00',
    reviewNotes: 'Flagged for forensic lab inspection. Secondary sealed master copy requested.',
    linkedEntities: [
      { id: 'ENT-EVD-001', label: 'EVD-2024-0814', type: 'Evidence' }
    ],
    history: [
      { timestamp: '2024-08-24 16:30:00', action: 'ALERT_GENERATED', performedBy: 'M6 Daemon' },
      { timestamp: '2024-08-24 17:10:00', action: 'REVIEW_LOGGED', performedBy: 'SI Priyanka Sen' }
    ]
  },
  {
    id: 'ALT-2024-003',
    caseId: 'CASE-2024-MH-092',
    category: 'Unusual Transaction Pattern',
    severity: 'HIGH',
    title: 'Rapid Dissipation of Liquid Funds: TXN-90214',
    explanation: '₹15,00,000 transferred at 01:18 AM and subsequently withdrawn in 3 tranches prior to business banking hours.',
    source: 'M5 Anomaly Detection Model',
    sourceRecordId: 'ENT-TXN-001',
    timestamp: '2024-08-14 04:30:00',
    isReviewed: false,
    linkedEntities: [
      { id: 'ENT-BANK-001', label: 'HDFC (9921-4820)', type: 'BankAccount' },
      { id: 'ENT-TXN-001', label: 'TXN-90214', type: 'Transaction' }
    ],
    history: [
      { timestamp: '2024-08-14 04:30:00', action: 'ALERT_GENERATED', performedBy: 'M5 Financial Anomaly Subsystem' }
    ]
  },
  {
    id: 'ALT-2024-004',
    caseId: 'CASE-2024-MH-092',
    category: 'Watchlist Match',
    severity: 'HIGH',
    title: 'Monitored Phone Number Identified in New FIR Filing',
    explanation: 'Watchlist entry +91-98791-22440 (Rajesh K. Sharma) appeared as co-signatory in parallel Surat EOW FIR-2024-4112.',
    source: 'M3 Watchlist Sync Pipeline',
    timestamp: '2024-08-22 09:15:00',
    isReviewed: false,
    linkedEntities: [
      { id: 'ENT-PERS-002', label: 'Rajesh K. Sharma', type: 'Person' }
    ],
    history: [
      { timestamp: '2024-08-22 09:15:00', action: 'ALERT_GENERATED', performedBy: 'Watchlist Engine' }
    ]
  }
];

export const SYNTHETIC_WATCHLIST: WatchlistEntry[] = [
  {
    id: 'WL-001',
    entryType: 'Person',
    value: 'Rajesh Kumar Sharma',
    targetName: 'Rajesh K. Sharma',
    reasonForMonitoring: 'Frequent Hawala settlement agent across western maritime ports',
    addedByOfficer: 'Insp. Vikramaditya Rao',
    addedAt: '2024-07-29',
    caseReference: 'CASE-2024-MH-092',
    matchCount: 4,
    lastMatchedAt: '2024-08-22',
    status: 'ACTIVE'
  },
  {
    id: 'WL-002',
    entryType: 'Phone',
    value: '+91-98791-22440',
    targetName: 'Rajesh K. Sharma Secondary Phone',
    reasonForMonitoring: 'Frequent late night communication with port clearing agents',
    addedByOfficer: 'SI Priyanka Sen',
    addedAt: '2024-08-05',
    caseReference: 'CASE-2024-MH-092',
    matchCount: 6,
    lastMatchedAt: '2024-08-24',
    status: 'ACTIVE'
  },
  {
    id: 'WL-003',
    entryType: 'BankAccount',
    value: '9921-4820-1102',
    targetName: 'BlueSea Logistics HDFC Account',
    reasonForMonitoring: 'Zero balance shell conduit account',
    addedByOfficer: 'Insp. Vikramaditya Rao',
    addedAt: '2024-08-12',
    caseReference: 'CASE-2024-MH-092',
    matchCount: 2,
    lastMatchedAt: '2024-08-14',
    status: 'ACTIVE'
  },
  {
    id: 'WL-004',
    entryType: 'Alias',
    value: 'Vicky Cargo',
    targetName: 'Vikram Malhotra Alias',
    reasonForMonitoring: 'Informal trade handle used in freight booking receipts',
    addedByOfficer: 'Insp. Vikramaditya Rao',
    addedAt: '2024-08-10',
    caseReference: 'CASE-2024-MH-092',
    matchCount: 3,
    lastMatchedAt: '2024-08-18',
    status: 'ACTIVE'
  }
];

// ==========================================
// 11. GROUNDED AI ASSISTANT DEMO Q&A
// ==========================================
export interface GroundedAIResponse {
  query: string;
  answer: string;
  relevantEntities: { id: string; label: string; type: string }[];
  graphPath: string[];
  sourceRecords: { source: string; documentRef: string; excerpt: string }[];
  supportingEvidence: { evidenceId: string; title: string; sha256: string; status: string }[];
  confidenceContext: string;
  caseReferences: string[];
}

export const SYNTHETIC_AI_KNOWLEDGE_BASE: GroundedAIResponse[] = [
  {
    query: 'How is Vikram Malhotra connected to BlueSea Logistics and FIR-2024-8841?',
    answer: 'Vikram Malhotra is directly named as an accused in FIR-2024-8841 registered by Nhava Sheva Special Crime Cell. Analytical graph traversal reveals an indirect 6-hop operational path linking him to BlueSea Logistics Shell Co: Vikram Malhotra operated subscriber phone +91-98201-99412, which initiated a 342-second call to Rajesh K. Sharma at 01:04 AM on August 14. Fourteen minutes later, Rajesh Sharma executed transaction TXN-90214 for ₹15,00,000 from HDFC Bank Account 9921-4820, which is legally registered to BlueSea Logistics & Trading Pvt Ltd. Additionally, container chassis truck MH-04-AZ-9921 registered under Vikram Malhotra entered Nhava Sheva Yard 4B where the illicit contraband was seized.',
    relevantEntities: [
      { id: 'ENT-PERS-001', label: 'Vikram Malhotra', type: 'Person' },
      { id: 'ENT-PHON-001', label: '+91-98201-99412', type: 'Phone' },
      { id: 'ENT-PERS-002', label: 'Rajesh K. Sharma', type: 'Person' },
      { id: 'ENT-BANK-001', label: 'HDFC (9921-4820)', type: 'BankAccount' },
      { id: 'ENT-TXN-001', label: 'TXN-90214', type: 'Transaction' },
      { id: 'ENT-ORG-001', label: 'BlueSea Logistics', type: 'Organization' },
      { id: 'ENT-FIR-001', label: 'FIR-2024-8841', type: 'FIR' }
    ],
    graphPath: [
      'Vikram Malhotra (Person)',
      '↓ registered subscriber',
      '+91-98201-99412 (Phone)',
      '↓ voice call 342s (01:04 AM)',
      'Rajesh K. Sharma (Person)',
      '↓ authorized signatory',
      'HDFC Account 9921-4820 (Bank)',
      '↓ NEFT debit ₹15L (01:18 AM)',
      'BlueSea Logistics (Organization)'
    ],
    sourceRecords: [
      {
        source: 'CCTNS Police Database',
        documentRef: 'FIR-2024-8841 IIF-1',
        excerpt: 'Accused Vikram Malhotra booked under Sections 8(c), 20(b)(ii)(C) NDPS Act and 120-B IPC.'
      },
      {
        source: 'Airtel Telecom Carrier Extract',
        documentRef: 'AIRTEL-CDR-20240815.txt',
        excerpt: 'Originating call 01:04:10 AM from +91-98201-99412 to +91-98791-22440, duration 342s.'
      },
      {
        source: 'HDFC Core Banking Ledger',
        documentRef: 'Batch Log #90214',
        excerpt: 'NEFT Transfer ₹15,00,000 from current account 9921-4820 to Rajesh K. Sharma.'
      }
    ],
    supportingEvidence: [
      {
        evidenceId: 'EVD-2024-0812',
        title: 'Forensic Physical Mobile Clone',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'VERIFIED_MATCH'
      },
      {
        evidenceId: 'EVD-2024-0813',
        title: 'Certified HDFC Bank Ledger',
        sha256: '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
        status: 'VERIFIED_MATCH'
      }
    ],
    confidenceContext: 'High Confidence (Corroborated by 3 independent verified sources: CCTNS, Telecom Carrier, and Core Banking Ledger). Analytical note: The connection establishes operational coordination; criminal intent is subject to judicial proof.',
    caseReferences: ['CASE-2024-MH-092']
  },
  {
    query: 'What data discrepancies exist regarding Vikram Malhotra?',
    answer: 'A critical discrepancy exists between Vikram Malhotra\'s defense statement and verified telecom carrier records. In Case Diary Entry #14-B of FIR-2024-8841, Vikram Malhotra stated that he was at Hotel Blue Diamond, Pune throughout the night of August 13-14. However, certified CDR records from Bharti Airtel demonstrate his phone (+91-98201-99412) actively communicated and connected through Nhava Sheva Sector 4 Tower (Cell ID 19402) at 01:04 AM and 02:40 AM on August 14, located 120km away in Navi Mumbai.',
    relevantEntities: [
      { id: 'ENT-PERS-001', label: 'Vikram Malhotra', type: 'Person' },
      { id: 'ENT-PHON-001', label: '+91-98201-99412', type: 'Phone' },
      { id: 'ENT-LOC-001', label: 'Nhava Sheva Yard 4B', type: 'Location' }
    ],
    graphPath: [
      'Vikram Malhotra (Person)',
      '↓ statement',
      'Claimed Location: Pune',
      '≠ CONFLICT',
      'Nhava Sheva Cell Tower (19402)',
      '↑ antenna lock',
      'Phone +91-98201-99412'
    ],
    sourceRecords: [
      {
        source: 'FIR Case Diary',
        documentRef: 'Vol I, Entry #14-B',
        excerpt: 'Accused statement claiming overnight stay in Pune room #402.'
      },
      {
        source: 'Bharti Airtel Telecom CDR Dump',
        documentRef: 'AIRTEL-CDR-20240815.csv',
        excerpt: 'Tower Cell ID 19402 Nhava Sheva registered CDR call at 01:04 AM.'
      }
    ],
    supportingEvidence: [
      {
        evidenceId: 'EVD-2024-0812',
        title: 'Forensic Mobile Extraction & CDR Audit',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'VERIFIED_MATCH'
      }
    ],
    confidenceContext: 'Corroborated Discrepancy (Cross-verification flag DISCREPANCY-001). System does not determine intent; findings indicate physical impossibility of simultaneous presence.',
    caseReferences: ['CASE-2024-MH-092']
  }
];
