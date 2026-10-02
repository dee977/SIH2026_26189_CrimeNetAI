import asyncio
from app.database import SessionLocal
from app.models import CaseModel
from app.services.supabase_service import get_supabase_storage_service

async def fix_storage():
    db = SessionLocal()
    cases = db.query(CaseModel).all()
    
    storage_service = get_supabase_storage_service()
    
    for c in cases:
        print(f"Creating storage prefix for {c.case_id}...")
        storage_service.ensure_case_storage_prefix(c.case_id)
        
    db.close()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(fix_storage())
