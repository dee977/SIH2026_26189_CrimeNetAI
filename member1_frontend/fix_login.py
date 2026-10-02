filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

pattern = r'<div className="flex items-center gap-3 mb-8">.*?<h1 className="text-3xl font-bold tracking-tight text-white leading-tight mb-4 max-w-lg">'

replacement = """<div className="flex flex-col items-start gap-1 mb-8">
              <img src="/logo.png" alt="CrimeNet AI" className="h-12 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
              <span className="block text-[10px] text-blue-600 font-mono">SIH2026 • SIH26189</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white leading-tight mb-4 max-w-lg">"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
