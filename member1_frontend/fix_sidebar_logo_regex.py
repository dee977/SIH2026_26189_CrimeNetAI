filepath = "src/components/layout/Sidebar.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# We will replace the entire brand header
pattern = r'<div className="w-9 h-9 rounded-xl bg-\[var\(--primary\)]/10 border border-\[var\(--primary\)]/30.*?<p className="text-\[10px] text-\[var\(--sidebar-text-muted\)] font-mono">SIH26189 Statutory Engine</p>\s*</div>\s*</div>'

replacement = """<div className="flex flex-col gap-1.5 w-full">
            <img src="/logo.png" alt="CrimeNet AI" className="h-8 object-contain object-left" style={{ filter: 'brightness(0) invert(1)' }} />
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-[10px] text-[var(--sidebar-text-muted)] font-mono">SIH26189 Statutory Engine</p>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/20 text-[var(--accent)] font-mono font-semibold ml-auto">RBAC</span>
            </div>
          </div>"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)

print("Sidebar Replaced:", code != new_code)
