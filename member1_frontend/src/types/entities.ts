export type EntityType = 
  | 'Person'
  | 'Phone'
  | 'BankAccount'
  | 'Vehicle'
  | 'Location'
  | 'Organization'
  | 'FIR'
  | 'Crime'
  | 'Transaction'
  | 'Communication'
  | 'Evidence';

export interface BaseEntity {
  id: string;
  type: EntityType;
  label: string;
  source: string;
  sourceDocument?: string;
  firstObserved: string;
  lastUpdated: string;
  caseIds: string[];
  evidenceCount: number;
  anomalyIndicators?: string[]; // strictly analytical findings, NOT risk scores
  notes?: string;
}

export interface PersonEntity extends BaseEntity {
  type: 'Person';
  fullName: string;
  aliases: string[];
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  nationalIdNumber?: string; // Aadhaar / Passport / Voter ID
  phoneNumbers: string[];
  bankAccounts: string[];
  vehicles: string[];
  addresses: string[];
  organizations: string[];
  associatedFIRs: string[];
  crimesReferenced: string[];
  knownAssociates: { personId: string; name: string; relationType: string; confidence: string }[];
  analyticalSummary: string; // Investigator analytical context
}

export interface PhoneEntity extends BaseEntity {
  type: 'Phone';
  phoneNumber: string;
  imei?: string;
  imsi?: string;
  serviceProvider: string;
  registeredSubscriber: string;
  associatedPersonId?: string;
  cdrCallCount: number;
  frequentTowerLocations: string[];
  lastActiveTower: string;
}

export interface BankAccountEntity extends BaseEntity {
  type: 'BankAccount';
  accountNumber: string;
  bankName: string;
  branch: string;
  ifscCode: string;
  accountHolderName: string;
  accountType: 'Savings' | 'Current' | 'NRE' | 'Escrow';
  associatedPersonId?: string;
  associatedOrgId?: string;
  totalTransactionsLogged: number;
  swiftCode?: string;
}

export interface VehicleEntity extends BaseEntity {
  type: 'Vehicle';
  registrationNumber: string;
  makeModel: string;
  vehicleType: 'Car' | 'Motorcycle' | 'Truck' | 'Container' | 'Vessel';
  registeredOwner: string;
  chassisNumber?: string;
  tollPingsCount: number;
  lastSightedLocation?: string;
}

export interface LocationEntity extends BaseEntity {
  type: 'Location';
  locationName: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  locationCategory: 'Crime Scene' | 'Suspect Residence' | 'Cell Tower' | 'Warehouse' | 'Port / Terminal' | 'Office';
  associatedCrimeIds: string[];
}

export interface OrganizationEntity extends BaseEntity {
  type: 'Organization';
  orgName: string;
  registrationNumber?: string;
  orgType: 'Shell Company' | 'Logistics' | 'Financial Intermediary' | 'Retail' | 'Trust';
  directors: string[];
  registeredAddress: string;
  bankAccountNumbers: string[];
}

export interface FIREntity extends BaseEntity {
  type: 'FIR';
  firNumber: string;
  policeStation: string;
  registrationDate: string;
  sectionsApplied: string[]; // e.g. IPC/BNS sections
  complainantName: string;
  accusedNames: string[];
  investigatingOfficer: string;
  status: 'Under Investigation' | 'Charge Sheet Filed' | 'Closed' | 'Trial Pending';
  briefFacts: string;
}

export interface CrimeEntity extends BaseEntity {
  type: 'Crime';
  crimeId: string;
  crimeCategory: string; // e.g., Narcotics Smuggling, Hawala, Cyber Fraud
  dateOfOccurrence: string;
  locationId: string;
  firNumber: string;
  modusOperandi: string;
  seizedMaterials: string[];
}

export interface TransactionEntity extends BaseEntity {
  type: 'Transaction';
  transactionId: string;
  sourceAccount: string;
  destinationAccount: string;
  sourceHolder: string;
  destinationHolder: string;
  amountINR: number;
  timestamp: string;
  channel: 'NEFT' | 'RTGS' | 'IMPS' | 'SWIFT' | 'Hawala Ledger' | 'Cash Deposit';
  anomalyNote?: string;
}

export interface CommunicationEntity extends BaseEntity {
  type: 'Communication';
  callId: string;
  callerNumber: string;
  receiverNumber: string;
  callerName?: string;
  receiverName?: string;
  callType: 'Voice' | 'SMS' | 'VoIP / Encrypted' | 'WhatsApp Call';
  durationSeconds: number;
  timestamp: string;
  originTower: string;
  destinationTower?: string;
}

export interface EvidenceEntity extends BaseEntity {
  type: 'Evidence';
  evidenceId: string;
  title: string;
  category: 'Digital Forensic Image' | 'CDR Dump' | 'Bank Statement' | 'Seized Physical Item' | 'CCTV Footage' | 'FIR Copy';
  originalHashSHA256: string;
  currentHashSHA256: string;
  isIntegrityVerified: boolean;
  seizureDate: string;
  seizingOfficer: string;
  chainOfCustodyCurrentHolder: string;
  bsaSection63CertificateId?: string;
  fileSizeBytes: number;
  mimeType: string;
  downloadUrl?: string;
}

export type AnyEntity = 
  | PersonEntity 
  | PhoneEntity 
  | BankAccountEntity 
  | VehicleEntity 
  | LocationEntity 
  | OrganizationEntity 
  | FIREntity 
  | CrimeEntity 
  | TransactionEntity 
  | CommunicationEntity 
  | EvidenceEntity;
