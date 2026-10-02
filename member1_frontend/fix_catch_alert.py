filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

old_catch = """      } catch (err: any) {
        setErrorMessage(err.message || 'Login failed');
      } finally {"""

new_catch = """      } catch (err: any) {
        setErrorMessage(err.message || 'Login failed');
        alert("Unexpected Login Crash: " + (err.message || 'Login failed'));
      } finally {"""

if old_catch in code:
    code = code.replace(old_catch, new_catch)
else:
    print("could not find catch")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Catch alert added")
