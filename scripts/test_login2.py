import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('member2_backend/.env')
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')
supabase = create_client(url, key)

try:
    res = supabase.auth.sign_in_with_password({"email": "wrongemail@gmail.com", "password": "wrongpassword"})
    print("Wrong email - Session:", res.session)
except Exception as e:
    print("Wrong email - Error:", e)

try:
    res = supabase.auth.sign_in_with_password({"email": "yakshvachhani1108@gmail.com", "password": "wrongpassword"})
    print("Wrong password - Session:", res.session)
except Exception as e:
    print("Wrong password - Error:", e)
