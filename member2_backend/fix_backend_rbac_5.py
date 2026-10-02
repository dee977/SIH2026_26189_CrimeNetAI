filepath = "app/dependencies.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

start_str = "db_profile = db.query(UserProfileModel).filter(UserProfileModel.email.ilike(user.email)).first()"
end_str = "user.grantedRole = (db_profile.role.upper() if db_profile else 'INVESTIGATOR')"

start_idx = code.find(start_str)
end_idx = code.find(end_str) + len(end_str)

if start_idx != -1 and end_idx != -1:
    new_chunk = """db_profile = db.query(UserProfileModel).filter(UserProfileModel.email.ilike(user.email)).first()
    if not db_profile:
        raise AuthenticationError('Your account is pending Admin approval or does not exist.')

    if not db_profile.is_active:
        raise AuthenticationError('Your account is currently suspended or pending Admin approval.')

    user.grantedRole = (db_profile.role.upper() if db_profile else 'INVESTIGATOR')"""

    new_code = code[:start_idx] + new_chunk + code[end_idx:]
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(new_code)
    print("Replaced successfully")
else:
    print("Could not find markers")
