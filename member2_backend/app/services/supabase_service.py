import os
from typing import Optional
try:
    from supabase import create_client, Client
except ImportError:
    create_client = None
    Client = None

from app.config import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseStorageService:
    def __init__(self):
        self.supabase_url = settings.SUPABASE_URL or os.environ.get("SUPABASE_URL")
        self.supabase_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
        
        self.client = None
        if create_client and self.supabase_url and self.supabase_key:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
            except Exception as e:
                logger.error(f"Failed to initialize Supabase client: {e}")
        else:
            logger.warning("Supabase credentials not found or supabase package not installed. Supabase storage will be disabled.")
            
        self.bucket_name = "case-documents"

    def _ensure_bucket(self):
        # Bucket is already provisioned via Supabase dashboard.
        # Avoid checking list_buckets on every upload to prevent RLS 403 warnings for anon keys.
        return True

    def ensure_case_storage_prefix(self, case_id: str) -> bool:
        """
        Ensures a case-scoped folder exists in Supabase Storage.
        Creates a tiny placeholder file .case-folder under the case_id prefix.
        """
        if not self.client:
            logger.warning(f"Storage client not initialized. Skipping prefix creation for {case_id}")
            return False
            
        try:
            placeholder_path = f"{case_id}/.case-folder"
            self.client.storage.from_(self.bucket_name).upload(
                path=placeholder_path,
                file=b"CRIMENET_CASE_DIR",
                file_options={"content-type": "text/plain", "upsert": "true"}
            )
            logger.info(f"Initialized storage prefix for case {case_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize storage prefix for case {case_id}: {e}")
            return False

    def upload_file(self, case_id: str, file_name: str, file_bytes: bytes, content_type: str = "application/octet-stream") -> Optional[str]:
        """
        Uploads a file to Supabase storage.
        Path format: {case_id}/{file_name}
        """
        if not self.client:
            logger.error("Supabase client not initialized")
            return None
        
        # Sanitize filename but preserve directories
        import re
        safe_filename = re.sub(r'[^a-zA-Z0-9_\-\.\/]', '_', file_name)
        if safe_filename.startswith(f"{case_id}/"):
            storage_path = safe_filename
        else:
            safe_filename = safe_filename.lstrip('/')
            storage_path = f"{case_id}/{safe_filename}"
        
        try:
            res = self.client.storage.from_(self.bucket_name).upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            # res.json() should contain the uploaded path
            logger.info(f"Successfully uploaded {storage_path} to Supabase")
            return storage_path
        except Exception as e:
            logger.error(f"Failed to upload to Supabase: {e}")
            return None
            
    def get_download_url(self, storage_path: str, expires_in: int = 3600) -> Optional[str]:
        """
        Creates a short-lived signed URL for downloading a file securely.
        """
        if not self.client:
            return None
            
        try:
            res = self.client.storage.from_(self.bucket_name).create_signed_url(storage_path, expires_in)
            return res.get('signedURL') or res.get('signedUrl')
        except Exception as e:
            logger.error(f"Failed to get signed URL: {e}")
            return None

    def download_file(self, storage_path: str) -> Optional[bytes]:
        if not self.client:
            return None
            
        try:
            res = self.client.storage.from_(self.bucket_name).download(storage_path)
            return res
        except Exception as e:
            logger.error(f"Failed to download file from Supabase: {e}")
            return None

_supabase_storage_service = None

def get_supabase_storage_service() -> SupabaseStorageService:
    global _supabase_storage_service
    if _supabase_storage_service is None:
        _supabase_storage_service = SupabaseStorageService()
    return _supabase_storage_service
