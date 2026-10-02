from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE access_requests ADD COLUMN phone_number VARCHAR;"))
        print("Added phone_number to access_requests")
    except Exception as e:
        print(e)
        
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN phone_number VARCHAR;"))
        print("Added phone_number to users")
    except Exception as e:
        pass
        
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN officer_name VARCHAR;"))
    except: pass
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN badge_number VARCHAR;"))
    except: pass
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN department VARCHAR;"))
    except: pass
    
    conn.commit()

print("DB Schema patched!")
