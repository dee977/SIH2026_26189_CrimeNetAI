filepath = "src/components/public/LandingPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

pattern = r'<div className="w-10 h-10 rounded-xl bg-\[var\(--surface-cyan\)] border border-\[var\(--primary\)] flex items-center justify-center text-\[var\(--primary\)]">\s*<Shield className="w-5 h-5" />\s*</div>\s*<div>\s*<div className="flex items-center gap-2">\s*<span className="font-bold text-base text-\[var\(--text-primary\)] tracking-tight">CrimeNet AI</span>'

replacement = """<img src="/logo.png" alt="CrimeNet AI" className="h-10 object-contain" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[var(--text-primary)] tracking-tight hidden">CrimeNet AI</span>"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)

print("LandingPage Replaced:", code != new_code)
