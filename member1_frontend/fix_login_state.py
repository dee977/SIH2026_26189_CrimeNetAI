filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
code = re.sub(r"const \[identifier,\s*setIdentifier\] = useState\([^)]+\);", "const [identifier, setIdentifier] = useState('');", code)
code = re.sub(r"const \[password,\s*setPassword\] = useState\([^)]+\);", "const [password, setPassword] = useState('');", code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("State variables set to empty strings.")
