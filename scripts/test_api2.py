import os
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('member2_backend/.env')
supabase = create_client(os.environ.get('SUPABASE_URL'), os.environ.get('SUPABASE_SERVICE_ROLE_KEY'))

# login
auth_res = supabase.auth.sign_in_with_password({"email": "yakshvachhani1108@gmail.com", "password": "123456"})
token = auth_res.session.access_token

# fetch cases
headers = {"Authorization": f"Bearer {token}"}
r = requests.get("http://127.0.0.1:8000/api/v1/cases?pageSize=100", headers=headers)
print("Status:", r.status_code)
print("Response:", r.json())
