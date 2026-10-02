filepath = "app/dependencies.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# We will use regex to replace the exact auto-provision block
pattern = r"      db_profile = db\.query\(UserProfileModel\)\.filter\(UserProfileModel\.email\.ilike\(user\.email\)\)\.first\(\)\s*if not db_profile:.*?user\.grantedRole = \(db_profile\.role\.upper\(\) if db_profile else 'INVESTIGATOR'\)"

replacement = """      db_profile = db.query(UserProfileModel).filter(UserProfileModel.email.ilike(user.email)).first()
      if not db_profile:
          from app.exceptions import AuthenticationError
          raise AuthenticationError('Your account is pending Admin approval or does not exist.')

      if not db_profile.is_active:
          from app.exceptions import AuthenticationError
          raise AuthenticationError('Your account is currently suspended or pending Admin approval.')

      user.grantedRole = (db_profile.role.upper() if db_profile else 'INVESTIGATOR')"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced:", code != new_code)
