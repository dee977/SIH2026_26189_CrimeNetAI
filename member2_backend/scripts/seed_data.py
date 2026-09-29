"""
Seed realistic investigation cases, entities, relationships, evidence,
alerts, and watchlist items in Supabase PostgreSQL (port 5432).
"""
import sys
import os
import hashlib
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models import (
    Base, CaseModel, UserProfileModel, CaseMembershipModel,
    EvidenceModel, AlertModel, WatchlistModel, IngestJobModel,
    EntityModel, RelationshipModel
)

def seed():
    print(f"Connecting to database via: {engine.url.render_as_string(hide_password=True)}")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Seeding Cases...")
        cases_data = [
            {
                "case_id": "CASE-2025-M3-DATASET",
                "case_number": "CASE-2025-M3-DATASET",
                "title": "Operation Falcon Web - National Contraband & Communications Syndicate",
                "description": "Centralized multi-state intelligence graph synthesized from CDR call logs, hawala accounts, and co-conspirator networks across Mumbai, Delhi, Pune, Ahmedabad, and Hyderabad.",
                "assigned_investigator": "Deputy Director Vikramaditya Rao (LEO-7729)",
                "assigned_team": "Special Intelligence Bureau Taskforce 4",
                "status": "active",
                "priority": "critical",
                "jurisdiction": "National Multi-State Cyber & Economic Zone",
                "police_station": "Central Intelligence Grid HQ, New Delhi"
            },
            {
                "case_id": "CASE-VIDEO-001",
                "case_number": "CASE-VIDEO-001",
                "title": "Operation Golden Fleece - Financial Syndicate",
                "description": "Multi-layer money laundering operation spanning offshore shell accounts, hawala conduits, and luxury asset liquidations across Mumbai and Dubai.",
                "assigned_investigator": "Inspector Rajesh Kumar (LEO-5521)",
                "assigned_team": "Economic Offences Wing, Unit 3",
                "status": "active",
                "priority": "critical",
                "jurisdiction": "Economic Offences Wing, Maharashtra",
                "police_station": "Cyber Cell HQ, Mumbai"
            },
            {
                "case_id": "CASE-VIDEO-002",
                "case_number": "CASE-VIDEO-002",
                "title": "Operation White Dust - Narcotics Ring",
                "description": "Multi-state coastal narcotics trafficking ring coordinating distribution via domestic express courier services and darknet dead drops.",
                "assigned_investigator": "Officer Reddy (LEO-3342)",
                "assigned_team": "Anti-Narcotics Task Force",
                "status": "active",
                "priority": "high",
                "jurisdiction": "Western Coastal Narcotics Control Zone",
                "police_station": "Narcotics Enforcement Wing, Goa"
            },
            {
                "case_id": "CASE-VIDEO-003",
                "case_number": "CASE-VIDEO-003",
                "title": "Operation Phishnet - Transnational Cyber Fraud",
                "description": "Syndicate operating illegal VoIP gateways, fake utility bill call centers, and coordinated mule accounts across Noida, Kolkata, and Jamtara.",
                "assigned_investigator": "SI Priyanka Sen (LEO-8812)",
                "assigned_team": "Cyber Crime Division",
                "status": "active",
                "priority": "high",
                "jurisdiction": "National Cyber Crime Coordination Centre",
                "police_station": "State Cyber Police Station, Pune"
            },
            {
                "case_id": "CASE-VIDEO-004",
                "case_number": "CASE-VIDEO-004",
                "title": "Operation Iron Shield - Cross-Border Smuggling Network",
                "description": "Cross-border contraband syndicate smuggling high-value electronics, gold bars, and restricted wildlife commodities.",
                "assigned_investigator": "Officer Patel (LEO-4419)",
                "assigned_team": "Frontier Anti-Smuggling Bureau",
                "status": "active",
                "priority": "medium",
                "jurisdiction": "Eastern Frontier Security Grid",
                "police_station": "Border Anti-Trafficking Unit, Kolkata"
            },
            {
                "case_id": "CASE-2026-DELHI-001",
                "case_number": "CASE-2026-DELHI-001",
                "title": "Operation Shadow Grid - Hawala Remittance & Document Forgery",
                "description": "Investigating high-value RTGS conduits and forged import invoices channeled through Chandni Chowk diamond traders.",
                "assigned_investigator": "ACP Amit Verma (LEO-9901)",
                "assigned_team": "Special Cell Intelligence Unit",
                "status": "active",
                "priority": "high",
                "jurisdiction": "Delhi & NCR Financial Crime Zone",
                "police_station": "Special Cell Lodhi Colony, New Delhi"
            }
        ]

        for c_data in cases_data:
            existing = db.query(CaseModel).filter(CaseModel.case_id == c_data["case_id"]).first()
            if not existing:
                db.add(CaseModel(**c_data))
            else:
                for k, v in c_data.items():
                    setattr(existing, k, v)
        db.commit()

        # Seed Entities
        print("Seeding Normalized Entities (Persons, Phones, Accounts, Vehicles, Locations, Orgs, FIRs, Crimes)...")
        entities_data = [
            # Persons
            {"entity_id": "ENT-PERS-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Person", "canonical_name": "Vikram Malhotra", "properties": {"fullName": "Vikram Malhotra", "role": "Syndicate Kingpin", "alias": "The Architect", "city": "Mumbai", "riskScore": "0.98", "address": "Altamount Road, Mumbai"}},
            {"entity_id": "ENT-PERS-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Person", "canonical_name": "Haji Salim", "properties": {"fullName": "Haji Salim", "role": "Logistics Coordinator", "alias": "Port Master", "city": "Dubai", "riskScore": "0.94", "address": "Deira Creek, Dubai"}},
            {"entity_id": "ENT-PERS-003", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Person", "canonical_name": "Farooq Merchant", "properties": {"fullName": "Farooq Merchant", "role": "Hawala Operator", "alias": "Merchant Bhai", "city": "Surat", "riskScore": "0.89", "address": "Ring Road, Surat"}},
            {"entity_id": "ENT-PERS-004", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Person", "canonical_name": "Anita Saxena", "properties": {"fullName": "Anita Saxena", "role": "Shell Company Director", "alias": "Corporate Proxy", "city": "New Delhi", "riskScore": "0.75", "address": "Barakhamba Road, New Delhi"}},
            {"entity_id": "ENT-PERS-005", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Person", "canonical_name": "Tariq Butt", "properties": {"fullName": "Tariq Butt", "role": "Courier Supervisor", "alias": "Shadow Courier", "city": "Pune", "riskScore": "0.82", "address": "Koregaon Park, Pune"}},
            {"entity_id": "ENT-PERS-006", "case_id": "CASE-VIDEO-001", "entity_type": "Person", "canonical_name": "Rajesh Singhania", "properties": {"fullName": "Rajesh Singhania", "role": "Crypto Cashout Agent", "alias": "Singhania", "city": "Mumbai", "riskScore": "0.88", "address": "Bandra Kurla Complex, Mumbai"}},
            {"entity_id": "ENT-PERS-007", "case_id": "CASE-VIDEO-001", "entity_type": "Person", "canonical_name": "Kavita Nair", "properties": {"fullName": "Kavita Nair", "role": "Offshore Account Holder", "alias": "Kavita N", "city": "Bengaluru", "riskScore": "0.71", "address": "Indiranagar, Bengaluru"}},
            {"entity_id": "ENT-PERS-008", "case_id": "CASE-VIDEO-002", "entity_type": "Person", "canonical_name": "Carlos Mendes", "properties": {"fullName": "Carlos Mendes", "role": "Coastal Dispatcher", "alias": "Goa Carlos", "city": "Panaji", "riskScore": "0.91", "address": "Candolim Beach Road, Goa"}},
            {"entity_id": "ENT-PERS-009", "case_id": "CASE-VIDEO-003", "entity_type": "Person", "canonical_name": "Deepak Chouhan", "properties": {"fullName": "Deepak Chouhan", "role": "VoIP Server Admin", "alias": "Admin D", "city": "Noida", "riskScore": "0.85", "address": "Sector 62, Noida"}},
            {"entity_id": "ENT-PERS-010", "case_id": "CASE-VIDEO-004", "entity_type": "Person", "canonical_name": "Subir Mondal", "properties": {"fullName": "Subir Mondal", "role": "Border Transit Agent", "alias": "Subir Da", "city": "Kolkata", "riskScore": "0.83", "address": "Salt Lake Sector V, Kolkata"}},
            
            # Phones
            {"entity_id": "ENT-PHON-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Phone", "canonical_name": "+91-9820011223", "properties": {"phoneNumber": "+91-9820011223", "carrier": "Airtel India", "subscriberName": "Vikram Malhotra", "imsi": "404450123456789", "imei": "864201041234567"}},
            {"entity_id": "ENT-PHON-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Phone", "canonical_name": "+971-50-9876543", "properties": {"phoneNumber": "+971-50-9876543", "carrier": "Etisalat UAE", "subscriberName": "Haji Salim", "imsi": "424020987654321", "imei": "358920049876543"}},
            {"entity_id": "ENT-PHON-003", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Phone", "canonical_name": "+91-9876543210", "properties": {"phoneNumber": "+91-9876543210", "carrier": "Jio Infocomm", "subscriberName": "Farooq Merchant", "imsi": "405850987654321", "imei": "869101039876543"}},
            {"entity_id": "ENT-PHON-004", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Phone", "canonical_name": "+91-9123456780", "properties": {"phoneNumber": "+91-9123456780", "carrier": "Vodafone Idea", "subscriberName": "Anita Saxena", "imsi": "404200112233445", "imei": "352341051122334"}},
            {"entity_id": "ENT-PHON-005", "case_id": "CASE-VIDEO-001", "entity_type": "Phone", "canonical_name": "+91-9988776655", "properties": {"phoneNumber": "+91-9988776655", "carrier": "Airtel India", "subscriberName": "Rajesh Singhania", "imsi": "404450998877665", "imei": "864201099887766"}},
            {"entity_id": "ENT-PHON-006", "case_id": "CASE-VIDEO-002", "entity_type": "Phone", "canonical_name": "+91-8877665544", "properties": {"phoneNumber": "+91-8877665544", "carrier": "BSNL Goa", "subscriberName": "Carlos Mendes", "imsi": "404510887766554", "imei": "358920088776655"}},

            # Bank Accounts
            {"entity_id": "ENT-BANK-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "BankAccount", "canonical_name": "ACC-HDFC-991203", "properties": {"accountNumber": "ACC-HDFC-991203", "bankName": "HDFC Bank", "branch": "Fort Branch, Mumbai", "accountHolder": "Shadow Logistics FZE Pvt Ltd", "balance": "4,52,00,000 INR"}},
            {"entity_id": "ENT-BANK-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "BankAccount", "canonical_name": "ACC-ICICI-441092", "properties": {"accountNumber": "ACC-ICICI-441092", "bankName": "ICICI Bank", "branch": "Ring Road Branch, Surat", "accountHolder": "Star Diamond Exporters LLP", "balance": "1,85,50,000 INR"}},
            {"entity_id": "ENT-BANK-003", "case_id": "CASE-2025-M3-DATASET", "entity_type": "BankAccount", "canonical_name": "ACC-SBI-109238", "properties": {"accountNumber": "ACC-SBI-109238", "bankName": "State Bank of India", "branch": "Parliament Street, New Delhi", "accountHolder": "Apex Trading Enterprises", "balance": "78,20,000 INR"}},
            {"entity_id": "ENT-BANK-004", "case_id": "CASE-VIDEO-001", "entity_type": "BankAccount", "canonical_name": "ACC-AXIS-778811", "properties": {"accountNumber": "ACC-AXIS-778811", "bankName": "Axis Bank", "branch": "BKC Branch, Mumbai", "accountHolder": "Singhania Financial Trust", "balance": "2,10,00,000 INR"}},
            {"entity_id": "ENT-BANK-005", "case_id": "CASE-VIDEO-001", "entity_type": "BankAccount", "canonical_name": "ACC-ENBD-332190", "properties": {"accountNumber": "ACC-ENBD-332190", "bankName": "Emirates NBD", "branch": "Business Bay, Dubai", "accountHolder": "Al-Noor Horizon FZE", "balance": "3,40,000 AED"}},

            # Vehicles
            {"entity_id": "ENT-VEH-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Vehicle", "canonical_name": "MH-04-AB-1234", "properties": {"registrationNumber": "MH-04-AB-1234", "make": "Toyota Fortuner", "color": "Pearl White", "registeredOwner": "Vikram Malhotra", "fastagTolls": "Vashi Toll Plaza, Kharghar Toll"}},
            {"entity_id": "ENT-VEH-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Vehicle", "canonical_name": "GJ-06-CD-9012", "properties": {"registrationNumber": "GJ-06-CD-9012", "make": "Mahindra Scorpio", "color": "Black", "registeredOwner": "Farooq Merchant", "fastagTolls": "Surat-Kamrej Expressway Toll"}},
            {"entity_id": "ENT-VEH-003", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Vehicle", "canonical_name": "DL-01-XY-5678", "properties": {"registrationNumber": "DL-01-XY-5678", "make": "Mercedes-Benz E-Class", "color": "Silver", "registeredOwner": "Anita Saxena", "fastagTolls": "DND Flyway, Kherki Daula"}},
            {"entity_id": "ENT-VEH-004", "case_id": "CASE-VIDEO-002", "entity_type": "Vehicle", "canonical_name": "GA-07-JK-3344", "properties": {"registrationNumber": "GA-07-JK-3344", "make": "Isuzu D-Max Cargo", "color": "Navy Blue", "registeredOwner": "Carlos Mendes", "fastagTolls": "Kollam Checkpost, Anmod Ghat"}},

            # Locations
            {"entity_id": "ENT-LOC-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Location", "canonical_name": "Nhava Sheva Port Terminal 2", "properties": {"locationName": "Nhava Sheva Port Terminal 2", "city": "Navi Mumbai", "coordinates": "18.9500, 72.9500", "state": "Maharashtra", "type": "Sea Port Facility"}},
            {"entity_id": "ENT-LOC-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Location", "canonical_name": "Surat Diamond Bourse", "properties": {"locationName": "Surat Diamond Bourse", "city": "Surat", "coordinates": "21.1702, 72.8311", "state": "Gujarat", "type": "Commercial Trading Hub"}},
            {"entity_id": "ENT-LOC-003", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Location", "canonical_name": "Chandni Chowk Bullion Market", "properties": {"locationName": "Chandni Chowk Bullion Market", "city": "Old Delhi", "coordinates": "28.6506, 77.2303", "state": "Delhi", "type": "Hawala Remittance Node"}},
            {"entity_id": "ENT-LOC-004", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Location", "canonical_name": "Dubai Creek Gold Souk", "properties": {"locationName": "Dubai Creek Gold Souk", "city": "Dubai", "coordinates": "25.2697, 55.2971", "country": "UAE", "type": "International Transit Hub"}},
            {"entity_id": "ENT-LOC-005", "case_id": "CASE-VIDEO-002", "entity_type": "Location", "canonical_name": "Mormugao Port Pier 4", "properties": {"locationName": "Mormugao Port Pier 4", "city": "Goa", "coordinates": "15.4167, 73.8000", "state": "Goa", "type": "Coastal Pier"}},

            # Organizations
            {"entity_id": "ENT-ORG-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Organization", "canonical_name": "Shadow Logistics FZE", "properties": {"orgName": "Shadow Logistics FZE", "registrationNumber": "FZE-RAK-88129", "jurisdiction": "Ras Al Khaimah / Mumbai", "director": "Vikram Malhotra", "industry": "Maritime Freight & Forwarding"}},
            {"entity_id": "ENT-ORG-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Organization", "canonical_name": "Star Diamond Exporters LLP", "properties": {"orgName": "Star Diamond Exporters LLP", "registrationNumber": "LLP-GUJ-44910", "jurisdiction": "Surat, Gujarat", "director": "Farooq Merchant", "industry": "Precious Gem Trade"}},
            {"entity_id": "ENT-ORG-003", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Organization", "canonical_name": "Apex Trading Enterprises", "properties": {"orgName": "Apex Trading Enterprises", "registrationNumber": "ROC-DEL-10293", "jurisdiction": "New Delhi", "director": "Anita Saxena", "industry": "Import / Export Shell"}},
            {"entity_id": "ENT-ORG-004", "case_id": "CASE-VIDEO-001", "entity_type": "Organization", "canonical_name": "Al-Noor Horizon FZE", "properties": {"orgName": "Al-Noor Horizon FZE", "registrationNumber": "DMCC-77192", "jurisdiction": "Dubai, UAE", "director": "Haji Salim", "industry": "Offshore Trade Intermediary"}},

            # FIRs
            {"entity_id": "ENT-FIR-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "FIR", "canonical_name": "FIR-2024-8841", "properties": {"firNumber": "FIR-2024-8841", "policeStation": "Nhava Sheva Port Police", "filingDate": "2024-03-10", "sections": "IPC 120B, 420; PMLA Sec 3 & 4", "incidentSummary": "Illicit high-value cargo clearance and fraudulent bill of lading."}},
            {"entity_id": "ENT-FIR-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "FIR", "canonical_name": "FIR-2025-0102", "properties": {"firNumber": "FIR-2025-0102", "policeStation": "Special Cell PS Lodhi Colony", "filingDate": "2025-01-14", "sections": "UAPA Sec 17, 18; IPC 489C", "incidentSummary": "Hawala routing of counterfeit high-denomination currency."}},
            {"entity_id": "ENT-FIR-003", "case_id": "CASE-VIDEO-001", "entity_type": "FIR", "canonical_name": "FIR-2025-FIN-088", "properties": {"firNumber": "FIR-2025-FIN-088", "policeStation": "Cyber Cell HQ, Mumbai", "filingDate": "2025-02-01", "sections": "IT Act 66D; IPC 409", "incidentSummary": "Systematic siphoning of commercial bank deposits to mule accounts."}},

            # Crimes
            {"entity_id": "ENT-CRIM-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Crime", "canonical_name": "Hawala Remittance Syndicate", "properties": {"crimeCode": "CR-HAWALA-01", "crimeCategory": "Organized Financial Crime", "severity": "High", "incidentDate": "2024-03-10", "description": "Unregistered parallel money transmission exceeding 50 Crore INR."}},
            {"entity_id": "ENT-CRIM-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Crime", "canonical_name": "Port Contraband Smuggling", "properties": {"crimeCode": "CR-SMUG-02", "crimeCategory": "Customs Violation & Contraband", "severity": "Critical", "incidentDate": "2024-03-12", "description": "Misdeclared containerized maritime freight routed through international transit."}},

            # Transactions
            {"entity_id": "ENT-TXN-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Transaction", "canonical_name": "TXN-RTGS-991823", "properties": {"transactionId": "TXN-RTGS-991823", "sourceAccount": "ACC-HDFC-991203", "destinationAccount": "ACC-ICICI-441092", "amount": 4500000.0, "currency": "INR", "method": "RTGS", "transactionDate": "2024-03-08"}},
            {"entity_id": "ENT-TXN-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Transaction", "canonical_name": "TXN-NEFT-882194", "properties": {"transactionId": "TXN-NEFT-882194", "sourceAccount": "ACC-ICICI-441092", "destinationAccount": "ACC-SBI-109238", "amount": 1500000.0, "currency": "INR", "method": "NEFT", "transactionDate": "2024-03-09"}},

            # Communications
            {"entity_id": "ENT-COMM-001", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Communication", "canonical_name": "COMM-CALL-0104", "properties": {"commId": "COMM-CALL-0104", "callerPhone": "+91-9820011223", "receiverPhone": "+971-50-9876543", "callType": "VoIP Encrypted", "durationSeconds": 482, "timestamp": "2024-03-10T01:04:00Z"}},
            {"entity_id": "ENT-COMM-002", "case_id": "CASE-2025-M3-DATASET", "entity_type": "Communication", "canonical_name": "COMM-CALL-0118", "properties": {"commId": "COMM-CALL-0118", "callerPhone": "+91-9820011223", "receiverPhone": "+91-9876543210", "callType": "Voice Cellular", "durationSeconds": 195, "timestamp": "2024-03-10T01:18:00Z"}}
        ]

        for ent in entities_data:
            existing = db.query(EntityModel).filter(EntityModel.entity_id == ent["entity_id"]).first()
            if not existing:
                db.add(EntityModel(**ent))
            else:
                for k, v in ent.items():
                    setattr(existing, k, v)
        db.commit()

        # Seed Relationships / Graph Edges
        print("Seeding Relationships / Graph Edges...")
        rel_data = [
            {"relationship_id": "REL-001", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-001", "target_id": "ENT-ORG-001", "relationship_type": "CONTROLS", "properties": {"role": "Managing Director", "shareholding": "74%"}},
            {"relationship_id": "REL-002", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-001", "target_id": "ENT-PHON-001", "relationship_type": "USES_DEVICE", "properties": {"verifiedBy": "Airtel CDR Subpoena"}},
            {"relationship_id": "REL-003", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-001", "target_id": "ENT-VEH-001", "relationship_type": "REGISTERED_OWNER", "properties": {"rtoOffice": "Thane RTO"}},
            {"relationship_id": "REL-004", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-001", "target_id": "ENT-PERS-002", "relationship_type": "COORDINATES_WITH", "properties": {"frequency": "Daily", "channel": "Encrypted VoIP"}},
            {"relationship_id": "REL-005", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-002", "target_id": "ENT-PHON-002", "relationship_type": "USES_DEVICE", "properties": {"network": "Etisalat International"}},
            {"relationship_id": "REL-006", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-002", "target_id": "ENT-LOC-004", "relationship_type": "BASED_AT", "properties": {"activity": "International Transit Hub"}},
            {"relationship_id": "REL-007", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-ORG-001", "target_id": "ENT-BANK-001", "relationship_type": "HOLDS_ACCOUNT", "properties": {"signatory": "Vikram Malhotra"}},
            {"relationship_id": "REL-008", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-ORG-001", "target_id": "ENT-LOC-001", "relationship_type": "OPERATES_FACILITY", "properties": {"leaseStatus": "Customs Bonded Warehouse"}},
            {"relationship_id": "REL-009", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-003", "target_id": "ENT-ORG-002", "relationship_type": "PARTNER", "properties": {"profitShare": "50%"}},
            {"relationship_id": "REL-010", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-003", "target_id": "ENT-PHON-003", "relationship_type": "USES_DEVICE", "properties": {"verifiedBy": "Tower CDR Match"}},
            {"relationship_id": "REL-011", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-ORG-002", "target_id": "ENT-BANK-002", "relationship_type": "HOLDS_ACCOUNT", "properties": {"accountType": "Current Account"}},
            {"relationship_id": "REL-012", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-ORG-002", "target_id": "ENT-LOC-002", "relationship_type": "LOCATED_AT", "properties": {"tower": "Tower D, Bourse"}},
            {"relationship_id": "REL-013", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-BANK-001", "target_id": "ENT-TXN-001", "relationship_type": "DEBITED_FOR", "properties": {"amount": "45,00,000 INR"}},
            {"relationship_id": "REL-014", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-TXN-001", "target_id": "ENT-BANK-002", "relationship_type": "CREDITED_TO", "properties": {"purpose": "Trade Advance Remittance"}},
            {"relationship_id": "REL-015", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-BANK-002", "target_id": "ENT-TXN-002", "relationship_type": "DEBITED_FOR", "properties": {"amount": "15,00,000 INR"}},
            {"relationship_id": "REL-016", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-TXN-002", "target_id": "ENT-BANK-003", "relationship_type": "CREDITED_TO", "properties": {"purpose": "Consultancy Settlement"}},
            {"relationship_id": "REL-017", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-004", "target_id": "ENT-ORG-003", "relationship_type": "DIRECTOR", "properties": {"appointmentDate": "2023-01-10"}},
            {"relationship_id": "REL-018", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-ORG-003", "target_id": "ENT-BANK-003", "relationship_type": "HOLDS_ACCOUNT", "properties": {"branch": "Parliament Street"}},
            {"relationship_id": "REL-019", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-ORG-003", "target_id": "ENT-LOC-003", "relationship_type": "REGISTERED_OFFICE", "properties": {"address": "Kucha Mahajani"}},
            {"relationship_id": "REL-020", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PERS-005", "target_id": "ENT-VEH-002", "relationship_type": "FREQUENT_DRIVER", "properties": {"tollMatches": 18}},
            {"relationship_id": "REL-021", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-VEH-002", "target_id": "ENT-LOC-001", "relationship_type": "INTERCEPTED_AT", "properties": {"timestamp": "2024-03-10T11:45:00Z"}},
            {"relationship_id": "REL-022", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PHON-001", "target_id": "ENT-COMM-001", "relationship_type": "CALLER", "properties": {"device": "iPhone 15 Pro"}},
            {"relationship_id": "REL-023", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-COMM-001", "target_id": "ENT-PHON-002", "relationship_type": "RECEIVER", "properties": {"cellTower": "Burjuman Metro Tower"}},
            {"relationship_id": "REL-024", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-PHON-001", "target_id": "ENT-COMM-002", "relationship_type": "CALLER", "properties": {"duration": "195s"}},
            {"relationship_id": "REL-025", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-COMM-002", "target_id": "ENT-PHON-003", "relationship_type": "RECEIVER", "properties": {"cellTower": "Navi Mumbai Central Tower"}},
            {"relationship_id": "REL-026", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-FIR-001", "target_id": "ENT-PERS-001", "relationship_type": "NAMES_ACCUSED", "properties": {"chargeStatus": "Named Kingpin"}},
            {"relationship_id": "REL-027", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-FIR-001", "target_id": "ENT-CRIM-001", "relationship_type": "INVESTIGATES_CRIME", "properties": {"predicateOffence": "Customs Act & PMLA"}},
            {"relationship_id": "REL-028", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-FIR-002", "target_id": "ENT-PERS-003", "relationship_type": "NAMES_ACCUSED", "properties": {"chargeStatus": "Under Lookout Notice"}},
            {"relationship_id": "REL-029", "case_id": "CASE-2025-M3-DATASET", "source_id": "ENT-FIR-002", "target_id": "ENT-CRIM-002", "relationship_type": "INVESTIGATES_CRIME", "properties": {"predicateOffence": "Hawala Trans-Shipment"}}
        ]

        for rel in rel_data:
            existing = db.query(RelationshipModel).filter(RelationshipModel.relationship_id == rel["relationship_id"]).first()
            if not existing:
                db.add(RelationshipModel(**rel))
            else:
                for k, v in rel.items():
                    setattr(existing, k, v)
        db.commit()

        # Seed Evidence Items
        print("Seeding Cryptographic Evidence Items...")
        evidence_data = [
            {
                "evidence_id": "EVD-2025-001",
                "case_id": "CASE-2025-M3-DATASET",
                "entity_type": "Evidence",
                "canonical_name": "Seized Encrypted Mobile Phone - Vikram Malhotra",
                "evidence_number": "EVD-MUM-2025-001",
                "evidence_type": "Digital Device",
                "description": "Apple iPhone 15 Pro recovered from cabin at Nhava Sheva Terminal. Physical state intact with active SIM.",
                "collected_date": "2025-01-15",
                "collected_by": "Inspector Rajesh Kumar (LEO-5521)",
                "storage_location": "CID Cyber Forensics Vault A-1",
                "sha256_hash": hashlib.sha256(b"iPhone15-Malhotra-Seized").hexdigest(),
                "bsa_certificate_id": "BSA-65B-EVD-2025-001",
                "confidence": "1.0",
                "metadata_json": {"imei": "864201041234567", "capacity": "256GB", "sealNumber": "SEAL-CID-8812"}
            },
            {
                "evidence_id": "EVD-2025-002",
                "case_id": "CASE-2025-M3-DATASET",
                "entity_type": "Evidence",
                "canonical_name": "Certified Bank Ledger & SWIFT MT103 Transcripts",
                "evidence_number": "EVD-MUM-2025-002",
                "evidence_type": "Financial Record",
                "description": "Certified section 65B bank account statement for ACC-HDFC-991203 with corresponding outward remittances.",
                "collected_date": "2025-01-18",
                "collected_by": "Inspector Sharma (LEO-5521)",
                "storage_location": "Economic Offences Vault C-4",
                "sha256_hash": hashlib.sha256(b"BankLedger-HDFC-Remittance").hexdigest(),
                "bsa_certificate_id": "BSA-65B-EVD-2025-002",
                "confidence": "1.0",
                "metadata_json": {"bank": "HDFC Bank", "pages": 142, "auditor": "Superintendent of Police Forensics"}
            },
            {
                "evidence_id": "EVD-2025-003",
                "case_id": "CASE-2025-M3-DATASET",
                "entity_type": "Evidence",
                "canonical_name": "CCTV Footage - Nhava Sheva Container Berth Exit Gate 3",
                "evidence_number": "EVD-MUM-2025-003",
                "evidence_type": "Video Footage",
                "description": "Continuous 4K CCTV video recording showing vehicle MH-04-AB-1234 departing bonded terminal at 01:22 AM.",
                "collected_date": "2025-01-20",
                "collected_by": "SI Priyanka Sen (LEO-8812)",
                "storage_location": "Digital Evidence Secure Server S-2",
                "sha256_hash": hashlib.sha256(b"CCTV-NhavaSheva-Gate3").hexdigest(),
                "bsa_certificate_id": "BSA-65B-EVD-2025-003",
                "confidence": "1.0",
                "metadata_json": {"cameraCode": "CAM-TERM2-G3", "duration": "04:30:00", "frameRate": "30fps"}
            }
        ]

        for ev in evidence_data:
            existing = db.query(EvidenceModel).filter(EvidenceModel.evidence_id == ev["evidence_id"]).first()
            if not existing:
                db.add(EvidenceModel(**ev))
            else:
                for k, v in ev.items():
                    setattr(existing, k, v)
        db.commit()

        # Seed Alerts
        print("Seeding System Alerts...")
        alerts_data = [
            {
                "alert_id": "ALT-2025-001",
                "case_id": "CASE-2025-M3-DATASET",
                "alert_type": "FINANCIAL_ANOMALY",
                "severity": "CRITICAL",
                "title": "Unexplained Foreign Inward Remittance Exceeding INR 50L",
                "description": "High-velocity RTGS transfer from Shadow Logistics to Star Diamond Exporters outside normal business hours.",
                "related_entity_id": "ENT-PERS-001",
                "related_entity_name": "Vikram Malhotra",
                "evidence_id": "EVD-2025-002",
                "status": "UNRESOLVED",
                "metadata_json": {"source": "FIU-IND Suspicious Transaction Feed"}
            },
            {
                "alert_id": "ALT-2025-002",
                "case_id": "CASE-2025-M3-DATASET",
                "alert_type": "TELECOM_INTERCEPT",
                "severity": "HIGH",
                "title": "Encrypted VoIP Call Intercept with UAE Node",
                "description": "SIM +91-9820011223 initiated late-night 482s VoIP session to known overseas coordinator Haji Salim (+971-50-9876543).",
                "related_entity_id": "ENT-PHON-001",
                "related_entity_name": "+91-9820011223",
                "evidence_id": "EVD-2025-001",
                "status": "UNRESOLVED",
                "metadata_json": {"tower": "Navi Mumbai Central Tower"}
            }
        ]

        for alt in alerts_data:
            existing = db.query(AlertModel).filter(AlertModel.alert_id == alt["alert_id"]).first()
            if not existing:
                db.add(AlertModel(**alt))
            else:
                for k, v in alt.items():
                    setattr(existing, k, v)
        db.commit()

        # Seed Watchlist
        print("Seeding Watchlist Items...")
        watchlist_data = [
            {
                "watch_id": "WCH-2025-001",
                "case_id": "CASE-2025-M3-DATASET",
                "entity_type": "Person",
                "identifier_value": "Vikram Malhotra",
                "canonical_name": "Vikram Malhotra",
                "reason": "Active Lookout Circular (LOC) issued by Bureau of Immigration. Priority coastal syndicate leader.",
                "priority": "CRITICAL",
                "added_by": "Deputy Director V. Rao",
                "is_active": True,
                "match_count": 5
            },
            {
                "watch_id": "WCH-2025-002",
                "case_id": "CASE-2025-M3-DATASET",
                "entity_type": "Vehicle",
                "identifier_value": "MH-04-AB-1234",
                "canonical_name": "Toyota Fortuner (MH-04-AB-1234)",
                "reason": "Vehicle linked to high-risk cash transit between Nhava Sheva and Surat.",
                "priority": "HIGH",
                "added_by": "Inspector Rajesh Kumar",
                "is_active": True,
                "match_count": 8
            }
        ]

        for w in watchlist_data:
            existing = db.query(WatchlistModel).filter(WatchlistModel.watch_id == w["watch_id"]).first()
            if not existing:
                db.add(WatchlistModel(**w))
            else:
                for k, v in w.items():
                    setattr(existing, k, v)
        db.commit()

        # Ensure user profiles exist & have case memberships
        print("Ensuring user permissions and Case Memberships...")
        users = db.query(UserProfileModel).all()
        cases = db.query(CaseModel).all()
        for u in users:
            for c in cases:
                m_exists = db.query(CaseMembershipModel).filter(
                    CaseMembershipModel.case_id == c.case_id,
                    CaseMembershipModel.user_email.ilike(u.email)
                ).first()
                if not m_exists:
                    db.add(CaseMembershipModel(
                        case_id=c.case_id,
                        user_email=u.email,
                        membership_role="OWNER" if u.role == "ADMIN" else "MEMBER"
                    ))
        db.commit()

        print("\n[SUCCESS] Database seeding complete!")
        print(f"Total Cases: {db.query(CaseModel).count()}")
        print(f"Total Entities: {db.query(EntityModel).count()}")
        print(f"Total Relationships: {db.query(RelationshipModel).count()}")
        print(f"Total Evidence: {db.query(EvidenceModel).count()}")
        print(f"Total Alerts: {db.query(AlertModel).count()}")
        print(f"Total Watchlist Items: {db.query(WatchlistModel).count()}")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == '__main__':
    seed()
