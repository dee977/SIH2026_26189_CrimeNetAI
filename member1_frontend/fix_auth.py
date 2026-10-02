import re

with open('src/components/common/CaseSelector.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'import { useCaseStore } from "../../store/caseStore";',
    'import { useCaseStore } from "../../store/caseStore";\nimport { useAuthStore } from "../../store/authStore";'
)
content = content.replace(
    'const { cases, user } = useCaseStore();',
    'const { cases } = useCaseStore();\n  const { user } = useAuthStore();'
)

with open('src/components/common/CaseSelector.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
