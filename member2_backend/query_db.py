from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
url = os.environ.get("DATABASE_URL")
if url:
    url = url.replace("?pgbouncer=true", "")
    engine = create_engine(url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT email, role FROM user_profiles"))
        print(result.fetchall())
else:
    print("No DB URL")
