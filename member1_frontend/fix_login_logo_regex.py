filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
pattern = r'<div className="w-10 h-10 rounded-xl bg-\[var\(--primary\)]/20.*?<span className="font-bold text-xl text-white tracking-tight">CrimeNet AI</span>'
replacement = """<img src="/logo.png" alt="CrimeNet AI" className="h-10 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)

print("LoginPage Replaced:", code != new_code)
