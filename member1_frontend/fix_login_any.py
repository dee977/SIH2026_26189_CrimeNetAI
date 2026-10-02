filepath = "src/components/public/LoginPage.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

target = """          session = {
              access_token: 'dev-bypass-token',
              user: {"""

replacement = """          session = {
              access_token: 'dev-bypass-token',
              user: {"""

code = code.replace("session = {", "session = {")

# Actually, I'll just find the exact assignment
import re
code = re.sub(r'session = \{\s*access_token: \'dev-bypass-token\'', 'session = {\n              access_token: \'dev-bypass-token\'', code)

# Let's replace the whole `session = { ... }` with `session = { ... } as any;`
pattern = r'session = \{\s*access_token: \'dev-bypass-token\',[\s\S]*?\}\s*\};\s*\} else \{'
replacement_str = """session = {
              access_token: 'dev-bypass-token',
              user: {
                  id: 'usr-dev-bypass',
                  email: 'yakshvachhani1108@gmail.com',
                  created_at: new Date().toISOString(),
                  user_metadata: {
                      name: 'Yaksh Vachhani',
                      officerId: 'LEO-1108',
                      organization: 'CrimeNet Administration',
                      role: 'ADMIN',
                      phone: '+91 99999 99999'
                  }
              }
          } as any;
      } else {"""
code = re.sub(pattern, replacement_str, code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Added as any.")
