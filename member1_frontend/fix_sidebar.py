filepath = "src/components/layout/Sidebar.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Find the brand header and replace it correctly
pattern = r'\{\/\* Brand Header \*\/\}.*?<div className="px-3\.5 py-3 bg-\[var\(--sidebar-hover\)\]/40 border-b border-\[var\(--sidebar-hover\)\]">'

replacement = """{/* Brand Header */}
        <div className="p-4 border-b border-[var(--sidebar-hover)] flex items-center justify-between">
          <div className="flex flex-col gap-1.5 w-full">
            <img src="/logo.png" alt="CrimeNet AI" className="h-8 object-contain object-left" style={{ filter: 'brightness(0) invert(1)' }} />
            <div className="flex items-center gap-1.5 mt-1">
              <p className="text-[10px] text-[var(--sidebar-text-muted)] font-mono">SIH26189 Statutory Engine</p>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--primary)]/20 text-[var(--accent)] font-mono font-semibold ml-auto">RBAC</span>
            </div>
          </div>
        </div>

        {/* Role / Officer Card */}
        <div className="px-3.5 py-3 bg-[var(--sidebar-hover)]/40 border-b border-[var(--sidebar-hover)]">"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
