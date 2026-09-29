"""
Create all database tables in Supabase PostgreSQL using DIRECT_URL (port 5432).
"""
import sys
import os

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
import app.models  # Ensure all models are registered with Base.metadata

def create_all_tables():
    print(f"Connecting to database via engine: {engine.url.render_as_string(hide_password=True)}")
    print("Creating all tables in Supabase Postgres...")
    Base.metadata.create_all(bind=engine)
    
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Success! Existing tables in DB:", tables)

if __name__ == '__main__':
    create_all_tables()
