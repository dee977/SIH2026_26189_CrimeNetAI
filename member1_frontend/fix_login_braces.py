filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Fix the broken curly brace block
pattern = r"if \(error\) \{\s*setErrorMessage\(error\.message\);\s*return;\s*session = data\?\.session;\s*\}"

replacement = """if (error) {
          setErrorMessage(error.message);
          return;
        }
        session = data?.session;"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
