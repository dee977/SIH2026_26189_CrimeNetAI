filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
pattern = r"permissions: permissions\n\s*\}\);"
replacement = "permissions: permissions,\n        status: 'active',\n        createdAt: new Date().toISOString()\n      });"

new_code = re.sub(pattern, replacement, code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
