filepath = "src/components/layout/TopNav.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Find the button that contains "Simulate Session Expiry"
pattern = r'<button[^>]*?onClick=\{\(\) => setSession\(null, null\)\}[^>]*?>\s*<Clock className="w-3\.5 h-3\.5" />\s*<span>Simulate Session Expiry</span>\s*</button>'
# Actually let's just find "Simulate Session Expiry" and remove the enclosing button
pattern2 = r'<button[\s\S]*?<span>Simulate Session Expiry</span>[\s\S]*?</button>'

new_code = re.sub(pattern2, '', code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)

print("Removed from TopNav.")
