from app.database import engine
from sqlalchemy import text
import sys

with engine.connect() as conn:
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'access_requests';"))
    cols = [r[0] for r in res]
    print(cols)
    if 'phone_number' not in cols:
        print("PHONE NUMBER NOT IN COLS!")
        try:
            conn.execute(text('ALTER TABLE access_requests ADD COLUMN "phone_number" VARCHAR;'))
            conn.commit()
            print("ADDED IT NOW")
        except Exception as e:
            print("ERROR", e)

