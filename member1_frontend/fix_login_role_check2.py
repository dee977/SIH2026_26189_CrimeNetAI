filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

str_to_replace = """        if (userStoredRole) {
          effectiveRole = normalizeRole(userStoredRole);
        }"""
        
replacement = """        if (userStoredRole) {
          const normalizedStoredRole = userStoredRole.toUpperCase();
          if (normalizedStoredRole !== selectedRole.toUpperCase()) {
            setErrorMessage(`Access Denied: Your account is provisioned for the ${normalizedStoredRole} role. Please select ${normalizedStoredRole} to login.`);
            await supabase.auth.signOut();
            return;
          }
          effectiveRole = normalizeRole(userStoredRole);
        }"""

if str_to_replace in code:
    code = code.replace(str_to_replace, replacement)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    print("Replaced role check successfully")
else:
    print("Could not find role check string")
