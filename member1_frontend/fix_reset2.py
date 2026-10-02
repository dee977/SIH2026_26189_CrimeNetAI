filepath = "src/components/public/ResetPasswordPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

pattern = r'<img src="/logo.png" alt="CrimeNet AI" className="h-10 object-contain" />'

replacement = """<img src="/logo.png" alt="CrimeNet AI" className="h-10 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />"""

new_code = re.sub(pattern, replacement, code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
