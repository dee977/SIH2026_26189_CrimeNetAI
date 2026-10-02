import re

with open('src/components/common/CaseSelector.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("compact?: boolean;", "compact?: boolean;\n  variant?: 'light' | 'dark';")
content = content.replace("compact = false,", "compact = false,\n  variant = 'light',")

old_class = r'className=\{lex items-center gap-2 rounded-lg border border-\[var\(--border\)\] bg-white hover:bg-slate-50 transition-colors shadow-sm \$\{[\s\S]*?\}\}'
new_class = """className={lex items-center justify-between gap-2 rounded-xl border transition-colors shadow-sm  }"""
content = re.sub(old_class, new_class, content)

old_text = r'<div className=\{ont-semibold text-\[var\(--primary\)\] truncate max-w-\[200px\] \$\{compact \? \'text-\[10px\]\' : \'text-\[11px\]\'\}\}>'
new_text = r'<div className={ont-semibold truncate max-w-[200px]  }>'
content = re.sub(old_text, new_text, content)

old_chev = r'<ChevronDown className="w-3\.5 h-3\.5 text-\[var\(--text-muted\)\] shrink-0" />'
new_chev = r'<ChevronDown className={w-3.5 h-3.5 shrink-0 } />'
content = re.sub(old_chev, new_chev, content)

old_brief = r'<Briefcase className="w-3\.5 h-3\.5 text-\[var\(--primary\)\]" />'
new_brief = r'<Briefcase className={w-3.5 h-3.5 shrink-0 } />'
content = re.sub(old_brief, new_brief, content)

with open('src/components/common/CaseSelector.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated")
