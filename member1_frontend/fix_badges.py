filepath = "src/components/layout/Sidebar.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
code = re.sub(r',\s*badge:\s*\'[^\']+\'', '', code)
code = re.sub(r'\{item\.badge && \(.*?</span>\s*\)\}', '', code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Badges removed.")
