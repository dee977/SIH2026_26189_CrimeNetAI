filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Fix type inference issue
code = code.replace("let data, error, session;", "let data: any, error: any, session: any;")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)
print("Fixed types")
