import os
import requests
from dotenv import load_dotenv

load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

login_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
headers = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json"
}
data = {
    "email": "admin123@gov.in",
    "password": "SecuredPassword123!"
}

resp = requests.post(login_url, headers=headers, json=data)
if resp.status_code == 200:
    token = resp.json().get("access_token")
    print("Got token!")
    
    me_resp = requests.get("http://localhost:8010/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    print("Me status:", me_resp.status_code)
    try:
        print("Me json:", me_resp.json())
    except Exception as e:
        print("Failed to decode JSON:", str(e))
else:
    print("Login failed:", resp.status_code, resp.text)
