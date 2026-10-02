filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# 1. Placeholders
code = code.replace('placeholder="officer@agency.gov"', 'placeholder="email id"')
code = re.sub(r'placeholder="[\?]+"', 'placeholder="password"', code)

# 2. Delete default password line
old_line = """              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  Default password: <code className="text-cyan-400">Password123!</code>
                </span>
                <button 
                  type="button" 
                  onClick={() => setView('forgot-password')}
                  className="text-blue-400 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>"""

new_line = """              <div className="flex justify-end text-xs pt-1">
                <button 
                  type="button" 
                  onClick={() => setView('forgot-password')}
                  className="text-blue-400 hover:underline font-medium"
                >
                  Forgot Password?
                </button>
              </div>"""

if old_line in code:
    code = code.replace(old_line, new_line)
else:
    print("WARNING: Could not find default password block to replace")

# 3. Logo replacement
logo_target = """            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center text-[var(--accent)] shadow-sm shadow-[var(--primary)]/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-xl text-white tracking-tight">CrimeNet AI</span>
                <span className="block text-[10px] text-cyan-400 font-mono">SIH2026 • SIH26189</span>
              </div>
            </div>"""

logo_replacement = """            <div className="flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="CrimeNet AI" className="h-12 object-contain" />
              <div>
                <span className="block text-[10px] text-cyan-400 font-mono mt-1">SIH2026 • SIH26189</span>
              </div>
            </div>"""

# Try matching without exact whitespace
logo_target_regex = r'<div className="w-10 h-10 rounded-xl bg-\[var\(--primary\)\].*?CrimeNet AI</span>\s*<span className="block text-\[10px\] text-cyan-400 font-mono">SIH2026.*?</span>\s*</div>\s*</div>'

match = re.search(logo_target_regex, code, re.DOTALL)
if match:
    code = code[:match.start()] + logo_replacement + code[match.end():]
else:
    print("WARNING: Logo not found")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("UI fixes applied")
