from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "postgresql://postgres.jzdrpxsyuyuxkabpgfwr:VaghasiyaDeep%402008@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

print("Fetching Users...")
users = db.execute(text("SELECT email FROM user_profiles")).fetchall()
print([u[0] for u in users])

print("Adding all users to CASE-900X cases...")
cases = ["CASE-9001", "CASE-9002", "CASE-9003", "CASE-9004", "CASE-9005"]

for case_id in cases:
    for user in users:
        email = user[0]
        db.execute(text(f"""
            INSERT INTO case_memberships (case_id, user_email, membership_role)
            VALUES ('{case_id}', '{email}', 'INVESTIGATOR')
            ON CONFLICT ON CONSTRAINT uq_case_member DO NOTHING;
        """))

db.commit()
print("Done adding memberships!")
