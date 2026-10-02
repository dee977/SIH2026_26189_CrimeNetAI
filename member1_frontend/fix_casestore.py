filepath = "src/store/caseStore.ts"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Fix the condition
pattern = r"if \(res\.success && res\.data\) \{\s*const items = Array\.isArray\(res\.data\) \? res\.data : \(res\.data\.items \|\| \[\]\);"
replacement = """if (res.success && (res.data || res.items)) {
          const rawData = res.data || res;
          const items = Array.isArray(rawData) ? rawData : (rawData.items || []);"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
