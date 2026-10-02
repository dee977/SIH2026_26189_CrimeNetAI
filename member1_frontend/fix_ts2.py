import re

with open('src/types/cases.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('relationshipCount: number;', 'relationshipCount?: number;')
content = content.replace('reportCount: number;', 'reportCount?: number;')

with open('src/types/cases.ts', 'w', encoding='utf-8') as f:
    f.write(content)
