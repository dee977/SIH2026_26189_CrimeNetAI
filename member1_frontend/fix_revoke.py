filepath = "src/components/admin/AdminDashboardView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

revoke_handler = """
  const handleRevoke = (id: string, name: string) => {
    setOfficers(prev => prev.map(o => o.id === id ? { ...o, status: 'RESTRICTED' } : o));
    triggerAction(`Revoked active JWT session tokens for ${name}`);
  };
"""

code = code.replace("const handleRebuild = () => {", revoke_handler + "\n  const handleRebuild = () => {")

code = re.sub(r"onClick=\{\(\) => triggerAction\(`Revoked active JWT session tokens for \$\{officer\.name\}`\)\}", r"onClick={() => handleRevoke(officer.id, officer.name)}", code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Revoke fixed.")
