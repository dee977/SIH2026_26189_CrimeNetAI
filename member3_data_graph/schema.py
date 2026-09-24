from neo4j import GraphDatabase
from config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

NODE_LABELS = [
    "Person", "Phone", "BankAccount", "Vehicle", "Location", 
    "Organization", "FIR", "Crime", "Transaction", "Communication", 
    "Evidence", "Case", "Event"
]

def setup_schema():
    """
    Initializes constraints and indexes for Neo4j.
    Ensures that each node type has a unique ID and indexes on frequently queried fields.
    """
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    with driver.session() as session:
        # Create Unique Constraints for ID
        for label in NODE_LABELS:
            # Using Cypher for Neo4j 5.x+
            constraint_query = f"CREATE CONSTRAINT {label.lower()}_id_unique IF NOT EXISTS FOR (n:{label}) REQUIRE n.id IS UNIQUE"
            try:
                session.run(constraint_query)
            except Exception as e:
                print(f"Constraint creation failed for {label}: {e}")

        # Create Indexes for performance optimization
        indexes = [
            "CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name)",
            "CREATE INDEX phone_number IF NOT EXISTS FOR (p:Phone) ON (p.number)",
            "CREATE INDEX bank_account_num IF NOT EXISTS FOR (b:BankAccount) ON (b.account_number)",
            "CREATE INDEX vehicle_plate IF NOT EXISTS FOR (v:Vehicle) ON (v.license_plate)",
            "CREATE INDEX fir_number IF NOT EXISTS FOR (f:FIR) ON (f.fir_number)",
            "CREATE INDEX trans_time IF NOT EXISTS FOR (t:Transaction) ON (t.timestamp)",
            "CREATE INDEX comms_time IF NOT EXISTS FOR (c:Communication) ON (c.timestamp)",
        ]
        
        for idx_query in indexes:
            try:
                session.run(idx_query)
            except Exception as e:
                print(f"Index creation failed: {e}")
                
    driver.close()
    print("Neo4j Schema setup complete.")

if __name__ == "__main__":
    setup_schema()
