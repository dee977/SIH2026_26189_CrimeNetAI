import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('member2_backend/.env')
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(url, key)

try:
    # Get user by email to get their ID
    res = supabase.auth.admin.list_users()
    users = res
    user_id = None
    for u in users:
        if u.email == 'yakshvachhani1108@gmail.com':
            user_id = u.id
            break
            
    if user_id:
        supabase.auth.admin.update_user_by_id(user_id, {"email_confirm": True})
        print("Updated via Admin API!")
    else:
        print("User not found via Admin API")
except Exception as e:
    print("Error:", e)
