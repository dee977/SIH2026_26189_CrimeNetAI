filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
code = re.sub(
    r'\} catch \(err: any\) \{\s*setErrorMessage\(err\.message \|\| \'Login failed\'\);\s*\} finally \{',
    """} catch (err: any) {
        setErrorMessage(err.message || 'Login failed');
        alert("Unexpected Login Crash: " + (err.message || 'Login failed'));
      } finally {""",
    code
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Catch alert added properly")
