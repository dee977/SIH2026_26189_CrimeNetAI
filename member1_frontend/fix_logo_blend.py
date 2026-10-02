filepaths = [
    "src/components/layout/Sidebar.tsx",
    "src/components/public/LoginPage.tsx",
    "src/components/public/LandingPage.tsx"
]

import re

for filepath in filepaths:
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()
    
    # Replace brightness(0) invert(1) with invert(1) and add mix-blend-mode
    # Or replace the whole style attribute
    code = re.sub(
        r"style=\{\{\s*filter:\s*'brightness\(0\)\s*invert\(1\)'\s*\}\}",
        r"style={{ filter: 'invert(1)', mixBlendMode: 'screen' }}",
        code
    )
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)

print("Updated filter and blend modes.")
