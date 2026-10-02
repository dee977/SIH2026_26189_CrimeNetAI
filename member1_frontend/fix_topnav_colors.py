filepath = "src/components/layout/TopNav.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

# Change button background
code = code.replace(
    'className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-slate-700/80 text-[var(--text-primary)] transition-all shadow-sm"',
    'className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-[var(--border)] text-[var(--text-primary)] transition-all shadow-sm"'
)

# Change text-white to text-[var(--text-primary)]
code = code.replace(
    '<div className="text-[11px] font-bold text-white leading-tight flex items-center gap-1.5">',
    '<div className="text-[11px] font-bold text-[var(--text-primary)] leading-tight flex items-center gap-1.5">'
)

code = code.replace(
    '<span className="text-slate-400">Logged in as:</span>',
    '<span className="text-[var(--text-secondary)]">Logged in as:</span>'
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed TopNav Officer button colors.")
