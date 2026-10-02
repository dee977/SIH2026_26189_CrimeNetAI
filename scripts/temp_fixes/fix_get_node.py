import re

filepath = "member2_backend/app/services/m3_graph_data.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

fallback = """
        # 2. Query Real PostgreSQL Database (Supabase)
        try:
            from app.database import SessionLocal
            from app.models import EntityModel, RelationshipModel
            db = SessionLocal()
            q = db.query(EntityModel).filter(EntityModel.entity_id == node_id)
            if case_id:
                q = q.filter((EntityModel.case_id == case_id) | (EntityModel.case_id == None))
            
            ent = q.first()
            if ent:
                d = dict(ent.properties or {})
                d.setdefault('id', ent.entity_id)
                d.setdefault('name', ent.canonical_name)
                d.setdefault('canonicalName', ent.canonical_name)
                d.setdefault('entityType', ent.entity_type)
                d.setdefault('caseId', ent.case_id)
                d.setdefault('confidence', float(ent.confidence or 0.95))
                db.close()
                return d
            db.close()
        except Exception as e:
            print(f"[M3 Client] Postgres get_node_by_id error: {e}")

        return None
"""

new_code = code.replace("        return None\n\n    async def query_entities", fallback + "\n    async def query_entities")
with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Updated get_node_by_id with Postgres fallback.")
