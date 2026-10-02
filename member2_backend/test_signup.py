import asyncio
from app.api.v1.access_requests import create_access_request, AccessRequestCreate
from app.database import SessionLocal

async def test():
    db = SessionLocal()
    req_in = AccessRequestCreate(
        email="test2@gmail.com",
        requestedRole="ADMIN",
        officer_name="Test Name",
        phone_number="1234567890",
        badge_number="LEO-999"
    )
    # mock m6 client
    class M6Mock:
        async def verify_token(self, token):
            return None
        async def log_audit_event(self, ev):
            pass
    try:
        res = await create_access_request(req_in=req_in, authorization=None, db=db, m6_client=M6Mock())
        print(res)
    except Exception as e:
        print("Error:", e)
    db.close()

asyncio.run(test())
