with open('tests/test_api.py', 'r') as f:
    code = f.read()

replacement = """from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_current_user
from app.schemas.auth import UserProfile

client = TestClient(app)

def mock_get_current_user():
    return UserProfile(
        userId="mock-id",
        email="rajesh.kumar@cid.gov.in",
        fullName="Inspector Rajesh Kumar",
        badgeNumber="CID-8841",
        agencyUnit="Maharashtra CID",
        role="authenticated",
        grantedRole="ADMIN",
        permissions=[
            'dashboard:read', 'case:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read',
            'evidence:read', 'evidence:write', 'ingest:upload', 'report:generate', 'alert:read', 'alert:manage',
            'watchlist:read', 'watchlist:manage', 'gis:read', 'ai:read', 'admin:read', 'admin:write', 'audit:read',
            'verification:read'
        ],
        isActive=True
    )

app.dependency_overrides[get_current_user] = mock_get_current_user
"""

import re
code = code.replace("from fastapi.testclient import TestClient\nfrom app.main import app\n\nclient = TestClient(app)", replacement)

# We also need to fix test_auth_login_and_profile, which tests the removed /login endpoint
code = code.replace("""def test_auth_login_and_profile():
    login_payload = {'email': 'rajesh.kumar@cid.gov.in', 'password': 'SecuredPassword123!'}
    resp = client.post('/api/v1/auth/login', json=login_payload)
    assert resp.status_code == 200
    assert 'token' in resp.json()['data']

    # Use token to get profile
    token = resp.json()['data']['token']
    client.headers.update({'Authorization': f'Bearer {token}'})

    me_resp = client.get('/api/v1/auth/me')
    assert me_resp.status_code == 200
    assert me_resp.json()['data']['email'] == 'rajesh.kumar@cid.gov.in'""",
"""def test_auth_login_and_profile():
    me_resp = client.get('/api/v1/auth/me')
    assert me_resp.status_code == 200
    assert me_resp.json()['data']['email'] == 'rajesh.kumar@cid.gov.in'""")

with open('tests/test_api.py', 'w') as f:
    f.write(code)
