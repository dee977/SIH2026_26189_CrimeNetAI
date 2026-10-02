import re

with open('src/components/gis/GISMapView.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix contrast issues by replacing var(--text-primary) with text-white where background is dark
c = c.replace('text-[var(--text-primary)]', 'text-white')
c = c.replace('text-[var(--text-secondary)]', 'text-slate-300')
c = c.replace('text-[var(--text-muted)]', 'text-slate-400')
c = c.replace('border-[var(--border)]', 'border-slate-700/50')
c = c.replace('text-slate-600', 'text-slate-400') # MapPin icon

with open('src/components/gis/GISMapView.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
