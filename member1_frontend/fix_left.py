import re

with open('src/components/public/LoginPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

right_side_start = content.find('<div className="w-full lg:w-7/12')
if right_side_start != -1:
    left_part = content[:right_side_start]
    right_part = content[right_side_start:]
    
    # Left part fixes
    left_part = left_part.replace('text-[var(--text-primary)]', 'text-white')
    left_part = left_part.replace('text-[var(--sidebar-text-muted)]', 'text-slate-400')
    left_part = left_part.replace('text-[var(--text-secondary)]', 'text-slate-300')
    
    content = left_part + right_part

with open('src/components/public/LoginPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated left side texts")
