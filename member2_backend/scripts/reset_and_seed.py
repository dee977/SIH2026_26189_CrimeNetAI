"""
CrimeNet AI - Reset and Seed Database Script
Wipes all cases, entities, relationships, evidence, alerts, watchlist items,
timeline events, ingestion jobs, and case memberships in correct FK order.
Preserves user_profiles and auth users.
Seeds 10 complete, multi-modal investigation cases into Supabase PostgreSQL.
"""
import sys
import os
import hashlib
from datetime import datetime, timezone, timedelta

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models import (
    Base, CaseModel, UserProfileModel, CaseMembershipModel,
    EvidenceModel, AlertModel, WatchlistModel, IngestJobModel,
    EntityModel, RelationshipModel, CaseNoteModel, TimelineEventModel
)

def sha256_for(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def reset_database(db):
    print("=" * 60)
    print("PART A: SAFELY DELETING ALL EXISTING CASES & RELATED DATA")
    print("=" * 60)

    # Correct FK deletion order
    rel_count = db.query(RelationshipModel).delete()
    ev_count = db.query(EvidenceModel).delete()
    al_count = db.query(AlertModel).delete()
    wl_count = db.query(WatchlistModel).delete()
    tl_count = db.query(TimelineEventModel).delete()
    cn_count = db.query(CaseNoteModel).delete()
    ij_count = db.query(IngestJobModel).delete()
    ent_count = db.query(EntityModel).delete()
    cm_count = db.query(CaseMembershipModel).delete()
    case_count = db.query(CaseModel).delete()

    db.commit()

    print(f"Deleted {case_count} cases, {ent_count} entities, {rel_count} relationships, "
          f"{ev_count} evidence items, {al_count} alerts, {wl_count} watchlist items, "
          f"{tl_count} timeline events, {ij_count} ingestion jobs, {cm_count} memberships.")
    print("Authentication records and user_profiles preserved intact.")
    print("=" * 60)

def seed_cases(db):
    print("PART B: SEEDING EXACTLY 10 RICH, REALISTIC INVESTIGATION CASES")
    print("=" * 60)

    # Gather user emails from user_profiles to assign memberships
    existing_users = db.query(UserProfileModel.email).all()
    user_emails = [u[0] for u in existing_users]
    if not user_emails:
        user_emails = ["admin123@gov.in", "investigator123@gov.in", "analyst123@gov.in", "yakshvachhani1@gmail.com"]

    cases_spec = [
        # Case 1: Hawala & Money Mule
        {
            "case_id": "CASE-2026-HWL-001",
            "case_number": "FIR/EOW/2026/0411",
            "title": "Operation Golden Fleece - Hawala & Money Mule Syndicate",
            "description": "Multi-layer financial syndicate laundering ₹45 Crore through layered RTGS transactions, dummy corporate accounts, and cross-border hawala conduits.",
            "assigned_investigator": "Deputy Commissioner Rajeshwar Varma (LEO-5521)",
            "assigned_team": "EOW Financial Forensics Task Force",
            "status": "active",
            "priority": "critical",
            "jurisdiction": "Economic Offences Wing, Maharashtra",
            "police_station": "BKC Cyber & Financial Crime PS, Mumbai",
            "case_type": "Financial Crime & Hawala",
            "persons": [
                {"id": "P-HWL-01", "name": "Rajesh Singhania", "alias": "The Bull", "role": "Syndicate Kingpin", "phones": ["+91-9820011221"], "accounts": ["ACC-HDFC-992144"], "vehicles": ["MH-01-EA-1001"], "city": "Mumbai", "address": "Altamount Road, Cumballa Hill, Mumbai"},
                {"id": "P-HWL-02", "name": "Farooq Merchant", "alias": "Merchant Bhai", "role": "Hawala Settlement Banker", "phones": ["+91-9876543210"], "accounts": ["ACC-ICICI-882190"], "vehicles": ["GJ-05-BX-4420"], "city": "Surat", "address": "Ring Road Textile Market, Surat"},
                {"id": "P-HWL-03", "name": "Kavita Nair", "alias": "Corporate Proxy", "role": "Mule Recruiter & Shell Director", "phones": ["+91-9123456780"], "accounts": ["ACC-SBI-331902"], "vehicles": ["MH-02-CB-8812"], "city": "Mumbai", "address": "Lokhandwala Complex, Andheri West, Mumbai"},
                {"id": "P-HWL-04", "name": "Deepak Sethi", "alias": "Cash Runner", "role": "Courier Operative", "phones": ["+91-9988771122"], "accounts": ["ACC-AXIS-551209"], "vehicles": ["MH-04-DX-7711"], "city": "Thane", "address": "Ghodbunder Road, Thane West"},
            ],
            "phones": [
                {"id": "PH-HWL-01", "number": "+91-9820011221", "carrier": "Airtel", "imei": "864201041122001", "subscriber": "Rajesh Singhania"},
                {"id": "PH-HWL-02", "number": "+91-9876543210", "carrier": "Jio", "imei": "864201041122002", "subscriber": "Farooq Merchant"},
                {"id": "PH-HWL-03", "number": "+91-9123456780", "carrier": "Vodafone Idea", "imei": "864201041122003", "subscriber": "Kavita Nair"}
            ],
            "accounts": [
                {"id": "ACC-HDFC-992144", "number": "9921443011", "bank": "HDFC Bank", "holder": "Shadow Logistics FZE Ltd", "branch": "BKC Branch, Mumbai", "balance": "₹14,50,00,000"},
                {"id": "ACC-ICICI-882190", "number": "8821904512", "bank": "ICICI Bank", "holder": "Star Gem Exporters LLP", "branch": "Ring Road Branch, Surat", "balance": "₹8,25,00,000"},
                {"id": "ACC-SBI-331902", "number": "3319027814", "bank": "State Bank of India", "holder": "Apex Layering Corp", "branch": "Fort Branch, Mumbai", "balance": "₹3,40,00,000"}
            ],
            "vehicles": [
                {"id": "VEH-MH01-1001", "plate": "MH-01-EA-1001", "model": "Mercedes-Benz S-Class (Black)", "owner": "Rajesh Singhania", "chassis": "WDD2221771A091244"},
                {"id": "VEH-GJ05-4420", "plate": "GJ-05-BX-4420", "model": "Toyota Fortuner (White)", "owner": "Farooq Merchant", "chassis": "MBJ11BB41009821"}
            ],
            "locations": [
                {"id": "LOC-HWL-01", "name": "BKC Financial Core Hub", "lat": 19.0657, "lng": 72.8687, "city": "Mumbai", "address": "G Block, Bandra Kurla Complex, Mumbai, Maharashtra 400051"},
                {"id": "LOC-HWL-02", "name": "Surat Diamond Exchange Hub", "lat": 21.1702, "lng": 72.8311, "city": "Surat", "address": "Ring Road Textile Market, Surat, Gujarat 395002"}
            ],
            "organizations": [
                {"id": "ORG-HWL-01", "name": "Shadow Logistics FZE Ltd", "type": "Shell Company", "cin": "U74999MH2021PTC351234", "reg_address": "BKC Tower 3, Mumbai"}
            ],
            "firs": [
                {"id": "FIR-HWL-01", "number": "FIR/EOW/2026/0411", "station": "BKC Financial PS", "sections": "BNS §316, §318, PMLA §3/§4", "summary": "Layered hawala remittances and suspicious transaction volume exceeding statutory thresholds."}
            ],
            "crimes": [
                {"id": "CRM-HWL-01", "code": "CR-PMLA-01", "category": "Money Laundering", "desc": "Off-ledger token redemption and automated RTGS layering"}
            ],
            "transactions": [
                {"id": "TXN-HWL-01", "from": "ACC-HDFC-992144", "to": "ACC-ICICI-882190", "amount": 45000000, "date": "2026-02-14", "method": "RTGS"},
                {"id": "TXN-HWL-02", "from": "ACC-ICICI-882190", "to": "ACC-SBI-331902", "amount": 18500000, "date": "2026-02-15", "method": "RTGS"}
            ],
            "comms": [
                {"id": "COM-HWL-01", "caller": "+91-9820011221", "receiver": "+91-9876543210", "timestamp": "2026-02-14T10:15:00Z", "duration": 340, "tower": "BKC Cell Tower 4A"},
                {"id": "COM-HWL-02", "caller": "+91-9876543210", "receiver": "+91-9123456780", "timestamp": "2026-02-14T11:45:00Z", "duration": 180, "tower": "Surat Ring Road BTS"}
            ],
            "evidence": [
                {"id": "EVD-HWL-01", "title": "Core Banking CBS Statement Ledger.pdf", "type": "Financial Records", "sha": "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e", "cert": "BSA-63-2026-EVD-HWL-01", "officer": "Insp. Varma", "loc": "Vault 1-A"},
                {"id": "EVD-HWL-02", "title": "Hawala Token Ledger Encrypted Backup.dd", "type": "Digital Forensic Image", "sha": "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92", "cert": "BSA-63-2026-EVD-HWL-02", "officer": "Forensics Unit", "loc": "Digital Locker 3"}
            ],
            "timeline": [
                {"id": "EVT-HWL-01", "ts": "2026-02-14T09:30:00Z", "type": "FINANCIAL_TRANSACTION", "title": "Bulk RTGS Inflow (INR 4.5 Cr)", "desc": "Funds transferred from HDFC aggregator into Surat escrow account.", "p_id": "ACC-HDFC-992144", "p_name": "Shadow Logistics Account", "s_id": "ACC-ICICI-882190", "s_name": "Star Gem Exporters Account", "loc": "BKC Mumbai"},
                {"id": "EVT-HWL-02", "ts": "2026-02-14T10:15:00Z", "type": "COMMUNICATION", "title": "Encrypted Token Confirmation Call", "desc": "Voice call confirming hawala token delivery serial HWL-DXB-9912.", "p_id": "P-HWL-01", "p_name": "Rajesh Singhania", "s_id": "P-HWL-02", "s_name": "Farooq Merchant", "loc": "BKC Sector 4"},
                {"id": "EVT-HWL-03", "ts": "2026-02-15T14:00:00Z", "type": "CRIME_INCIDENT", "title": "EOW Search & Seizure Execution", "desc": "Concurrent search operations executed at Fort corporate office and Surat exchange.", "p_id": "P-HWL-01", "p_name": "Rajesh Singhania", "loc": "BKC Financial Core Hub"}
            ],
            "alerts": [
                {"id": "ALT-HWL-01", "type": "Unusual Transaction Pattern", "sev": "CRITICAL", "title": "High-Velocity Layered Fund Transfer Spike", "desc": "INR 4.5 Crore moved across 3 accounts in under 2 hours without underlying commercial invoice.", "entity_id": "ACC-HDFC-992144", "entity_name": "Shadow Logistics Account"},
                {"id": "ALT-HWL-02", "type": "Cross-source Contradiction", "sev": "HIGH", "title": "PAN Mismatch across Banking & Registrar Databases", "desc": "Kavita Nair KYC PAN does not match Ministry of Corporate Affairs director registry.", "entity_id": "P-HWL-03", "entity_name": "Kavita Nair"}
            ],
            "watchlist": [
                {"id": "WCH-HWL-01", "type": "Person", "val": "P-HWL-01", "name": "Rajesh Singhania", "reason": "Central hawala orchestrator under PMLA Section 3 surveillance.", "prio": "CRITICAL"},
                {"id": "WCH-HWL-02", "type": "BankAccount", "val": "ACC-HDFC-992144", "name": "Shadow Logistics FZE Ltd", "reason": "Flagged by FIU-IND STR report for suspicious velocity.", "prio": "HIGH"}
            ]
        },

        # Case 2: Cyber Fraud & Phishing Ring
        {
            "case_id": "CASE-2026-CYB-002",
            "case_number": "FIR/CYB/2026/0182",
            "title": "Operation PhishNet - Banking Trojan & OTP Bypass Syndicate",
            "description": "Transnational cyber ring deploying reverse-proxy phishing pages and automated SIM swaps to compromise high-net-worth bank accounts.",
            "assigned_investigator": "Assistant Commissioner Sunita Deshmukh (LEO-8812)",
            "assigned_team": "Special Operations Cyber Cell Unit 1",
            "status": "active",
            "priority": "critical",
            "jurisdiction": "Special Cell Cyber Crime, Delhi Police",
            "police_station": "Cyber Cell PS, Mandir Marg, New Delhi",
            "case_type": "Cybercrime & Financial Fraud",
            "persons": [
                {"id": "P-CYB-01", "name": "Deepak Chouhan", "alias": "CipherX", "role": "C2 Server Administrator", "phones": ["+91-9811023456"], "accounts": ["ACC-PAYTM-991200"], "vehicles": ["DL-3C-CC-4910"], "city": "Noida", "address": "Sector 62 IT Park, Noida, UP"},
                {"id": "P-CYB-02", "name": "Amit Mandal", "alias": "ScriptBoy", "role": "Phishing Kit Developer", "phones": ["+91-9711034567"], "accounts": ["ACC-KOTAK-102938"], "vehicles": ["JH-01-AF-2019"], "city": "Jamtara", "address": "Karma Road, Jamtara, Jharkhand"},
                {"id": "P-CYB-03", "name": "Pooja Sharma", "alias": "Mule Recruiter", "role": "Mule Account Coordinator", "phones": ["+91-9911045678"], "accounts": ["ACC-AXIS-992211"], "vehicles": ["DL-8S-AA-1122"], "city": "New Delhi", "address": "Rohini Sector 15, New Delhi"},
                {"id": "P-CYB-04", "name": "Suraj Paswan", "alias": "ATM Runner", "role": "Cash Extraction Agent", "phones": ["+91-9611056789"], "accounts": ["ACC-SBI-771122"], "vehicles": ["DL-1N-XY-9002"], "city": "New Delhi", "address": "Laxmi Nagar, East Delhi"}
            ],
            "phones": [
                {"id": "PH-CYB-01", "number": "+91-9811023456", "carrier": "Airtel Delhi", "imei": "860100051122331", "subscriber": "Deepak Chouhan"},
                {"id": "PH-CYB-02", "number": "+91-9711034567", "carrier": "Jio Bihar", "imei": "860100051122332", "subscriber": "Amit Mandal"}
            ],
            "accounts": [
                {"id": "ACC-PAYTM-991200", "number": "9912001122", "bank": "Paytm Payments Bank", "holder": "Deepak Tech Consultancies", "branch": "Noida Sector 62", "balance": "₹42,50,000"},
                {"id": "ACC-KOTAK-102938", "number": "1029384756", "bank": "Kotak Mahindra Bank", "holder": "Mandal Trading", "branch": "Dhanbad Branch", "balance": "₹18,20,000"}
            ],
            "vehicles": [
                {"id": "VEH-DL3C-4910", "plate": "DL-3C-CC-4910", "model": "Hyundai Creta (Dark Knight)", "owner": "Deepak Chouhan", "chassis": "MALH141BL009123"}
            ],
            "locations": [
                {"id": "LOC-CYB-01", "name": "Noida Sector 62 Cyber Hub", "lat": 28.6280, "lng": 77.3649, "city": "Noida", "address": "Electronic City, Sector 62, Noida, Uttar Pradesh 201309"},
                {"id": "LOC-CYB-02", "name": "Jamtara Operation Cell", "lat": 23.9629, "lng": 86.8021, "city": "Jamtara", "address": "Station Road, Jamtara, Jharkhand 815351"}
            ],
            "organizations": [
                {"id": "ORG-CYB-01", "name": "SecurePay Gateway Solutions", "type": "Fraudulent Domain/Entity", "cin": "N/A", "reg_address": "Virtual Cloud Proxy"}
            ],
            "firs": [
                {"id": "FIR-CYB-01", "number": "FIR/CYB/2026/0182", "station": "Cyber Cell Mandir Marg", "sections": "IT Act §66C, §66D, BNS §318", "summary": "Unauthorised access to banking infrastructure and identity theft through spoofed domains."}
            ],
            "crimes": [
                {"id": "CRM-CYB-01", "code": "CR-CYBER-01", "category": "Identity Theft & Banking Phishing", "desc": "Reverse proxy phishing mimicking nationalized bank portals"}
            ],
            "transactions": [
                {"id": "TXN-CYB-01", "from": "ACC-KOTAK-102938", "to": "ACC-PAYTM-991200", "amount": 2500000, "date": "2026-02-18", "method": "IMPS"}
            ],
            "comms": [
                {"id": "COM-CYB-01", "caller": "+91-9811023456", "receiver": "+91-9711034567", "timestamp": "2026-02-18T03:12:00Z", "duration": 420, "tower": "Noida Sector 62 Cell 4"}
            ],
            "evidence": [
                {"id": "EVD-CYB-01", "title": "Reverse Proxy Server PCAP Dump.pcap", "type": "Network Packet Capture", "sha": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", "cert": "BSA-63-2026-EVD-CYB-01", "officer": "Insp. Deshmukh", "loc": "Cyber Forensics Lab Server"},
                {"id": "EVD-CYB-02", "title": "Harvested Credentials SQLite DB.db", "type": "Digital Evidence", "sha": "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321", "cert": "BSA-63-2026-EVD-CYB-02", "officer": "Sub-Insp. Kumar", "loc": "Digital Locker 1"}
            ],
            "timeline": [
                {"id": "EVT-CYB-01", "ts": "2026-02-18T02:00:00Z", "type": "COMMUNICATION", "title": "Phishing Proxy C2 Connection", "desc": "Spoofed domain sbi-secure-portal.net resolved to C2 IP 198.51.100.42.", "p_id": "P-CYB-01", "p_name": "Deepak Chouhan", "loc": "Noida Sector 62 Cyber Hub"},
                {"id": "EVT-CYB-02", "ts": "2026-02-18T03:12:00Z", "type": "COMMUNICATION", "title": "Automated Exfiltration Burst", "desc": "31 victim 2FA tokens transmitted to Telegram exfiltration bot.", "p_id": "P-CYB-01", "p_name": "Deepak Chouhan", "s_id": "P-CYB-02", "s_name": "Amit Mandal", "loc": "Jamtara Operation Cell"},
                {"id": "EVT-CYB-03", "ts": "2026-02-18T06:45:00Z", "type": "FINANCIAL_TRANSACTION", "title": "Coordinated ATM Cash Withdrawals", "desc": "INR 8.5 Lakhs withdrawn across 3 metropolitan ATMs in East Delhi.", "p_id": "P-CYB-04", "p_name": "Suraj Paswan", "loc": "East Delhi ATM Cluster"}
            ],
            "alerts": [
                {"id": "ALT-CYB-01", "type": "Communication Pattern", "sev": "CRITICAL", "title": "C2 Automated Telegram Hook Activity", "desc": "Continuous TLS 1.3 telemetry stream originating from C2 infrastructure.", "entity_id": "P-CYB-01", "entity_name": "Deepak Chouhan"}
            ],
            "watchlist": [
                {"id": "WCH-CYB-01", "type": "Person", "val": "P-CYB-01", "name": "Deepak Chouhan", "reason": "C2 server administrator and primary cyber developer.", "prio": "CRITICAL"}
            ]
        },

        # Case 3: Coastal Narcotics Cell
        {
            "case_id": "CASE-2026-NRC-003",
            "case_number": "FIR/ANC/2026/0094",
            "title": "Operation White Dust - Coastal Synthetic Narcotics Pipeline",
            "description": "Inter-state drug cartel coordinating synthetic narcotics offloads at sea, road transit along Konkan highway, and dead-drop retail distribution.",
            "assigned_investigator": "Superintendent Arvind Reddy (LEO-3342)",
            "assigned_team": "Coastal Surveillance & Interdiction Squad",
            "status": "active",
            "priority": "critical",
            "jurisdiction": "Anti-Narcotics Task Force, Western Coast",
            "police_station": "Port Narcotics Bureau, Nhava Sheva",
            "case_type": "Narcotics Control (NDPS)",
            "persons": [
                {"id": "P-NRC-01", "name": "Carlos Mendes", "alias": "Goa Carlos", "role": "Coastal Dispatcher", "phones": ["+91-8877665544"], "accounts": ["ACC-CANARA-440192"], "vehicles": ["GA-03-A-9922"], "city": "Panaji", "address": "Candolim Beach Road, North Goa"},
                {"id": "P-NRC-02", "name": "Iqbal Memon", "alias": "Captain Bhai", "role": "Sea Transport Operator", "phones": ["+91-9920199441"], "accounts": ["ACC-SBI-881920"], "vehicles": ["MH-04-TR-5511"], "city": "Alibaug", "address": "Rewas Jetty Road, Alibaug, Raigad"},
                {"id": "P-NRC-03", "name": "Tariq Butt", "alias": "Courier T", "role": "Inland Logistics Lead", "phones": ["+91-9820144912"], "accounts": ["ACC-HDFC-112233"], "vehicles": ["MH-12-PQ-8800"], "city": "Pune", "address": "Koregaon Park, Pune"}
            ],
            "phones": [
                {"id": "PH-NRC-01", "number": "+91-8877665544", "carrier": "BSNL Goa", "imei": "358920088776655", "subscriber": "Carlos Mendes"},
                {"id": "PH-NRC-02", "number": "+91-9820144912", "carrier": "Airtel Maharashtra", "imei": "358920088776656", "subscriber": "Tariq Butt"}
            ],
            "accounts": [
                {"id": "ACC-CANARA-440192", "number": "4401928371", "bank": "Canara Bank", "holder": "Mendes Marine Exports", "branch": "Panaji Central", "balance": "₹65,00,000"}
            ],
            "vehicles": [
                {"id": "VEH-GA03-9922", "plate": "GA-03-A-9922", "model": "Mahindra Scorpio-N (Silver)", "owner": "Carlos Mendes", "chassis": "MA1TA2SK008821"}
            ],
            "locations": [
                {"id": "LOC-NRC-01", "name": "Nhava Sheva Yard 4B Anchorage", "lat": 18.9498, "lng": 72.9510, "city": "Navi Mumbai", "address": "Jawaharlal Nehru Port, Nhava Sheva, Maharashtra 400707"},
                {"id": "LOC-NRC-02", "name": "Rewas Port & Jetty Coordinates", "lat": 18.7845, "lng": 72.8834, "city": "Alibaug", "address": "Rewas Jetty, Raigad District, Maharashtra 402201"}
            ],
            "organizations": [
                {"id": "ORG-NRC-01", "name": "Blue Ocean Freight Transporters", "type": "Logistics Cover", "cin": "U60200GA2020PTC019821", "reg_address": "Panaji Port Road"}
            ],
            "firs": [
                {"id": "FIR-NRC-01", "number": "FIR/ANC/2026/0094", "station": "Port Narcotics Bureau", "sections": "NDPS Act §21, §29, BNS §111", "summary": "Interception of commercial quantity illicit narcotics aboard unflagged speed craft."}
            ],
            "crimes": [
                {"id": "CRM-NRC-01", "code": "CR-NDPS-01", "category": "Narcotics Smuggling", "desc": "Coastal vessel drop-off and inland contraband dispatch"}
            ],
            "transactions": [
                {"id": "TXN-NRC-01", "from": "ACC-CANARA-440192", "to": "ACC-HDFC-112233", "amount": 1200000, "date": "2026-02-10", "method": "NEFT"}
            ],
            "comms": [
                {"id": "COM-NRC-01", "caller": "+91-8877665544", "receiver": "+91-9820144912", "timestamp": "2026-02-10T22:30:00Z", "duration": 95, "tower": "Alibaug Coastal Tower 2"}
            ],
            "evidence": [
                {"id": "EVD-NRC-01", "title": "Seizure Panchnama & Field Test Report.pdf", "type": "Seizure Docket", "sha": "4455667788990011223344556677889900112233445566778899001122334455", "cert": "BSA-63-2026-EVD-NRC-01", "officer": "Supt. Reddy", "loc": "Customs Safe Vault 4"}
            ],
            "timeline": [
                {"id": "EVT-NRC-01", "ts": "2026-02-10T21:15:00Z", "type": "COMMUNICATION", "title": "Satellite Voice Intercept", "desc": "Encrypted voice packet burst captured along offshore coastal coordinates.", "p_id": "P-NRC-01", "p_name": "Carlos Mendes", "s_id": "P-NRC-02", "s_name": "Iqbal Memon", "loc": "Rewas Port & Jetty Coordinates"},
                {"id": "EVT-NRC-02", "ts": "2026-02-10T23:30:00Z", "type": "CRIME_INCIDENT", "title": "Offshore Coast Guard Interdiction", "desc": "Target vessel boarded 12 nautical miles off Alibaug coast; 32 kg contraband seized.", "p_id": "P-NRC-02", "p_name": "Iqbal Memon", "loc": "Nhava Sheva Yard 4B Anchorage"}
            ],
            "alerts": [
                {"id": "ALT-NRC-01", "type": "Communication Pattern", "sev": "CRITICAL", "title": "Offshore Marine Satellite Telemetry Burst", "desc": "Thuraya satellite handset active in marine exclusion zone prior to rendezvous.", "entity_id": "P-NRC-01", "entity_name": "Carlos Mendes"}
            ],
            "watchlist": [
                {"id": "WCH-NRC-01", "type": "Person", "val": "P-NRC-01", "name": "Carlos Mendes", "reason": "Primary narcotics coordinator under Section 29 NDPS.", "prio": "CRITICAL"}
            ]
        },

        # Case 4: Organized Auto Theft & Racket
        {
            "case_id": "CASE-2026-VHL-004",
            "case_number": "FIR/CRIM/2026/0302",
            "title": "Operation Iron Track - Luxury Auto-Theft & Chassis Tampering Syndicate",
            "description": "Syndicate using OBD diagnostic programmers to steal premium SUVs in NCR, replacing engine chassis engravings, and moving vehicles into Northeast states.",
            "assigned_investigator": "Inspector Manpreet Singh Sandhu (LEO-4910)",
            "assigned_team": "Anti-Auto Theft Squad (AATS)",
            "status": "active",
            "priority": "high",
            "jurisdiction": "Crime Branch CID, Haryana & Punjab",
            "police_station": "Crime Branch Central, Gurugram",
            "case_type": "Organized Vehicle Theft",
            "persons": [
                {"id": "P-VHL-01", "name": "Gurpreet Singh", "alias": "Goldy", "role": "Syndicate Leader", "phones": ["+91-9810992201"], "accounts": ["ACC-PUNJAB-991200"], "vehicles": ["HR-26-DK-9000"], "city": "Gurugram", "address": "Golf Course Extension, Gurugram"},
                {"id": "P-VHL-02", "name": "Mohammad Aslam", "alias": "Master Mechanic", "role": "Chassis Etching Specialist", "phones": ["+91-9710883302"], "accounts": ["ACC-PNB-109283"], "vehicles": ["UP-14-BT-1122"], "city": "Meerut", "address": "Sotiganj Auto Market, Meerut"},
                {"id": "P-VHL-03", "name": "Vikash Yadav", "alias": "Transporter", "role": "Inter-State Transit Driver", "phones": ["+91-9610774403"], "accounts": ["ACC-SBI-991244"], "vehicles": ["HR-55-XY-4400"], "city": "Rewari", "address": "Bhiwadi Highway, Rewari"}
            ],
            "phones": [
                {"id": "PH-VHL-01", "number": "+91-9810992201", "carrier": "Airtel", "imei": "862201049911001", "subscriber": "Gurpreet Singh"}
            ],
            "accounts": [
                {"id": "ACC-PUNJAB-991200", "number": "9912003344", "bank": "Punjab National Bank", "holder": "GS Auto Spares", "branch": "Sohna Road Gurugram", "balance": "₹38,00,000"}
            ],
            "vehicles": [
                {"id": "VEH-HR26-9000", "plate": "HR-26-DK-9000", "model": "Toyota Fortuner Legender (Black)", "owner": "Gurpreet Singh", "chassis": "MBJ11BB40019283"},
                {"id": "VEH-HR55-4400", "plate": "HR-55-XY-4400", "model": "Mahindra Scorpio Classic", "owner": "Vikash Yadav", "chassis": "MA1TA2SK0099182"}
            ],
            "locations": [
                {"id": "LOC-VHL-01", "name": "Gurugram Auto Corridor", "lat": 28.4595, "lng": 77.0266, "city": "Gurugram", "address": "Sector 29, Gurugram, Haryana 122001"},
                {"id": "LOC-VHL-02", "name": "Meerut Scrapyard Cluster", "lat": 28.9845, "lng": 77.7064, "city": "Meerut", "address": "Sotiganj Industrial Yard, Meerut, UP 250002"}
            ],
            "organizations": [
                {"id": "ORG-VHL-01", "name": "GS Precision Auto Parts LLP", "type": "Front Workshop", "cin": "U50100HR2022LLP019283", "reg_address": "Sohna Road, Gurugram"}
            ],
            "firs": [
                {"id": "FIR-VHL-01", "number": "FIR/CRIM/2026/0302", "station": "Crime Branch Gurugram", "sections": "BNS §303, §317, §336", "summary": "Theft of motor vehicles using electronic frequency jammers and chassis etching."}
            ],
            "crimes": [
                {"id": "CRM-VHL-01", "code": "CR-AUTO-01", "category": "Organized Vehicle Theft", "desc": "Electronic key cloning and VIN restamping"}
            ],
            "transactions": [
                {"id": "TXN-VHL-01", "from": "ACC-PUNJAB-991200", "to": "ACC-PNB-109283", "amount": 650000, "date": "2026-01-28", "method": "NEFT"}
            ],
            "comms": [
                {"id": "COM-VHL-01", "caller": "+91-9810992201", "receiver": "+91-9710883302", "timestamp": "2026-01-28T16:20:00Z", "duration": 210, "tower": "Gurugram Sector 29 BTS"}
            ],
            "evidence": [
                {"id": "EVD-VHL-01", "title": "Autel MaxiSys Key Programmer Forensic Image.dd", "type": "Digital Forensics", "sha": "aa11bb22cc33dd44ee55ff6600112233445566778899aabbccddeeff00112233", "cert": "BSA-63-2026-EVD-VHL-01", "officer": "Insp. Sandhu", "loc": "AATS Evidence Locker"}
            ],
            "timeline": [
                {"id": "EVT-VHL-01", "ts": "2026-01-28T02:30:00Z", "type": "LOCATION", "title": "Vehicle Theft Intercepted on CCTV", "desc": "Toyota Fortuner stolen from Sector 45 residence using key programmer.", "p_id": "P-VHL-01", "p_name": "Gurpreet Singh", "loc": "Gurugram Auto Corridor"},
                {"id": "EVT-VHL-02", "ts": "2026-01-28T06:15:00Z", "type": "LOCATION", "title": "Fastag Toll Passage at Kherki Daula", "desc": "Stolen vehicle crossed toll plaza using counterfeit RFID tag.", "p_id": "P-VHL-03", "p_name": "Vikash Yadav", "loc": "Gurugram Auto Corridor"}
            ],
            "alerts": [
                {"id": "ALT-VHL-01", "type": "Cross-source Contradiction", "sev": "HIGH", "title": "Fastag RFID Mismatch with Parivahan RTO Registry", "desc": "Fastag RFID mapped to Maruti Swift detected on stolen Toyota Fortuner.", "entity_id": "VEH-HR26-9000", "entity_name": "HR-26-DK-9000"}
            ],
            "watchlist": [
                {"id": "WCH-VHL-01", "type": "Vehicle", "val": "HR-26-DK-9000", "name": "Toyota Fortuner Legender", "reason": "Target stolen vehicle with altered chassis.", "prio": "HIGH"}
            ]
        },

        # Case 5: Cross-Border Contraband Smuggling
        {
            "case_id": "CASE-2026-CTB-005",
            "case_number": "FIR/CID/2026/0517",
            "title": "Operation Falcon Web - Maritime Contraband & Container Smuggling",
            "description": "Multi-state syndicate utilizing refrigerated shipping containers with hidden compartments to smuggle undeclared gold bullion, currency, and high-value electronics.",
            "assigned_investigator": "Deputy Director Vikramaditya Rao (LEO-7729)",
            "assigned_team": "Special Intelligence Bureau Taskforce 4",
            "status": "active",
            "priority": "critical",
            "jurisdiction": "Directorate of Revenue Intelligence & State CID",
            "police_station": "Special Crime Branch, CID Mumbai",
            "case_type": "Customs Smuggling & Organized Crime",
            "persons": [
                {"id": "P-CTB-01", "name": "Haji Salim", "alias": "Port Master", "role": "Syndicate Kingpin", "phones": ["+971-50-9876543"], "accounts": ["ACC-ENBD-901122"], "vehicles": ["MH-06-AZ-5500"], "city": "Dubai", "address": "Deira Creek Logistics Tower, Dubai"},
                {"id": "P-CTB-02", "name": "Vikram Malhotra", "alias": "The Architect", "role": "Domestic Consignment Receiver", "phones": ["+91-9820011223"], "accounts": ["ACC-HDFC-102938"], "vehicles": ["MH-01-EE-3344"], "city": "Mumbai", "address": "Worli Sea Face, Mumbai"},
                {"id": "P-CTB-03", "name": "Murugan Nadar", "alias": "Customs Broker", "role": "Clearing & Forwarding Proxy", "phones": ["+91-9444012345"], "accounts": ["ACC-SBI-667788"], "vehicles": ["MH-04-JJ-2211"], "city": "Navi Mumbai", "address": "Sector 19, Vashi, Navi Mumbai"}
            ],
            "phones": [
                {"id": "PH-CTB-01", "number": "+91-9820011223", "carrier": "Airtel", "imei": "864201041234567", "subscriber": "Vikram Malhotra"},
                {"id": "PH-CTB-02", "number": "+971-50-9876543", "carrier": "Etisalat", "imei": "358920049876543", "subscriber": "Haji Salim"}
            ],
            "accounts": [
                {"id": "ACC-HDFC-102938", "number": "1029384711", "bank": "HDFC Bank", "holder": "Malhotra Maritime Ventures", "branch": "Nariman Point Mumbai", "balance": "₹12,40,00,000"}
            ],
            "vehicles": [
                {"id": "VEH-MH01-3344", "plate": "MH-01-EE-3344", "model": "BMW 7 Series (Dark Sapphire)", "owner": "Vikram Malhotra", "chassis": "WBAGL410098231"}
            ],
            "locations": [
                {"id": "LOC-CTB-01", "name": "JNPT Container Terminal 2", "lat": 18.9498, "lng": 72.9510, "city": "Navi Mumbai", "address": "Berth 4, JNPT Port, Nhava Sheva, Navi Mumbai, Maharashtra 400707"},
                {"id": "LOC-CTB-02", "name": "Khed Shivapur Toll Plaza Corridor", "lat": 18.3541, "lng": 73.8567, "city": "Pune", "address": "NH4 Highway Corridor, Khed Shivapur, Maharashtra 412205"}
            ],
            "organizations": [
                {"id": "ORG-CTB-01", "name": "Malhotra Maritime Ventures Pvt Ltd", "type": "Import/Export Company", "cin": "U61100MH2019PTC328811", "reg_address": "Nariman Point, Mumbai"}
            ],
            "firs": [
                {"id": "FIR-CTB-01", "number": "FIR/CID/2026/0517", "station": "Special Crime Branch CID", "sections": "Customs Act §135, BNS §111, §318", "summary": "Seizure of 42.5 kg contraband concealed in reefer container at JNPT."}
            ],
            "crimes": [
                {"id": "CRM-CTB-01", "code": "CR-SMUG-01", "category": "Customs Contraband", "desc": "Maritime freight container cavity concealment"}
            ],
            "transactions": [
                {"id": "TXN-CTB-01", "from": "ACC-HDFC-102938", "to": "ACC-SBI-667788", "amount": 3500000, "date": "2026-01-08", "method": "RTGS"}
            ],
            "comms": [
                {"id": "COM-CTB-01", "caller": "+91-9820011223", "receiver": "+971-50-9876543", "timestamp": "2026-01-08T08:30:00Z", "duration": 180, "tower": "JNPT Sector 4 Cell 19"}
            ],
            "evidence": [
                {"id": "EVD-CTB-01", "title": "JNPT Port Container Seizure Memo.pdf", "type": "Seizure Panchnama", "sha": "bb22cc33dd44ee55ff660011223344556677889900112233445566778899aabb", "cert": "BSA-63-2026-EVD-CTB-01", "officer": "DD Vikramaditya Rao", "loc": "Vault JNPT-01"}
            ],
            "timeline": [
                {"id": "EVT-CTB-01", "ts": "2026-01-08T08:30:00Z", "type": "COMMUNICATION", "title": "Encrypted Satellite Burst Pre-Dispatch", "desc": "Short-burst communication recorded preceding container offload.", "p_id": "P-CTB-02", "p_name": "Vikram Malhotra", "s_id": "P-CTB-01", "s_name": "Haji Salim", "loc": "JNPT Container Terminal 2"},
                {"id": "EVT-CTB-02", "ts": "2026-01-08T17:30:00Z", "type": "CRIME_INCIDENT", "title": "DRI Preventive Interdiction", "desc": "Joint enforcement raid intercepted refrigerated container; recovered 42.5kg contraband.", "p_id": "P-CTB-02", "p_name": "Vikram Malhotra", "loc": "JNPT Container Terminal 2"}
            ],
            "alerts": [
                {"id": "ALT-CTB-01", "type": "Communication Pattern", "sev": "CRITICAL", "title": "International VoIP Intercept Preceding Shipment", "desc": "14 encrypted voice calls between Mumbai receiver and Dubai principal prior to customs clearance.", "entity_id": "P-CTB-02", "entity_name": "Vikram Malhotra"}
            ],
            "watchlist": [
                {"id": "WCH-CTB-01", "type": "Person", "val": "P-CTB-02", "name": "Vikram Malhotra", "reason": "Central receiver under DRI customs surveillance.", "prio": "CRITICAL"}
            ]
        },

        # Case 6: Fake Document & Identity Fraud
        {
            "case_id": "CASE-2026-DOC-006",
            "case_number": "FIR/AHT/2026/0209",
            "title": "Operation Paper Ghost - Counterfeit Passport & KYC Factory",
            "description": "Counterfeiting ring operating underground offset printing, biometric chip tampering, and forged identity documents for overseas transit.",
            "assigned_investigator": "ACP Pradeep Kulkarni (LEO-6291)",
            "assigned_team": "Anti-Human Trafficking Unit (AHTU)",
            "status": "under_investigation",
            "priority": "high",
            "jurisdiction": "Crime Branch Central Division, Bengaluru City Police",
            "police_station": "CCB Special Investigation Division, Bengaluru",
            "case_type": "Identity Forgery & Human Trafficking",
            "persons": [
                {"id": "P-DOC-01", "name": "Arunachalam Murthy", "alias": "Master Printer", "role": "Chief Document Forger", "phones": ["+91-9845012399"], "accounts": ["ACC-CANARA-102900"], "vehicles": ["KA-01-MJ-4001"], "city": "Bengaluru", "address": "Shivajinagar, Bengaluru, Karnataka"},
                {"id": "P-DOC-02", "name": "Imran Qureshi", "alias": "Safehouse Custodian", "role": "Intermediate Handler", "phones": ["+91-9845023400"], "accounts": ["ACC-HDFC-441290"], "vehicles": ["KA-03-NB-8899"], "city": "Bengaluru", "address": "Koramangala 4th Block, Bengaluru"},
                {"id": "P-DOC-03", "name": "Sunita Verma", "alias": "KYC Broker", "role": "Bank KYC Document Provider", "phones": ["+91-9845034501"], "accounts": ["ACC-SBI-772211"], "vehicles": ["KA-05-PQ-1200"], "city": "Bengaluru", "address": "Jayanagar, Bengaluru"}
            ],
            "phones": [
                {"id": "PH-DOC-01", "number": "+91-9845012399", "carrier": "Airtel Karnataka", "imei": "860450091122334", "subscriber": "Arunachalam Murthy"}
            ],
            "accounts": [
                {"id": "ACC-CANARA-102900", "number": "1029008821", "bank": "Canara Bank", "holder": "Graphic Design Solutions", "branch": "Shivajinagar Bengaluru", "balance": "₹28,50,000"}
            ],
            "vehicles": [
                {"id": "VEH-KA01-4001", "plate": "KA-01-MJ-4001", "model": "Honda City (Pearl White)", "owner": "Arunachalam Murthy", "chassis": "MAKGM2650091823"}
            ],
            "locations": [
                {"id": "LOC-DOC-01", "name": "Shivajinagar Underground Workshop", "lat": 12.9856, "lng": 77.6057, "city": "Bengaluru", "address": "Commercial Street Road, Shivajinagar, Bengaluru, Karnataka 560051"},
                {"id": "LOC-DOC-02", "name": "Kempegowda International Airport", "lat": 13.1986, "lng": 77.7066, "city": "Bengaluru", "address": "Terminal 2 Departure Gate, Devanahalli, Bengaluru 560300"}
            ],
            "organizations": [
                {"id": "ORG-DOC-01", "name": "Classic Graphics & Binding Works", "type": "Cover Printing Press", "cin": "N/A", "reg_address": "Shivajinagar, Bengaluru"}
            ],
            "firs": [
                {"id": "FIR-DOC-01", "number": "FIR/AHT/2026/0209", "station": "CCB Bengaluru", "sections": "BNS §336, §340, Passports Act §12", "summary": "Manufacturing and distributing counterfeit biometric passport folios and visa stamps."}
            ],
            "crimes": [
                {"id": "CRM-DOC-01", "code": "CR-FORG-01", "category": "Document Counterfeiting", "desc": "High-resolution offset printing of official travel credentials"}
            ],
            "transactions": [
                {"id": "TXN-DOC-01", "from": "ACC-CANARA-102900", "to": "ACC-HDFC-441290", "amount": 800000, "date": "2026-02-01", "method": "IMPS"}
            ],
            "comms": [
                {"id": "COM-DOC-01", "caller": "+91-9845012399", "receiver": "+91-9845023400", "timestamp": "2026-02-01T14:30:00Z", "duration": 150, "tower": "Shivajinagar Tower 1"}
            ],
            "evidence": [
                {"id": "EVD-DOC-01", "title": "High-End Laser Engraver & Passport Dies Inventory.pdf", "type": "Seizure Memo", "sha": "cc33dd44ee55ff66001122334455667788990011223344556677889900112233", "cert": "BSA-63-2026-EVD-DOC-01", "officer": "ACP Kulkarni", "loc": "CCB Evidence Room 2"}
            ],
            "timeline": [
                {"id": "EVT-DOC-01", "ts": "2026-02-01T11:00:00Z", "type": "CRIME_INCIDENT", "title": "Airport Immigration Intercept", "desc": "Passenger intercepted at KIA Terminal 2 with counterfeit passport serial #PASSPORT-Z992144.", "p_id": "P-DOC-02", "p_name": "Imran Qureshi", "loc": "Kempegowda International Airport"},
                {"id": "EVT-DOC-02", "ts": "2026-02-01T18:00:00Z", "type": "CRIME_INCIDENT", "title": "Shivajinagar Press Raid", "desc": "AHTU team seized 48 blank passport folios, UV dye cartridges, and embossing plates.", "p_id": "P-DOC-01", "p_name": "Arunachalam Murthy", "loc": "Shivajinagar Underground Workshop"}
            ],
            "alerts": [
                {"id": "ALT-DOC-01", "type": "Cross-source Contradiction", "sev": "CRITICAL", "title": "Immigration Gate Passport ID Sequence Contradiction", "desc": "Passport serial logged at Land Customs Station while biometric database reports identity in custody.", "entity_id": "P-DOC-02", "entity_name": "Imran Qureshi"}
            ],
            "watchlist": [
                {"id": "WCH-DOC-01", "type": "Person", "val": "P-DOC-01", "name": "Arunachalam Murthy", "reason": "Master counterfeiter under BNS Section 336 investigation.", "prio": "HIGH"}
            ]
        },

        # Case 7: Corporate Shell Company Money Laundering
        {
            "case_id": "CASE-2026-SHL-007",
            "case_number": "FIR/EOW/2026/0633",
            "title": "Operation Shadow Ledger - Round-Tripping & Bogus Invoicing Ring",
            "description": "Multi-tier network of 18 paper entities generating ₹120 Crore in non-genuine transactions and bogus Input Tax Credit claims.",
            "assigned_investigator": "Joint Director Kavita Nambiar (LEO-1044)",
            "assigned_team": "Corporate Fraud Investigation Wing",
            "status": "active",
            "priority": "critical",
            "jurisdiction": "Enforcement Directorate & EOW, Telangana",
            "police_station": "Cyberabad Economic Crimes Branch, Hyderabad",
            "case_type": "Corporate Fraud & Shell Laundering",
            "persons": [
                {"id": "P-SHL-01", "name": "Venkat Ramanathan", "alias": "Chartered Auditor", "role": "Chief Financial Structurer", "phones": ["+91-9849011122"], "accounts": ["ACC-AXIS-109283"], "vehicles": ["TS-09-EA-7700"], "city": "Hyderabad", "address": "Jubilee Hills, Hyderabad, Telangana"},
                {"id": "P-SHL-02", "name": "Kishore Chawla", "alias": "The Director", "role": "Dummy Director on 12 Boards", "phones": ["+91-9849022233"], "accounts": ["ACC-HDFC-991122"], "vehicles": ["TS-07-FA-5500"], "city": "Hyderabad", "address": "Banjara Hills Road No 12, Hyderabad"},
                {"id": "P-SHL-03", "name": "Meera Agarwal", "alias": "Cash Disburser", "role": "Shell Account Signatory", "phones": ["+91-9849033344"], "accounts": ["ACC-ICICI-665544"], "vehicles": ["TS-08-GH-9911"], "city": "Secunderabad", "address": "Sindhi Colony, Secunderabad"}
            ],
            "phones": [
                {"id": "PH-SHL-01", "number": "+91-9849011122", "carrier": "Airtel AP", "imei": "864401091122445", "subscriber": "Venkat Ramanathan"}
            ],
            "accounts": [
                {"id": "ACC-AXIS-109283", "number": "1092837461", "bank": "Axis Bank", "holder": "Nexus Apex Commodities Ltd", "branch": "Jubilee Hills Hyderabad", "balance": "₹32,00,00,000"}
            ],
            "vehicles": [
                {"id": "VEH-TS09-7700", "plate": "TS-09-EA-7700", "model": "Audi A6 (Mythos Black)", "owner": "Venkat Ramanathan", "chassis": "WAUZZZF20091823"}
            ],
            "locations": [
                {"id": "LOC-SHL-01", "name": "HITEC City Financial District", "lat": 17.4435, "lng": 78.3772, "city": "Hyderabad", "address": "Financial District, Nanakramguda, Hyderabad, Telangana 500032"},
                {"id": "LOC-SHL-02", "name": "Banjara Hills Corporate Suites", "lat": 17.4156, "lng": 78.4357, "city": "Hyderabad", "address": "Road No 2, Banjara Hills, Hyderabad 500034"}
            ],
            "organizations": [
                {"id": "ORG-SHL-01", "name": "Nexus Apex Commodities Ltd", "type": "Shell Entity", "cin": "U51909TG2020PLC148921", "reg_address": "HITEC City, Hyderabad"},
                {"id": "ORG-SHL-02", "name": "Vertex Infra Global LLP", "type": "Shell Entity", "cin": "AAR-8821", "reg_address": "Banjara Hills, Hyderabad"}
            ],
            "firs": [
                {"id": "FIR-SHL-01", "number": "FIR/EOW/2026/0633", "station": "Cyberabad Economic Crimes", "sections": "BNS §316, §318, PMLA §3", "summary": "Bogus input tax credit siphoning and layered inter-corporate loans without underlying business."}
            ],
            "crimes": [
                {"id": "CRM-SHL-01", "code": "CR-CORP-01", "category": "Corporate Embezzlement", "desc": "Circular round-tripping of funds across shared-director companies"}
            ],
            "transactions": [
                {"id": "TXN-SHL-01", "from": "ACC-AXIS-109283", "to": "ACC-HDFC-991122", "amount": 62000000, "date": "2026-02-20", "method": "RTGS"}
            ],
            "comms": [
                {"id": "COM-SHL-01", "caller": "+91-9849011122", "receiver": "+91-9849022233", "timestamp": "2026-02-20T09:45:00Z", "duration": 240, "tower": "HITEC City Tower 2"}
            ],
            "evidence": [
                {"id": "EVD-SHL-01", "title": "MCA Filings & Circular Banking Flow Chart.pdf", "type": "Forensic Audit Report", "sha": "dd44ee55ff660011223344556677889900112233445566778899001122334455", "cert": "BSA-63-2026-EVD-SHL-01", "officer": "JD Kavita Nambiar", "loc": "ED Forensic Vault 1"}
            ],
            "timeline": [
                {"id": "EVT-SHL-01", "ts": "2026-02-20T10:00:00Z", "type": "FINANCIAL_TRANSACTION", "title": "Round-Tripping Transfer (INR 6.2 Cr)", "desc": "RTGS credit moved from Nexus Apex to Vertex Infra within 14 minutes of receipt.", "p_id": "ACC-AXIS-109283", "p_name": "Nexus Apex Account", "s_id": "ACC-HDFC-991122", "s_name": "Vertex Infra Account", "loc": "HITEC City Financial District"}
            ],
            "alerts": [
                {"id": "ALT-SHL-01", "type": "Unusual Transaction Pattern", "sev": "CRITICAL", "title": "Circular Transaction Loop Detected", "desc": "Algorithmic audit detected closed graph cycle of ₹12 Crore returning to origin account.", "entity_id": "ORG-SHL-01", "entity_name": "Nexus Apex Commodities Ltd"}
            ],
            "watchlist": [
                {"id": "WCH-SHL-01", "type": "Organization", "val": "ORG-SHL-01", "name": "Nexus Apex Commodities Ltd", "reason": "Primary corporate vehicle used for circular transactions.", "prio": "CRITICAL"}
            ]
        },

        # Case 8: SIM Box & Illegal VoIP Gateway
        {
            "case_id": "CASE-2026-VOIP-008",
            "case_number": "FIR/DOT/2026/0145",
            "title": "Operation Frequency - Clandestine SIM Box & Grey VoIP Exchange",
            "description": "Unauthorized telecom infrastructure housing multiple 128-port SIM boxes terminating grey international voice traffic into domestic GSM networks.",
            "assigned_investigator": "Superintendent S. Murugan (LEO-9120)",
            "assigned_team": "Telecom Enforcement & Threat Monitoring Squad",
            "status": "active",
            "priority": "high",
            "jurisdiction": "Telecom Regulatory & Cyber Crime Cell, Tamil Nadu",
            "police_station": "State Cyber Operations PS, Chennai",
            "case_type": "Telecom Bypass & Cyber Crime",
            "persons": [
                {"id": "P-VOIP-01", "name": "Karthik Subramanian", "alias": "SIP Master", "role": "VoIP Gateway Admin", "phones": ["+91-9840199221"], "accounts": ["ACC-INDIAN-992211"], "vehicles": ["TN-07-CC-1144"], "city": "Chennai", "address": "Velachery Main Road, Chennai, Tamil Nadu"},
                {"id": "P-VOIP-02", "name": "M. Selvam", "alias": "SIM Runner", "role": "Bulk Pre-activated SIM Procurer", "phones": ["+91-9840288332"], "accounts": ["ACC-IOB-883322"], "vehicles": ["TN-09-BF-5566"], "city": "Chennai", "address": "T. Nagar, Chennai, Tamil Nadu"},
                {"id": "P-VOIP-03", "name": "Ahmed Faraz", "alias": "Overseas Route Broker", "role": "VoIP Termination Broker", "phones": ["+91-9840377443"], "accounts": ["ACC-HDFC-774433"], "vehicles": ["TN-02-XY-9900"], "city": "Coimbatore", "address": "RS Puram, Coimbatore"}
            ],
            "phones": [
                {"id": "PH-VOIP-01", "number": "+91-9840199221", "carrier": "Airtel TN", "imei": "864401051122339", "subscriber": "Karthik Subramanian"}
            ],
            "accounts": [
                {"id": "ACC-INDIAN-992211", "number": "9922114455", "bank": "Indian Bank", "holder": "Apex Telecom Labs", "branch": "Velachery Chennai", "balance": "₹19,20,000"}
            ],
            "vehicles": [
                {"id": "VEH-TN07-1144", "plate": "TN-07-CC-1144", "model": "Skoda Slavia (Carbon Steel)", "owner": "Karthik Subramanian", "chassis": "TMBBA2NS009821"}
            ],
            "locations": [
                {"id": "LOC-VOIP-01", "name": "Velachery Illegal Exchange", "lat": 12.9791, "lng": 80.2185, "city": "Chennai", "address": "100 Feet Bypass Road, Velachery, Chennai, Tamil Nadu 600042"},
                {"id": "LOC-VOIP-02", "name": "Guindy Telecom Node", "lat": 13.0067, "lng": 80.2025, "city": "Chennai", "address": "Industrial Estate, Guindy, Chennai 600032"}
            ],
            "organizations": [
                {"id": "ORG-VOIP-01", "name": "Apex Telecom Cloud Labs", "type": "Unregistered VoIP Entity", "cin": "N/A", "reg_address": "Velachery, Chennai"}
            ],
            "firs": [
                {"id": "FIR-VOIP-01", "number": "FIR/DOT/2026/0145", "station": "State Cyber Operations PS", "sections": "Indian Telegraph Act §20, §25, BNS §318", "summary": "Running unauthorized international telegraphic exchange using SIM boxes."}
            ],
            "crimes": [
                {"id": "CRM-VOIP-01", "code": "CR-TEL-01", "category": "Telecom Bypass", "desc": "SIM box bypass terminating foreign minutes illegally"}
            ],
            "transactions": [
                {"id": "TXN-VOIP-01", "from": "ACC-INDIAN-992211", "to": "ACC-IOB-883322", "amount": 420000, "date": "2026-02-12", "method": "IMPS"}
            ],
            "comms": [
                {"id": "COM-VOIP-01", "caller": "+91-9840199221", "receiver": "+91-9840288332", "timestamp": "2026-02-12T15:10:00Z", "duration": 190, "tower": "Velachery North BTS"}
            ],
            "evidence": [
                {"id": "EVD-VOIP-01", "title": "Seized 128-Port SIM Box Appliance & Dinstar Firmware.dd", "type": "Hardware Forensic Image", "sha": "ee55ff6600112233445566778899001122334455667788990011223344556677", "cert": "BSA-63-2026-EVD-VOIP-01", "officer": "Supt. Murugan", "loc": "Cyber Forensics Cell Chennai"}
            ],
            "timeline": [
                {"id": "EVT-VOIP-01", "ts": "2026-02-12T14:00:00Z", "type": "COMMUNICATION", "title": "Signal Telemetry Spike Detected by DoT", "desc": "DoT TERM cell flagged abnormal CDR calling pattern on 256 SIM cards from single tower sector.", "p_id": "P-VOIP-01", "p_name": "Karthik Subramanian", "loc": "Velachery Illegal Exchange"},
                {"id": "EVT-VOIP-02", "ts": "2026-02-12T19:30:00Z", "type": "CRIME_INCIDENT", "title": "Tactical Raid on Velachery Exchange", "desc": "Four 128-port SIM boxes and 1,200 active pre-activated SIM cards seized in raid.", "p_id": "P-VOIP-01", "p_name": "Karthik Subramanian", "loc": "Velachery Illegal Exchange"}
            ],
            "alerts": [
                {"id": "ALT-VOIP-01", "type": "Communication Pattern", "sev": "CRITICAL", "title": "Abnormal SIM Density at Single Azimuth", "desc": "Over 500 outbound calls per hour routed through single residential sector BTS.", "entity_id": "P-VOIP-01", "entity_name": "Karthik Subramanian"}
            ],
            "watchlist": [
                {"id": "WCH-VOIP-01", "type": "Person", "val": "P-VOIP-01", "name": "Karthik Subramanian", "reason": "Illegal VoIP operator causing critical telecom security bypass.", "prio": "CRITICAL"}
            ]
        },

        # Case 9: Arms & Explosives Intelligence
        {
            "case_id": "CASE-2026-ARM-009",
            "case_number": "FIR/ATS/2026/0078",
            "title": "Operation Iron Shield - Clandestine Arms Supply Chain",
            "description": "Intelligence tracking illicit factory-manufactured and country-made automatic weapon consignments distributed along inter-state riverine logistics corridors.",
            "assigned_investigator": "Deputy Inspector General Alok Trivedi (LEO-2488)",
            "assigned_team": "Special Operations Group (SOG)",
            "status": "under_investigation",
            "priority": "critical",
            "jurisdiction": "Anti-Terrorism Squad, UP & Bihar",
            "police_station": "ATS Central Police Station, Lucknow",
            "case_type": "Illegal Arms & Munitions Control",
            "persons": [
                {"id": "P-ARM-01", "name": "Rameshwar Singh", "alias": "Subedar", "role": "Arms Logistics Consignor", "phones": ["+91-9415011928"], "accounts": ["ACC-SBI-109244"], "vehicles": ["UP-32-AB-9911"], "city": "Lucknow", "address": "Gomti Nagar Extension, Lucknow, UP"},
                {"id": "P-ARM-02", "name": "Dhirendra Yadav", "alias": "Munger Bhai", "role": "Weapons Fabricator & Machinist", "phones": ["+91-9415022839"], "accounts": ["ACC-PNB-883311"], "vehicles": ["BR-08-C-4400"], "city": "Munger", "address": "Kashimbazar, Munger, Bihar"},
                {"id": "P-ARM-03", "name": "Bilal Ansari", "alias": "Transporter", "role": "Secure Freight Courier", "phones": ["+91-9415033740"], "accounts": ["ACC-BOB-774400"], "vehicles": ["UP-70-ZZ-1212"], "city": "Prayagraj", "address": "Civil Lines, Prayagraj, UP"}
            ],
            "phones": [
                {"id": "PH-ARM-01", "number": "+91-9415011928", "carrier": "BSNL UP", "imei": "864401081122990", "subscriber": "Rameshwar Singh"}
            ],
            "accounts": [
                {"id": "ACC-SBI-109244", "number": "1092445566", "bank": "State Bank of India", "holder": "Singh Transport Services", "branch": "Hazratganj Lucknow", "balance": "₹22,40,000"}
            ],
            "vehicles": [
                {"id": "VEH-UP32-9911", "plate": "UP-32-AB-9911", "model": "Tata Safari (Tropical Mist)", "owner": "Rameshwar Singh", "chassis": "MAT612001A09821"}
            ],
            "locations": [
                {"id": "LOC-ARM-01", "name": "Munger Underground Ordnance Lathe", "lat": 25.3757, "lng": 86.4735, "city": "Munger", "address": "Kashimbazar Industrial By-lane, Munger, Bihar 811201"},
                {"id": "LOC-ARM-02", "name": "Gomti Riverine Staging Post", "lat": 26.8467, "lng": 80.9462, "city": "Lucknow", "address": "Kukrail Reserve Corridor, Lucknow, UP 226002"}
            ],
            "organizations": [
                {"id": "ORG-ARM-01", "name": "Singh Logistics & Heavy Transit", "type": "Fleet Cover", "cin": "N/A", "reg_address": "Transport Nagar, Lucknow"}
            ],
            "firs": [
                {"id": "FIR-ARM-01", "number": "FIR/ATS/2026/0078", "station": "ATS Central PS", "sections": "Arms Act §25(1AA), §25(1A), BNS §111", "summary": "Possession, trafficking, and transit of prohibited firearms and munitions."}
            ],
            "crimes": [
                {"id": "CRM-ARM-01", "code": "CR-ARMS-01", "category": "Arms Trafficking", "desc": "Inter-state weapons transfer using concealed truck undercarriages"}
            ],
            "transactions": [
                {"id": "TXN-ARM-01", "from": "ACC-SBI-109244", "to": "ACC-PNB-883311", "amount": 750000, "date": "2026-02-05", "method": "NEFT"}
            ],
            "comms": [
                {"id": "COM-ARM-01", "caller": "+91-9415011928", "receiver": "+91-9415022839", "timestamp": "2026-02-05T18:40:00Z", "duration": 140, "tower": "Munger City Cell 2"}
            ],
            "evidence": [
                {"id": "EVD-ARM-01", "title": "Ballistic Seizure Memorandum & Serial Registry.pdf", "type": "Ballistics Document", "sha": "ff66001122334455667788990011223344556677889900112233445566778899", "cert": "BSA-63-2026-EVD-ARM-01", "officer": "DIG Alok Trivedi", "loc": "ATS Armory Locker 1"}
            ],
            "timeline": [
                {"id": "EVT-ARM-01", "ts": "2026-02-05T16:00:00Z", "type": "COMMUNICATION", "title": "Weapons Dispatch Token Call", "desc": "Encrypted call recorded specifying delivery point at NH-27 bypass.", "p_id": "P-ARM-01", "p_name": "Rameshwar Singh", "s_id": "P-ARM-02", "s_name": "Dhirendra Yadav", "loc": "Munger Underground Ordnance Lathe"},
                {"id": "EVT-ARM-02", "ts": "2026-02-06T04:15:00Z", "type": "CRIME_INCIDENT", "title": "Highway Checkpoint Consignment Interception", "desc": "SOG team intercepted transport vehicle at toll barrier; 16 automatic pistols recovered.", "p_id": "P-ARM-03", "p_name": "Bilal Ansari", "loc": "Gomti Riverine Staging Post"}
            ],
            "alerts": [
                {"id": "ALT-ARM-01", "type": "Cross-source Contradiction", "sev": "CRITICAL", "title": "Weapon Serial Number Contradiction with OFB Registry", "desc": "Factory markings on seized firearms match obsolete decommissioned Ordnance Factory batch.", "entity_id": "P-ARM-01", "entity_name": "Rameshwar Singh"}
            ],
            "watchlist": [
                {"id": "WCH-ARM-01", "type": "Person", "val": "P-ARM-01", "name": "Rameshwar Singh", "reason": "Principal arms consignor under Section 25 Arms Act.", "prio": "CRITICAL"}
            ]
        },

        # Case 10: Multi-State Inter-Gang Coordination
        {
            "case_id": "CASE-2026-GNG-010",
            "case_number": "FIR/OC/2026/0890",
            "title": "Operation Apex Nexus - Inter-State Extortion & Safehouse Network",
            "description": "Multi-state organized syndicate coordinating protection money extortion calls through overseas VoIP handles, using student mules for fund cashouts.",
            "assigned_investigator": "Inspector General Bhupendra Shekhawat (LEO-3801)",
            "assigned_team": "Inter-State Gangster Task Force (IGTF)",
            "status": "active",
            "priority": "critical",
            "jurisdiction": "National Organised Crime Command (Rajasthan & Delhi)",
            "police_station": "Organised Crime Branch, Jaipur",
            "case_type": "Organized Crime & Extortion",
            "persons": [
                {"id": "P-GNG-01", "name": "Tejpal Bishnoi", "alias": "Chhotu Bhai", "role": "Syndicate Operations Commander", "phones": ["+91-9829011990"], "accounts": ["ACC-ICICI-110022"], "vehicles": ["RJ-14-GH-1001"], "city": "Jaipur", "address": "Vaishali Nagar, Jaipur, Rajasthan"},
                {"id": "P-GNG-02", "name": "Harshvardhan Rathore", "alias": "The Banker", "role": "Extortion Proceeds Custodian", "phones": ["+91-9829022881"], "accounts": ["ACC-HDFC-332211"], "vehicles": ["RJ-19-CB-4499"], "city": "Jodhpur", "address": "Sardarpura, Jodhpur, Rajasthan"},
                {"id": "P-GNG-03", "name": "Karan Mehra", "alias": "Shooter / Recce", "role": "Tactical Operative", "phones": ["+91-9829033772"], "accounts": ["ACC-SBI-554433"], "vehicles": ["DL-1C-ZZ-8811"], "city": "New Delhi", "address": "Dwarka Sector 10, New Delhi"},
                {"id": "P-GNG-04", "name": "Sandeep Tanwar", "alias": "Logistics Safehouse", "role": "Safehouse Provider", "phones": ["+91-9829044663"], "accounts": ["ACC-AXIS-776655"], "vehicles": ["RJ-32-BB-2233"], "city": "Kotputli", "address": "Delhi-Jaipur Expressway, Kotputli"}
            ],
            "phones": [
                {"id": "PH-GNG-01", "number": "+91-9829011990", "carrier": "Airtel Rajasthan", "imei": "864401061122880", "subscriber": "Tejpal Bishnoi"},
                {"id": "PH-GNG-02", "number": "+91-9829022881", "carrier": "Jio Rajasthan", "imei": "864401061122881", "subscriber": "Harshvardhan Rathore"}
            ],
            "accounts": [
                {"id": "ACC-ICICI-110022", "number": "1100223344", "bank": "ICICI Bank", "holder": "Apex Stone Crushers", "branch": "Vaishali Nagar Jaipur", "balance": "₹48,00,000"},
                {"id": "ACC-HDFC-332211", "number": "3322119988", "bank": "HDFC Bank", "holder": "Rathore Minerals & Agro", "branch": "Sardarpura Jodhpur", "balance": "₹72,00,000"}
            ],
            "vehicles": [
                {"id": "VEH-RJ14-1001", "plate": "RJ-14-GH-1001", "model": "Toyota Land Cruiser Prado (White)", "owner": "Tejpal Bishnoi", "chassis": "JTEBX29J0098231"},
                {"id": "VEH-RJ19-4499", "plate": "RJ-19-CB-4499", "model": "Mahindra Thar 4x4 (Black)", "owner": "Harshvardhan Rathore", "chassis": "MA1TB2TH0019283"}
            ],
            "locations": [
                {"id": "LOC-GNG-01", "name": "Jaipur Syndicate Safehouse Core", "lat": 26.9124, "lng": 75.7873, "city": "Jaipur", "address": "Queens Road, Vaishali Nagar, Jaipur, Rajasthan 302021"},
                {"id": "LOC-GNG-02", "name": "Delhi-Jaipur Highway Relay Safehouse", "lat": 27.7025, "lng": 76.2008, "city": "Kotputli", "address": "NH-48 Corridor, Kotputli, Rajasthan 303108"}
            ],
            "organizations": [
                {"id": "ORG-GNG-01", "name": "Apex Stone Crushers & Minerals", "type": "Front Business", "cin": "U14100RJ2021PTC071234", "reg_address": "Vaishali Nagar, Jaipur"}
            ],
            "firs": [
                {"id": "FIR-GNG-01", "number": "FIR/OC/2026/0890", "station": "Organised Crime Branch Jaipur", "sections": "BNS §111, §308, §351", "summary": "Organised crime syndicate executing targeted extortion calls and harbouring armed fugitives."}
            ],
            "crimes": [
                {"id": "CRM-GNG-01", "code": "CR-EXT-01", "category": "Organized Extortion & Gang Activity", "desc": "Virtual VoIP extortion calls demanding protection payoffs"}
            ],
            "transactions": [
                {"id": "TXN-GNG-01", "from": "ACC-ICICI-110022", "to": "ACC-HDFC-332211", "amount": 2500000, "date": "2026-02-22", "method": "RTGS"}
            ],
            "comms": [
                {"id": "COM-GNG-01", "caller": "+91-9829011990", "receiver": "+91-9829022881", "timestamp": "2026-02-22T11:20:00Z", "duration": 280, "tower": "Jaipur Vaishali Nagar BTS 1"}
            ],
            "evidence": [
                {"id": "EVD-GNG-01", "title": "Extortion Audio Recording & Voice Biometric Match.wav", "type": "Audio Forensic Recording", "sha": "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff", "cert": "BSA-63-2026-EVD-GNG-01", "officer": "IG Bhupendra Shekhawat", "loc": "Cyber Cell Vault Jaipur"}
            ],
            "timeline": [
                {"id": "EVT-GNG-01", "ts": "2026-02-22T10:00:00Z", "type": "COMMUNICATION", "title": "Virtual VoIP Extortion Call Intercepted", "desc": "Extortion demand of ₹2 Crore placed to prominent Jaipur jeweler using spoofed Canadian number.", "p_id": "P-GNG-01", "p_name": "Tejpal Bishnoi", "loc": "Jaipur Syndicate Safehouse Core"},
                {"id": "EVT-GNG-02", "ts": "2026-02-22T15:30:00Z", "type": "LOCATION", "title": "Safehouse Cell Mobility Detected", "desc": "Target vehicle tracked heading north on NH-48 towards Kotputli border safehouse.", "p_id": "P-GNG-03", "p_name": "Karan Mehra", "loc": "Delhi-Jaipur Highway Relay Safehouse"}
            ],
            "alerts": [
                {"id": "ALT-GNG-01", "type": "Communication Pattern", "sev": "CRITICAL", "title": "Virtual Number Spoofing Detection", "desc": "VoIP SIP trunk identified routing spoofed North American numbers to local telecom subscribers.", "entity_id": "P-GNG-01", "entity_name": "Tejpal Bishnoi"}
            ],
            "watchlist": [
                {"id": "WCH-GNG-01", "type": "Person", "val": "P-GNG-01", "name": "Tejpal Bishnoi", "reason": "Inter-state gang operations commander under BNS Section 111.", "prio": "CRITICAL"}
            ]
        }
    ]

    total_inserted = {
        "cases": 0, "entities": 0, "relationships": 0, "evidence": 0,
        "alerts": 0, "watchlist": 0, "timeline": 0, "memberships": 0
    }

    for cs in cases_spec:
        cid = cs["case_id"]

        # 1. Insert Case and flush immediately so FK constraints pass
        c_model = CaseModel(
            case_id=cid,
            case_number=cs["case_number"],
            title=cs["title"],
            description=cs["description"],
            assigned_investigator=cs["assigned_investigator"],
            assigned_team=cs["assigned_team"],
            status=cs["status"],
            priority=cs["priority"],
            jurisdiction=cs["jurisdiction"],
            police_station=cs["police_station"],
            case_type=cs["case_type"],
            created_at=datetime.now(timezone.utc) - timedelta(days=15)
        )
        db.add(c_model)
        db.flush()
        total_inserted["cases"] += 1

        # 2. Case Memberships for all users
        for email in user_emails:
            cm = CaseMembershipModel(
                case_id=cid,
                user_email=email,
                membership_role="OWNER" if "admin" in email.lower() or "deep" in email.lower() else "MEMBER"
            )
            db.add(cm)
            total_inserted["memberships"] += 1

        # Track entities to create network edges
        person_ids = []
        phone_ids = []
        account_ids = []
        vehicle_ids = []
        loc_ids = []
        org_ids = []
        fir_ids = []
        crime_ids = []

        # 3. Persons
        for p in cs.get("persons", []):
            person_ids.append(p["id"])
            ent = EntityModel(
                entity_id=p["id"],
                case_id=cid,
                entity_type="Person",
                canonical_name=p["name"],
                confidence="0.98",
                properties={
                    "id": p["id"],
                    "name": p["name"],
                    "fullName": p["name"],
                    "canonicalName": p["name"],
                    "alias": p["alias"],
                    "role": p["role"],
                    "city": p.get("city", "Mumbai"),
                    "address": p.get("address", ""),
                    "phoneNumbers": p.get("phones", []),
                    "associatedPhones": p.get("phones", []),
                    "bankAccounts": p.get("accounts", []),
                    "associatedAccounts": p.get("accounts", []),
                    "vehicles": p.get("vehicles", []),
                    "riskScore": 0.92,
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 4. Phones
        for ph in cs.get("phones", []):
            phone_ids.append(ph["id"])
            ent = EntityModel(
                entity_id=ph["id"],
                case_id=cid,
                entity_type="Phone",
                canonical_name=ph["number"],
                confidence="0.96",
                properties={
                    "id": ph["id"],
                    "phoneNumber": ph["number"],
                    "canonicalName": ph["number"],
                    "carrier": ph.get("carrier", "Telecom Carrier"),
                    "imei": ph.get("imei", "864201040000000"),
                    "subscriberName": ph.get("subscriber", "Verified Subscriber"),
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 5. Accounts
        for acc in cs.get("accounts", []):
            account_ids.append(acc["id"])
            ent = EntityModel(
                entity_id=acc["id"],
                case_id=cid,
                entity_type="BankAccount",
                canonical_name=f"{acc['bank']} - {acc['id']}",
                confidence="0.98",
                properties={
                    "id": acc["id"],
                    "accountNumber": acc["number"],
                    "bankName": acc["bank"],
                    "accountHolder": acc["holder"],
                    "branch": acc["branch"],
                    "balance": acc.get("balance", "₹0"),
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 6. Vehicles
        for v in cs.get("vehicles", []):
            vehicle_ids.append(v["id"])
            ent = EntityModel(
                entity_id=v["id"],
                case_id=cid,
                entity_type="Vehicle",
                canonical_name=v["plate"],
                confidence="0.95",
                properties={
                    "id": v["id"],
                    "registrationNumber": v["plate"],
                    "model": v["model"],
                    "owner": v["owner"],
                    "chassis": v["chassis"],
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 7. Locations
        for loc in cs.get("locations", []):
            loc_ids.append(loc["id"])
            ent = EntityModel(
                entity_id=loc["id"],
                case_id=cid,
                entity_type="Location",
                canonical_name=loc["name"],
                confidence="0.97",
                properties={
                    "id": loc["id"],
                    "locationName": loc["name"],
                    "latitude": loc["lat"],
                    "longitude": loc["lng"],
                    "city": loc["city"],
                    "address": loc["address"],
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 8. Organizations
        for org in cs.get("organizations", []):
            org_ids.append(org["id"])
            ent = EntityModel(
                entity_id=org["id"],
                case_id=cid,
                entity_type="Organization",
                canonical_name=org["name"],
                confidence="0.95",
                properties={
                    "id": org["id"],
                    "orgName": org["name"],
                    "type": org["type"],
                    "cin": org["cin"],
                    "registeredAddress": org["reg_address"],
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 9. FIRs
        for fir in cs.get("firs", []):
            fir_ids.append(fir["id"])
            ent = EntityModel(
                entity_id=fir["id"],
                case_id=cid,
                entity_type="FIR",
                canonical_name=fir["number"],
                confidence="0.99",
                properties={
                    "id": fir["id"],
                    "firNumber": fir["number"],
                    "policeStation": fir["station"],
                    "actsSections": [fir["sections"]],
                    "incidentSummary": fir["summary"],
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 10. Crimes
        for cr in cs.get("crimes", []):
            crime_ids.append(cr["id"])
            ent = EntityModel(
                entity_id=cr["id"],
                case_id=cid,
                entity_type="Crime",
                canonical_name=f"{cr['category']} ({cr['code']})",
                confidence="0.98",
                properties={
                    "id": cr["id"],
                    "crimeCode": cr["code"],
                    "crimeCategory": cr["category"],
                    "description": cr["desc"],
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 11. Transactions
        for tx in cs.get("transactions", []):
            ent = EntityModel(
                entity_id=tx["id"],
                case_id=cid,
                entity_type="Transaction",
                canonical_name=f"Transfer INR {tx['amount']:,.2f}",
                confidence="0.98",
                properties={
                    "id": tx["id"],
                    "transactionId": tx["id"],
                    "sourceAccount": tx["from"],
                    "destinationAccount": tx["to"],
                    "amount": tx["amount"],
                    "transactionDate": tx["date"],
                    "method": tx["method"],
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 12. Communications
        for cm in cs.get("comms", []):
            ent = EntityModel(
                entity_id=cm["id"],
                case_id=cid,
                entity_type="Communication",
                canonical_name=f"Call ({cm['duration']}s) on {cm['tower']}",
                confidence="0.97",
                properties={
                    "id": cm["id"],
                    "commId": cm["id"],
                    "callerPhone": cm["caller"],
                    "receiverPhone": cm["receiver"],
                    "timestamp": cm["timestamp"],
                    "duration": cm["duration"],
                    "tower": cm["tower"],
                    "caseId": cid
                }
            )
            db.add(ent)
            total_inserted["entities"] += 1

        # 13. Evidence Items (Entities & EvidenceModel rows)
        for ev in cs.get("evidence", []):
            ev_model = EvidenceModel(
                evidence_id=ev["id"],
                case_id=cid,
                entity_type="Evidence",
                canonical_name=ev["title"],
                evidence_number=ev["id"],
                evidence_type=ev["type"],
                description=f"Authentic digital forensic artifact registered under BSA Section 63/65B. Case {cid}.",
                collected_date="2026-02-14",
                collected_by=ev["officer"],
                storage_location=ev["loc"],
                sha256_hash=ev["sha"],
                bsa_certificate_id=ev["cert"],
                confidence="1.0",
                metadata_json={
                    "category": ev["type"],
                    "originalHash": ev["sha"],
                    "sha256": ev["sha"],
                    "bsaSection65BCertificateId": ev["cert"],
                    "custodian": ev["loc"],
                    "fileSize": 2048576,
                    "previewUrl": None
                }
            )
            db.add(ev_model)
            total_inserted["evidence"] += 1

            # Also create as Entity for graph linking
            ev_ent = EntityModel(
                entity_id=ev["id"],
                case_id=cid,
                entity_type="Evidence",
                canonical_name=ev["title"],
                confidence="1.0",
                properties={
                    "id": ev["id"],
                    "canonicalName": ev["title"],
                    "evidenceNumber": ev["id"],
                    "evidenceType": ev["type"],
                    "sha256Hash": ev["sha"],
                    "bsaCertificateId": ev["cert"],
                    "caseId": cid
                }
            )
            db.add(ev_ent)
            total_inserted["entities"] += 1

        # 14. Relationships (Network Edges)
        edge_id = 1
        def add_edge(src, tgt, rel_type, props=None):
            nonlocal edge_id
            rid = f"REL-{cid}-{edge_id:03d}"
            edge_id += 1
            rel = RelationshipModel(
                relationship_id=rid,
                case_id=cid,
                source_id=src,
                target_id=tgt,
                relationship_type=rel_type,
                confidence="0.95",
                properties=props or {}
            )
            db.add(rel)
            total_inserted["relationships"] += 1

        # Inter-person co-conspirator edges
        if len(person_ids) >= 2:
            add_edge(person_ids[0], person_ids[1], "CO_ACCUSED", {"relationship": "Syndicate Co-Conspirator"})
        if len(person_ids) >= 3:
            add_edge(person_ids[0], person_ids[2], "OPERATES_UNDER", {"role": "Direct Superior"})
            add_edge(person_ids[1], person_ids[2], "CO_ACCUSED", {"channel": "Logistics Dispatch"})
        if len(person_ids) >= 4:
            add_edge(person_ids[2], person_ids[3], "COURIER_LINK", {"task": "Cash Transit"})

        # Person -> Phone
        for i, ph_id in enumerate(phone_ids):
            if i < len(person_ids):
                add_edge(person_ids[i], ph_id, "PERSON_USES_PHONE", {"ownership": "Registered Subscriber"})

        # Person -> Account
        for i, acc_id in enumerate(account_ids):
            if i < len(person_ids):
                add_edge(person_ids[i], acc_id, "PERSON_OWNS_ACCOUNT", {"role": "Authorized Signatory"})

        # Account -> Account (Transfer)
        for tx in cs.get("transactions", []):
            add_edge(tx["from"], tx["to"], "ACCOUNT_TRANSFER", {"amount": tx["amount"], "method": tx["method"]})

        # Person -> Vehicle
        for i, veh_id in enumerate(vehicle_ids):
            if i < len(person_ids):
                add_edge(person_ids[i], veh_id, "OPERATES_VEHICLE", {"status": "Daily Driver"})

        # Person -> Location
        for i, loc_id in enumerate(loc_ids):
            if i < len(person_ids):
                add_edge(person_ids[i], loc_id, "LOCATED_AT", {"frequency": "Primary Operational Base"})

        # Person -> Organization
        for org_id in org_ids:
            if person_ids:
                add_edge(person_ids[0], org_id, "DIRECTOR_OF", {"shareholding": "99%"})
            if len(person_ids) > 1:
                add_edge(person_ids[1], org_id, "PERSON_MEMBER_OF_ORG", {"role": "Managing Director"})

        # FIR -> Person
        for fir_id in fir_ids:
            for pid in person_ids[:3]:
                add_edge(fir_id, pid, "FIR_NAMES_PERSON", {"charge": "Named Accused"})

        # Crime -> FIR
        for cr_id in crime_ids:
            if fir_ids:
                add_edge(fir_ids[0], cr_id, "INVESTIGATES_CRIME", {"statutoryAct": "BNS / PMLA"})

        # Evidence -> Person / Case
        for ev in cs.get("evidence", []):
            if person_ids:
                add_edge(ev["id"], person_ids[0], "EVIDENCE_INCRIMINATES", {"custodyStatus": "Seized"})

        # 15. Timeline Events
        for tl in cs.get("timeline", []):
            tl_model = TimelineEventModel(
                event_id=tl["id"],
                case_id=cid,
                timestamp=tl["ts"],
                event_type=tl["type"],
                title=tl["title"],
                description=tl["desc"],
                primary_entity_id=tl["p_id"],
                primary_entity_name=tl["p_name"],
                secondary_entity_id=tl.get("s_id"),
                secondary_entity_name=tl.get("s_name"),
                location=tl.get("loc"),
                source_document=f"{cid}_investigation_docket.pdf",
                evidence_id=cs.get("evidence", [{}])[0].get("id"),
                metadata_json={"caseId": cid, "classification": "LEO Verified"}
            )
            db.add(tl_model)
            total_inserted["timeline"] += 1

        # 16. Alerts
        for al in cs.get("alerts", []):
            al_model = AlertModel(
                alert_id=al["id"],
                case_id=cid,
                alert_type=al["type"],
                severity=al["sev"],
                title=al["title"],
                description=al["desc"],
                related_entity_id=al["entity_id"],
                related_entity_name=al["entity_name"],
                evidence_id=cs.get("evidence", [{}])[0].get("id"),
                status="UNRESOLVED",
                is_read=False,
                metadata_json={
                    "caseId": cid,
                    "category": al["type"],
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            )
            db.add(al_model)
            total_inserted["alerts"] += 1

        # 17. Watchlist Items
        for wl in cs.get("watchlist", []):
            wl_model = WatchlistModel(
                watch_id=wl["id"],
                case_id=cid,
                entity_type=wl["type"],
                identifier_value=wl["val"],
                canonical_name=wl["name"],
                reason=wl["reason"],
                priority=wl["prio"],
                added_by=cs["assigned_investigator"],
                added_at=datetime.now(timezone.utc) - timedelta(days=5),
                is_active=True,
                match_count=7
            )
            db.add(wl_model)
            total_inserted["watchlist"] += 1

        # Commit per case to preserve transaction integrity
        db.commit()
        print(f"  + Seeded {cid}: {cs['title']}")

    print("=" * 60)
    print("SEEDING SUMMARY:")
    for k, v in total_inserted.items():
        print(f"  - Total {k}: {v}")
    print("=" * 60)

def main():
    print(f"Connecting to database via: {engine.url.render_as_string(hide_password=True)}")
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        reset_database(db)
        seed_cases(db)
        print("Database successfully wiped and seeded with 10 investigation cases!")
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"FATAL: Database reset and seed failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
