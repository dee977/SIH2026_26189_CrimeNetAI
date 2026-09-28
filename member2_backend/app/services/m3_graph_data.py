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

        # 2. Canonical case entity lookup fallback if Neo4j is offline or record not in graph
        from app.services.demo_data import DEMO_ENTITIES
        for e in DEMO_ENTITIES:
            if (e.get('id') == node_id or e.get('person_id') == node_id) and (not case_id or e.get('caseId') == case_id):
                return dict(e)
        for e in DEMO_ENTITIES:
            if e.get('id') == node_id:
                return dict(e)

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
                    entities = await loop.run_in_executor(None, session.execute_read, _query_list)
                    if entities:
                        return entities
            except Exception as e:
                print(f"[M3 Client] Neo4j query_entities error, falling back: {e}")
        # 2. Canonical case entity query fallback
        from app.services.demo_data import DEMO_ENTITIES
        res = []
        for e in DEMO_ENTITIES:
            if entity_type and e.get('entityType', '').lower() != entity_type.lower():
                continue
            if case_id and e.get('caseId') != case_id:
                continue
            if query:
                q = query.lower()
                name = str(e.get('name') or e.get('canonicalName') or '').lower()
                eid = str(e.get('id', '')).lower()
                if q not in name and q not in eid:
                    continue
            res.append(dict(e))
            if len(res) >= limit:
                break
        return res

    async def get_neighborhood(self, node_id: str, case_id: str, hops: int = 1, relationship_types: Optional[List[str]] = None) -> GraphDataResponse:
        # 1. Query Neo4j (Primary Real Dataset)
        if self.driver:
            def _query_graph(tx):
                # If node_id is a demo ID not in Neo4j, or default FIR-2024-8841, pick a central real subject if node not found
                target_id = node_id
                check = tx.run("MATCH (n {id: $id}) RETURN n.id LIMIT 1", id=target_id).single()
                if not check and node_id in ['FIR-2024-8841', 'ALL', 'default', '']:
                    # Default to prominent real person P00001
                    target_id = 'P00001'

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

        # 2. Canonical case graph fallback
        from app.services.demo_data import DEMO_ENTITIES, DEMO_EDGES
        matching_nodes = []
        matching_edges = []
        connected_ids = {node_id}
        for e in DEMO_EDGES:
            if e['source'] == node_id:
                connected_ids.add(e['target'])
                matching_edges.append(GraphEdge(
                    id=e.get('id', f"{e['source']}-{e['target']}"),
                    source=e['source'],
                    target=e['target'],
                    relationshipType=e.get('relationshipType', 'CONNECTED_TO'),
                    relationType=e.get('relationshipType', 'CONNECTED_TO'),
                    properties=e.get('properties', {}),
                    confidence=0.95
                ))
            elif e['target'] == node_id:
                connected_ids.add(e['source'])
                matching_edges.append(GraphEdge(
                    id=e.get('id', f"{e['source']}-{e['target']}"),
                    source=e['source'],
                    target=e['target'],
                    relationshipType=e.get('relationshipType', 'CONNECTED_TO'),
                    relationType=e.get('relationshipType', 'CONNECTED_TO'),
                    properties=e.get('properties', {}),
                    confidence=0.95
                ))
        for ent in DEMO_ENTITIES:
            if ent.get('id') in connected_ids or (not matching_edges and ent.get('caseId') == (case_id or 'CASE-2024-001')):
                matching_nodes.append(GraphNode(
                    id=ent.get('id', ''),
                    label=ent.get('canonicalName') or ent.get('name') or ent.get('id', ''),
                    type=ent.get('entityType', 'Entity'),
                    entityType=ent.get('entityType', 'Entity'),
                    properties=ent,
                    source='member3_data_graph/datasets',
                    caseId=case_id or ent.get('caseId', 'CASE-2024-001'),
                    confidence=0.95
                ))
                if len(matching_nodes) >= 15:
                    break
        return GraphDataResponse(nodes=matching_nodes, edges=matching_edges, totalNodes=len(matching_nodes), totalEdges=len(matching_edges))

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

        # 2. Canonical subgraph fallback
        from app.services.demo_data import DEMO_ENTITIES, DEMO_EDGES
        nodes_list = []
        edges_list = []
        id_set = set(node_ids)
        for ent in DEMO_ENTITIES:
            if ent.get('id') in id_set:
                nodes_list.append(GraphNode(
                    id=ent.get('id', ''),
                    label=ent.get('canonicalName') or ent.get('name') or ent.get('id', ''),
                    type=ent.get('entityType', 'Entity'),
                    entityType=ent.get('entityType', 'Entity'),
                    properties=ent,
                    source='member3_data_graph/datasets',
                    caseId=case_id or ent.get('caseId', 'CASE-2024-001'),
                    confidence=0.95
                ))
        for e in DEMO_EDGES:
            if e['source'] in id_set and e['target'] in id_set:
                edges_list.append(GraphEdge(
                    id=e.get('id', f"{e['source']}-{e['target']}"),
                    source=e['source'],
                    target=e['target'],
                    relationshipType=e.get('relationshipType', 'CONNECTED_TO'),
                    relationType=e.get('relationshipType', 'CONNECTED_TO'),
                    properties=e.get('properties', {}),
                    confidence=0.95
                ))
        return GraphDataResponse(nodes=nodes_list, edges=edges_list, totalNodes=len(nodes_list), totalEdges=len(edges_list))

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
                if res and (res.nodes or res.edges):
                    return res
            except Exception as e:
                import traceback
                print(f"[M3 Client] get_case_graph Neo4j error: {e}")

        return GraphDataResponse(nodes=[], edges=[], totalNodes=0, totalEdges=0)


_m3_client_instance = None
def get_m3_client() -> M3GraphDataClient:
    global _m3_client_instance
    if _m3_client_instance is None:
        _m3_client_instance = M3GraphDataClient()
    return _m3_client_instance
