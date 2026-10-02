filepath = "src/components/layout/TopNav.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

target = r'<button[^>]*>\s*<Clock className="w-3\.5 h-3\.5" />\s*<span>Simulate Session Expiry</span>\s*</button>'
code = re.sub(target, '', code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Removed Simulate Session Expiry.")
