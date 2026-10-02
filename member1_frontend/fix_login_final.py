filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

# Fix 1: The swallowed brace for if (error)
str_to_replace = """        if (error) {
          setErrorMessage(error.message);
          return;
        
        session = data?.session;
    }"""
replacement = """        if (error) {
          setErrorMessage(error.message);
          return;
        }
        session = data?.session;"""
code = code.replace(str_to_replace, replacement)

# Fix 2: The catch block
str_to_replace2 = """        // Check backend /auth/me to get the true approved role from PostgreSQL database
        try {
          const token = session.access_token;
          const meRes = await apiRequest<any>('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (meRes.success && meRes.data?.grantedRole) {
            userStoredRole = meRes.data.grantedRole;
          }
        } catch (meErr: any) {
            console.warn('Backend /auth/me lookup notice:', meErr);
            if (meErr.message === 'Unauthorized' || meErr.status === 401) {
              setErrorMessage('Your account is pending Admin approval. You cannot log in yet.');
              await supabase.auth.signOut();
              return;
            }
          }"""

replacement2 = """        // Check backend /auth/me to get the true approved role from PostgreSQL database
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
            if (meErr.message === 'Unauthorized' || meErr.status === 401) {
              setErrorMessage('Your account is pending Admin approval. You cannot log in yet.');
              await supabase.auth.signOut();
              return;
            }
        }"""

code = code.replace(str_to_replace2, replacement2)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)
print("Replaced Fix 1:", str_to_replace in code)  # should be false
print("Replaced Fix 2:", str_to_replace2 in code) # should be false
