import os
import pandas as pd
from neo4j import GraphDatabase

NEO4J_URI = "bolt://localhost:7687"
NEO4J_USER = "neo4j"
NEO4J_PASS = "CrimeNetNeo4j123!"
driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASS))

def batch_import_nodes(session, label, df, id_col, case_id):
    batch_size = 5000
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size].to_dict('records')
        query = f"""
        UNWIND $batch as row
        CREATE (n:{label} {{id: row.{id_col}, caseId: $case_id}})
        SET n += row
        """
        session.run(query, batch=batch, case_id=case_id)
    print(f"Imported {len(df)} {label} nodes for {case_id}")

def batch_import_edges(session, rel_type, df, src_col, tgt_col, case_id):
    batch_size = 5000
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size].to_dict('records')
        query = f"""
        UNWIND $batch as row
        MATCH (s {{id: row.{src_col}, caseId: $case_id}})
        MATCH (t {{id: row.{tgt_col}, caseId: $case_id}})
        CREATE (s)-[r:{rel_type}]->(t)
        SET r += row, r.caseId = $case_id
        """
        session.run(query, batch=batch, case_id=case_id)
    print(f"Imported {len(df)} {rel_type} edges for {case_id}")

def import_all():
    base_dir = "member3_data_graph/datasets"
    print("Reading CSVs...")
    persons_df = pd.read_csv(f"{base_dir}/persons.csv").where(pd.notnull, None)
    tx_df = pd.read_csv(f"{base_dir}/financial_transactions.csv").where(pd.notnull, None)
    comm_df = pd.read_csv(f"{base_dir}/communication_links.csv").where(pd.notnull, None)
    crim_df = pd.read_csv(f"{base_dir}/criminal_relationships.csv").where(pd.notnull, None)
    
    with driver.session() as session:
        print("Clearing graph...")
        session.run("MATCH (n) DETACH DELETE n")
        
        session.run("CREATE INDEX IF NOT EXISTS FOR (n:Person) ON (n.id, n.caseId)")
        
        for case_id, limit in [("CASE-REAL-001", None), ("CASE-REAL-002", 50)]:
            print(f"Loading {case_id}")
            
            p_df = persons_df if limit is None else persons_df.head(limit)
            t_df = tx_df if limit is None else tx_df.head(limit)
            c_df = comm_df if limit is None else comm_df.head(limit)
            cr_df = crim_df if limit is None else crim_df.head(limit)
            
            # Since sender_id, receiver_id, caller_id, receiver_id, person_a, person_b are all person IDs in this schema
            # We just need Person nodes.
            # No separate BankAccount nodes if the IDs are just Person IDs. Actually, tx_df has sender_id and receiver_id which are PERS-...
            # Let's verify this. We'll just import Persons and then map edges between Persons.
            batch_import_nodes(session, "Person", p_df, "person_id", case_id)
            
            batch_import_edges(session, "TRANSACTED_WITH", t_df, "sender_id", "receiver_id", case_id)
            batch_import_edges(session, "COMMUNICATED_WITH", c_df, "caller_id", "receiver_id", case_id)
            batch_import_edges(session, "KNOWS", cr_df, "person_a", "person_b", case_id)
            
if __name__ == "__main__":
    import_all()
    print("Done")
