import re

with open('src/components/evidence/EvidenceView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the end of the file to include {uploadModalJSX}
content = content.replace(
    '      )}\n\n    </div>\n  );\n};\n',
    '      )}\n\n      {uploadModalJSX}\n    </div>\n  );\n};\n'
)

with open('src/components/evidence/EvidenceView.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
