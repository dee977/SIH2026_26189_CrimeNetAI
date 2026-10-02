filepath = "src/components/layout/TopNav.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace(
    'className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs"',
    'className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[var(--border)] shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 text-xs"'
)

code = code.replace(
    '<div className="pb-3 border-b border-slate-800">',
    '<div className="pb-3 border-b border-[var(--border)]">'
)

code = code.replace(
    '<p className="font-bold text-white text-sm">',
    '<p className="font-bold text-[var(--text-primary)] text-sm">'
)

code = code.replace(
    '<p className="text-[11px] text-slate-400 font-mono mt-0.5">',
    '<p className="text-[11px] text-[var(--text-secondary)] font-mono mt-0.5">'
)

code = code.replace(
    '<div className="py-2 border-b border-slate-800 space-y-1">',
    '<div className="py-2 border-b border-[var(--border)] space-y-1">'
)

code = code.replace(
    '<span className="text-[10px] text-slate-400 font-mono">',
    '<span className="text-[10px] text-[var(--text-secondary)] font-mono">'
)

code = code.replace(
    '<div className="text-[10px] font-mono text-slate-400">',
    '<div className="text-[10px] font-mono text-[var(--text-secondary)]">'
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Fixed TopNav dropdown colors.")
