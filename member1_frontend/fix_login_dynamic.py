filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Find the email input field and replace the static placeholder with a dynamic one
# We know the state variable `selectedRole` holds the current role string ('ADMIN', 'INVESTIGATOR', etc)
# Let's map it dynamically.

email_input_target = r'<input\s+type="email"\s+required\s+value=\{identifier\}\s+onChange=\{\(e\) => setIdentifier\(e\.target\.value\)\}\s+className="w-full [^"]+"\s+placeholder="email id"\s*/>'

# We can replace `placeholder="email id"` with dynamic placeholder
# selectedRole is 'ADMIN', 'INVESTIGATOR', 'ANALYST', 'AUDITOR'

replacement_email = """<input
                    type="email"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                    placeholder={
                      selectedRole === 'ADMIN' ? 'admin123@gov.in' :
                      selectedRole === 'INVESTIGATOR' ? 'investigator123@gov.in' :
                      selectedRole === 'ANALYST' ? 'analyst123@gov.in' :
                      'auditor123@gov.in'
                    }
                  />"""

code = re.sub(email_input_target, replacement_email, code, flags=re.DOTALL)

# Password placeholder
password_input_target = r'placeholder="password"'
code = code.replace(password_input_target, 'placeholder="******************"')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Dynamic placeholders applied!")
