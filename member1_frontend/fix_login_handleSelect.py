filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
old_handle = """  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const match = ROLE_OPTIONS.find(r => r.id === role);
    if (match) {
      setIdentifier(match.demoEmail);
      setPassword('Password123!');
    }
  };"""

new_handle = """  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
  };"""

if old_handle in code:
    code = code.replace(old_handle, new_handle)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Fixed handleSelectRole!")
else:
    print("Could not find old_handle!")

