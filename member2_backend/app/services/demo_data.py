from datetime import datetime, timezone
from typing import Any, Dict, List

# DEMO STORY CANONICAL DATASET (SIH26189)
# Chain: FIR -> Person A -> Phone -> Person B -> Bank Account -> Transaction -> Organization -> Location -> Crime

DEMO_CASES = [
    {
        'caseId': 'CASE-2025-NAT-001',
        'caseNumber': 'CASE-2025-NAT-001',
        'title': 'National Multi-Modal Criminal Network (Primary Dataset)',
        'description': 'Centralized multi-state intelligence graph synthesized from 10,000 indexed persons, 200,000 financial transactions, 250,000 communications, and 30,000 FIR co-accused links.',
        'assignedInvestigator': 'Inspector Vikramaditya Rao (LEO-7729)',
        'leadInvestigator': 'Inspector Vikramaditya Rao (LEO-7729)',
        'assignedTeam': 'Joint Financial Crimes & Organized Syndicate Taskforce',
        'status': 'active',
        'priority': 'critical',
        'policeStation': 'Central Intelligence Grid',
        'jurisdiction': 'National Multi-State Jurisdiction',
        'executiveSummary': 'Real repository dataset analysis spanning 490,000 nodes and 540,000 relationships across banking, telecommunication, and criminal law-enforcement records.',
        'entityCount': 490000,
        'relationshipCount': 540000,
        'evidenceCount': 4,
        'reportCount': 1,
        'accessClassification': 'RESTRICTED',
        'associatedFIRs': ['F000001', 'F000002', 'F000003'],
        'createdAt': '2025-01-01T00:00:00Z',
        'updatedAt': '2025-12-31T23:59:59Z'
    },
    {
        'caseId': 'CASE-2024-MH-092',
        'caseNumber': 'CASE-2024-MH-092',
        'title': 'Operation Blue Tide: Nhava Sheva Illicit Logistics & Hawala Nexus',
        'description': 'Investigation into organized contraband import through fictitious shipping manifests, shell clearing companies, and offshore hawala conduits along the Mumbai-Surat maritime corridor.',
        'assignedInvestigator': 'Inspector Vikramaditya Rao (LEO-7729)',
        'leadInvestigator': 'Inspector Vikramaditya Rao (LEO-7729)',
        'assignedTeam': 'Insp. V. Rao, SI Priyanka Sen, Analyst K. Nair',
        'status': 'active',
        'priority': 'critical',
        'policeStation': 'Special Crime Branch, CID Mumbai',
        'jurisdiction': 'Special Crime Branch, CID Mumbai',
        'executiveSummary': 'Investigation into organized contraband import through fictitious shipping manifests, shell clearing companies, and offshore hawala conduits along the Mumbai-Surat maritime corridor. On 14 August 2024 at 02:30 AM, joint preventive officers intercepted refrigerated container #MRKU-982141-0 at Nhava Sheva Port Yard 4B, recovering 42.5 kg concealed illicit contraband. Multi-hop network synthesis establishes operational coordination between logistics operator Vikram Malhotra and Surat financial broker Rajesh K. Sharma via shell entity BlueSea Logistics & Trading Pvt Ltd.',
        'entityCount': 11,
        'relationshipCount': 14,
        'evidenceCount': 5,
        'reportCount': 1,
        'accessClassification': 'CONFIDENTIAL',
        'associatedFIRs': ['FIR-2024-8841'],
        'createdAt': '2024-08-10T09:30:00Z',
        'updatedAt': '2024-08-25T14:30:00Z'
    },
    {
        'caseId': 'CASE-2024-001',
        'title': 'Operation Blue Shadow: JNPT International Smuggling & Hawala Ring',
        'description': 'Comprehensive multi-agency investigation into an organized syndicate engaging in customs fraud, illicit container diversion at JNPT, and shell company laundering.',
        'assignedInvestigator': 'Inspector Rajesh Kumar',
        'assignedTeam': 'State Cyber & Special Narcotics Operations Team',
        'status': 'active',
        'priority': 'critical',
        'entityCount': 9,
        'relationshipCount': 12,
        'evidenceCount': 6,
        'reportCount': 2,
        'createdAt': '2024-03-15T09:00:00Z',
        'updatedAt': '2024-03-24T14:30:00Z'
    },
    {
        'caseId': 'CASE-2024-002',
        'title': 'Operation Golden Horizon: Multi-State Cyber Financial Scam',
        'description': 'Investigation into fraudulent investment applications routing stolen proceeds across multiple mule bank accounts.',
        'assignedInvestigator': 'Inspector Sunita Rao',
        'assignedTeam': 'Cyber Financial Crimes Unit',
        'status': 'under_review',
        'priority': 'high',
        'entityCount': 5,
        'relationshipCount': 6,
        'evidenceCount': 3,
        'reportCount': 1,
        'createdAt': '2024-02-10T10:00:00Z',
        'updatedAt': '2024-03-20T11:00:00Z'
    }
]

DEMO_ENTITIES: List[Dict[str, Any]] = [
    {
        'id': 'FIR-2024-8841',
        'entityType': 'FIR',
        'canonicalName': 'FIR No. 8841/2024 - Nhava Sheva Police Station',
        'firNumber': 'FIR-2024-8841',
        'policeStation': 'Nhava Sheva Port Police Station',
        'filingDate': '2024-03-10T11:30:00Z',
        'actsSections': ['Customs Act Sec 135', 'BNS Sec 318(4) (Cheating)', 'BNS Sec 111 (Organized Crime)'],
        'complainant': 'Customs Intelligence Officer K. Roy',
        'accusedPersons': ['Vikram Malhotra', 'Rajesh Sharma'],
        'incidentSummary': 'Intercepted declared heavy machinery consignment at JNPT containing undeclared contraband and forged clearance manifests.',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-001',
        'confidence': 0.99,
        'metadata': {'jurisdiction': 'Navi Mumbai', 'sourceDataset': 'POLICE_PORTAL_INGEST'}
    },
    {
        'id': 'PER-001',
        'entityType': 'Person',
        'canonicalName': 'Vikram Malhotra',
        'fullName': 'Vikram Malhotra',
        'aliases': ['Vicky Builder', 'VM Bhai'],
        'dateOfBirth': '1982-06-14',
        'nationalId': 'AADHAAR-8821-9932-1102',
        'passportNumber': 'Z-9821443',
        'address': 'Flat 802, Palm Beach Heights, Sector 18, Vashi, Navi Mumbai',
        'associatedPhones': ['+91-9876543210'],
        'associatedAccounts': ['HDFC-99214430'],
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-001',
        'confidence': 0.98,
        'metadata': {'role': 'Consignment Receiver & Shell Director'}
    },
    {
        'id': 'PHO-001',
        'entityType': 'Phone',
        'canonicalName': '+91-9876543210',
        'phoneNumber': '+91-9876543210',
        'imei': '864209041234567',
        'carrier': 'Airtel Mumbai',
        'subscriberName': 'Vikram Malhotra',
        'callCount': 142,
        'smsCount': 38,
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-002',
        'confidence': 0.97,
        'metadata': {'towerLocation': 'JNPT Container Terminal Gate #3'}
    },
    {
        'id': 'PER-002',
        'entityType': 'Person',
        'canonicalName': 'Rajesh Sharma',
        'fullName': 'Rajesh Sharma',
        'aliases': ['Munna Transporter', 'RS'],
        'dateOfBirth': '1979-11-23',
        'nationalId': 'AADHAAR-4412-8812-7731',
        'passportNumber': 'M-4412091',
        'address': 'B-12, Green Park Society, Belapur, Navi Mumbai',
        'associatedPhones': ['+91-9822334455'],
        'associatedAccounts': ['ICICI-44128890'],
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-002',
        'confidence': 0.96,
        'metadata': {'role': 'Logistics Coordinator & Account Operative'}
    },
    {
        'id': 'ACC-001',
        'entityType': 'BankAccount',
        'canonicalName': 'HDFC-99214430 (Shadow Logistics)',
        'accountNumber': 'HDFC-99214430',
        'bankName': 'HDFC Bank',
        'branch': 'Vashi Sector 17',
        'ifscCode': 'HDFC0000128',
        'accountHolder': 'Shadow Logistics Ltd (Auth Signatory: Vikram Malhotra)',
        'totalCredits': 14500000.0,
        'totalDebits': 14200000.0,
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-003',
        'confidence': 0.99,
        'metadata': {'accountType': 'Current Account', 'kycStatus': 'Verified'}
    },
    {
        'id': 'TXN-2024-8812',
        'entityType': 'Transaction',
        'canonicalName': 'TXN-2024-8812 (INR 45,00,000)',
        'transactionId': 'TXN-2024-8812',
        'sourceAccount': 'ICICI-44128890',
        'destinationAccount': 'HDFC-99214430',
        'amount': 4500000.0,
        'currency': 'INR',
        'transactionDate': '2024-03-08T16:45:00Z',
        'paymentChannel': 'RTGS',
        'referenceNumber': 'RTGS-MAH-20240308-882199',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-003',
        'confidence': 0.99,
        'metadata': {'narration': 'Urgent logistics freight clearance JNPT'}
    },
    {
        'id': 'ORG-001',
        'entityType': 'Organization',
        'canonicalName': 'Shadow Logistics Ltd',
        'orgName': 'Shadow Logistics Ltd',
        'registrationNumber': 'CIN-U74999MH2021PTC362190',
        'orgType': 'Shell Freight Forwarding Entity',
        'directors': ['Vikram Malhotra', 'Rajesh Sharma'],
        'registeredAddress': 'Office 401, Sai Commercial Arcade, Plot 12, APMC Market, Vashi, Navi Mumbai',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-004',
        'confidence': 0.95,
        'metadata': {'mcaStatus': 'Active (Flagged for Non-Filing)'}
    },
    {
        'id': 'LOC-001',
        'entityType': 'Location',
        'canonicalName': 'Godown #4, JNPT Logistics Park, Navi Mumbai',
        'locationName': 'Godown #4, JNPT Logistics Park',
        'address': 'Plot 44, Container Freight Station Zone, JNPT, Uran, Navi Mumbai, Maharashtra 400702',
        'city': 'Navi Mumbai',
        'state': 'Maharashtra',
        'country': 'India',
        'latitude': 18.9498,
        'longitude': 72.9512,
        'locationType': 'Illicit Warehousing & Offloading Facility',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-005',
        'confidence': 0.98,
        'metadata': {'securityJurisdiction': 'CISF / Navi Mumbai Police'}
    },
    {
        'id': 'CRM-001',
        'entityType': 'Crime',
        'canonicalName': 'Gold & Narcotics Contraband Smuggling Syndicate',
        'crimeCode': 'CRIME-SMUGGLING-2024-01',
        'crimeCategory': 'Organized Port Smuggling & Hawala Financing',
        'description': 'Diversion of high-value contraband containers using falsified customs bills of entry and cash transfers.',
        'incidentDate': '2024-03-10T10:00:00Z',
        'location': 'JNPT Navi Mumbai',
        'status': 'Under Active Investigation',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-001',
        'confidence': 0.99,
        'metadata': {'seizureValueINR': 125000000.0}
    },
    {
        'id': 'VEH-001',
        'entityType': 'Vehicle',
        'canonicalName': 'MH-46-AR-9902 (Tata Heavy Trailer)',
        'registrationNumber': 'MH-46-AR-9902',
        'make': 'Tata Motors',
        'model': 'Signa 4825.T',
        'color': 'Blue & White',
        'chassisNumber': 'MAT624109N7B88219',
        'engineNumber': 'CUMMINS-ISBE-8821',
        'ownerName': 'Shadow Logistics Ltd',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-005',
        'confidence': 0.97,
        'metadata': {'tollFastagRecords': 'Kharghar Toll Plaza 2024-03-10 08:22'}
    },
    {
        'id': 'EVD-2024-001',
        'entityType': 'Evidence',
        'canonicalName': 'Customs Inspection Report & Seizure Memo #8841',
        'evidenceNumber': 'EVD-2024-001',
        'evidenceType': 'Seizure Memo & Physical Cargo Manifest',
        'description': 'Original signed cargo inspection memo with container seals verification and physical examination notes.',
        'collectedDate': '2024-03-10T14:00:00Z',
        'collectedBy': 'Inspector R. K. Shinde (Customs Preventive Unit)',
        'storageLocation': 'Navi Mumbai Police Vault, Locker #12',
        'sha256Hash': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'bsaSection65BCertificateId': 'BSA-65B-2024-MH-00918',
        'caseId': 'CASE-2024-001',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': True, 'ledgerTimestamp': '2024-03-10T14:15:00Z'}
    }
]

