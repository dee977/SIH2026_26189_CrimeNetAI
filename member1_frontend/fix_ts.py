filepath = "src/store/caseStore.ts"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Fix the typescript error
pattern = r"if \(res\.success && \(res\.data \|\| res\.items\)\) \{"
replacement = "if (res.success && (res.data || (res as any).items)) {"

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
