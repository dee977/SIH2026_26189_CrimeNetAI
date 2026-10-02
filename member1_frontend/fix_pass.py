import re

with open('src/components/public/LoginPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'<span className="text-\[11px\] text-\[var\(--text-secondary\)\] font-mono">\s*Default password: <code[^>]*>Password123!</code>\s*</span>',
    '<span></span>',
    content
)

with open('src/components/public/LoginPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed default password text")
