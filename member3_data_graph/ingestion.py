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
