filepath = "src/components/layout/TopNav.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
# Regex to match this specific button
pattern = r'<button\s*onClick=\{\(\) => \{\s*setIsRoleDropdownOpen\(false\);\s*triggerSessionExpiry\(\);\s*\}\}\s*className="w-full text-left px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-amber-950/30 flex items-center gap-2 transition-colors"\s*>\s*<Clock className="w-3\.5 h-3\.5" />\s*<span>Simulate Session Expiry</span>\s*</button>'

new_code = re.sub(pattern, '', code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)

print("TopNav fixed properly 4.")
