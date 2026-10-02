import os
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('member2_backend/.env')
supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))

# register unapproved user
email = "dharmiktest@gmail.com"
try:
    supabase.auth.admin.delete_user(email)
except:
    pass
    
res = supabase.auth.admin.create_user({"email": email, "password": "password123", "email_confirm": True, "user_metadata": {"role": "INVESTIGATOR"}})

# login
auth_res = supabase.auth.sign_in_with_password({"email": email, "password": "password123"})
token = auth_res.session.access_token

# fetch /auth/me
headers = {"Authorization": f"Bearer {token}"}
r = requests.get("http://127.0.0.1:8000/api/v1/auth/me", headers=headers)
print("Status:", r.status_code)
print("Response:", r.json())
