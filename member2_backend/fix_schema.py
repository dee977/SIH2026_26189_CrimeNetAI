filepath = "app/api/v1/access_requests.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
schema_target = "badge_number: Optional[str] = None"
schema_new = "badge_number: Optional[str] = None\n    phone: Optional[str] = None\n    phone_number: Optional[str] = None"
if "phone: Optional[str] = None" not in code:
    code = code.replace(schema_target, schema_new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Schema fixed.")