# RELATIONSHIP GRAPH EDGES (M3 NEO4J CANONICAL MAPPING)
DEMO_EDGES: List[Dict[str, Any]] = [
    {'id': 'E1', 'source': 'FIR-2024-8841', 'target': 'PER-001', 'relationshipType': 'NAMES_ACCUSED', 'properties': {'role': 'Principal Accused'}, 'sourceDoc': 'FIR-2024-8841', 'timestamp': '2024-03-10T11:30:00Z', 'confidence': 0.99},
    {'id': 'E2', 'source': 'PER-001', 'target': 'PHO-001', 'relationshipType': 'USES_PHONE', 'properties': {'since': '2022-01-15', 'usageFrequency': 'Daily'}, 'sourceDoc': 'CDR_AIRTEL_202403', 'timestamp': '2024-03-10T09:12:00Z', 'confidence': 0.98},
    {'id': 'E3', 'source': 'PHO-001', 'target': 'PER-002', 'relationshipType': 'COMMUNICATED_WITH', 'properties': {'totalCalls': 46, 'totalDurationSec': 8420}, 'sourceDoc': 'CDR_ANALYSIS_M4', 'timestamp': '2024-03-08T15:20:00Z', 'confidence': 0.96},
    {'id': 'E4', 'source': 'PER-002', 'target': 'ACC-001', 'relationshipType': 'TRANSFERRED_FUNDS_TO', 'properties': {'amount': 4500000.0, 'method': 'RTGS'}, 'sourceDoc': 'BANK_STATEMENT_HDFC', 'timestamp': '2024-03-08T16:45:00Z', 'confidence': 0.99},
    {'id': 'E5', 'source': 'ACC-001', 'target': 'TXN-2024-8812', 'relationshipType': 'INVOLVED_IN_TRANSACTION', 'properties': {'creditAmount': 4500000.0}, 'sourceDoc': 'TXN_LOG_8812', 'timestamp': '2024-03-08T16:45:00Z', 'confidence': 0.99},
    {'id': 'E6', 'source': 'ACC-001', 'target': 'ORG-001', 'relationshipType': 'BELONGS_TO_ORGANIZATION', 'properties': {'signatory': 'Vikram Malhotra'}, 'sourceDoc': 'MCA_COMPANY_FILINGS', 'timestamp': '2021-08-10T00:00:00Z', 'confidence': 0.97},
    {'id': 'E7', 'source': 'ORG-001', 'target': 'LOC-001', 'relationshipType': 'OPERATES_OUT_OF', 'properties': {'leaseAgreementNumber': 'LEASE-JNPT-2023-41'}, 'sourceDoc': 'JNPT_PORT_RECORDS', 'timestamp': '2023-01-01T00:00:00Z', 'confidence': 0.95},
    {'id': 'E8', 'source': 'LOC-001', 'target': 'CRM-001', 'relationshipType': 'SITE_OF_CRIME', 'properties': {'contrabandFound': True}, 'sourceDoc': 'SEIZURE_MEMO_8841', 'timestamp': '2024-03-10T10:00:00Z', 'confidence': 0.99},
    {'id': 'E9', 'source': 'ORG-001', 'target': 'VEH-001', 'relationshipType': 'OWNS_VEHICLE', 'properties': {'fleetId': 'FL-04'}, 'sourceDoc': 'VAHAN_PORTAL_API', 'timestamp': '2023-05-12T00:00:00Z', 'confidence': 0.98},
    {'id': 'E10', 'source': 'VEH-001', 'target': 'LOC-001', 'relationshipType': 'SIGHTED_AT', 'properties': {'cctvCapture': 'JNPT Gate 4 Camera 02'}, 'sourceDoc': 'CCTV_LOG_JNPT', 'timestamp': '2024-03-10T08:45:00Z', 'confidence': 0.95}
]

# TIMELINE EVENTS
DEMO_TIMELINE: List[Dict[str, Any]] = [
    {
        'eventId': 'EVT-001',
        'timestamp': '2024-03-08T15:20:00Z',
        'eventType': 'CALL_MADE',
        'title': 'High-Frequency Call Exchange: Vikram Malhotra to Rajesh Sharma',
        'description': '46-minute encrypted conversation logged immediately prior to RTGS fund remittance.',
        'primaryEntityId': 'PER-001',
        'primaryEntityName': 'Vikram Malhotra',
        'secondaryEntityId': 'PER-002',
        'secondaryEntityName': 'Rajesh Sharma',
        'location': 'Vashi / Belapur, Navi Mumbai',
        'sourceDocument': 'CDR_AIRTEL_202403',
        'caseId': 'CASE-2024-001'
    },
    {
        'eventId': 'EVT-002',
        'timestamp': '2024-03-08T16:45:00Z',
        'eventType': 'TRANSACTION_EXECUTED',
        'title': 'RTGS Remittance: INR 45,00,000 Transferred to Shadow Logistics Ltd',
        'description': 'Transfer originated from Rajesh Sharma account to Shadow Logistics HDFC Account #99214430.',
        'primaryEntityId': 'ACC-001',
        'primaryEntityName': 'HDFC-99214430',
        'secondaryEntityId': 'TXN-2024-8812',
        'secondaryEntityName': 'TXN-2024-8812',
        'location': 'HDFC Bank Vashi Branch',
        'sourceDocument': 'BANK_STATEMENT_HDFC',
        'caseId': 'CASE-2024-001'
    },
    {
        'eventId': 'EVT-003',
        'timestamp': '2024-03-10T08:45:00Z',
        'eventType': 'VEHICLE_SIGHTED',
        'title': 'Trailer MH-46-AR-9902 Entered Godown #4 at JNPT',
        'description': 'ANPR camera flagged vehicle transporting Container #MSKU-982144 into designated offloading facility.',
        'primaryEntityId': 'VEH-001',
        'primaryEntityName': 'MH-46-AR-9902',
        'secondaryEntityId': 'LOC-001',
        'secondaryEntityName': 'Godown #4, JNPT',
        'location': 'JNPT Logistics Park Gate #4',
        'sourceDocument': 'CCTV_ANPR_LOG',
        'caseId': 'CASE-2024-001'
    },
    {
        'eventId': 'EVT-004',
        'timestamp': '2024-03-10T10:00:00Z',
        'eventType': 'CRIME_OCCURRED',
        'title': 'Raid & Contraband Interception at Godown #4',
        'description': 'Joint enforcement team intercepted undeclared contraband during illicit unsealing operation.',
        'primaryEntityId': 'CRM-001',
        'primaryEntityName': 'Gold & Narcotics Contraband Smuggling Syndicate',
        'secondaryEntityId': 'LOC-001',
        'secondaryEntityName': 'Godown #4, JNPT',
        'location': 'Godown #4, JNPT Logistics Park',
        'sourceDocument': 'RAID_SEIZURE_REPORT',
        'caseId': 'CASE-2024-001'
    },
    {
        'eventId': 'EVT-005',
        'timestamp': '2024-03-10T11:30:00Z',
        'eventType': 'FIR_FILED',
        'title': 'FIR No. 8841/2024 Registered at Nhava Sheva Police Station',
        'description': 'Formal registration under BNS Organized Crime provisions naming Vikram Malhotra and Rajesh Sharma.',
        'primaryEntityId': 'FIR-2024-8841',
        'primaryEntityName': 'FIR-2024-8841',
        'secondaryEntityId': 'PER-001',
        'secondaryEntityName': 'Vikram Malhotra',
        'location': 'Nhava Sheva Port Police Station',
        'sourceDocument': 'FIR-2024-8841',
        'caseId': 'CASE-2024-001'
    }
]

