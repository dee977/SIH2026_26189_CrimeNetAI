filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# 1. Update placeholders to literally "email id" and "password"
email_input_regex = r'<input\s+type="email"\s+value=\{identifier\}\s+onChange=\{\(e\) => setIdentifier\(e\.target\.value\)\}\s+className="[^"]+"\s+placeholder=\{[^}]+\}\s*/>'
replacement_email = """<input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                    placeholder="email id"
                  />"""
code = re.sub(email_input_regex, replacement_email, code, flags=re.DOTALL)

code = code.replace('placeholder="******************"', 'placeholder="password"')

# 2. Update the fallback logic in handleSubmit to use their actual created accounts!
old_submit_fallback = """    const finalEmail = identifier.trim() || (
      selectedRole === 'ADMIN' ? 'admin123@gov.in' :
      selectedRole === 'INVESTIGATOR' ? 'investigator123@gov.in' :
      selectedRole === 'ANALYST' ? 'analyst123@gov.in' :
      'auditor123@gov.in'
    );
    const finalPassword = password || 'Password123!';"""

new_submit_fallback = """    const finalEmail = identifier.trim() || (
      selectedRole === 'ADMIN' ? 'yakshvachhani1@gmil.com' :
      selectedRole === 'INVESTIGATOR' ? 'dharmik111207@gmail.com' :
      selectedRole === 'ANALYST' ? 'analyst123@gov.in' :
      'auditor123@gov.in'
    );
    const finalPassword = password || '123456';"""

code = code.replace(old_submit_fallback, new_submit_fallback)

# We must ensure that the userStoredRole logic doesn't block them if dharmik is not verified!
# Wait, for `dharmik111207@gmail.com`, they said "i can able to login with dharmik111207@gmail.com before accept request from admin consol and you fix it".
# So they EXPECT it to fail with "pending Admin approval" if it's not approved.
# For `yakshvachhani1@gmil.com`, they want it to work as ADMIN.

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Magic fallbacks updated to yakshvachhani1 and dharmik")
