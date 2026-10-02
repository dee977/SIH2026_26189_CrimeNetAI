filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

pattern = r"if \(\!session\) \{\s*setErrorMessage\('Authentication succeeded but session token was not returned\.'\);\s*return;\s*\}"

replacement = """if (!session) {
          if (data?.user) {
            setErrorMessage('Your account requires email verification. Please check your inbox and click the confirmation link.');
          } else {
            setErrorMessage('Authentication failed. No session returned.');
          }
          return;
        }"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