# ALERTS
DEMO_ALERTS: List[Dict[str, Any]] = [
    {
        'alertId': 'ALT-2024-001',
        'alertType': 'Watchlist Match',
        'severity': 'CRITICAL',
        'title': 'Active Watchlist Match: Vikram Malhotra (PER-001)',
        'description': 'Person listed on Central Watchlist for prior evasion offenses was identified as signatory for Shadow Logistics Ltd.',
        'relatedEntityId': 'PER-001',
        'relatedEntityName': 'Vikram Malhotra',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-001',
        'status': 'UNRESOLVED',
        'triggeredAt': '2024-03-10T12:00:00Z'
    },
    {
        'alertId': 'ALT-2024-002',
        'alertType': 'Transaction Pattern',
        'severity': 'HIGH',
        'title': 'Hawala Layering Pattern: Rapid Remittance Ahead of Shipment Delivery',
        'description': 'High value transaction INR 45,00,000 executed 36 hours prior to container arrival without corresponding trade invoices.',
        'relatedEntityId': 'TXN-2024-8812',
        'relatedEntityName': 'TXN-2024-8812',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-003',
        'status': 'UNRESOLVED',
        'triggeredAt': '2024-03-09T09:15:00Z'
    },
    {
        'alertId': 'ALT-2024-003',
        'alertType': 'Communication Pattern',
        'severity': 'HIGH',
        'title': 'Burst CDR Activity Prior to Cargo Movement',
        'description': 'Spike of 46 voice calls between Vikram Malhotra (+91-9876543210) and Rajesh Sharma (+91-9822334455).',
        'relatedEntityId': 'PHO-001',
        'relatedEntityName': '+91-9876543210',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-002',
        'status': 'UNRESOLVED',
        'triggeredAt': '2024-03-08T18:00:00Z'
    },
    {
        'alertId': 'ALT-2024-004',
        'alertType': 'Evidence Integrity Mismatch',
        'severity': 'CRITICAL',
        'title': 'Audit Hash Verification Passed: SHA-256 Ledger Intact',
        'description': 'SHA-256 hash match confirmed on tamper-evident storage for Seizure Memo #8841.',
        'relatedEntityId': 'EVD-2024-001',
        'relatedEntityName': 'Customs Inspection Report & Seizure Memo #8841',
        'caseId': 'CASE-2024-001',
        'evidenceId': 'EVD-2024-001',
        'status': 'RESOLVED',
        'triggeredAt': '2024-03-10T14:30:00Z'
    }
]

# WATCHLIST
DEMO_WATCHLIST: List[Dict[str, Any]] = [
    {
        'watchId': 'WCH-001',
        'entityType': 'Person',
        'identifierValue': 'Vikram Malhotra',
        'canonicalName': 'Vikram Malhotra',
        'reason': 'History of maritime customs violations and shell company layering',
        'priority': 'critical',
        'caseId': 'CASE-2024-001',
        'addedBy': 'Inspector Rajesh Kumar',
        'addedAt': '2024-01-10T10:00:00Z',
        'isActive': True,
        'matchCount': 4
    },
    {
        'watchId': 'WCH-002',
        'entityType': 'Phone',
        'identifierValue': '+91-9876543210',
        'canonicalName': '+91-9876543210',
        'reason': 'Monitored communication channel for syndicate coordination',
        'priority': 'high',
        'caseId': 'CASE-2024-001',
        'addedBy': 'Inspector Rajesh Kumar',
        'addedAt': '2024-02-01T11:00:00Z',
        'isActive': True,
        'matchCount': 12
    }
]

# =============================================================================
# CASE-2024-MH-092 CANONICAL DOSSIER REGISTRIES (SIH26189)
# =============================================================================

DEMO_ENTITIES_MH092: List[Dict[str, Any]] = [
    {
        'category': 'PRIMARY SUBJECT',
        'name': 'Vikram Malhotra',
        'id': 'ENT-PERS-001',
        'aliases': 'Vicky Cargo, V.M. Logistics',
        'role': 'On-Ground Logistics Coordinator',
        'details': 'Identified as principal on-ground logistics coordinator in container handling at Nhava Sheva. CDR indicates repeated burst calls prior to consignment arrivals. No prior convictions recorded; analytical focus centered on multi-hop remittances and discrepancies in cargo declaration documents.',
        'source': 'FIR-2024-8841 Case Diary Vol I & Port Clearance Register'
    },
    {
        'category': 'INTERMEDIARY BROKER',
        'name': 'Rajesh Kumar Sharma',
        'id': 'ENT-PERS-002',
        'aliases': 'Sharma Ji, RK Hawala, Bhaiya Surat',
        'role': 'Financial Intermediary & Hawala Broker',
        'details': 'Documented financial intermediary operating out of Surat diamond bazaar. Banking audit reveals high-velocity pass-through transfers between bullion accounts and logistics firms.',
        'source': 'FIU-IND Suspicious Transaction Report STR-2024-09'
    },
    {
        'category': 'SHELL CORPORATE FRONT',
        'name': 'BlueSea Logistics & Trading Pvt Ltd',
        'id': 'ENT-ORG-001',
        'aliases': 'CIN: U63090MH2021PTC368912',
        'role': 'Shell Clearing & Forwarding Front',
        'details': 'Paper clearing entity without legitimate freight equipment. Used for billing bogus transport invoices and receiving hawala wire transfers.',
        'source': 'MCA Company Registrar Audit'
    },
    {
        'category': 'FINANCIAL CONDUIT',
        'name': 'HDFC Account 9921-4820',
        'id': 'ENT-BANK-001',
        'aliases': 'IFSC: HDFC0000060 | Branch: Fort Mumbai | Holder: Rajesh Sharma',
        'role': 'Pooling Current Account',
        'details': 'Primary transaction conduit. Executed INR 15,00,000 debit relay wire TXN-90214 directly prior to container arrival at terminal.',
        'source': 'HDFC Certified Ledger Stmt #B24-911'
    },
    {
        'category': 'TARGET CELLULAR HANDSET',
        'name': '+91-98201-99412',
        'id': 'ENT-PHON-001',
        'aliases': 'Carrier: Airtel Mumbai | IMEI: 864209041234567 | Sub: V. Malhotra',
        'role': 'Operational Burner Handset',
        'details': 'Target line seized under Faraday containment. Associated with 342s voice call to Surat broker immediately prior to container offloading.',
        'source': 'Airtel Tower Dump & CDR Extraction'
    },
    {
        'category': 'SEIZED EXHIBIT / CARGO',
        'name': 'Container #MRKU-982141-0',
        'id': 'ENT-CRIM-001',
        'aliases': 'Exhibit P-1 (42.5 kg Contraband)',
        'role': 'Contraband Concealment Vessel',
        'details': 'Intercepted with 42.5 kg contraband behind false insulation bulkhead. Seal tampered in transit from Jebel Ali to JNPT Port.',
        'source': 'Joint Customs & CID Panchnama Memo'
    }
]

