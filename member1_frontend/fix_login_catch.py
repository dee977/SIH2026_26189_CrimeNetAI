filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# We need to manually check if meRes.success is false
pattern = r"""try \{
            const token = session\.access_token;
            const meRes = await apiRequest<any>\('/auth/me', \{
              headers: \{ Authorization: `Bearer \$\{token\}` \}
            \}\);
            if \(meRes\.success && meRes\.data\?\.grantedRole\) \{
              userStoredRole = meRes\.data\.grantedRole;
            \}
          \} catch \(meErr: any\) \{
              console\.warn\('Backend /auth/me lookup notice:', meErr\);
              if \(meErr\.message === 'Unauthorized' \|\| meErr\.status === 401\) \{
                setErrorMessage\('Your account is pending Admin approval\. You cannot log in yet\.'\);
                await supabase\.auth\.signOut\(\);
                return;
              \}
            \}"""

replacement = """try {
            const token = session.access_token;
            const meRes = await apiRequest<any>('/auth/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!meRes.success && (meRes.error === 'Unauthorized' || meRes.error === 'Permission denied')) {
              setErrorMessage('Your account is pending Admin approval. You cannot log in yet.');
              await supabase.auth.signOut();
              return;
            }
            if (meRes.success && meRes.data?.grantedRole) {
              userStoredRole = meRes.data.grantedRole;
            }
          } catch (meErr: any) {
            // Unlikely to hit this since apiRequest catches
          }"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
