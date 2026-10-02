from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DB_URL = "postgresql://postgres.jzdrpxsyuyuxkabpgfwr:VaghasiyaDeep%402008@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_engine(DB_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

preserve_cases = ['CASE-9001', 'CASE-9002', 'CASE-9003', 'CASE-9004', 'CASE-9005']
preserve_str = "('" + "', '".join(preserve_cases) + "')"

try:
    db.execute(text(f"DELETE FROM watchlist_items WHERE case_id NOT IN {preserve_str}"))
    print("Deleted from watchlist_items")
    db.execute(text(f"DELETE FROM cases WHERE case_id NOT IN {preserve_str}"))
    print("Deleted from cases")
except Exception as e:
    print(f"Failed to delete: {e}")

db.commit()
print("Cleanup complete!")
