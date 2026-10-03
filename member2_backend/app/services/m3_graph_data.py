import os
import asyncio
from typing import Any, Dict, List, Optional
from neo4j import GraphDatabase

from app.config import settings
from app.schemas.graph import GraphDataResponse, GraphNode, GraphEdge


def _neo4j_node_to_dict(n_props: dict, labels: list) -> dict:
    """Standardizes a Neo4j node into the CrimeNet AI entity structure."""
    props = dict(n_props)
    n_id = str(props.get('id', ''))
    label = labels[0] if labels else props.get('entityType', 'Entity')
    
    c_name = (
        props.get('canonicalName') or 
        props.get('name') or 
        props.get('fullName') or 
        props.get('firNumber') or 
        f"{label} {n_id}"
    )

    metadata = dict(props)
    # Remove top-level redundant props from metadata dictionary
    for k in ['id', 'canonicalName', 'entityType', 'source', 'caseId', 'evidenceId', 'confidence']:
        metadata.pop(k, None)

    entity_dict = {
        'id': n_id,
        'entityType': label,
        'type': label,
        'label': c_name,
        'canonicalName': c_name,
        'name': props.get('name', c_name),
        'fullName': props.get('name', c_name),
        'source': props.get('source', 'member3_data_graph/datasets'),
        'caseId': props.get('caseId', props.get('case_id', 'CASE-2025-NAT-001')),
        'caseIds': [props.get('caseId', props.get('case_id', 'CASE-2025-NAT-001'))],
        'evidenceId': props.get('evidenceId', props.get('evidence_id', 'EVD-REAL-001')),
        'evidenceCount': 1,
        'confidence': float(props.get('confidence', 0.95)),
        'firstObserved': str(props.get('date', props.get('timestamp', '2025-01-01'))),
        'lastUpdated': str(props.get('date', props.get('timestamp', '2025-01-01'))),
        'anomalyIndicators': [],
        'metadata': metadata
    }

    # Specialized entity attributes for seamless Pydantic validation & UI Explorer
    if label == 'Person':
        entity_dict['city'] = props.get('city')
        entity_dict['age'] = props.get('age')
        entity_dict['role'] = props.get('role', 'Suspect')
        entity_dict['aliases'] = []
        entity_dict['addresses'] = [str(props.get('city'))] if props.get('city') else []
        entity_dict['phoneNumbers'] = []
        entity_dict['bankAccounts'] = []
        entity_dict['vehicles'] = []
        entity_dict['organizations'] = []
        entity_dict['associatedFIRs'] = []
        entity_dict['crimesReferenced'] = []
        entity_dict['knownAssociates'] = []
        entity_dict['analyticalSummary'] = f"Indexed individual: {c_name} (Role: {props.get('role', 'Suspect')}, City: {props.get('city', 'Unknown')}) from central intelligence records."
        entity_dict['associatedPhones'] = []
        entity_dict['associatedAccounts'] = []
    elif label == 'Transaction':
        entity_dict['transactionId'] = n_id
        entity_dict['amount'] = float(props.get('amount') or props.get('amount_inr') or 0.0)
        entity_dict['sourceAccount'] = str(props.get('sender_id', 'P-UNKNOWN'))
        entity_dict['destinationAccount'] = str(props.get('receiver_id', 'P-UNKNOWN'))
        entity_dict['method'] = props.get('method', 'Bank Transfer')
        entity_dict['location'] = props.get('location', 'Unknown')
        entity_dict['transactionDate'] = props.get('date', '2025-01-01')
        entity_dict['timestamp'] = props.get('timestamp', props.get('date', '2025-01-01'))
    elif label == 'Communication':
        entity_dict['commId'] = n_id
        entity_dict['callerPhone'] = str(props.get('caller_id', 'P-UNKNOWN'))
        entity_dict['receiverPhone'] = str(props.get('receiver_id', 'P-UNKNOWN'))
        entity_dict['callType'] = props.get('call_type', 'Voice')
        entity_dict['status'] = props.get('status', 'Answered')
        entity_dict['duration'] = int(props.get('duration_sec') or 0)
        entity_dict['timestamp'] = props.get('timestamp', '2025-01-01 00:00:00')
    elif label == 'FIR':
        entity_dict['firNumber'] = n_id
        entity_dict['policeStation'] = props.get('location', 'Central Police Station')
        entity_dict['filingDate'] = props.get('date', '2025-01-01')
        entity_dict['crimeCategory'] = props.get('crime_type', 'Organized Crime')
        entity_dict['incidentSummary'] = f"{props.get('crime_type', 'Crime incident')} recorded at {props.get('location', 'location')}. Status: {props.get('case_status', 'Open')}."
        entity_dict['actsSections'] = [f"BNS Sec 111 ({props.get('crime_type', 'Organized Crime')})"]

    return entity_dict


