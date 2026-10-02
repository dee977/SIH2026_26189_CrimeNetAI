import re

with open('src/components/public/LoginPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'bg-[var(--primary)] hover:bg-[var(--primary)] text-[var(--text-primary)] font-bold',
    'bg-[var(--primary)] hover:bg-blue-600 text-white font-bold'
)

with open('src/components/public/LoginPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed sign in button text color")
