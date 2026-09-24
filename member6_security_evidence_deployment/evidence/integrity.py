import hashlib
import os

def calculate_sha256(file_path: str) -> str:
    """Calculates the SHA-256 hash of a file."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
        
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        # Read and update hash in chunks of 4K
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def verify_evidence_integrity(file_path: str, original_hash: str) -> bool:
    """
    Verifies if the current file hash matches the original hash.
    Returns True if match, False if mismatch (Tamper Indication).
    """
    current_hash = calculate_sha256(file_path)
    return current_hash == original_hash
