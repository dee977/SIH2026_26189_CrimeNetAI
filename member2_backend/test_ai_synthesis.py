import re, os, asyncio
from app.config import settings
from neo4j import GraphDatabase

def test_synthesis():
    uri = getattr(settings, 'M3_NEO4J_URI', 'bolt://localhost:7687')
    if 'neo4j:7687' in uri:
        uri = 'bolt://localhost:7687'
    user = getattr(settings, 'M3_NEO4J_USER', 'neo4j')
    pwd = getattr(settings, 'M3_NEO4J_PASSWORD', 'CrimeNetNeo4j123!')

    driver = GraphDatabase.driver(uri, auth=(user, pwd))
    with driver.session() as s:
        for cid in ['CASE-2025-M3-DATASET', 'CASE-VIDEO-001', 'CASE-VIDEO-002', 'CASE-VIDEO-003', 'CASE-VIDEO-004']:
            persons = s.run('MATCH (p:Person {caseId: $c}) RETURN p.id as id, p.name as name, p.role as role LIMIT 3', c=cid).data()
            edges = s.run('MATCH (a {caseId: $c})-[r]->(b {caseId: $c}) RETURN a.id as src, type(r) as rel, b.id as tgt LIMIT 3', c=cid).data()
            print(f"{cid} -> {len(persons)} persons, {len(edges)} edges")
    driver.close()

if __name__ == '__main__':
    test_synthesis()
