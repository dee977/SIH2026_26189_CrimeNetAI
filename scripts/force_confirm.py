import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv('member2_backend/.env')
db_url = os.environ.get('DIRECT_URL') or os.environ.get('DATABASE_URL')

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

try:
    engine = create_engine(db_url)
    with engine.begin() as conn:
        result = conn.execute(text("UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;"))
        print(f"Confirmed {result.rowcount} users!")
except Exception as e:
    print("Error:", e)
