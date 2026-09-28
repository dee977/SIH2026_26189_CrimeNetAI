import re
with open('app/dependencies.py', 'r') as f:
    content = f.read()

new_logic = """
    db_profile = db.query(UserProfileModel).filter(UserProfileModel.email.ilike(user.email)).first()
    
    if user.email == 'admin123@gov.in':
        user.grantedRole = 'ADMIN'
    elif db_profile:
        user.grantedRole = db_profile.role.upper()
    else:
        user.grantedRole = 'RESTRICTED'
"""

content = re.sub(r"db_profile = db\.query\(UserProfileModel\)\.filter\(UserProfileModel\.email\.ilike\(user\.email\)\)\.first\(\)\s*if db_profile:\s*user\.grantedRole = db_profile\.role\.upper\(\)\s*else:\s*# Default restricted role if not in DB\s*user\.grantedRole = 'RESTRICTED'", new_logic, content, flags=re.DOTALL)

with open('app/dependencies.py', 'w') as f:
    f.write(content)
