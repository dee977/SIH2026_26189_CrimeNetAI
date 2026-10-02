import re

with open('src/components/public/LoginPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "'bg-[var(--bg-primary)]/40 border-[var(--border)]/80 hover:border-[var(--border)]'",
    "'bg-white/10 border-white/20 hover:bg-white/20'"
)

with open('src/components/public/LoginPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed left side boxes")