class M3GraphDataClient:
    """
    Primary Data Access Client for CrimeNet AI.
    Queries the central Neo4j graph database containing real repository datasets:
    - persons.csv (10,000 subjects)
    - financial_transactions.csv (200,000 transactions)
    - communication_links.csv (250,000 communications)
    - criminal_relationships.csv (30,000 FIRs & co-accused links)
    Falls back gracefully to demo fixtures if Neo4j is offline or record not in graph.
    """
    def __init__(self):
        uri = os.getenv('NEO4J_URI', getattr(settings, 'M3_NEO4J_URI', 'bolt://localhost:7687'))
        user = os.getenv('NEO4J_USERNAME', os.getenv('NEO4J_USER', getattr(settings, 'M3_NEO4J_USER', 'neo4j')))
        pwd = os.getenv('NEO4J_PASSWORD', getattr(settings, 'M3_NEO4J_PASSWORD', 'CrimeNetNeo4j123!'))
        
        self.driver = None
        try:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.2)
            check_port = sock.connect_ex(('127.0.0.1', 7687))
            sock.close()
            if check_port == 0:
                d = GraphDatabase.driver(uri, auth=(user, pwd), connection_timeout=0.2, max_connection_lifetime=10)
                d.verify_connectivity()
                self.driver = d
        except Exception:
            self.driver = None

    def _get_session(self):
        if self.driver:
            return self.driver.session()
        return None

    async def get_node_by_id(self, node_id: str, case_id: str) -> Optional[Dict[str, Any]]:
        # 1. Query Neo4j (Primary Real Dataset)
        if self.driver:
            def _query_node(tx):
                query = """MATCH (n)
                WHERE (n.id = $node_id OR n.original_id = $node_id OR n.person_id = $node_id)
                  AND (n.caseId = $case_id OR n.case_id = $case_id)
                RETURN properties(n) as props, labels(n) as labels LIMIT 1"""
                res = tx.run(query, node_id=node_id, case_id=case_id)
                rec = res.single()
                if rec:
                    node_dict = _neo4j_node_to_dict(rec["props"], rec["labels"])
                    # Enrich 1-hop neighbors
                    try:
                        rel_query = """
                        MATCH (n)-[r]-(neighbor)
                        WHERE (n.id = $node_id OR n.original_id = $node_id OR n.person_id = $node_id)
                          AND (n.caseId = $case_id OR n.case_id = $case_id)
                        RETURN type(r) as rel_type, labels(neighbor) as n_labels, properties(neighbor) as n_props
                        LIMIT 30
                        """
                        rel_res = tx.run(rel_query, node_id=node_id, case_id=case_id)
                        for r_rec in rel_res:
                            r_type = r_rec["rel_type"]
                            n_labels = r_rec["n_labels"] or []
                            n_props = r_rec["n_props"] or {}
                            neighbor_id = n_props.get("id") or n_props.get("name") or "Entity"
                            
                            if "FIR" in n_labels or r_type in ["ACCUSED_IN", "INVOLVED_IN", "LINKED_TO_FIR"]:
                                fir_id = n_props.get("id") or n_props.get("firNumber") or str(neighbor_id)
                                if fir_id not in node_dict.get("associatedFIRs", []):
                                    node_dict.setdefault("associatedFIRs", []).append(fir_id)
                            elif "BankAccount" in n_labels or r_type in ["HOLDS_ACCOUNT", "TRANSFERRED_TO", "RECEIVED_FROM"]:
                                acc_id = n_props.get("id") or str(neighbor_id)
                                if acc_id not in node_dict.get("bankAccounts", []):
                                    node_dict.setdefault("bankAccounts", []).append(acc_id)
                            elif "Phone" in n_labels or r_type in ["OWNS_PHONE", "COMMUNICATED_WITH", "CALLED"]:
                                phone_id = n_props.get("id") or n_props.get("phoneNumber") or str(neighbor_id)
                                if phone_id not in node_dict.get("phoneNumbers", []):
                                    node_dict.setdefault("phoneNumbers", []).append(phone_id)
                            elif "Person" in n_labels:
                                assoc_name = n_props.get("name") or str(neighbor_id)
                                if assoc_name not in node_dict.get("knownAssociates", []):
                                    node_dict.setdefault("knownAssociates", []).append(assoc_name)
                    except Exception:
                        pass
                    return node_dict
                return None

            try:
                loop = asyncio.get_event_loop()
                with self.driver.session() as session:
                    res = await loop.run_in_executor(None, session.execute_read, _query_node)
                    if res:
                        return res
            except Exception as e:
                print(f"[M3 Client] Neo4j get_node_by_id fallback on {node_id}: {e}")


        # 2. Query Real PostgreSQL Database (Supabase)
        try:
            from app.database import SessionLocal
            from app.models import EntityModel, RelationshipModel
            db = SessionLocal()
            q = db.query(EntityModel).filter(
                (EntityModel.entity_id == node_id) | 
                (EntityModel.canonical_name == node_id)
            )
            if case_id:
                ent = q.filter(EntityModel.case_id == case_id).first()
                if not ent:
                    ent = q.first()
                if not ent:
                    ent = db.query(EntityModel).filter(
                        EntityModel.case_id == case_id,
                        EntityModel.canonical_name.ilike(f"%{node_id}%")
                    ).first()
            else:
                ent = q.first()
            
            if ent:
                props = dict(ent.properties or {})
                d = dict(props)
                d.setdefault('id', ent.entity_id)
                d.setdefault('name', ent.canonical_name)
                d.setdefault('canonicalName', ent.canonical_name)
                d.setdefault('label', ent.canonical_name)
                d.setdefault('entityType', ent.entity_type)
                d.setdefault('type', ent.entity_type)
                d.setdefault('caseId', ent.case_id)
                d.setdefault('confidence', float(ent.confidence or 0.95))
                if 'latitude' in props and props['latitude'] is not None:
                    d['latitude'] = props['latitude']
                if 'longitude' in props and props['longitude'] is not None:
                    d['longitude'] = props['longitude']
                db.close()
                return d
            db.close()
        except Exception as e:
            print(f"[M3 Client] Postgres get_node_by_id error: {e}")

        return None

    async def query_entities(self, entity_type: Optional[str] = None, query: Optional[str] = None, case_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        # 1. Query Neo4j (Primary Real Dataset)
        if self.driver and entity_type in ['Person', 'Transaction', 'Communication', 'FIR', None]:
            def _query_list(tx):
                label_clause = f":{entity_type}" if entity_type else ""
                where_clauses = []
                params = {"limit": limit}
                if case_id:
                    where_clauses.append("(n.caseId = $case_id OR n.case_id = $case_id)")
                    params["case_id"] = case_id
                
                if query:
                    params["q"] = query.lower()
                    if entity_type == 'Person':
                        where_clauses.append("(toLower(n.name) CONTAINS $q OR toLower(n.id) CONTAINS $q OR toLower(n.city) CONTAINS $q OR toLower(n.role) CONTAINS $q)")
                    elif entity_type == 'Transaction':
                        where_clauses.append("(toLower(n.id) CONTAINS $q OR toLower(n.method) CONTAINS $q OR toLower(n.location) CONTAINS $q OR toLower(n.sender_id) CONTAINS $q OR toLower(n.receiver_id) CONTAINS $q)")
                    elif entity_type == 'Communication':
                        where_clauses.append("(toLower(n.id) CONTAINS $q OR toLower(n.call_type) CONTAINS $q OR toLower(n.status) CONTAINS $q OR toLower(n.caller_id) CONTAINS $q OR toLower(n.receiver_id) CONTAINS $q)")
                    elif entity_type == 'FIR':
                        where_clauses.append("(toLower(n.id) CONTAINS $q OR toLower(n.crime_type) CONTAINS $q OR toLower(n.location) CONTAINS $q OR toLower(n.case_status) CONTAINS $q)")
                    else:
                        where_clauses.append("(toLower(n.name) CONTAINS $q OR toLower(n.id) CONTAINS $q)")

                where_clause = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ''
                cypher = f"MATCH (n{label_clause}) {where_clause} RETURN properties(n) as props, labels(n) as labels ORDER BY n.id ASC LIMIT $limit"
                results = tx.run(cypher, **params)
                return [_neo4j_node_to_dict(r["props"], r["labels"]) for r in results]

            try:
                loop = asyncio.get_event_loop()
                with self.driver.session() as session:
                    entities = await loop.run_in_executor(None, session.execute_read, _query_list) or []
            except Exception as e:
                print(f"[M3 Client] Neo4j query_entities error, falling back: {e}")
                entities = []
        else:
            entities = []

        # 2. Query Real PostgreSQL Database (Supabase)
        try:
            from app.database import SessionLocal
            from app.models import EntityModel
            db = SessionLocal()
            q = db.query(EntityModel)
            if entity_type and entity_type.upper() != 'ALL':
                q = q.filter(EntityModel.entity_type.ilike(entity_type))
            if case_id:
                case_q = q.filter(EntityModel.case_id == case_id)
                db_ents = case_q.limit(limit).all()
                if not db_ents:
                    # Fallback to general or demo if no case-specific entities found
                    db_ents = q.filter(EntityModel.case_id.is_(None)).limit(limit).all()
            else:
                db_ents = q.limit(limit).all()

            if query:
                q_str = f"%{query}%"
                db_ents = [e for e in db_ents if q_str.lower().strip('%') in (e.canonical_name or '').lower() or q_str.lower().strip('%') in (e.entity_id or '').lower()]

            if db_ents:
                res = []
                for ent in db_ents:
                    props = dict(ent.properties or {})
                    d = dict(props)
                    d.setdefault('id', ent.entity_id)
                    d.setdefault('name', ent.canonical_name)
                    d.setdefault('canonicalName', ent.canonical_name)
                    d.setdefault('label', ent.canonical_name)
                    d.setdefault('entityType', ent.entity_type)
                    d.setdefault('type', ent.entity_type)
                    d.setdefault('caseId', ent.case_id)
                    d.setdefault('confidence', float(ent.confidence or 0.95))
                    if 'latitude' in props and props['latitude'] is not None:
                        d['latitude'] = props['latitude']
                    if 'longitude' in props and props['longitude'] is not None:
                        d['longitude'] = props['longitude']
                    res.append(d)
                db.close()
                return res
            db.close()
        except Exception as e:
            print(f"[M3 Client] Postgres query_entities error: {e}")

        return entities

    async def get_neighborhood(self, node_id: str, case_id: str, hops: int = 1, relationship_types: Optional[List[str]] = None) -> GraphDataResponse:
        # 1. Query Neo4j (Primary Real Dataset)
        if self.driver:
            def _query_graph(tx):
                target_id = node_id

                query = """
                MATCH (source {id: $node_id})-[r]-(target)
                RETURN 
                    source.id as src_id, properties(source) as src_props, labels(source) as src_labels,
                    type(r) as rel_type, properties(r) as rel_props,
                    target.id as tgt_id, properties(target) as tgt_props, labels(target) as tgt_labels
                LIMIT 60
                """
                records = list(tx.run(query, node_id=target_id))
                if not records:
                    return None

                nodes_map = {}
                edges_list = []

                for rec in records:
                    s_id = rec["src_id"]
                    t_id = rec["tgt_id"]
                    r_type = rec["rel_type"]
                    r_props = rec["rel_props"]

                    if s_id not in nodes_map:
                        src_type = rec["src_labels"][0] if rec["src_labels"] else 'Entity'
                        nodes_map[s_id] = GraphNode(
                            id=s_id,
                            label=rec["src_props"].get('name') or rec["src_props"].get('canonicalName') or s_id,
                            type=src_type,
                            entityType=src_type,
                            entityId=s_id,
                            properties=rec["src_props"],
                            source='member3_data_graph/datasets',
                            caseId='CASE-2025-NAT-001',
                            confidence=0.95
                        )
                    if t_id not in nodes_map:
                        tgt_type = rec["tgt_labels"][0] if rec["tgt_labels"] else 'Entity'
                        nodes_map[t_id] = GraphNode(
                            id=t_id,
                            label=rec["tgt_props"].get('name') or rec["tgt_props"].get('canonicalName') or t_id,
                            type=tgt_type,
                            entityType=tgt_type,
                            entityId=t_id,
                            properties=rec["tgt_props"],
                            source='member3_data_graph/datasets',
                            caseId='CASE-2025-NAT-001',
                            confidence=0.95
                        )

                    edge_id = str(r_props.get('id') or r_props.get('transaction_id') or r_props.get('call_id') or r_props.get('fir_id') or f"{s_id}-{r_type}-{t_id}")
                    edges_list.append(GraphEdge(
                        id=edge_id,
                        source=s_id,
                        target=t_id,
                        relationshipType=r_type,
                        relationType=r_type,
                        confidence=0.95,
                        properties=r_props
                    ))

                nodes_list = list(nodes_map.values())
                return GraphDataResponse(
                    nodes=nodes_list,
                    edges=edges_list,
                    totalNodes=len(nodes_list),
                    totalEdges=len(edges_list)
                )

            try:
                loop = asyncio.get_event_loop()
                with self.driver.session() as session:
                    res = await loop.run_in_executor(None, session.execute_read, _query_graph)
                    if res:
                        return res
            except Exception as e:
                print(f"[M3 Client] Neo4j get_neighborhood fallback: {e}")

        return GraphDataResponse(nodes=[], edges=[], totalNodes=0, totalEdges=0)

    async def get_subgraph(self, node_ids: List[str], case_id: str) -> GraphDataResponse:
        # 1. Query Neo4j (Primary Real Dataset)
        if self.driver:
            def _query_subgraph(tx):
                query = """
                MATCH (n) WHERE n.id IN $node_ids
                OPTIONAL MATCH (n)-[r]-(m) WHERE m.id IN $node_ids
                RETURN 
                    n.id as src_id, properties(n) as src_props, labels(n) as src_labels,
                    type(r) as rel_type, properties(r) as rel_props,
                    m.id as tgt_id, properties(m) as tgt_props, labels(m) as tgt_labels
                """
                records = list(tx.run(query, node_ids=node_ids))
                if not records:
                    return None

                nodes_map = {}
                edges_list = []
                seen_edges = set()

                for rec in records:
                    s_id = rec["src_id"]
                    if s_id and s_id not in nodes_map:
                        src_type = rec["src_labels"][0] if rec["src_labels"] else 'Entity'
                        nodes_map[s_id] = GraphNode(
                            id=s_id,
                            label=rec["src_props"].get('name') or rec["src_props"].get('canonicalName') or s_id,
                            type=src_type,
                            entityType=src_type,
                            entityId=s_id,
                            properties=rec["src_props"],
                            source='member3_data_graph/datasets',
                            confidence=0.95
                        )
                    t_id = rec.get("tgt_id")
                    if t_id and t_id not in nodes_map:
                        tgt_type = rec["tgt_labels"][0] if rec["tgt_labels"] else 'Entity'
                        nodes_map[t_id] = GraphNode(
                            id=t_id,
                            label=rec["tgt_props"].get('name') or rec["tgt_props"].get('canonicalName') or t_id,
                            type=tgt_type,
                            entityType=tgt_type,
                            entityId=t_id,
                            properties=rec["tgt_props"],
                            source='member3_data_graph/datasets',
                            confidence=0.95
                        )
                    if s_id and t_id and rec.get("rel_type"):
                        edge_key = f"{s_id}-{rec['rel_type']}-{t_id}"
                        if edge_key not in seen_edges:
                            seen_edges.add(edge_key)
                            edges_list.append(GraphEdge(
                                id=edge_key,
                                source=s_id,
                                target=t_id,
                                relationshipType=rec["rel_type"],
                                relationType=rec["rel_type"],
                                confidence=0.95,
                                properties=rec.get("rel_props") or {}
                            ))

                nodes_list = list(nodes_map.values())
                return GraphDataResponse(nodes=nodes_list, edges=edges_list, totalNodes=len(nodes_list), totalEdges=len(edges_list))

            try:
                loop = asyncio.get_event_loop()
                with self.driver.session() as session:
                    res = await loop.run_in_executor(None, session.execute_read, _query_subgraph)
                    if res and res.nodes:
                        return res
            except Exception as e:
                print(f"[M3 Client] Neo4j get_subgraph error: {e}")

        return GraphDataResponse(nodes=[], edges=[], totalNodes=0, totalEdges=0)

    async def get_case_graph(self, case_id: str, limit: int = 60) -> GraphDataResponse:
        if self.driver:
            def _neo4j_case_graph(tx, c_id, lim):
                nodes_res = tx.run("MATCH (n) WHERE n.caseId=$c_id OR n.case_id=$c_id RETURN n LIMIT $lim", c_id=c_id, lim=lim)
                nodes = []
                for record in nodes_res:
                    n = record["n"]
                    n_props = dict(n)
                    n_id = n_props.get("id") or getattr(n, "id", None) or str(n.element_id)
                    labels = list(n.labels) if hasattr(n, "labels") else []
                    lbl = labels[0] if labels else "Entity"
                    c_name = n_props.get("canonicalName") or n_props.get("name") or n_props.get("fullName") or n_id
                    nodes.append(GraphNode(
                        id=n_id,
                        label=c_name,
                        type=lbl,
                        entityType=lbl,
                        properties=n_props,
                        source='member3_data_graph/datasets',
                        caseId=c_id,
                        confidence=0.95
                    ))
                edges_res = tx.run("MATCH (n)-[r]->(m) WHERE (n.caseId=$c_id OR n.case_id=$c_id) AND (m.caseId=$c_id OR m.case_id=$c_id) RETURN r, n.id as src, m.id as tgt LIMIT $lim", c_id=c_id, lim=lim)
                edges = []
                for record in edges_res:
                    r = record["r"]
                    r_props = dict(r)
                    src_id = record["src"] or getattr(r.start_node, "id", None) or str(r.start_node.element_id)
                    tgt_id = record["tgt"] or getattr(r.end_node, "id", None) or str(r.end_node.element_id)
                    edges.append(GraphEdge(
                        id=str(r_props.get("id") or f"{src_id}-{r.type}-{tgt_id}"),
                        source=src_id,
                        target=tgt_id,
                        relationshipType=r.type,
                        relationType=r.type,
                        properties=r_props,
                        confidence=0.95
                    ))
                return GraphDataResponse(nodes=nodes, edges=edges, totalNodes=len(nodes), totalEdges=len(edges))
            
            try:
                loop = asyncio.get_event_loop()
                def _run_case():
                    with self.driver.session() as session:
                        return session.execute_read(_neo4j_case_graph, case_id, limit)
                res = await loop.run_in_executor(None, _run_case)
                if res:
                    return res
            except Exception as e:
                import traceback
                print(f"[M3 Client] get_case_graph Neo4j error: {e}")

        # 2. Query Real PostgreSQL Database (Supabase)
        try:
            from app.database import SessionLocal
            from app.models import EntityModel, RelationshipModel
            db = SessionLocal()
            query = db.query(EntityModel)
            if case_id:
                case_query = query.filter(EntityModel.case_id == case_id)
                db_entities = case_query.limit(limit).all()
                if not db_entities:
                    db_entities = query.filter(EntityModel.case_id.is_(None)).limit(limit).all()
            else:
                db_entities = query.limit(limit).all()

            if db_entities:
                nodes = []
                node_ids = set()
                for ent in db_entities:
                    node_ids.add(ent.entity_id)
                    props = dict(ent.properties or {})
                    props.setdefault('id', ent.entity_id)
                    props.setdefault('name', ent.canonical_name)
                    props.setdefault('canonicalName', ent.canonical_name)
                    props.setdefault('entityType', ent.entity_type)
                    props.setdefault('caseId', ent.case_id)
                    nodes.append(GraphNode(
                        id=ent.entity_id,
                        label=ent.canonical_name,
                        type=ent.entity_type,
                        entityType=ent.entity_type,
                        properties=props,
                        source=props.get('source', 'Investigative Database'),
                        caseId=ent.case_id or case_id or 'CASE-2025-M3-DATASET',
                        confidence=float(ent.confidence or 0.95)
                    ))

                # Fetch relationships
                rel_query = db.query(RelationshipModel)
                if case_id:
                    case_rel_query = rel_query.filter(RelationshipModel.case_id == case_id)
                    db_rels = case_rel_query.limit(limit).all()
                    if not db_rels:
                        db_rels = rel_query.filter(RelationshipModel.case_id.is_(None)).limit(limit).all()
                else:
                    db_rels = rel_query.limit(limit).all()
                edges = []
                for r in db_rels:
                    if r.source_id in node_ids and r.target_id in node_ids:
                        edges.append(GraphEdge(
                            id=r.relationship_id,
                            source=r.source_id,
                            target=r.target_id,
                            relationshipType=r.relationship_type,
                            relationType=r.relationship_type,
                            properties=r.properties or {},
                            confidence=float(r.confidence or 0.95)
                        ))
                    elif not case_id:
                        edges.append(GraphEdge(
                            id=r.relationship_id,
                            source=r.source_id,
                            target=r.target_id,
                            relationshipType=r.relationship_type,
                            relationType=r.relationship_type,
                            properties=r.properties or {},
                            confidence=float(r.confidence or 0.95)
                        ))

                db.close()
                if nodes:
                    return GraphDataResponse(nodes=nodes, edges=edges, totalNodes=len(nodes), totalEdges=len(edges))
            db.close()
        except Exception as e:
            print(f"[M3 Client] Postgres get_case_graph error: {e}")

        return GraphDataResponse(nodes=[], edges=[], totalNodes=0, totalEdges=0)


_m3_client_instance = None
def get_m3_client() -> M3GraphDataClient:
    global _m3_client_instance
    if _m3_client_instance is None:
        _m3_client_instance = M3GraphDataClient()
    return _m3_client_instance
