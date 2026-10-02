import re

with open('src/components/public/LoginPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'(<input[^>]*type="password"[^>]*)placeholder="[^"]*"',
    r'\1placeholder="Password123!"',
    content
)

with open('src/components/public/LoginPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed password placeholder")
