filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Match the password input
password_input_target = r'<input\s+type="password"\s+required\s+value=\{password\}\s+onChange=\{\(e\) => setPassword\(e\.target\.value\)\}\s+className="w-full [^"]+"\s+placeholder="[^"]*"\s*/>'

replacement_pwd = """<input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-mono"
                    placeholder="******************"
                  />"""

code = re.sub(password_input_target, replacement_pwd, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Password placeholder applied!")
