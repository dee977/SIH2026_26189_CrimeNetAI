import re

with open('app/dependencies.py', 'r') as f:
    content = f.read()

content = content.replace("user.grantedRole = db_profile.role", "user.grantedRole = db_profile.role.upper()")

with open('app/dependencies.py', 'w') as f:
    f.write(content)

with open('../member1_frontend/src/App.tsx', 'r') as f:
    content_app = f.read()

content_app = content_app.replace("grantedRole: beUser.grantedRole,", "grantedRole: (beUser.grantedRole || 'RESTRICTED').toUpperCase(),")

with open('../member1_frontend/src/App.tsx', 'w') as f:
    f.write(content_app)
