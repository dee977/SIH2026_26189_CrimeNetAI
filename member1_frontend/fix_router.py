filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# 1. Add import
if "import { useNavigate }" not in code:
    code = code.replace("import React", "import React from 'react';\nimport { useNavigate } from 'react-router-dom';\n//")

# 2. Replace useNavigationStore() with useNavigate()
code = code.replace("const { setView } = useNavigationStore();", "const navigate = useNavigate();")

# 3. Replace setView('dashboard') with navigate('/dashboard')
code = code.replace("setView('dashboard');", "navigate('/dashboard');")

# 4. Replace setView('forgot-password') with navigate('/forgot-password')
code = code.replace("setView('forgot-password')", "navigate('/forgot-password')")

# 5. Replace setView('register') with navigate('/register')
code = code.replace("setView('register')", "navigate('/register')")

# Remove useNavigationStore import if not needed
code = re.sub(r"import\s*\{\s*useNavigationStore\s*\}\s*from\s*'[^']+';\s*", "", code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Router fixed")
