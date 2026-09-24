from datetime import datetime, timezone
from typing import Any, Dict, List

# DEMO STORY CANONICAL DATASET (SIH26189)
# Chain: FIR -> Person A -> Phone -> Person B -> Bank Account -> Transaction -> Organization -> Location -> Crime

DEMO_CASES = [
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
