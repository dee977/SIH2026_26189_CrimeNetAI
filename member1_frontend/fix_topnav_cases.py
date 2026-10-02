filepath = "src/components/layout/TopNav.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Add useCaseStore import if missing
if 'useCaseStore' not in code:
    code = code.replace("import { useAuthStore } from '../../store/authStore';", 
                        "import { useAuthStore } from '../../store/authStore';\nimport { useCaseStore } from '../../store/caseStore';")

# Add cases inside the component
if 'const { cases } = useCaseStore();' not in code:
    code = code.replace("const { unreadAlertCount", "const { cases } = useCaseStore();\n  const { unreadAlertCount")

# Replace the hardcoded <select> with dynamic options
pattern = r'<select\s*value=\{selectedCaseId \|\| \'CASE-2025-M3-DATASET\'\}\s*onChange=\{\(e\) => selectCase\(e\.target\.value\)\}\s*className="bg-transparent text-xs font-semibold text-\[var\(--primary\)\] focus:outline-none cursor-pointer"\s*>\s*<option value="CASE-2025-M3-DATASET".*?</select>'

replacement = """<select
            value={selectedCaseId || ''}
            onChange={(e) => selectCase(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[var(--primary)] focus:outline-none cursor-pointer"
          >
            <option value="" disabled className="bg-white text-[var(--text-secondary)]">Select Active Case...</option>
            {cases.map((c) => (
              <option key={c.caseId} value={c.caseId} className="bg-white text-[var(--text-primary)]">
                {c.caseNumber} ({c.title})
              </option>
            ))}
          </select>"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)

print("TopNav cases Replaced:", code != new_code)