DEMO_HOPS_MH092: List[Dict[str, Any]] = [
    {
        'hop': 'Hop 1',
        'origin': 'Vikram Malhotra',
        'originSub': 'Person: ENT-PERS-001',
        'rel': 'OPERATES_PHONE',
        'relSub': 'Registered Subscriber',
        'dest': '+91-98201-99412',
        'destSub': 'Phone: ENT-PHON-001',
        'audit': 'Active Since: 2024-01-10<br/>KYC Verified &bull; Conf: 0.98'
    },
    {
        'hop': 'Hop 2',
        'origin': '+91-98201-99412',
        'originSub': 'Phone: ENT-PHON-001',
        'rel': 'TELECOM_CALL',
        'relSub': 'Call 342s (01:04 AM)',
        'dest': 'Rajesh K. Sharma',
        'destSub': 'Person: ENT-PERS-002',
        'audit': '2024-08-14 01:04:12 UTC<br/>Airtel CDR Dump #901 &bull; Conf: 0.96'
    },
    {
        'hop': 'Hop 3',
        'origin': 'Rajesh K. Sharma',
        'originSub': 'Person: ENT-PERS-002',
        'rel': 'FINANCIAL_CONTROL',
        'relSub': 'Sole Authorized Signatory',
        'dest': 'HDFC Account 9921-4820',
        'destSub': 'Bank: ENT-BANK-001',
        'audit': 'KYC Ref: HDFC-B-4410<br/>Branch: Fort Mumbai &bull; Conf: 0.99'
    },
    {
        'hop': 'Hop 4',
        'origin': 'HDFC Account 9921-4820',
        'originSub': 'Bank: ENT-BANK-001',
        'rel': 'NEFT_DEBIT_RELAY',
        'relSub': 'TXN-90214 ₹15,00,000 (NEFT)',
        'dest': 'TXN-90214',
        'destSub': 'Transaction: ENT-TXN-001',
        'audit': '2024-08-14 01:18:45 UTC<br/>UTR: HDFCN24081490214 &bull; Conf: 0.99'
    },
    {
        'hop': 'Hop 5',
        'origin': 'TXN-90214',
        'originSub': 'Transaction: ENT-TXN-001',
        'rel': 'BENEFICIARY_CREDIT',
        'relSub': 'Liaison Handling Fee',
        'dest': 'BlueSea Logistics & Trading Pvt Ltd',
        'destSub': 'Shell Org: ENT-ORG-001',
        'audit': '2024-08-14 01:19:10 UTC<br/>Instant Settlement &bull; Conf: 0.97'
    },
    {
        'hop': 'Hop 6',
        'origin': 'BlueSea Logistics & Trading Pvt Ltd',
        'originSub': 'Shell Org: ENT-ORG-001',
        'rel': 'CUSTOMS_CONSIGNEE',
        'relSub': 'False Manifest Filer',
        'dest': 'Container #MRKU-982141-0',
        'destSub': 'Seized Cargo: EVD-001',
        'audit': '2024-08-14 02:30:00 UTC<br/>Panchnama Seizure &bull; Conf: 0.95'
    }
]

DEMO_DISCREPANCIES_MH092: List[Dict[str, Any]] = [
    {
        'id': 'DISCREPANCY-001',
        'status': 'DATA DISCREPANCY DETECTED',
        'title': 'Contradiction: Accused Alibi Statement vs Telecom CDR Tower Ping',
        'conflictingField': 'Physical Location Coordinates at 2024-08-14 02:40 AM',
        'sourceA': {
            'name': 'Source A (Accused Statement in FIR-2024-8841 Case Diary Vol I)',
            'docRef': 'Case Diary Entry #14-B dated 2024-08-15',
            'timestamp': '2024-08-14 02:40:00 UTC',
            'recordedValue': 'Hotel Blue Diamond, Koregaon Park, Pune, Maharashtra',
            'excerpt': "'I retired to my room at Hotel Blue Diamond, Pune by 11:30 PM on August 13 and did not travel anywhere until the afternoon of August 14.'"
        },
        'sourceB': {
            'name': 'Source B (Airtel Telecom Tower Carrier Dump - Certified BSA Sec 63)',
            'docRef': 'Carrier Audit File AIRTEL-CDR-20240815.csv',
            'timestamp': '2024-08-14 02:40:18 UTC',
            'recordedValue': 'Nhava Sheva Sector 4 Tower (Cell ID: 19402, Lat: 18.9535, Lng: 72.9480)',
            'excerpt': "'Subscriber +91-98201-99412 registered incoming SMS delivery receipt and data session handover at Nhava Sheva Port Sector 4 tower, 120km away from Pune.'"
        },
        'assessment': 'Physical alibi statement is mathematically irreconcilable with radio propagation range of Sector 4 cell tower. System flags this for investigator follow-up without drawing definitive legal conclusions.',
        'actions': '1. Subpoena Hotel Blue Diamond guest register and CCTV footage for August 13-14.\n2. Request cell tower LAC timing advance records for precise 50m distance estimation.\n3. Re-interview accused with corroborated telecom timeline.'
    },
    {
        'id': 'DISCREPANCY-002',
        'status': 'DATA DISCREPANCY DETECTED',
        'title': 'Discrepancy: Shipping Cargo Declaration vs Physical Customs Panchnama',
        'conflictingField': 'Declared Consignment Weight & Commodity Code',
        'sourceA': {
            'name': 'Source A (Import General Manifest IGM #239104)',
            'docRef': 'Customs ICEGATE Electronic Manifest Filing',
            'timestamp': '2024-08-10 16:00:00 UTC',
            'recordedValue': 'HS Code 08041020: Fresh Dates, Gross Weight 18,200 kg',
            'excerpt': "'Commercial importer declares 800 cartons of premium packaging dates in cold container.'"
        },
        'sourceB': {
            'name': 'Source B (Physical Joint Customs & CID Panchnama)',
            'docRef': 'Panchnama Seizure Exhibit P-1 dated 2024-08-14',
            'timestamp': '2024-08-14 03:15:00 UTC',
            'recordedValue': 'Concealed Contraband: 42.5 kg Narcotic Consignment behind false bulkhead',
            'excerpt': "'Physical search revealed false bulkhead partition containing tamper-wrapped packages with chemical odor, not declared in IGM.'"
        },
        'assessment': 'Weight discrepancy confirms secondary unmanifested payload concealed within container structure.',
        'actions': '1. Impound shipping agent electronic correspondence.\n2. Forensic examination of container weld joints.\n3. Trace freight payment origin account.'
    }
]

DEMO_EVIDENCE_MH092: List[Dict[str, Any]] = [
    {
        'id': 'EVD-2024-0812',
        'name': 'Physical Extraction Image: Mobile Phone (+91-98201-99412)',
        'type': 'Digital Forensic Bitstream Image (E01)',
        'category': 'Physical Smartphone Extraction',
        'size': '24.89 GB',
        'custodian': 'FSL Kalina Cyber Forensic Lab',
        'bsaCert': 'BSA-63-FSL-2024-8841',
        'status': 'VALID',
        'resultText': 'MATCH (VERIFIED IMMUTABLE)',
        'genesisHash': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'currentHash': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'history': [
            '2024-08-14 04:00:00: SEIZURE_AND_FARADAY_BAG by Insp. Vikramaditya Rao. Seized from Vikram Malhotra.',
            '2024-08-14 11:30:00: FORENSIC_IMAGING_E01 by Scientific Officer V. Kulkarni on Tableau TD3.',
            '2024-08-25 10:15:00: PERIODIC_SHA256_VERIFICATION by M6 Evidence Daemon. Checksum MATCH confirmed.'
        ],
        'evidentiaryInfo': [
            'Full bitstream hash verified against genesis ledger record.',
            'Cryptographic certificate signed with FSL RSA-4096 private key.',
            'Admissible as Primary Electronic Record under BSA Section 63.'
        ]
    },
    {
        'id': 'EVD-2024-0813',
        'name': 'Certified Bank Ledger: HDFC Account 9921-4820',
        'type': 'Certified Electronic Financial Document',
        'category': 'Bank Statement Ledger',
        'size': '4.21 MB',
        'custodian': 'CID Economic Intelligence Unit Locker',
        'bsaCert': 'BSA-63-BNK-2024-1102',
        'status': 'VALID',
        'resultText': 'MATCH (VERIFIED IMMUTABLE)',
        'genesisHash': '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
        'currentHash': '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
        'history': [
            '2024-08-15 14:00:00: BANK_SUBPOENA_COLLECTION by SI Priyanka Sen via certified digital token.',
            '2024-08-25 10:15:00: PERIODIC_SHA256_VERIFICATION by M6 Evidence Daemon. Checksum MATCH confirmed.'
        ],
        'evidentiaryInfo': [
            'Bank compliance digital signature verified under BSA Section 63.',
            'Contains authenticated NEFT debit wire record TXN-90214.',
            'Court admissible certified documentary evidence.'
        ]
    },
    {
        'id': 'EVD-2024-0814',
        'name': 'Tampered CDR Audit File (Demonstration of Mismatch Alert)',
        'type': 'Telecom Carrier CDR Ingestion File',
        'category': 'Carrier Dump Audit Record',
        'size': '1.84 MB',
        'custodian': 'Sub-Inspector Desk Terminal (Under Integrity Audit)',
        'bsaCert': 'BSA-63-TEL-2024-0091',
        'status': 'REVOKED',
        'resultText': 'MISMATCH (TAMPER ALERT DETECTED)',
        'genesisHash': 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        'currentHash': 'f9e8d7c6b5a403928172635443322110ffeeddccbbaa99887766554433221100',
        'history': [
            '2024-08-16 09:00:00: INITIAL_INGESTION by Insp. Vikramaditya Rao. Genesis hash recorded.',
            '2024-08-24 16:30:00: HASH_MISMATCH_TRIGGERED by M6 Evidence Daemon. Current hash differs from Genesis Hash. Byte alteration detected!'
        ],
        'evidentiaryInfo': [
            'File quarantined from formal court evidence bundle.',
            'Internal audit incident logged under LOG-SEC-TAMPER-0814.',
            'Sub-Inspector terminal disconnected from network pending forensic review.'
        ]
    }
]


