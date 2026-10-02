filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
code = code.replace("status: 'active',", "status: 'APPROVED',")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)
