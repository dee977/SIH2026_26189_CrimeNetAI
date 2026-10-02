from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "postgresql://postgres.jzdrpxsyuyuxkabpgfwr:VaghasiyaDeep%402008@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

res = db.execute(text("SELECT email, role FROM user_profiles")).fetchall()
for r in res: print(r)
