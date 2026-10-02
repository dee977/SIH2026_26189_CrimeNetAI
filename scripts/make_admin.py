import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.abspath('member2_backend'))
load_dotenv('.env')
load_dotenv('member2_backend/.env')

from member2_backend.app.database import SessionLocal
from member2_backend.app.models import UserProfileModel, AccessRequestModel

db = SessionLocal()

emails = ['yakshvachhani1108@gmail.com', 'admin123@gov.in', 'admin124@gov.in', 'test1@gov.in']

for email in emails:
    user = db.query(UserProfileModel).filter(UserProfileModel.email == email).first()
    if not user:
        user = UserProfileModel(email=email, role='ADMIN', is_active=True, officer_name='Yaksh (Admin)')
        db.add(user)
    else:
        user.role = 'ADMIN'
        user.is_active = True

db.commit()
print("Success! Admin access granted to specified emails.")
