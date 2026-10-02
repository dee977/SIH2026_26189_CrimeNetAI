import os
import re

file_path = 'member1_frontend/src/components/layout/TopNav.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace dark mode classes in TopNav
content = content.replace('bg-slate-900/40', 'bg-white')
content = content.replace('hover:bg-slate-800/80', 'hover:bg-slate-50')
content = content.replace('border-slate-700/80', 'border-[var(--border)]')
content = content.replace('text-white', 'text-[var(--text-primary)]')
content = content.replace('bg-[#0f172a]', 'bg-white')
content = content.replace('border-slate-800', 'border-[var(--border)]')
content = content.replace('text-slate-400', 'text-[var(--text-secondary)]')
content = content.replace('text-amber-300', 'text-amber-600')
content = content.replace('hover:bg-amber-950/30', 'hover:bg-amber-50')
content = content.replace('text-rose-400', 'text-rose-600')
content = content.replace('hover:bg-rose-950/30', 'hover:bg-rose-50')
content = content.replace('text-rose-300', 'text-rose-700')
content = content.replace('text-blue-300', 'text-blue-700')
content = content.replace('text-cyan-300', 'text-cyan-700')

with open(file_path, 'w') as f:
    f.write(content)

print("Updated TopNav.tsx")
