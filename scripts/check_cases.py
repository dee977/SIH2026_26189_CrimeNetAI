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
        result = conn.execute(text("SELECT case_id, title FROM cases;"))
        cases = result.fetchall()
        print(f"Total Cases: {len(cases)}")
        for c in cases:
            print(f" - {c[0]}: {c[1]}")
except Exception as e:
    print("Error:", e)
