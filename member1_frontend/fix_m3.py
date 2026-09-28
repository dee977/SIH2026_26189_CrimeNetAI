import sys

with open('member2_backend/app/services/m3_graph_data.py', 'r') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    if line.startswith('    async def get_neighborhood(self, node_id: str, hops: int = 1, relationship_types: Optional[List[str]] = None) -> GraphDataResponse:'):
        new_lines.append('    async def get_neighborhood(self, node_id: str, case_id: str, hops: int = 1, relationship_types: Optional[List[str]] = None) -> GraphDataResponse:\n')
    elif line.startswith('    async def get_subgraph(self, node_ids: List[str]) -> GraphDataResponse:'):
        new_lines.append('    async def get_subgraph(self, node_ids: List[str], case_id: str) -> GraphDataResponse:\n')
    elif 'tx.run("MATCH (n)' in line and 'node_id' in line:
        line = line.replace('node_id=node_id', 'node_id=node_id, case_id=case_id')
        if 'WHERE coalesce(n.id, elementId(n)) = $node_id' in line:
             line = line.replace('WHERE coalesce(n.id, elementId(n)) = $node_id', 'WHERE coalesce(n.id, elementId(n)) = $node_id AND (n.caseId = $case_id OR n.case_id = $case_id)')
        new_lines.append(line)
    elif 'tx.run("MATCH (n)' in line and 'node_ids' in line:
        line = line.replace('node_ids=node_ids', 'node_ids=node_ids, case_id=case_id')
        if 'WHERE coalesce(n.id, elementId(n)) IN $node_ids' in line:
             line = line.replace('WHERE coalesce(n.id, elementId(n)) IN $node_ids', 'WHERE coalesce(n.id, elementId(n)) IN $node_ids AND (n.caseId = $case_id OR n.case_id = $case_id)')
        new_lines.append(line)
    elif 'def _neo4j_neighborhood' in line:
        new_lines.append('            def _neo4j_neighborhood(tx, node_id, case_id, hops, relationship_types):\n')
    elif 'def _neo4j_subgraph' in line:
        new_lines.append('            def _neo4j_subgraph(tx, node_ids, case_id):\n')
    elif 'session.execute_read(_neo4j_neighborhood, node_id, hops, relationship_types)' in line:
        new_lines.append(line.replace('node_id, hops, relationship_types', 'node_id, case_id, hops, relationship_types'))
    elif 'session.execute_read(_neo4j_subgraph, node_ids)' in line:
        new_lines.append(line.replace('node_ids', 'node_ids, case_id'))
    else:
        new_lines.append(line)

new_lines.append('''
    async def get_case_graph(self, case_id: str, limit: int = 60) -> GraphDataResponse:
        if self.driver:
            def _neo4j_case_graph(tx, case_id, limit):
                nodes_res = tx.run("MATCH (n) WHERE n.caseId=$case_id OR n.case_id=$case_id RETURN n LIMIT $limit", case_id=case_id, limit=limit)
                nodes = []
                for record in nodes_res:
                    n = record["n"]
                    nodes.append({
                        "id": getattr(n, "id", None) or getattr(n, "element_id", None) or dict(n).get("id") or str(n.element_id),
                        "label": list(n.labels)[0] if n.labels else "Unknown",
                        "properties": dict(n)
                    })
                edges_res = tx.run("MATCH (n)-[r]->(m) WHERE (n.caseId=$case_id OR n.case_id=$case_id) AND (m.caseId=$case_id OR m.case_id=$case_id) RETURN r LIMIT $limit", case_id=case_id, limit=limit)
                edges = []
                for record in edges_res:
                    r = record["r"]
                    edges.append({
                        "id": getattr(r, "element_id", None) or str(r.element_id),
                        "source": getattr(r.start_node, "id", None) or getattr(r.start_node, "element_id", None) or str(r.start_node.element_id),
                        "target": getattr(r.end_node, "id", None) or getattr(r.end_node, "element_id", None) or str(r.end_node.element_id),
                        "type": r.type,
                        "properties": dict(r)
                    })
                
                from app.schemas.graph import GraphDataResponse
                return GraphDataResponse(nodes=nodes, edges=edges)
            
            try:
                loop = asyncio.get_event_loop()
                def _run_case():
                    with self.driver.session() as session:
                        return session.execute_read(_neo4j_case_graph, case_id, limit)
                return await loop.run_in_executor(None, _run_case)
            except Exception as e:
                import traceback
                traceback.print_exc()
        
        from app.schemas.graph import GraphDataResponse
        return GraphDataResponse(nodes=[], edges=[])
''')

with open('member2_backend/app/services/m3_graph_data.py', 'w') as f:
    f.writelines(new_lines)
