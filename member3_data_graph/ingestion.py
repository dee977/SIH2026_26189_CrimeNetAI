import pandas as pd
from typing import List, Dict, Any
from neo4j import GraphDatabase
from config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, BATCH_SIZE
from models import RelationshipData

class DataIngestor:
    def __init__(self):
        self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))

    def close(self):
        self.driver.close()

    def process_and_clean_dataframe(self, df: pd.DataFrame, model_class) -> List[Dict[str, Any]]:
        """Validates and cleans dataframe rows using Pydantic models."""
        df = df.where(pd.notnull(df), None)  # Replace NaNs with None
        valid_records = []
        for _, row in df.iterrows():
            try:
                # Convert to dict and validate
                data = row.to_dict()
                validated = model_class(**data)
                valid_records.append(validated.model_dump(exclude_none=True))
            except Exception as e:
                print(f"Validation error for record {row.get('id', 'UNKNOWN')}: {e}")
        return valid_records

    def ingest_nodes(self, label: str, records: List[Dict[str, Any]]):
        """Batch insert nodes with idempotent MERGE using UNWIND."""
        if not records:
            return

        query = f"""
        UNWIND $batch AS record
        MERGE (n:{label} {{id: record.id}})
        SET n += record
        """
        
        with self.driver.session() as session:
            for i in range(0, len(records), BATCH_SIZE):
                batch = records[i:i + BATCH_SIZE]
                session.run(query, batch=batch)
                print(f"Ingested {len(batch)} nodes of type {label}.")

    def ingest_relationships(self, records: List[Dict[str, Any]]):
        """Batch insert edges with idempotent MERGE using UNWIND."""
        if not records:
            return

        # Group by pattern for strict Cypher compliance
        grouped = {}
        for r in records:
            pattern = (r['source_label'], r['target_label'], r['rel_type'])
            if pattern not in grouped:
                grouped[pattern] = []
            
            props = {k: v for k, v in r.items() if k not in ('source_label', 'target_label', 'rel_type', 'source_id', 'target_id')}
            grouped[pattern].append({
                "source_id": r['source_id'],
                "target_id": r['target_id'],
                "properties": props
            })

        with self.driver.session() as session:
            for (s_label, t_label, rel_type), batch_records in grouped.items():
                specific_query = f"""
                UNWIND $batch AS record
                MATCH (source:{s_label} {{id: record.source_id}})
                MATCH (target:{t_label} {{id: record.target_id}})
                MERGE (source)-[r:{rel_type}]->(target)
                SET r += record.properties
                """
                for i in range(0, len(batch_records), BATCH_SIZE):
                    batch = batch_records[i:i + BATCH_SIZE]
                    session.run(specific_query, batch=batch)
                    print(f"Ingested {len(batch)} relationships of type {rel_type} ({s_label}->{t_label}).")

    def run_pipeline(self, file_path: str, entity_type: str, model_class):
        print(f"Processing {file_path} for {entity_type}...")
        try:
            df = pd.read_csv(file_path)
            records = self.process_and_clean_dataframe(df, model_class)
            self.ingest_nodes(entity_type, records)
        except Exception as e:
            print(f"Failed to process {file_path}: {e}")

    def run_relationship_pipeline(self, file_path: str):
        print(f"Processing relationships {file_path}...")
        try:
            df = pd.read_csv(file_path)
            records = self.process_and_clean_dataframe(df, RelationshipData)
            self.ingest_relationships(records)
        except Exception as e:
            print(f"Failed to process relationships {file_path}: {e}")

    def ingest_repository_datasets(self, datasets_dir: str = None):
        """
        Loads the primary real datasets from member3_data_graph/datasets:
        - persons.csv -> :Person nodes
        - criminal_relationships.csv -> :FIR nodes & :CO_ACCUSED_WITH, :NAMED_IN_FIR edges
        - financial_transactions.csv -> :Transaction nodes & :TRANSFERRED_FUNDS edges
        - communication_links.csv -> :Communication nodes & :COMMUNICATED_WITH edges
        """
        import os
        if not datasets_dir:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            datasets_dir = os.path.join(base_dir, "datasets")

        print(f"[M3 Ingestion] Ingesting primary real datasets from {datasets_dir}...")
        
        # 1. Setup constraints & indexes
        with self.driver.session() as session:
            session.run("CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE")
            session.run("CREATE CONSTRAINT fir_id_unique IF NOT EXISTS FOR (f:FIR) REQUIRE f.id IS UNIQUE")
            session.run("CREATE CONSTRAINT transaction_id_unique IF NOT EXISTS FOR (t:Transaction) REQUIRE t.id IS UNIQUE")
            session.run("CREATE CONSTRAINT communication_id_unique IF NOT EXISTS FOR (c:Communication) REQUIRE c.id IS UNIQUE")
            session.run("CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name)")
            session.run("CREATE INDEX person_city IF NOT EXISTS FOR (p:Person) ON (p.city)")
            session.run("CREATE INDEX person_role IF NOT EXISTS FOR (p:Person) ON (p.role)")

        # 2. Persons
        persons_csv = os.path.join(datasets_dir, "persons.csv")
        if os.path.exists(persons_csv):
            print(f"[M3 Ingestion] Ingesting persons from {persons_csv}...")
            df_p = pd.read_csv(persons_csv)
            records = []
            for _, r in df_p.iterrows():
                records.append({
                    "id": str(r["person_id"]),
                    "name": str(r["name"]),
                    "canonicalName": str(r["name"]),
                    "age": int(r["age"]) if pd.notnull(r["age"]) else None,
                    "city": str(r["city"]) if pd.notnull(r["city"]) else None,
                    "role": str(r["role"]) if pd.notnull(r["role"]) else None,
                    "entityType": "Person",
                    "source": "persons.csv"
                })
            self.ingest_nodes("Person", records)

        # 3. Criminal Relationships
        crim_csv = os.path.join(datasets_dir, "criminal_relationships.csv")
        if os.path.exists(crim_csv):
            print(f"[M3 Ingestion] Ingesting criminal relationships & FIRs from {crim_csv}...")
            df_c = pd.read_csv(crim_csv)
            fir_records = []
            seen_firs = set()
            for _, r in df_c.iterrows():
                fid = str(r["fir_id"])
                if fid not in seen_firs:
                    seen_firs.add(fid)
                    fir_records.append({
                        "id": fid,
                        "firNumber": fid,
                        "canonicalName": f"FIR {fid} ({r['crime_type']} - {r['location']})",
                        "crime_type": str(r["crime_type"]),
                        "date": str(r["date"]),
                        "location": str(r["location"]),
                        "case_status": str(r["case_status"]),
                        "entityType": "FIR",
                        "source": "criminal_relationships.csv"
                    })
            self.ingest_nodes("FIR", fir_records)

            rel_records = []
            for _, r in df_c.iterrows():
                rel_records.append({
                    "source_id": str(r["person_a"]),
                    "target_id": str(r["person_b"]),
                    "source_label": "Person",
                    "target_label": "Person",
                    "rel_type": "CO_ACCUSED_WITH",
                    "fir_id": str(r["fir_id"]),
                    "crime_type": str(r["crime_type"]),
                    "date": str(r["date"]),
                    "location": str(r["location"]),
                    "case_status": str(r["case_status"]),
                    "source": "criminal_relationships.csv"
                })
            self.ingest_relationships(rel_records)

        print("[M3 Ingestion] Primary real datasets successfully ingested into Neo4j.")

if __name__ == "__main__":
    ingestor = DataIngestor()
    try:
        ingestor.ingest_repository_datasets()
    finally:
        ingestor.close()
