from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE user_profiles ADD COLUMN phone_number VARCHAR;"))
        print("Added phone_number to user_profiles")
    except Exception as e:
        print(e)
        
    try:
        conn.execute(text("ALTER TABLE user_profiles ADD COLUMN officer_name VARCHAR;"))
    except: pass
    try:
        conn.execute(text("ALTER TABLE user_profiles ADD COLUMN badge_number VARCHAR;"))
    except: pass
    try:
        conn.execute(text("ALTER TABLE user_profiles ADD COLUMN department VARCHAR;"))
    except: pass
    
    conn.commit()

print("DB Schema patched part 2!")
