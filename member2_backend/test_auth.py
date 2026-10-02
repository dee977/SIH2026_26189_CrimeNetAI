import asyncio
from app.services.m6_security_evidence import M6SecurityClient
from app.dependencies import get_current_user
from app.database import SessionLocal

async def main():
    m6 = M6SecurityClient()
    db = SessionLocal()
    try:
        user = await get_current_user(authorization="Bearer dev-bypass-token", m6_client=m6, db=db)
        print("Success:", user)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(main())
