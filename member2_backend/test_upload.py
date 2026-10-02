import sys
import os
sys.path.append('.')

from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_current_user
from app.models import UserProfileModel, CaseModel, CaseMembershipModel
from app.database import SessionLocal
from app.schemas.auth import UserProfile

db = SessionLocal()
mock_user = db.query(UserProfileModel).first()

case_id = "CASE-2024-001"
case = db.query(CaseModel).filter(CaseModel.case_id == case_id).first()
if case:
    mem = db.query(CaseMembershipModel).filter_by(case_id=case_id, user_email=mock_user.email).first()
    if not mem:
        mem = CaseMembershipModel(case_id=case_id, user_email=mock_user.email, membership_role="OWNER")
        db.add(mem)
        db.commit()

async def mock_get_current_user():
    return UserProfile(id=mock_user.id, userId=str(mock_user.id), fullName="Test User", agencyUnit="HQ", email=mock_user.email, role="INVESTIGATOR", grantedRole="INVESTIGATOR", permissions=["evidence:write", "evidence:read"])

app.dependency_overrides[get_current_user] = mock_get_current_user

client = TestClient(app)

print(f"Testing upload for {case_id}")

file_content = b"This is a secret evidence document."
files = {"file": ("secret.txt", file_content, "text/plain")}
data = {"document_type": "Digital Forensic Image", "description": "Test upload 123"}

response = client.post(f"/api/v1/cases/{case_id}/documents", files=files, data=data)
print(f"Status Code: {response.status_code}")
print("Response JSON:")
print(response.json())

print("\nVerifying listing...")
response_list = client.get(f"/api/v1/cases/{case_id}/documents")
print(f"Status Code: {response_list.status_code}")
items = response_list.json().get("data", [])
found = False
for item in items:
    if item.get("description") == "Test upload 123":
        found = True
        print(f"Found uploaded item: {item}")
        break

if not found:
    print("WARNING: Uploaded item not found in listing.")
