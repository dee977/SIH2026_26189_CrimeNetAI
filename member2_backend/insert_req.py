import uuid
import datetime
from app.database import SessionLocal
from app.models import AccessRequestModel

db = SessionLocal()
try:
    req = AccessRequestModel(
        id=f"REQ-2026-{uuid.uuid4().hex[:4].upper()}",
        user_id="usr-" + uuid.uuid4().hex[:8],
        user_email="yakshvachhani1108@gmail.com",
        officer_name="Yaksh Vachhani",
        badge_number="LEO-1108",
        phone_number="+91 99999 99999",
        department="CrimeNet User",
        requested_role="INVESTIGATOR",
        status="pending",
        reason="Manual insert for user",
        warrant_ref="SYS-VERIFY",
        assigned_case_id="CASE-2025-NAT-001",
        assigned_case_title="National Case",
        created_at=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(req)
    db.commit()
    print("Inserted manual request for yakshvachhani1108@gmail.com")
except Exception as e:
    print(e)
finally:
    db.close()