DEMO_CASES.extend([
    {
        'caseId': 'CASE-VIDEO-001',
        'caseNumber': 'CASE-VIDEO-001',
        'title': 'Operation Golden Fleece - Financial Syndicate',
        'description': 'Massive money laundering operation spanning multiple offshore shell companies.',
        'assignedInvestigator': 'Inspector Sharma',
        'leadInvestigator': 'Inspector Sharma',
        'assignedTeam': 'Financial Crimes Unit',
        'status': 'active',
        'priority': 'critical',
        'policeStation': 'Cyber Cell HQ',
        'jurisdiction': 'National',
        'executiveSummary': 'Demo Case 1',
        'entityCount': 200,
        'relationshipCount': 150,
        'evidenceCount': 2,
        'reportCount': 1,
        'accessClassification': 'RESTRICTED',
        'associatedFIRs': ['F1001'],
        'createdAt': '2026-01-01T00:00:00Z',
        'updatedAt': '2026-01-01T00:00:00Z'
    },
    {
        'caseId': 'CASE-VIDEO-002',
        'caseNumber': 'CASE-VIDEO-002',
        'title': 'Operation White Dust - Narcotics Ring',
        'description': 'Multi-state drug trafficking ring using domestic courier services.',
        'assignedInvestigator': 'Officer Reddy',
        'leadInvestigator': 'Officer Reddy',
        'assignedTeam': 'Narcotics Control',
        'status': 'active',
        'priority': 'high',
        'policeStation': 'Cyber Cell HQ',
        'jurisdiction': 'National',
        'executiveSummary': 'Demo Case 2',
        'entityCount': 200,
        'relationshipCount': 150,
        'evidenceCount': 2,
        'reportCount': 1,
        'accessClassification': 'RESTRICTED',
        'associatedFIRs': ['F1002'],
        'createdAt': '2026-01-01T00:00:00Z',
        'updatedAt': '2026-01-01T00:00:00Z'
    },
    {
        'caseId': 'CASE-VIDEO-003',
        'caseNumber': 'CASE-VIDEO-003',
        'title': 'Operation Phishnet - Cyber Fraud',
        'description': 'Organized cyber fraud targeting elderly citizens.',
        'assignedInvestigator': 'Inspector Khan',
        'leadInvestigator': 'Inspector Khan',
        'assignedTeam': 'Cyber Crimes Unit',
        'status': 'active',
        'priority': 'high',
        'policeStation': 'Cyber Cell HQ',
        'jurisdiction': 'National',
        'executiveSummary': 'Demo Case 3',
        'entityCount': 200,
        'relationshipCount': 150,
        'evidenceCount': 2,
        'reportCount': 1,
        'accessClassification': 'RESTRICTED',
        'associatedFIRs': ['F1003'],
        'createdAt': '2026-01-01T00:00:00Z',
        'updatedAt': '2026-01-01T00:00:00Z'
    },
    {
        'caseId': 'CASE-VIDEO-004',
        'caseNumber': 'CASE-VIDEO-004',
        'title': 'Operation Iron Shield - Human Trafficking',
        'description': 'Cross-border human trafficking and exploitation ring.',
        'assignedInvestigator': 'Officer Patel',
        'leadInvestigator': 'Officer Patel',
        'assignedTeam': 'Human Trafficking Task Force',
        'status': 'active',
        'priority': 'critical',
        'policeStation': 'Cyber Cell HQ',
        'jurisdiction': 'National',
        'executiveSummary': 'Demo Case 4',
        'entityCount': 200,
        'relationshipCount': 150,
        'evidenceCount': 2,
        'reportCount': 1,
        'accessClassification': 'RESTRICTED',
        'associatedFIRs': ['F1004'],
        'createdAt': '2026-01-01T00:00:00Z',
        'updatedAt': '2026-01-01T00:00:00Z'
    }
])


