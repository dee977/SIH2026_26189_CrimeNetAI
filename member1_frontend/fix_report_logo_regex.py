filepath = "src/components/reports/ReportView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re
pattern = r'<div className="w-16 h-16 bg-\[#0a192f\].*?</div>\s*<div>\s*<h1 className="text-2xl font-black text-\[#0a192f\] tracking-tight uppercase">CrimeNet Investigative Intelligence</h1>'
replacement = """<img src="/logo.png" alt="CrimeNet AI" className="h-16 object-contain mr-4" />
            <div>
              <h1 className="text-2xl font-black text-[#0a192f] tracking-tight uppercase">CrimeNet Investigative Intelligence</h1>"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)

print("ReportView Replaced:", code != new_code)
