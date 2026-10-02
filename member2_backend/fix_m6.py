filepath = "app/services/m6_security_evidence.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Remove the local import
pattern = r"if token == 'dev-bypass-token':\s*from app\.schemas\.auth import UserProfile\s*return UserProfile"
replacement = "if token == 'dev-bypass-token':\n            return UserProfile"

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
