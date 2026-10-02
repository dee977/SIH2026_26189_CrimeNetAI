import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('member2_backend/.env')
db_url = os.environ.get('DIRECT_URL') or os.environ.get('DATABASE_URL')
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)

emails = ["yakshvachhani1@gmil.com", "yakshvachhani1@gmail.com"]

for email in emails:
    try:
        with engine.begin() as conn:
            conn.execute(
                text("""
                INSERT INTO user_profiles (email, officer_name, badge_number, department, role, is_active) 
                VALUES (:email, 'Yaksh Vachhani', 'ADM-1101', 'HQ', 'ADMIN', true)
                ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', is_active = true
                """),
                {"email": email}
            )
            print(f"Successfully added/updated to user_profiles: {email}")
    except Exception as e:
        print(f"DB insertion error for {email}:", e)
