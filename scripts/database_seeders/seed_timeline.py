import uuid
import random
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "postgresql://postgres.jzdrpxsyuyuxkabpgfwr:VaghasiyaDeep%402008@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_timeline_data(session):
    print("Adding Timeline data...")
    cases = ["CASE-9001", "CASE-9002", "CASE-9003", "CASE-9004", "CASE-9005"]
    for case_id in cases:
        entities = [
            (f"TX1-{case_id}", "Transaction", "Wire Transfer $15,000", '{"type": "Transaction", "amount": 15000, "transactionDate": "2026-09-15T10:00:00Z", "timestamp": "2026-09-15T10:00:00Z", "sourceAccount": "P4", "destinationAccount": "BA1", "method": "Wire"}'),
            (f"TX2-{case_id}", "Transaction", "Wire Transfer $22,000", '{"type": "Transaction", "amount": 22000, "transactionDate": "2026-09-16T14:30:00Z", "timestamp": "2026-09-16T14:30:00Z", "sourceAccount": "P5", "destinationAccount": "BA1", "method": "Wire"}'),
            (f"COMM1-{case_id}", "Communication", "Encrypted Call (120s)", '{"type": "Communication", "callType": "Voice", "timestamp": "2026-09-17T09:15:00Z", "callerPhone": "P2", "receiverPhone": "PH1", "status": "Answered", "duration": 120}')
        ]
        
        for eid, etype, cname, props in entities:
            session.execute(text(f"""
                INSERT INTO entities (entity_id, case_id, entity_type, canonical_name, properties)
                VALUES ('{eid}', '{case_id}', '{etype}', '{cname}', '{props}'::jsonb)
                ON CONFLICT (entity_id) DO NOTHING;
            """))
            
        rels = [
            (f"P4-{case_id}", f"TX1-{case_id}", "INITIATED"),
            (f"TX1-{case_id}", f"BA1-{case_id}", "DEPOSITED_TO"),
            (f"P2-{case_id}", f"COMM1-{case_id}", "MADE_CALL")
        ]
        
        for src, tgt, rtype in rels:
            rid = str(uuid.uuid4())
            session.execute(text(f"""
                INSERT INTO relationships (relationship_id, case_id, source_id, target_id, relationship_type, properties)
                VALUES ('{rid}', '{case_id}', '{src}', '{tgt}', '{rtype}', '{{}}'::jsonb)
                ON CONFLICT (relationship_id) DO NOTHING;
            """))
            
    session.commit()
    print("Timeline data created successfully!")

db = SessionLocal()
try:
    add_timeline_data(db)
except Exception as e:
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
