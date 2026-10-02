filepath = "app/dependencies.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

start_marker = "db_profile = db.query(UserProfileModel).filter(UserProfileModel.email.ilike(user.email)).first()"
end_marker = "user.grantedRole ="

before = code.split(start_marker)[0]
after = code.split(end_marker)[1]

new_code = before + start_marker + """
    if not db_profile:
        from app.core.exceptions import AuthenticationError
        raise AuthenticationError('Your account is pending Admin approval or does not exist.')

    if not db_profile.is_active:
        from app.core.exceptions import AuthenticationError
        raise AuthenticationError('Your account is currently suspended or pending Admin approval.')

    """ + end_marker + after

with open(filepath, "w", encoding="utf-8") as f:
    f.write(new_code)
print("Replaced successfully")
