filepath = "src/components/layout/TopNav.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
# Regex to match that specific button without being greedy over multiple buttons
pattern = r'<button\s*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*setIsRoleDropdownOpen\(false\);\s*triggerSessionExpiry\(\);\s*\}\}[\s\S]*?<span>Simulate Session Expiry</span>\s*</button>'

new_code = re.sub(pattern, '', code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)

print("TopNav fixed properly.")
