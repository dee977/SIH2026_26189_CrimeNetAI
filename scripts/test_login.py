import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('member2_backend/.env')
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')

supabase = create_client(url, key)

try:
    res = supabase.auth.sign_in_with_password({"email": "yakshvachhani1108@gmail.com", "password": "123456"})
    print("Session:", res.session is not None)
    print("User:", res.user is not None)
except Exception as e:
    print("Error:", e)
