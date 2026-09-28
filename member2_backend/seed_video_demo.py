import os
import sys
import pandas as pd
from neo4j import GraphDatabase
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import CaseModel

NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "CrimeNetNeo4j123!"

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

CASES = [
    {
        "case_id": "CASE-2025-M3-DATASET",
        "title": "Operation Falcon Web - National Contraband & Communications Syndicate",
        "description": "Primary national organized crime syndicate synthesized from the Member 3 dataset (Persons, Transactions, CDR Calls, and FIR records).",
        "assigned_investigator": "Deputy Director V. Rao",
        "status": "active",
        "priority": "critical"
    },
    {
        "case_id": "CASE-VIDEO-001",
        "title": "Operation Golden Fleece - Financial Syndicate",
        "description": "Massive money laundering operation spanning multiple offshore shell companies.",
        "assigned_investigator": "Inspector Sharma",
        "status": "active",
        "priority": "critical"
    },
    {
        "case_id": "CASE-VIDEO-002",
        "title": "Operation White Dust - Narcotics Ring",
        "description": "Multi-state drug trafficking ring using domestic courier services.",
        "assigned_investigator": "Officer Reddy",
        "status": "active",
        "priority": "high"
    },
    {
        "case_id": "CASE-VIDEO-003",
        "title": "Operation Phishnet - Cyber Fraud",
        "description": "Organized cyber fraud targeting elderly citizens through fake banking portals.",
        "assigned_investigator": "Inspector Khan",
        "status": "active",
        "priority": "high"
    },
    {
        "case_id": "CASE-VIDEO-004",
        "title": "Operation Iron Shield - Human Trafficking",
        "description": "Cross-border human trafficking and exploitation ring.",
        "assigned_investigator": "Officer Patel",
        "status": "active",
        "priority": "critical"
    }
]

DATASET_PATH = "../member3_data_graph/datasets/"

def seed_sql():
    print("Seeding SQL Cases...")
    db = SessionLocal()
    try:
        case_ids = [c["case_id"] for c in CASES]
        db.query(CaseModel).filter(CaseModel.case_id.in_(case_ids)).delete(synchronize_session=False)
        db.commit()

        for c in CASES:
            case = CaseModel(
                case_id=c["case_id"],
                case_number=c["case_id"],
                title=c["title"],
                description=c["description"],
                assigned_investigator=c["assigned_investigator"],
                assigned_team="National Cyber & Intelligence Taskforce",
                status=c["status"],
                priority=c["priority"],
                jurisdiction="National Multi-State Cyber & Economic Zone",
                police_station="Central Intelligence Grid HQ, New Delhi"
            )
            db.add(case)
        db.commit()
        print(f"SQL seeding complete with {len(CASES)} cases.")
    finally:
        db.close()

def clear_neo4j(tx):
    tx.run("MATCH (n) WHERE n.caseId STARTS WITH 'CASE-VIDEO' OR n.caseId = 'CASE-2025-M3-DATASET' DETACH DELETE n")

def insert_persons(tx, case_id, df):
    query = """
    UNWIND $rows AS row
    MERGE (p:Person:Entity {id: row.person_id + '_' + $case_id})
    SET p.name = row.name,
        p.age = toInteger(row.age),
        p.city = row.city,
        p.role = row.role,
        p.caseId = $case_id,
        p.person_id = row.person_id,
        p.original_id = row.person_id
    """
    tx.run(query, rows=df.to_dict('records'), case_id=case_id)

    # For CASE-2025-M3-DATASET, also create direct person_id nodes so raw CSV imports connect seamlessly
    if case_id == 'CASE-2025-M3-DATASET':
        query_direct = """
        UNWIND $rows AS row
        MERGE (p:Person:Entity {id: row.person_id})
        SET p.name = row.name,
            p.age = toInteger(row.age),
            p.city = row.city,
            p.role = row.role,
            p.caseId = $case_id,
            p.person_id = row.person_id
        """
        tx.run(query_direct, rows=df.to_dict('records'), case_id=case_id)

