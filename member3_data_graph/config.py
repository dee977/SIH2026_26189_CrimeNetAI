import os

# Neo4j Configuration
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", os.getenv("NEO4J_USERNAME", "neo4j"))
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "CrimeNetNeo4j123!")

# Ingestion Configuration
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "10000"))

# Default stable demo IDs
DEMO_IDS = {
    "FIR": "FIR-DEMO-001",
    "Person_A": "P-DEMO-A",
    "Phone": "PH-DEMO-001",
    "Person_B": "P-DEMO-B",
    "Bank_Account": "BA-DEMO-001",
    "Transaction": "TX-DEMO-001",
    "Organization": "ORG-DEMO-001",
    "Location": "LOC-DEMO-001",
    "Crime": "CR-DEMO-001"
}
