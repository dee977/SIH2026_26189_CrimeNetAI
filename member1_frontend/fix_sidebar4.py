import re

with open('src/components/layout/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '  const location = useLocation();\n  const navigate = useNavigate();\n  const { user } = useAuthStore();',
    '  const location = useLocation();\n  const navigate = useNavigate();\n  const { user } = useAuthStore();\n  const { isSidebarCollapsed } = useNavigationStore();'
)
# If that didn't match, let's just insert it at the beginning of the component.
if 'const { isSidebarCollapsed }' not in content:
    content = content.replace(
        'export const Sidebar: React.FC = () => {',
        'export const Sidebar: React.FC = () => {\n  const { isSidebarCollapsed } = useNavigationStore();'
    )

with open('src/components/layout/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