# STANDARDIZED EVIDENCE CATALOG FOR ALL 5 ACTIVE CASES
ALL_CASE_EVIDENCE: List[Dict[str, Any]] = [
    # 1. CASE-2025-M3-DATASET (Operation Falcon Web)
    {
        'id': 'EVD-2025-M3-01',
        'entityType': 'Evidence',
        'evidenceCode': 'EVD-2025-M3-01',
        'title': 'Seized Primary Mobile Handset (Samsung S23 Ultra) - Bitstream Extraction',
        'canonicalName': 'Seized Primary Mobile Handset (Samsung S23 Ultra) - Bitstream Extraction',
        'evidenceNumber': 'EVD-2025-M3-01',
        'evidenceType': 'Digital Forensic Image',
        'category': 'Digital Forensic Image',
        'caseId': 'CASE-2025-M3-DATASET',
        'case_id': 'CASE-2025-M3-DATASET',
        'caseTitle': 'Operation Falcon Web - National Contraband & Communications Syndicate',
        'seizureDate': '2025-01-14 04:00:00',
        'collectedDate': '2025-01-14T04:00:00Z',
        'seizingOfficer': 'Inspector Vikramaditya Rao (LEO-7729)',
        'collectedBy': 'Inspector Vikramaditya Rao (LEO-7729)',
        'custodian': 'FSL Cyber Vault, Locker #08',
        'storageLocation': 'FSL Cyber Vault, Locker #08',
        'fileSizeBytes': 14891240000,
        'sha256Hash': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'originalHashSHA256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'currentHashSHA256': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'integrityStatus': 'MATCH',
        'lastVerifiedAt': '2025-01-20 10:15:00',
        'verifiedBy': 'M6 Automated SHA-256 Ledger Node',
        'chainOfCustody': [
            {'timestamp': '2025-01-14 04:00:00', 'action': 'SEIZURE_FARADAY_LOCK', 'officer': 'Insp. Vikramaditya Rao', 'notes': 'Seized from prime suspect P00001. Enclosed in RF-shielded evidence pouch.'},
            {'timestamp': '2025-01-14 11:30:00', 'action': 'TABLEAU_PHYSICAL_IMAGING', 'officer': 'Scientific Officer V. Kulkarni', 'notes': 'RAW bitstream dump verified via cryptographic hashing.'},
            {'timestamp': '2025-01-20 10:15:00', 'action': 'PERIODIC_AUDIT', 'officer': 'M6 Security Daemon', 'notes': 'Hash audit confirmed 100% integrity.'}
        ],
        'bsaSection63Certificate': {
            'certificateId': 'BSA-63-FSL-2025-0811',
            'issuer': 'Central Forensic Science Laboratory, CBI / MHA',
            'hashAlgorithm': 'SHA-256',
            'signedAt': '2025-01-14 16:00:00',
            'status': 'VALID'
        },
        'bsaSection65BCertificateId': 'BSA-63-FSL-2025-0811',
        'associatedEntities': [
            {'entityId': 'P00001', 'entityType': 'Person', 'label': 'P00001 (Prime Suspect)'},
            {'entityId': 'C0000001', 'entityType': 'Call', 'label': 'Call C0000001'}
        ],
        'description': 'Bitstream physical forensic clone of target smartphone containing encrypted VoIP communications, coordinates, and contact records.',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': True, 'ledgerTimestamp': '2025-01-14T04:15:00Z'}
    },
    {
        'id': 'EVD-2025-M3-02',
        'entityType': 'Evidence',
        'evidenceCode': 'EVD-2025-M3-02',
        'title': 'Certified Core Banking Transaction Audit Dump - Acc #99214430',
        'canonicalName': 'Certified Core Banking Transaction Audit Dump - Acc #99214430',
        'evidenceNumber': 'EVD-2025-M3-02',
        'evidenceType': 'Bank Statement',
        'category': 'Bank Statement',
        'caseId': 'CASE-2025-M3-DATASET',
        'case_id': 'CASE-2025-M3-DATASET',
        'caseTitle': 'Operation Falcon Web - National Contraband & Communications Syndicate',
        'seizureDate': '2025-01-15 14:00:00',
        'collectedDate': '2025-01-15T14:00:00Z',
        'seizingOfficer': 'SI Priyanka Sen (CID EIU)',
        'collectedBy': 'SI Priyanka Sen (CID EIU)',
        'custodian': 'CID Economic Intelligence Locker',
        'storageLocation': 'CID Economic Intelligence Locker',
        'fileSizeBytes': 5219000,
        'sha256Hash': '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
        'originalHashSHA256': '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
        'currentHashSHA256': '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
        'integrityStatus': 'MATCH',
        'lastVerifiedAt': '2025-01-20 10:15:00',
        'verifiedBy': 'M6 Automated SHA-256 Ledger Node',
        'chainOfCustody': [
            {'timestamp': '2025-01-15 14:00:00', 'action': 'LEGAL_SUBPOENA_EXTRACTION', 'officer': 'SI Priyanka Sen', 'notes': 'Certified digital ledger extracted with digital signature.'}
        ],
        'bsaSection63Certificate': {
            'certificateId': 'BSA-63-BNK-2025-4421',
            'issuer': 'HDFC Bank Compliance Directorate',
            'hashAlgorithm': 'SHA-256',
            'signedAt': '2025-01-15 13:45:00',
            'status': 'VALID'
        },
        'bsaSection65BCertificateId': 'BSA-63-BNK-2025-4421',
        'associatedEntities': [
            {'entityId': 'T0000001', 'entityType': 'Transaction', 'label': 'Transaction T0000001 (INR 45,00,000)'},
            {'entityId': 'P00005', 'entityType': 'Person', 'label': 'P00005 (Beneficiary)'}
        ],
        'description': 'Certified banking ledger showing un-invoiced RTGS transfers between syndicate accounts without legitimate underlying trade documentation.',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': True}
    },
    {
        'id': 'EVD-2025-M3-03',
        'entityType': 'Evidence',
        'evidenceCode': 'EVD-2025-M3-03',
        'title': 'Tampered Telecom Tower Carrier Dump (Integrity Alert Demonstration)',
        'canonicalName': 'Tampered Telecom Tower Carrier Dump (Integrity Alert Demonstration)',
        'evidenceNumber': 'EVD-2025-M3-03',
        'evidenceType': 'CDR Dump',
        'category': 'CDR Dump',
        'caseId': 'CASE-2025-M3-DATASET',
        'case_id': 'CASE-2025-M3-DATASET',
        'caseTitle': 'Operation Falcon Web - National Contraband & Communications Syndicate',
        'seizureDate': '2025-01-16 09:00:00',
        'collectedDate': '2025-01-16T09:00:00Z',
        'seizingOfficer': 'Inspector Vikramaditya Rao',
        'collectedBy': 'Inspector Vikramaditya Rao',
        'custodian': 'Desk Terminal Quarantine Locker',
        'storageLocation': 'Desk Terminal Quarantine Locker',
        'fileSizeBytes': 2845000,
        'sha256Hash': 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        'originalHashSHA256': 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        'currentHashSHA256': 'f9e8d7c6b5a403928172635443322110ffeeddccbbaa99887766554433221100',
        'integrityStatus': 'MISMATCH',
        'lastVerifiedAt': '2025-01-20 10:15:00',
        'verifiedBy': 'M6 Automated SHA-256 Ledger Node',
        'chainOfCustody': [
            {'timestamp': '2025-01-16 09:00:00', 'action': 'INGEST_AND_HASH', 'officer': 'Insp. Vikramaditya Rao', 'notes': 'Genesis SHA-256 computed.'},
            {'timestamp': '2025-01-19 18:22:00', 'action': 'CHECKSUM_FAIL_ALERT', 'officer': 'M6 Evidence Daemon', 'notes': 'TAMPER ALERT: Live node hash mismatch detected! File marked compromised.'}
        ],
        'bsaSection63Certificate': {
            'certificateId': 'BSA-63-TEL-2025-0099',
            'issuer': 'Telecom Regulatory Carrier Audit Cell',
            'hashAlgorithm': 'SHA-256',
            'signedAt': '2025-01-16 08:30:00',
            'status': 'REVOKED'
        },
        'bsaSection65BCertificateId': 'BSA-63-TEL-2025-0099',
        'associatedEntities': [
            {'entityId': 'C0000004', 'entityType': 'Call', 'label': 'Call C0000004'}
        ],
        'description': 'Demonstration artifact showcasing CrimeNet AI automated tamper detection. Bitstream modifications trigger real-time integrity alerts.',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': False}
    },

    # 2. CASE-VIDEO-001 (Financial Syndicate)
    {
        'id': 'EVD-VIDEO-001',
        'entityType': 'Evidence',
        'evidenceCode': 'EVD-VIDEO-001',
        'title': 'Seized Shell Company Accounting Hard Drive (256GB RAW)',
        'canonicalName': 'Seized Shell Company Accounting Hard Drive (256GB RAW)',
        'evidenceNumber': 'EVD-VIDEO-001',
        'evidenceType': 'Digital Forensic Image',
        'category': 'Digital Forensic Image',
        'caseId': 'CASE-VIDEO-001',
        'case_id': 'CASE-VIDEO-001',
        'caseTitle': 'Operation Golden Fleece - Financial Syndicate',
        'seizureDate': '2026-01-05 10:00:00',
        'collectedDate': '2026-01-05T10:00:00Z',
        'seizingOfficer': 'DSP Ananya Sen (Economic Offences Wing)',
        'collectedBy': 'DSP Ananya Sen (Economic Offences Wing)',
        'custodian': 'State Cyber Forensic Lab 1',
        'storageLocation': 'State Cyber Forensic Lab 1, Rack 4',
        'fileSizeBytes': 256000000000,
        'sha256Hash': 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        'originalHashSHA256': 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        'currentHashSHA256': 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
        'integrityStatus': 'MATCH',
        'lastVerifiedAt': '2026-01-10 12:00:00',
        'verifiedBy': 'M6 Automated Integrity Daemon',
        'chainOfCustody': [
            {'timestamp': '2026-01-05 10:00:00', 'action': 'OFFICE_RAID_SEIZURE', 'officer': 'DSP Ananya Sen', 'notes': 'Seized from principal office safe under warrant.'},
            {'timestamp': '2026-01-05 15:30:00', 'action': 'FORENSIC_CLONING', 'officer': 'Forensic Examiner R. Nair', 'notes': 'Cloned to forensic image E01.'}
        ],
        'bsaSection63Certificate': {
            'certificateId': 'BSA-63-EOW-2026-0101',
            'issuer': 'Directorate of Forensic Science Services',
            'hashAlgorithm': 'SHA-256',
            'signedAt': '2026-01-05 16:00:00',
            'status': 'VALID'
        },
        'bsaSection65BCertificateId': 'BSA-63-EOW-2026-0101',
        'associatedEntities': [
            {'entityId': 'P00101_CASE-VIDEO-001', 'entityType': 'Person', 'label': 'Person_00101 (Syndicate Head)'}
        ],
        'description': 'Contains clandestine hawala reconciliation spreadsheets, offshore beneficiary accounts, and shell entity formation documents.',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': True}
    },
    {
        'id': 'EVD-VIDEO-001-B',
        'entityType': 'Evidence',
        'evidenceCode': 'EVD-VIDEO-001-B',
        'title': 'Certified Bank RTGS Inward Ledger - ICICI & Axis Feeder Accounts',
        'canonicalName': 'Certified Bank RTGS Inward Ledger - ICICI & Axis Feeder Accounts',
        'evidenceNumber': 'EVD-VIDEO-001-B',
        'evidenceType': 'Bank Statement',
        'category': 'Bank Statement',
        'caseId': 'CASE-VIDEO-001',
        'case_id': 'CASE-VIDEO-001',
        'caseTitle': 'Operation Golden Fleece - Financial Syndicate',
        'seizureDate': '2026-01-06 14:00:00',
        'collectedDate': '2026-01-06T14:00:00Z',
        'seizingOfficer': 'Inspector S. Roy',
        'collectedBy': 'Inspector S. Roy',
        'custodian': 'Court Evidence Vault, Mumbai',
        'storageLocation': 'Court Evidence Vault, Mumbai',
        'fileSizeBytes': 8420000,
        'sha256Hash': 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a',
        'originalHashSHA256': 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a',
        'currentHashSHA256': 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a',
        'integrityStatus': 'MATCH',
        'lastVerifiedAt': '2026-01-10 12:00:00',
        'verifiedBy': 'M6 Automated Integrity Daemon',
        'chainOfCustody': [
            {'timestamp': '2026-01-06 14:00:00', 'action': 'SUBPOENA_COLLECTION', 'officer': 'Insp. S. Roy', 'notes': 'Received from Nodal Compliance Officer.'}
        ],
        'bsaSection63Certificate': {
            'certificateId': 'BSA-63-BNK-2026-0102',
            'issuer': 'ICICI Bank Regulatory Affairs',
            'hashAlgorithm': 'SHA-256',
            'signedAt': '2026-01-06 15:30:00',
            'status': 'VALID'
        },
        'bsaSection65BCertificateId': 'BSA-63-BNK-2026-0102',
        'associatedEntities': [
            {'entityId': 'P00104_CASE-VIDEO-001', 'entityType': 'Person', 'label': 'Person_00104 (Account Holder)'}
        ],
        'description': 'Direct bank evidence proving INR 1.25 Crore smurfed across multiple bogus accounts in under 48 hours.',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': True}
    },

    # 3. CASE-VIDEO-002 (Narcotics Ring)
    {
        'id': 'EVD-VIDEO-002',
        'entityType': 'Evidence',
        'evidenceCode': 'EVD-VIDEO-002',
        'title': 'Intercepted Satellite Communications Voice Capture & Transcripts',
        'canonicalName': 'Intercepted Satellite Communications Voice Capture & Transcripts',
        'evidenceNumber': 'EVD-VIDEO-002',
        'evidenceType': 'Telecom Data',
        'category': 'CDR Dump',
        'caseId': 'CASE-VIDEO-002',
        'case_id': 'CASE-VIDEO-002',
        'caseTitle': 'Operation White Dust - Narcotics Ring',
        'seizureDate': '2026-01-07 02:30:00',
        'collectedDate': '2026-01-07T02:30:00Z',
        'seizingOfficer': 'Superintendent R. Patil (NCB / Special Cell)',
        'collectedBy': 'Superintendent R. Patil (NCB / Special Cell)',
        'custodian': 'Special Cell Evidence Repository',
        'storageLocation': 'Special Cell Evidence Repository',
        'fileSizeBytes': 45000000,
        'sha256Hash': 'c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b',
        'originalHashSHA256': 'c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b',
        'currentHashSHA256': 'c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b',
        'integrityStatus': 'MATCH',
        'lastVerifiedAt': '2026-01-10 12:00:00',
        'verifiedBy': 'M6 Automated Integrity Daemon',
        'chainOfCustody': [
            {'timestamp': '2026-01-07 02:30:00', 'action': 'WARRANT_INTERCEPT', 'officer': 'SP R. Patil', 'notes': 'Court-authorized interception log.'}
        ],
        'bsaSection63Certificate': {
            'certificateId': 'BSA-63-NCB-2026-0201',
            'issuer': 'Narcotics Control Bureau Cyber Wing',
            'hashAlgorithm': 'SHA-256',
            'signedAt': '2026-01-07 04:00:00',
            'status': 'VALID'
        },
        'bsaSection65BCertificateId': 'BSA-63-NCB-2026-0201',
        'associatedEntities': [
            {'entityId': 'P00201_CASE-VIDEO-002', 'entityType': 'Person', 'label': 'Person_00201 (Ring Leader)'}
        ],
        'description': 'Intercepted encrypted satellite phone recordings establishing coordinate handoffs for sea shipment.',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': True}
    },
    {
        'id': 'EVD-VIDEO-002-B',
        'entityType': 'Evidence',
        'evidenceCode': 'EVD-VIDEO-002-B',
        'title': 'Chemical Analysis Certificate & Laboratory Assay Report',
        'canonicalName': 'Chemical Analysis Certificate & Laboratory Assay Report',
        'evidenceNumber': 'EVD-VIDEO-002-B',
        'evidenceType': 'Seizure Memo',
        'category': 'Seized Physical Item',
        'caseId': 'CASE-VIDEO-002',
        'case_id': 'CASE-VIDEO-002',
        'caseTitle': 'Operation White Dust - Narcotics Ring',
        'seizureDate': '2026-01-07 11:00:00',
        'collectedDate': '2026-01-07T11:00:00Z',
        'seizingOfficer': 'Senior Analyst Dr. M. Joshi',
        'collectedBy': 'Senior Analyst Dr. M. Joshi',
        'custodian': 'Government Opium & Chemical Works Vault',
        'storageLocation': 'Government Opium & Chemical Works Vault',
        'fileSizeBytes': 1200000,
        'sha256Hash': 'd4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c',
        'originalHashSHA256': 'd4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c',
        'currentHashSHA256': 'd4e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c',
        'integrityStatus': 'MATCH',
        'lastVerifiedAt': '2026-01-10 12:00:00',
        'verifiedBy': 'M6 Automated Integrity Daemon',
        'chainOfCustody': [
            {'timestamp': '2026-01-07 11:00:00', 'action': 'CHEMICAL_TESTING', 'officer': 'Dr. M. Joshi', 'notes': 'Spectrometry confirmation completed.'}
        ],
        'bsaSection63Certificate': {
            'certificateId': 'BSA-63-FSL-2026-0202',
            'issuer': 'State Forensic Science Laboratory Chemical Wing',
            'hashAlgorithm': 'SHA-256',
            'signedAt': '2026-01-07 12:30:00',
            'status': 'VALID'
        },
        'bsaSection65BCertificateId': 'BSA-63-FSL-2026-0202',
        'associatedEntities': [
            {'entityId': 'P00204_CASE-VIDEO-002', 'entityType': 'Person', 'label': 'Person_00204 (Courier)'}
        ],
        'description': 'Certified forensic spectroscopy report confirming high-purity chemical composition under NDPS Act provisions.',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': True}
    },

    # 4. CASE-VIDEO-003 (Cyber Fraud)
    {
        'id': 'EVD-VIDEO-003',
        'entityType': 'Evidence',
        'evidenceCode': 'EVD-VIDEO-003',
        'title': 'C2 Cloud Server Memory Dump & Phishing Kit Source Code',
        'canonicalName': 'C2 Cloud Server Memory Dump & Phishing Kit Source Code',
        'evidenceNumber': 'EVD-VIDEO-003',
        'evidenceType': 'Server Logs',
        'category': 'Digital Forensic Image',
        'caseId': 'CASE-VIDEO-003',
        'case_id': 'CASE-VIDEO-003',
        'caseTitle': 'Operation Phishnet - Cyber Fraud',
        'seizureDate': '2026-01-08 03:00:00',
        'collectedDate': '2026-01-08T03:00:00Z',
        'seizingOfficer': 'Cyber Cell Inspector T. Deshmukh',
        'collectedBy': 'Cyber Cell Inspector T. Deshmukh',
        'custodian': 'National Cyber Crime Forensic Repository',
        'storageLocation': 'National Cyber Crime Forensic Repository',
        'fileSizeBytes': 6400000000,
        'sha256Hash': 'e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c4d',
        'originalHashSHA256': 'e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c4d',
        'currentHashSHA256': 'e5f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c4d',
        'integrityStatus': 'MATCH',
        'lastVerifiedAt': '2026-01-10 12:00:00',
        'verifiedBy': 'M6 Automated Integrity Daemon',
        'chainOfCustody': [
            {'timestamp': '2026-01-08 03:00:00', 'action': 'LIVE_VOLATILITY_CAPTURE', 'officer': 'Insp. T. Deshmukh', 'notes': 'Live RAM captured prior to host power-off.'}
        ],
        'bsaSection63Certificate': {
            'certificateId': 'BSA-63-CYBER-2026-0301',
            'issuer': 'CERT-In / I4C Forensic Division',
            'hashAlgorithm': 'SHA-256',
            'signedAt': '2026-01-08 05:00:00',
            'status': 'VALID'
        },
        'bsaSection65BCertificateId': 'BSA-63-CYBER-2026-0301',
        'associatedEntities': [
            {'entityId': 'P00301_CASE-VIDEO-003', 'entityType': 'Person', 'label': 'Person_00301 (Master Hacker)'}
        ],
        'description': 'RAM snapshot and source scripts proving automated redirection of OTP verification pages and fraudulent credential harvesting.',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': True}
    },

    # 5. CASE-VIDEO-004 (Human Trafficking)
    {
        'id': 'EVD-VIDEO-004',
        'entityType': 'Evidence',
        'evidenceCode': 'EVD-VIDEO-004',
        'title': 'Seized Safehouse Route Ledger & Counterfeit Visa Templates',
        'canonicalName': 'Seized Safehouse Route Ledger & Counterfeit Visa Templates',
        'evidenceNumber': 'EVD-VIDEO-004',
        'evidenceType': 'Document',
        'category': 'Seized Physical Item',
        'caseId': 'CASE-VIDEO-004',
        'case_id': 'CASE-VIDEO-004',
        'caseTitle': 'Operation Iron Shield - Human Trafficking',
        'seizureDate': '2026-01-09 18:30:00',
        'collectedDate': '2026-01-09T18:30:00Z',
        'seizingOfficer': 'ACP K. Mehra (Anti-Human Trafficking Unit)',
        'collectedBy': 'ACP K. Mehra (Anti-Human Trafficking Unit)',
        'custodian': 'AHTU Central Evidence Vault',
        'storageLocation': 'AHTU Central Evidence Vault',
        'fileSizeBytes': 18000000,
        'sha256Hash': 'f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c4d5e',
        'originalHashSHA256': 'f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c4d5e',
        'currentHashSHA256': 'f67890123456789abcdef0123456789abcdef0123456789abcdef01a2b3c4d5e',
        'integrityStatus': 'MATCH',
        'lastVerifiedAt': '2026-01-10 12:00:00',
        'verifiedBy': 'M6 Automated Integrity Daemon',
        'chainOfCustody': [
            {'timestamp': '2026-01-09 18:30:00', 'action': 'SAFEHOUSE_RAID', 'officer': 'ACP K. Mehra', 'notes': 'Discovered in concealed wall cavity.'}
        ],
        'bsaSection63Certificate': {
            'certificateId': 'BSA-63-AHTU-2026-0401',
            'issuer': 'State Crime Investigation Department',
            'hashAlgorithm': 'SHA-256',
            'signedAt': '2026-01-09 20:00:00',
            'status': 'VALID'
        },
        'bsaSection65BCertificateId': 'BSA-63-AHTU-2026-0401',
        'associatedEntities': [
            {'entityId': 'P00401_CASE-VIDEO-004', 'entityType': 'Person', 'label': 'Person_00401 (Logistics Handler)'}
        ],
        'description': 'Handwritten route itinerary and digital master files matching fake immigration clearance stamps and victim transport manifests.',
        'confidence': 1.0,
        'metadata': {'chainOfCustodyVerified': True}
    }
]

