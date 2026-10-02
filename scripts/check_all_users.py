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
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email, email_confirmed_at FROM auth.users;"))
        users = result.fetchall()
        print(f"Total Users: {len(users)}")
        for u in users:
            print(f"Email: {u[0]}, Confirmed At: {u[1]}")
except Exception as e:
    print("Error:", e)
