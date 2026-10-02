filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

pattern = r"// Check backend /auth/me.*?catch \(meErr: any\) \{.*?\}"

replacement = """// Check backend /auth/me to get the true approved role from PostgreSQL database
          try {
            const token = session.access_token;
            const meRes = await apiRequest<any>('/auth/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!meRes.success && (meRes.error === 'Unauthorized' || meRes.error === 'Permission denied' || meRes.error === 'Not found')) {
                setErrorMessage('Your account is pending Admin approval. You cannot log in yet.');
                await supabase.auth.signOut();
                return;
            }
            
            if (meRes.success && meRes.data?.grantedRole) {
              userStoredRole = meRes.data.grantedRole;
            }
          } catch (meErr: any) {
              console.warn('Backend /auth/me lookup notice:', meErr);
          }"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
