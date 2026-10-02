import os
import sys
import time
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('member2_backend/.env')
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(url, key)

email = "yakshvachhani1108@gmail.com"

try:
    # 1. Find user
    res = supabase.auth.admin.list_users()
    user_id = None
    for u in res:
        if u.email == email:
            user_id = u.id
            break
            
    # 2. Delete user
    if user_id:
        supabase.auth.admin.delete_user(user_id)
        print(f"Deleted old user {user_id}")
        time.sleep(2)
        
    # 3. Create new user with confirmed email
    new_user = supabase.auth.admin.create_user({
        "email": email,
        "password": "123456",
        "email_confirm": True,
        "user_metadata": {
            "name": "Yaksh Vachhani",
            "role": "ADMIN"
        }
    })
    print(f"Created new user {new_user.user.id} and confirmed it.")
except Exception as e:
    print("Error:", e)
