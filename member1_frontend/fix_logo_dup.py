filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

bad = """            <div className="flex items-center gap-3 mb-8">
                          <div className="flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="CrimeNet AI" className="h-12 object-contain" />
              <div>
                <span className="block text-[10px] text-cyan-400 font-mono mt-1">SIH2026 • SIH26189</span>
              </div>
            </div>"""

good = """            <div className="flex items-center gap-3 mb-8">
              <img src="/logo.png" alt="CrimeNet AI" className="h-12 object-contain" />
              <div>
                <span className="block text-[10px] text-cyan-400 font-mono mt-1">SIH2026 • SIH26189</span>
              </div>
            </div>"""

# since there's weird characters like ?, let's use regex
import re
code = re.sub(r'<div className="flex items-center gap-3 mb-8">\s*<div className="flex items-center gap-3 mb-8">\s*<img src="/logo\.png".*?</div>\s*</div>', good, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)
print("Logo dupe fixed")
