filepath = "src/components/alerts/AlertsView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
code = re.sub(r'bg-\[\#112240\] rounded-2xl border border-\[\#1f2937\]\s*text-\[var\(--text-secondary\)\].*?flex flex-col', 'bg-white rounded-2xl border border-slate-200 text-slate-800 flex flex-col', code, flags=re.DOTALL)
code = code.replace('text-slate-600', 'text-slate-400')
code = code.replace('text-[var(--text-secondary)] text-sm', 'text-slate-800 text-sm')
code = code.replace('text-[var(--text-muted)] mt-1 max-w-md', 'text-slate-500 mt-1 max-w-md')

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Alerts empty state fixed.")
