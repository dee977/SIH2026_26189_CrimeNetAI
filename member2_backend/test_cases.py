import asyncio
from app.api.v1.cases import list_cases
from app.database import SessionLocal
from app.auth_middleware import UserProfile

async def test():
    db = SessionLocal()
    user = UserProfile(email="test@admin.com", grantedRole="ADMIN")
    res = await list_cases(page=1, pageSize=100, status=None, priority=None, current_user=user, db=db)
    print(f"Loaded {res.totalCount} cases.")
    db.close()

asyncio.run(test())
