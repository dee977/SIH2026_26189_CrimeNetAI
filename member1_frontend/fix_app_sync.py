filepath = "src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

pattern = r"\} catch \(err\) \{\s*console\.warn\(\"Backend profile sync warning, maintaining active session:\", err\);\s*\}"

replacement = """} catch (err: any) {
    console.warn("Backend profile sync error:", err);
    if (err.message === 'Unauthorized' || err.status === 401) {
      // If the backend rejects the token (e.g. user not approved), kill the session entirely
      // to prevent infinite retry loops and secure the frontend.
      await supabase.auth.signOut();
      setSession(null, null);
    }
  }"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
