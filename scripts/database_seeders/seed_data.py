import uuid
import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "postgresql://postgres.jzdrpxsyuyuxkabpgfwr:VaghasiyaDeep%402008@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_postgres_data(session):
    print("Creating Postgres data...")
    cases = [
        ("CASE-9001", "OP-NARCO", "Cross-Border Narcotics Smuggling", "Operation intercepting a major narcotics ring operating across international borders.", "Mumbai PD", "active", "high"),
        ("CASE-9002", "OP-EMBEZZLE", "Corporate Embezzlement Syndicate", "Investigation into systematic siphoning of corporate funds through layered shell companies.", "EOW Delhi", "active", "high"),
        ("CASE-9003", "OP-RANSOM", "Cyber-Ransomware Extortion Ring", "Tracking a distributed cybercriminal group demanding cryptocurrency ransoms.", "Cyber Cell Bengaluru", "active", "critical"),
        ("CASE-9004", "OP-TRAFFIC", "Human Trafficking & Fake Passports", "Dismantling a human trafficking ring producing forged travel documents.", "CBI Anti-Trafficking", "active", "high"),
        ("CASE-9005", "OP-KICKBACK", "Political Corruption & Kickbacks", "Uncovering illicit political donations and kickbacks for public infrastructure contracts.", "CBI Anti-Corruption", "active", "medium")
    ]
    for case_id, case_num, title, desc, jur, status, prio in cases:
        session.execute(text(f"""
            INSERT INTO cases (case_id, case_number, title, description, assigned_investigator, assigned_team, status, priority, jurisdiction, police_station, case_type)
            VALUES ('{case_id}', '{case_num}', '{title}', '{desc}', 'yakshvachhani4@gmail.com', 'Special Task Force', '{status}', '{prio}', '{jur}', 'HQ', 'Criminal Investigation')
            ON CONFLICT (case_id) DO NOTHING;
        """))
        session.execute(text(f"""
            INSERT INTO case_memberships (case_id, user_email, membership_role)
            VALUES ('{case_id}', 'yakshvachhani4@gmail.com', 'OWNER')
            ON CONFLICT ON CONSTRAINT uq_case_member DO NOTHING;
        """))
        session.execute(text(f"""
            INSERT INTO case_notes (note_id, case_id, content, author_email, author_name)
            VALUES ('{str(uuid.uuid4())}', '{case_id}', 'Initial analysis initialized. Graph analytics activated to detect hidden relationships.', 'yakshvachhani4@gmail.com', 'Lead Investigator')
            ON CONFLICT (note_id) DO NOTHING;
        """))
        session.execute(text(f"""
            INSERT INTO alerts (alert_id, case_id, alert_type, severity, title, description, related_entity_id, related_entity_name, status, is_read, metadata_json)
            VALUES 
            ('{str(uuid.uuid4())}', '{case_id}', 'Cross-Verification Conflict', 'HIGH', 'Identity Discrepancy Detected', 'The registered address for the primary suspect conflicts across 3 separate financial databases.', 'ENT-SUSPECT-{case_id}', 'John Doe', 'UNRESOLVED', false, '{{}}'::json),
            ('{str(uuid.uuid4())}', '{case_id}', 'Network Anomaly', 'CRITICAL', 'Hidden Community Cluster Detected', 'Graph analytics engine detected a highly dense subgraph indicating a coordinated cell.', 'CLUSTER-{case_id}', 'Unknown Cell', 'UNRESOLVED', false, '{{}}'::json)
            ON CONFLICT (alert_id) DO NOTHING;
        """))
        session.execute(text(f"""
            INSERT INTO evidence_items (evidence_id, case_id, entity_type, canonical_name, evidence_number, evidence_type, description, collected_date, collected_by, storage_location, sha256_hash, metadata_json)
            VALUES 
            ('{str(uuid.uuid4())}', '{case_id}', 'Evidence', 'Seized Ledger', 'EV-01', 'Document', 'Ledger detailing illicit transactions and bank accounts.', '2026-10-01', 'Tactical Team Alpha', '{case_id}/ledger.pdf', 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e', '{{}}'::json),
            ('{str(uuid.uuid4())}', '{case_id}', 'Evidence', 'Encrypted Hard Drive', 'EV-02', 'Digital', 'Hard drive containing encrypted communications.', '2026-10-02', 'Cyber Forensics Unit', '{case_id}/drive.dd', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', '{{}}'::json)
            ON CONFLICT (evidence_id) DO NOTHING;
        """))
        session.execute(text(f"""
            INSERT INTO watchlist_items (watch_id, case_id, entity_type, identifier_value, canonical_name, reason, priority, added_by, is_active, match_count)
            VALUES 
            ('{str(uuid.uuid4())}', '{case_id}', 'Person', 'ID-{case_id}-001', 'High Value Target Alpha', 'Primary orchestrator of the operation.', 'HIGH', 'yakshvachhani4@gmail.com', true, 3)
            ON CONFLICT (watch_id) DO NOTHING;
        """))
        
        entities = [
            (f"ORG-{case_id}", "Organization", f"Syndicate {case_id}", '{"type": "Organization", "riskScore": 90}'),
            (f"P1-{case_id}", "Person", f"Kingpin {case_id}", '{"type": "Person", "riskScore": 95, "city": "Mumbai", "role": "Kingpin"}'),
            (f"P2-{case_id}", "Person", "Lieutenant A", '{"type": "Person", "riskScore": 80, "city": "Delhi", "role": "Lieutenant"}'),
            (f"P3-{case_id}", "Person", "Lieutenant B", '{"type": "Person", "riskScore": 75, "city": "Surat", "role": "Lieutenant"}'),
            (f"BA1-{case_id}", "BankAccount", f"Offshore Account {case_id}", '{"type": "BankAccount", "bankName": "Swiss Bank"}'),
            (f"PH1-{case_id}", "Phone", "+1-555-0192", '{"type": "Phone", "provider": "Verizon"}'),
            (f"LOC1-{case_id}", "Location", "Safehouse Alpha", '{"type": "Location", "latitude": 19.0760, "longitude": 72.8777}'),
            (f"LOC2-{case_id}", "Location", "Drop Point Beta", '{"type": "Location", "latitude": 28.7041, "longitude": 77.1025}')
        ]
        
        for eid, etype, cname, props in entities:
            session.execute(text(f"""
                INSERT INTO entities (entity_id, case_id, entity_type, canonical_name, properties)
                VALUES ('{eid}', '{case_id}', '{etype}', '{cname}', '{props}'::jsonb)
                ON CONFLICT (entity_id) DO NOTHING;
            """))
            
        rels = [
            (f"P1-{case_id}", f"ORG-{case_id}", "LEADS"),
            (f"P2-{case_id}", f"P1-{case_id}", "WORKS_FOR"),
            (f"P3-{case_id}", f"P1-{case_id}", "WORKS_FOR"),
            (f"ORG-{case_id}", f"BA1-{case_id}", "OWNS"),
            (f"P2-{case_id}", f"BA1-{case_id}", "TRANSFERRED_FUNDS"),
            (f"P3-{case_id}", f"PH1-{case_id}", "USED"),
            (f"P1-{case_id}", f"LOC1-{case_id}", "VISITED"),
            (f"P2-{case_id}", f"LOC2-{case_id}", "VISITED")
        ]
        
        for src, tgt, rtype in rels:
            rid = str(uuid.uuid4())
            session.execute(text(f"""
                INSERT INTO relationships (relationship_id, case_id, source_id, target_id, relationship_type, properties)
                VALUES ('{rid}', '{case_id}', '{src}', '{tgt}', '{rtype}', '{{}}'::jsonb)
                ON CONFLICT (relationship_id) DO NOTHING;
            """))
            
    session.commit()
    print("Postgres Data, Entities, and Relationships created successfully!")

db = SessionLocal()
try:
    create_postgres_data(db)
except Exception as e:
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
