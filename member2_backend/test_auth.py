import os
import pytest
from jose import jwt
from dotenv import load_dotenv
import requests
import time

load_dotenv()
if not os.getenv('RUN_AUTH_TESTS'):
    pytest.skip('Skipping auth integration test', allow_module_level=True)
SUPABASE_JWT_SECRET = os.environ.get('SUPABASE_JWT_SECRET')
if not SUPABASE_JWT_SECRET:
    print("No JWT secret!")
    exit(1)

# Generate a mock token that looks exactly like Supabase
payload = {
    "aud": "authenticated",
    "exp": int(time.time()) + 3600,
    "sub": "mock-uuid-1234",
    "email": "admin123@gov.in",
    "phone": "",
    "app_metadata": {
        "provider": "email",
        "providers": ["email"]
    },
    "user_metadata": {
        "name": "Admin User",
        "role": "Investigator"
    },
    "role": "authenticated",
    "aal": "aal1",
    "amr": [{"method": "password", "timestamp": int(time.time())}],
    "session_id": "mock-session-id"
}

token = jwt.encode(payload, SUPABASE_JWT_SECRET, algorithm="HS256")
print("Generated token")

me_resp = requests.get("http://localhost:8010/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
print("Status:", me_resp.status_code)
print("Response:", me_resp.text)

# Also test investigator
payload["email"] = "investigator123@gov.in"
token2 = jwt.encode(payload, SUPABASE_JWT_SECRET, algorithm="HS256")
me_resp2 = requests.get("http://localhost:8010/api/v1/auth/me", headers={"Authorization": f"Bearer {token2}"})
print("Investigator Status:", me_resp2.status_code)
print("Investigator Response:", me_resp2.text)
