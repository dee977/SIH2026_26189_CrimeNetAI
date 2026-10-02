import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client
from sqlalchemy import create_engine, text

load_dotenv('member2_backend/.env')
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
db_url = os.environ.get('DIRECT_URL') or os.environ.get('DATABASE_URL')
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

supabase: Client = create_client(url, key)
engine = create_engine(db_url)

emails = ["yakshvachhani1@gmil.com", "yakshvachhani1@gmail.com"]
password = "123456"

for email in emails:
    # 1. Create in Supabase Auth
    try:
        new_user = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": {
                "name": "Yaksh Vachhani",
                "role": "ADMIN"
            }
        })
        print(f"Created in Supabase Auth: {email}")
    except Exception as e:
        print(f"Auth creation error for {email}:", e)
        
    # 2. Add to backend user_profiles
    try:
        with engine.begin() as conn:
            conn.execute(
                text("""
                INSERT INTO user_profiles (user_id, email, full_name, badge_number, agency_unit, role, is_active) 
                VALUES (:uid, :email, 'Yaksh Vachhani', 'ADM-1101', 'HQ', 'ADMIN', true)
                ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', is_active = true
                """),
                {"uid": f"usr-adm-{int(time.time())}", "email": email}
            )
            print(f"Added to user_profiles: {email}")
    except Exception as e:
        print(f"DB insertion error for {email}:", e)
