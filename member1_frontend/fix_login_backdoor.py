filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# We want to replace the `if (identifier.trim().toLowerCase() === 'yakshvachhani1108@gmail.com') { ... } else { ... }` block
# with just the Supabase sign in.

pattern = r"// Developer backdoor\s*if \(identifier\.trim\(\)\.toLowerCase\(\) === 'yakshvachhani1108@gmail\.com'\) \{.*?\} else \{\s*(const res = await supabase\.auth\.signInWithPassword\(\{\s*email: identifier\.trim\(\),\s*password: password,\s*\}\);.*?)\}"

replacement = r"""\1"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Backdoor removed:", code != new_code)
