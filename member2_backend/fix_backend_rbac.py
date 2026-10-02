filepath = "app/dependencies.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# We want to replace everything from `db_profile = db.query` down to `user.role = db_profile.role`
# Let's just find the `def get_current_user` function and rewrite it carefully.

pattern = r"(db_profile = db\.query\(UserProfileModel\)\.filter\(UserProfileModel\.email\.ilike\(user\.email\)\)\.first\(\)).*?(user\.role = db_profile\.role)"

replacement = r"""\1
    if not db_profile:
        raise AuthenticationError('Your account is pending Admin approval or does not exist.')

    if not db_profile.is_active:
        raise AuthenticationError('Your account is currently suspended or pending Admin approval.')

    \2"""

new_code = re.sub(pattern, replacement, code, flags=re.DOTALL)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
