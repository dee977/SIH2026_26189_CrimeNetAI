filepath = "src/components/public/ResetPasswordPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

code = re.sub(
    r"style=\{\{\s*filter:\s*'brightness\(0\)\s*invert\(1\)'\s*\}\}",
    r"style={{ filter: 'invert(1)', mixBlendMode: 'screen' }}",
    code
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)
