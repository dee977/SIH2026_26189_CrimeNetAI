
import re

with open("src/components/evidence/EvidenceView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

modal_start = content.find("{/* UPLOAD EVIDENCE MODAL */}")
if modal_start == -1:
    print("Modal block not found")
    exit(1)

# Find where the modal ends. It ends at `        )}` which is after `</form></div></div>`
modal_match = re.search(r"\{\/\* UPLOAD EVIDENCE MODAL \*\/.*?\n\s*\}\)", content[modal_start:], re.DOTALL)
if not modal_match:
    print("Could not extract modal")
    exit(1)

modal_code = modal_match.group(0)

# Remove the modal from the bottom
content = content.replace(modal_code, "")

# Inject the modal code as a variable before the first `if` statement
injection = "  const uploadModalJSX = (\n    <>\n      " + modal_code.replace("\n", "\n      ") + "\n    </>\n  );\n\n  if (!targetCase) {"

content = content.replace("  if (!targetCase) {", injection, 1)

# Now inject {uploadModalJSX} into the empty state return
empty_state_match = re.search(r"(if \(evidenceList\.length === 0\) \{\s*return \(\s*)(<div className=\"bg-\[var\(--bg-card\)\].*?<\/div>)(\s*\);\s*\})", content, re.DOTALL)

if empty_state_match:
    new_empty_state = empty_state_match.group(1) + "<>\n        " + empty_state_match.group(2) + "\n        {uploadModalJSX}\n      </>" + empty_state_match.group(3)
    content = content.replace(empty_state_match.group(0), new_empty_state)
else:
    print("Could not find empty state")
    exit(1)
    
# Now inject {uploadModalJSX} into the main return
main_return_match = re.search(r"(<div className=\"space-y-6 animate-in fade-in duration-300\">.*)(<\/div>\s*\)\;\s*\}\;)", content, re.DOTALL)
if main_return_match:
    new_main = main_return_match.group(1) + "\n      {uploadModalJSX}\n    " + main_return_match.group(2)
    content = content.replace(main_return_match.group(0), new_main)
else:
    print("Could not find main return")
    exit(1)

with open("src/components/evidence/EvidenceView.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")

