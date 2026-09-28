import re
with open('src/components/layout/Sidebar.tsx', 'r') as f:
    content = f.read()

# Make sure admin:read and admin are BOTH checked
content = content.replace("userPermissions.includes(item.requiredPermission);", "userPermissions.includes(item.requiredPermission) || (item.requiredPermission === 'admin:read' && userPermissions.includes('admin'));")

# Let's add BOTH!
new_nav = """
    { id: 'reports', label: 'Investigation Reports', icon: <FileText className="w-4 h-4" />, category: 'governance' },
    { id: 'admin', label: 'Admin Console', icon: <Settings className="w-4 h-4" />, category: 'governance', requiredPermission: 'admin:read' },
    { id: 'authority', label: 'System Admin', icon: <Settings className="w-4 h-4" />, category: 'governance', requiredPermission: 'admin:read' },
  ];
"""
content = re.sub(r"\{\s*id:\s*'reports'.*?\n\s*\{\s*id:\s*'admin'.*?\n\s*\];", new_nav, content, flags=re.DOTALL)

with open('src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(content)
