import re

with open('src/components/public/LoginPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix handleSelectRole
content = content.replace(
    '''  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    const match = ROLE_OPTIONS.find(r => r.id === role);
    if (match) {
      setIdentifier(match.demoEmail);
      setPassword('Password123!');
    }
  };''',
    '''  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
  };'''
)

# 2. Fix the placeholders to be dynamic
content = content.replace(
    'placeholder="officer@agency.gov"',
    'placeholder={ROLE_OPTIONS.find(r => r.id === selectedRole)?.demoEmail || "officer@agency.gov"}'
)
content = content.replace(
    'placeholder="•••••••••"',
    'placeholder="Password123!"'
)

with open('src/components/public/LoginPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed placeholders and handleSelectRole")
