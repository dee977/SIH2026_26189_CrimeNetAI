import os
# Must patch env before importing app.database
os.environ["DATABASE_URL"] = "postgresql://postgres.jzdrpxsyuyuxkabpgfwr:VaghasiyaDeep%402008@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from sqlalchemy import Column, Integer, String, Boolean

class UserProfileModel(Base):
    __tablename__ = 'user_profiles'
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

Base.metadata.create_all(bind=engine)

def seed_users():
    db = SessionLocal()
    users = [
        {"email": "admin123@gov.in", "role": "ADMIN"},
        {"email": "investigator123@gov.in", "role": "INVESTIGATOR"},
        {"email": "analyst123@gov.in", "role": "ANALYST"},
        {"email": "auditor123@gov.in", "role": "AUDITOR"}
    ]
    for u in users:
        existing = db.query(UserProfileModel).filter_by(email=u["email"]).first()
        if existing:
            existing.role = u["role"]
        else:
            new_u = UserProfileModel(email=u["email"], role=u["role"])
            db.add(new_u)
    db.commit()
    db.close()

if __name__ == "__main__":
    seed_users()
    print("RBAC Database Seeded")