def insert_transactions(tx, case_id, df):
    query = """
    UNWIND $rows AS row
    MERGE (s:Person {id: row.sender_id + '_' + $case_id})
    SET s.caseId = $case_id, s.original_id = row.sender_id
    
    MERGE (r:Person {id: row.receiver_id + '_' + $case_id})
    SET r.caseId = $case_id, r.original_id = row.receiver_id
    
    MERGE (t:Transaction:FinancialTransaction:Entity {id: row.transaction_id + '_' + $case_id})
    SET t.date = row.date,
        t.amount = toInteger(row.amount_inr),
        t.method = row.method,
        t.location = row.location,
        t.risk_label = row.risk_label,
        t.sender_id = row.sender_id + '_' + $case_id,
        t.receiver_id = row.receiver_id + '_' + $case_id,
        t.caseId = $case_id
        
    MERGE (s)-[:SENT_MONEY {caseId: $case_id}]->(t)
    MERGE (t)-[:RECEIVED_BY {caseId: $case_id}]->(r)
    """
    tx.run(query, rows=df.to_dict('records'), case_id=case_id)

def insert_calls(tx, case_id, df):
    query = """
    UNWIND $rows AS row
    MERGE (c1:Person {id: row.caller_id + '_' + $case_id})
    SET c1.caseId = $case_id, c1.original_id = row.caller_id
    
    MERGE (c2:Person {id: row.receiver_id + '_' + $case_id})
    SET c2.caseId = $case_id, c2.original_id = row.receiver_id
    
    MERGE (c:Call:Communication:Entity {id: row.call_id + '_' + $case_id})
    SET c.timestamp = row.timestamp,
        c.duration = toInteger(row.duration_sec),
        c.call_type = row.call_type,
        c.status = row.status,
        c.caller_id = row.caller_id + '_' + $case_id,
        c.receiver_id = row.receiver_id + '_' + $case_id,
        c.caseId = $case_id
        
    MERGE (c1)-[:MADE_CALL {caseId: $case_id}]->(c)
    MERGE (c)-[:RECEIVED_BY {caseId: $case_id}]->(c2)
    """
    tx.run(query, rows=df.to_dict('records'), case_id=case_id)

def insert_relationships(tx, case_id, df):
    query = """
    UNWIND $rows AS row
    MERGE (p1:Person {id: row.person_a + '_' + $case_id})
    SET p1.caseId = $case_id, p1.original_id = row.person_a
    
    MERGE (p2:Person {id: row.person_b + '_' + $case_id})
    SET p2.caseId = $case_id, p2.original_id = row.person_b
    
    MERGE (f:FIR:Crime:Entity {id: row.fir_id + '_' + $case_id})
    SET f.crime_type = row.crime_type,
        f.date = row.date,
        f.location = row.location,
        f.case_status = row.case_status,
        f.caseId = $case_id
        
    MERGE (p1)-[:CO_ACCUSED_IN {caseId: $case_id}]->(f)
    MERGE (p2)-[:CO_ACCUSED_IN {caseId: $case_id}]->(f)
    """
    tx.run(query, rows=df.to_dict('records'), case_id=case_id)

def seed_neo4j():
    print("Seeding Neo4j...")
    
    df_persons = pd.read_csv(os.path.join(DATASET_PATH, 'persons.csv'))
    df_tx = pd.read_csv(os.path.join(DATASET_PATH, 'financial_transactions.csv'))
    df_calls = pd.read_csv(os.path.join(DATASET_PATH, 'communication_links.csv'))
    df_rels = pd.read_csv(os.path.join(DATASET_PATH, 'criminal_relationships.csv'))
    
    with driver.session() as session:
        session.execute_write(clear_neo4j)
        
        for i, c in enumerate(CASES):
            case_id = c["case_id"]
            print(f"Loading data for {case_id} ({c['title']})...")
            
            p_sample = df_persons.iloc[i*100:(i+1)*100]
            t_sample = df_tx.iloc[i*100:(i+1)*100]
            c_sample = df_calls.iloc[i*100:(i+1)*100]
            r_sample = df_rels.iloc[i*15:(i+1)*15]
            
            session.execute_write(insert_persons, case_id, p_sample)
            session.execute_write(insert_transactions, case_id, t_sample)
            session.execute_write(insert_calls, case_id, c_sample)
            session.execute_write(insert_relationships, case_id, r_sample)
            
    print("Neo4j seeding complete.")

if __name__ == "__main__":
    seed_sql()
    seed_neo4j()
    print("All 5 cases seeded successfully!")
