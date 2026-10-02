import re

with open('src/components/common/CaseSelector.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const canCreate = user?.grantedRole === "ADMIN" || user?.grantedRole === "SUPERVISOR";',
    'const canCreate = user?.grantedRole === "ADMIN";'
)

with open('src/components/common/CaseSelector.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