# Insert all case evidence into DEMO_ENTITIES
DEMO_ENTITIES.extend(ALL_CASE_EVIDENCE)

# DISCREPANCIES CATALOG
CASE_DISCREPANCIES: Dict[str, List[Dict[str, Any]]] = {
    'CASE-2025-M3-DATASET': [
        {
            'id': 'DISCREPANCY-M3-01',
            'caseId': 'CASE-2025-M3-DATASET',
            'title': 'Contradiction: Suspect Alibi Statement vs Telecom CDR Tower Triangulation',
            'status': 'DATA DISCREPANCY DETECTED',
            'conflictingField': 'Suspect Location at 2025-01-14 02:40 AM',
            'sourceA': {
                'sourceName': 'Accused Formal Statement (Case Diary Entry #14)',
                'documentRef': 'FIR Case Diary Entry #14-B',
                'timestamp': '2025-01-14 02:40:00',
                'recordedValue': 'Hotel Blue Diamond, Koregaon Park, Pune',
                'excerpt': '"I stayed at my hotel room in Pune from 11:00 PM and did not travel until morning."'
            },
            'sourceB': {
                'sourceName': 'Telecom CDR Tower Dump (BSA §63 Certified)',
                'documentRef': 'Carrier Audit Dump AIRTEL-CDR-20250114.csv',
                'timestamp': '2025-01-14 02:40:18',
                'recordedValue': 'Nhava Sheva Sector 4 Tower (Cell ID: 19402, 120km from Pune)',
                'excerpt': 'Subscriber handset pinged Sector 4 mast directly overlooking port container transit yard.'
            },
            'analyticalNotes': 'Suspect alibi statement is mathematically irreconcilable with the 120km geographic distance to Sector 4 cell tower.',
            'investigatorActions': [
                'Subpoena Hotel Blue Diamond CCTV footage and guest registry.',
                'Request LAC timing advance logs for 50-meter pinpoint radio positioning.',
                'Schedule formal confrontation interview with the accused.'
            ]
        },
        {
            'id': 'DISCREPANCY-M3-02',
            'caseId': 'CASE-2025-M3-DATASET',
            'title': 'Discrepancy: Shipping Cargo Declaration vs Physical Weighbridge Panchnama',
            'status': 'DATA DISCREPANCY DETECTED',
            'conflictingField': 'Declared Gross Consignment Weight',
            'sourceA': {
                'sourceName': 'Customs Electronic Import General Manifest (IGM #239104)',
                'documentRef': 'ICEGATE Electronic Manifest Filing',
                'timestamp': '2025-01-10 16:00:00',
                'recordedValue': 'HS Code 08041020: Fresh Dates, Gross Weight 18,200 kg',
                'excerpt': 'Declared cargo: 800 cartons of fresh fruit in refrigerated container.'
            },
            'sourceB': {
                'sourceName': 'Physical Port Weighbridge Receipt & Seizure Memo',
                'documentRef': 'Central Weighbridge Memo #WB-99120',
                'timestamp': '2025-01-14 03:00:00',
                'recordedValue': 'Gross Weight 19,450 kg (+1,250 kg surplus unmanifested cavity payload)',
                'excerpt': 'Physical gross weight exceeds declared documentation by 1,250 kg, confirming false ceiling concealment cavity.'
            },
            'analyticalNotes': 'Surplus weight confirms secondary unmanifested payload concealed within refrigeration structure.',
            'investigatorActions': [
                'Issue summons to container freight forwarder and clearing house agent.',
                'Secure weighbridge calibration certificate for court evidence ledger.'
            ]
        }
    ],
    'CASE-VIDEO-001': [
        {
            'id': 'DISCREPANCY-V1-01',
            'caseId': 'CASE-VIDEO-001',
            'title': 'Financial Mismatch: Declared Annual Income vs RTGS Hawala Inflow',
            'status': 'DATA DISCREPANCY DETECTED',
            'conflictingField': 'Account Beneficiary Turnover Legitimacy',
            'sourceA': {
                'sourceName': 'Income Tax Return (ITR-4 Filing AY 2025-26)',
                'documentRef': 'CBDT Electronic Tax Filing Portal',
                'timestamp': '2025-07-31 10:00:00',
                'recordedValue': 'Declared Gross Income: INR 3,60,000 / annum',
                'excerpt': 'Assessee declares modest freelance commission earnings.'
            },
            'sourceB': {
                'sourceName': 'HDFC Core Banking Ledger (BSA Certified)',
                'documentRef': 'Bank Statement HDFC-99214430',
                'timestamp': '2026-01-08 16:45:00',
                'recordedValue': 'Credit Turnover: INR 1,25,00,000 via multi-layered RTGS',
                'excerpt': 'Account received 18 high-velocity remittances followed by immediate outward RTGS dispersion.'
            },
            'analyticalNotes': 'Severe turnover mismatch (347x declared income) strongly corroborates mule account facilitation under PMLA §3.',
            'investigatorActions': [
                'Issue summons under PMLA Section 50 for personal appearance.',
                'Freeze beneficiary accounts via FIU-IND STR protocol.'
            ]
        }
    ],
    'CASE-VIDEO-002': [
        {
            'id': 'DISCREPANCY-V2-01',
            'caseId': 'CASE-VIDEO-002',
            'title': 'Vessel AIS Tracker Telemetry vs Harbour Master Log Entry',
            'status': 'DATA DISCREPANCY DETECTED',
            'conflictingField': 'Vessel Offshore Coordinates at Sea Berth',
            'sourceA': {
                'sourceName': 'Harbour Master Manual Check-in Register',
                'documentRef': 'Berth Log #BM-2026-09',
                'timestamp': '2026-01-07 01:15:00',
                'recordedValue': 'Stationary at Outer Anchorage Berth 3',
                'excerpt': 'Skipper logged vessel anchored with main propulsion disabled.'
            },
            'sourceB': {
                'sourceName': 'Coast Guard Radar & AIS Transponder Recording',
                'documentRef': 'ICG Coastal Surveillance Radar Tape #07',
                'timestamp': '2026-01-07 01:18:22',
                'recordedValue': 'Underway at 14 knots heading 240 degrees southwest',
                'excerpt': 'Target vessel rendezvoused with unflagged high-speed skiff at coordinates 18.91N 72.82E.'
            },
            'analyticalNotes': 'Direct radar confrontation invalidates manual harbour log entry, demonstrating intentional AIS falsification.',
            'investigatorActions': [
                'Impound vessel navigational chart plotter.',
                'Detain crew for formal statement recording under NDPS Section 67.'
            ]
        }
    ],
    'CASE-VIDEO-003': [
        {
            'id': 'DISCREPANCY-V3-01',
            'caseId': 'CASE-VIDEO-003',
            'title': 'Domain WHOIS Registrant vs TLS Certificate Server Origin',
            'status': 'DATA DISCREPANCY DETECTED',
            'conflictingField': 'Infrastructure Identity & Geolocation',
            'sourceA': {
                'sourceName': 'ICANN WHOIS Registration Record',
                'documentRef': 'Domain Registrar Filing: sbi-secure-portal.net',
                'timestamp': '2026-01-02 08:00:00',
                'recordedValue': 'Registrant: Ramesh Patel, Surat, Gujarat (Indian Resident)',
                'excerpt': 'Registered with dummy local KYC details.'
            },
            'sourceB': {
                'sourceName': 'BGP Route & Reverse DNS Telemetry',
                'documentRef': 'Cloudflare & AWS Ingress Traffic Analysis',
                'timestamp': '2026-01-08 03:12:00',
                'recordedValue': 'Origin IP: 185.220.101.42 (Anonymous Tor Exit Relay, Frankfurt)',
                'excerpt': 'All credential submissions routed to offshore Telegram Bot token via foreign reverse-proxy.'
            },
            'analyticalNotes': 'Proves synthetic identity was deployed for domain masking while command server operated abroad.',
            'investigatorActions': [
                'Issue MLAT request to foreign cloud provider.',
                'Subpoena domain registrar payment gateway transaction logs.'
            ]
        }
    ],
    'CASE-VIDEO-004': [
        {
            'id': 'DISCREPANCY-V4-01',
            'caseId': 'CASE-VIDEO-004',
            'title': 'Fastag Toll Booth Timestamp vs Transport Manifest Schedule',
            'status': 'DATA DISCREPANCY DETECTED',
            'conflictingField': 'Vehicle Route & Transit Timeline',
            'sourceA': {
                'sourceName': 'Commercial Transport Waybill',
                'documentRef': 'Consignment Waybill #TR-9902',
                'timestamp': '2026-01-09 14:00:00',
                'recordedValue': 'Intended Route: Mumbai to Surat via NH48',
                'excerpt': 'Goods carrier registered for scheduled agricultural equipment transport.'
            },
            'sourceB': {
                'sourceName': 'NHAI Fastag Toll Plaza Record',
                'documentRef': 'Khed Shivapur Toll Gate Camera 03',
                'timestamp': '2026-01-09 17:42:10',
                'recordedValue': 'Diverted South: Pune-Bangalore Corridor (NH4)',
                'excerpt': 'Vehicle crossed toll heading towards isolated rural safehouse cluster, contrary to manifest.'
            },
            'analyticalNotes': 'Unauthorized route diversion confirms intentional transit to secondary unmonitored drop point.',
            'investigatorActions': [
                'Alert regional police check-posts along NH4.',
                'Seize vehicle GPS tracker unit upon interception.'
            ]
        }
    ]
}

def get_case_discrepancies(case_id: str) -> List[Dict[str, Any]]:
    if case_id in CASE_DISCREPANCIES:
        return CASE_DISCREPANCIES[case_id]
    # Default to M3 dataset discrepancies if case not found
    return CASE_DISCREPANCIES.get('CASE-2025-M3-DATASET', [])


