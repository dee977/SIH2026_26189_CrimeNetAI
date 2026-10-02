filepath = "src/components/layout/Sidebar.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

target = """        {/* Brand Header */}
        <div className="p-4 border-b border-[var(--sidebar-hover)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/30 flex items-center justify-center text-[var(--accent)] shadow-sm shadow-[var(--primary)]/10">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[var(--sidebar-text)] tracking-tight">CrimeNet AI</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/20 text-[var(--accent)] font-mono font-semibold">RBAC</span>
              </div>
              <p className="text-[10px] text-[var(--sidebar-text-muted)] font-mono">SIH26189 Statutory Engine</p>
            </div>
          </div>
        </div>"""

replacement = """        {/* Brand Header */}
        <div className="p-4 border-b border-[var(--sidebar-hover)] flex items-center justify-between">
          <div className="flex flex-col gap-1.5 w-full">
            <img src="/logo.png" alt="CrimeNet AI" className="h-8 object-contain object-left" style={{ filter: 'brightness(0) invert(1)' }} />
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-[10px] text-[var(--sidebar-text-muted)] font-mono">SIH26189 Statutory Engine</p>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/20 text-[var(--accent)] font-mono font-semibold ml-auto">RBAC</span>
            </div>
          </div>
        </div>"""

# Remove extra whitespace differences
code = code.replace(target, replacement)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Sidebar logo updated.")
