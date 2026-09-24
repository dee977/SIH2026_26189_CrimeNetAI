from neo4j import Transaction

def get_entity(tx: Transaction, entity_id: str, label: str = None) -> dict:
    """Retrieve a specific entity by its ID, optionally filtered by label."""
    label_query = f":{label}" if label else ""
    query = f"""
    MATCH (n{label_query} {{id: $entity_id}})
    RETURN properties(n) AS entity, labels(n) AS labels
    """
    result = tx.run(query, entity_id=entity_id)
    record = result.single()
    return {"entity": record["entity"], "labels": record["labels"]} if record else None

def get_neighbors(tx: Transaction, entity_id: str, label: str = None, max_depth: int = 1) -> list:
    """Retrieve all neighbor entities up to a given depth."""
    label_query = f":{label}" if label else ""
    query = f"""
    MATCH (n{label_query} {{id: $entity_id}})-[*1..{max_depth}]-(m)
    RETURN DISTINCT properties(m) AS neighbor, labels(m) AS labels
    """
    result = tx.run(query, entity_id=entity_id)
    return [{"neighbor": record["neighbor"], "labels": record["labels"]} for record in result]

def get_relationships(tx: Transaction, entity_id: str, label: str = None) -> list:
    """Retrieve all relationships (edges) for a given entity."""
    label_query = f":{label}" if label else ""
    query = f"""
    MATCH (n{label_query} {{id: $entity_id}})-[r]-(m)
    RETURN 
        properties(n) AS source, 
        type(r) AS rel_type, 
        properties(r) AS rel_props, 
        properties(m) AS target
    """
    result = tx.run(query, entity_id=entity_id)
    return [
        {
            "source": record["source"],
            "rel_type": record["rel_type"],
            "rel_props": record["rel_props"],
            "target": record["target"]
        } for record in result
    ]

def get_case_subgraph(tx: Transaction, case_id: str) -> list:
    """Retrieve all entities and relationships associated with a specific case_id."""
    query = """
    MATCH (n)-[r]-(m)
    WHERE n.case_id = $case_id OR r.case_id = $case_id OR m.case_id = $case_id
    RETURN DISTINCT 
        properties(n) AS node1, labels(n) AS labels1,
        type(r) AS rel_type, properties(r) AS rel_props,
        properties(m) AS node2, labels(m) AS labels2
    """
    result = tx.run(query, case_id=case_id)
    return [record.data() for record in result]

def get_raw_paths(tx: Transaction, source_id: str, target_id: str, max_depth: int = 3) -> list:
    """Retrieve all paths between two entities up to a max_depth."""
    query = f"""
    MATCH path = (s {{id: $source_id}})-[*1..{max_depth}]-(t {{id: $target_id}})
    RETURN [n in nodes(path) | properties(n)] AS nodes,
           [r in relationships(path) | type(r)] AS relationships
    """
    result = tx.run(query, source_id=source_id, target_id=target_id)
    return [{"nodes": record["nodes"], "relationships": record["relationships"]} for record in result]

def get_entity_timeline(tx: Transaction, entity_id: str, label: str = None) -> list:
    """Retrieve all events/relationships associated with an entity ordered by timestamp."""
    label_query = f":{label}" if label else ""
    query = f"""
    MATCH (n{label_query} {{id: $entity_id}})-[r]-(m)
    WHERE r.timestamp IS NOT NULL
    RETURN 
        type(r) AS event_type, 
        r.timestamp AS timestamp, 
        properties(r) AS details, 
        properties(m) AS related_entity
    ORDER BY r.timestamp ASC
    """
    result = tx.run(query, entity_id=entity_id)
    return [record.data() for record in result]

def filter_by_source(tx: Transaction, source_name: str) -> list:
    """Retrieve nodes originating from a specific source."""
    query = """
    MATCH (n)
    WHERE n.source = $source_name OR n.source_file = $source_name
    RETURN properties(n) AS entity, labels(n) AS labels
    """
    result = tx.run(query, source_name=source_name)
    return [{"entity": record["entity"], "labels": record["labels"]} for record in result]

def filter_by_date(tx: Transaction, start_date: str, end_date: str) -> list:
    """Retrieve relationships that occurred between start_date and end_date."""
    query = """
    MATCH (n)-[r]->(m)
    WHERE r.timestamp >= $start_date AND r.timestamp <= $end_date
    RETURN properties(n) AS source, type(r) AS rel_type, properties(r) AS properties, properties(m) AS target
    """
    result = tx.run(query, start_date=start_date, end_date=end_date)
    return [record.data() for record in result]

def get_evidence_linked_relationships(tx: Transaction, evidence_id: str) -> list:
    """Retrieve relationships linked to specific evidence."""
    query = """
    MATCH (n)-[r]->(m)
    WHERE r.evidence_id = $evidence_id
    RETURN properties(n) AS source, type(r) AS rel_type, properties(r) AS properties, properties(m) AS target
    """
    result = tx.run(query, evidence_id=evidence_id)
    return [record.data() for record in result]
