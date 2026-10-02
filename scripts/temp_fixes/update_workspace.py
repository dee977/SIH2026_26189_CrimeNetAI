import os
import re

file_path = 'member1_frontend/src/components/cases/InvestigationWorkspace.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace dark mode classes in InvestigationWorkspace
content = content.replace('bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/80', '')
content = content.replace('bg-cyan-950', 'bg-blue-50')
content = content.replace('border-cyan-800', 'border-blue-200')
content = content.replace('text-cyan-300', 'text-blue-700')
content = content.replace('text-emerald-400', 'text-[var(--success)]')
content = content.replace('text-[var(--primary)]', 'text-[var(--primary)]') # No-op, just checking

# The tab active state:
content = content.replace("bg-[var(--surface-cyan)] text-cyan-300 border border-[var(--primary)] shadow-sm", "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold shadow-sm")

with open(file_path, 'w') as f:
    f.write(content)

print("Updated InvestigationWorkspace.tsx")
