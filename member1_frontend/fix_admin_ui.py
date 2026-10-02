filepath = "src/components/admin/AdminDashboardView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Access requests phone display
req_target = "<span>{req.badgeNumber || 'PENDING'}</span>"
req_new = "<span>{req.badgeNumber || 'PENDING'}</span>\n                                  {req.phone && <span>•</span>}\n                                  {req.phone && <span>{req.phone}</span>}"
code = code.replace(req_target, req_new)

# Officer list phone display
officer_target = "<div className=\"text-[11px] font-mono text-[var(--text-muted)]\">{officer.email}</div>"
officer_new = "<div className=\"text-[11px] font-mono text-[var(--text-muted)]\">{officer.email}</div>\n                          {officer.phone && <div className=\"text-[11px] font-mono text-[var(--text-muted)] mt-0.5\">{officer.phone}</div>}"
code = code.replace(officer_target, officer_new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Admin UI fixed.")
