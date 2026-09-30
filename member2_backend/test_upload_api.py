import asyncio
import httpx
import sys

async def run():
    print("Testing Ingestion Upload API on Port 8000...")
    async with httpx.AsyncClient(timeout=None) as client:
        # 1. Login to get token
        login_res = await client.post("http://localhost:8000/api/v1/auth/login", json={"email": "rajesh.kumar@cid.gov.in", "password": "password123"})
        if login_res.status_code != 200:
            print("Login failed:", login_res.text)
            sys.exit(1)
        
        token = login_res.json()["data"]["accessToken"]
        print("Got token")
        
        # 2. Test upload
        files = {"file": ("test.txt", b"hello world", "text/plain")}
        data = {"case_id": "CASE-2025-M3-DATASET"}
        res2 = await client.post("http://localhost:8000/api/v1/ingestion/upload", files=files, data=data, headers={"Authorization": f"Bearer {token}"})
        print("Upload Status:", res2.status_code)
        print("Upload Response:", res2.text)
        
asyncio.run(run())
