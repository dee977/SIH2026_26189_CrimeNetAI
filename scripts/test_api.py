import os
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('member2_backend/.env')
supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))
res = supabase.auth.admin.create_user({"email": "testcases1@gov.in", "password": "password123", "email_confirm": True, "user_metadata": {"role": "ADMIN"}})

# login
auth_res = supabase.auth.sign_in_with_password({"email": "testcases1@gov.in", "password": "password123"})
token = auth_res.session.access_token

# fetch cases
headers = {"Authorization": f"Bearer {token}"}
r = requests.get("http://127.0.0.1:62449/api/v1/cases?pageSize=100", headers=headers)
print("Status:", r.status_code)
print("Response:", r.json())

supabase.auth.admin.delete_user(auth_res.user.id)
