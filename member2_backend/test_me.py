from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class MockUser:
    email = "admin123@gov.in"
    sub = "12345"
    role = "Investigator"
    name = "Admin User"

class MockM6Client:
    async def verify_token(self, token):
        from app.schemas.auth import UserProfile
        return UserProfile(
            userId=MockUser.sub,
            email=MockUser.email,
            fullName=MockUser.name,
            agencyUnit='CrimeNet',
            role=MockUser.role.upper()
        )

from app.dependencies import get_m6_client
app.dependency_overrides[get_m6_client] = lambda: MockM6Client()

resp = client.get('/api/v1/auth/me', headers={"Authorization": "Bearer fake_token"})
print("Status:", resp.status_code)
import json
print(json.dumps(resp.json(), indent=2))
