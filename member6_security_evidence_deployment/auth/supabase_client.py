import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # We need service role for backend admin tasks, standard key for client operations.

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.")

# Service role client for backend operations that require bypassing RLS when necessary, 
# or acting as the system.
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_client() -> Client:
    """Returns the Supabase admin client. Used for backend operations."""
    return supabase_admin

