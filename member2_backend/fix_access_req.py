filepath = "app/api/v1/access_requests.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Add phone parameter extraction
phone_extract = """
    phone = (
        getattr(req_in, 'phone', None) or
        getattr(req_in, 'phone_number', None) or
        getattr(req_in, 'phoneNumber', None) or
        '+91 Not Provided'
    )
"""
target_warrant = "warrant_ref = ("
code = code.replace(target_warrant, phone_extract + "\n    " + target_warrant)

# Add to model instantiation
new_req_target = "badge_number=badge_number,"
new_req_new = "badge_number=badge_number,\n        phone_number=phone,"
code = code.replace(new_req_target, new_req_new)

# Update approve_access_request to populate user profile
profile_creation = """db_profile = UserProfileModel(
            email=req.user_email,
            role=target_role,
            is_active=True
        )"""
profile_creation_new = """db_profile = UserProfileModel(
            email=req.user_email,
            role=target_role,
            is_active=True,
            phone_number=req.phone_number,
            officer_name=req.officer_name,
            badge_number=req.badge_number,
            department=req.department
        )"""
code = code.replace(profile_creation, profile_creation_new)

# Update profile modification
profile_update = """db_profile.role = target_role
        db_profile.is_active = True"""
profile_update_new = """db_profile.role = target_role
        db_profile.is_active = True
        db_profile.phone_number = req.phone_number or db_profile.phone_number
        db_profile.officer_name = req.officer_name or db_profile.officer_name
        db_profile.badge_number = req.badge_number or db_profile.badge_number
        db_profile.department = req.department or db_profile.department"""
code = code.replace(profile_update, profile_update_new)

# Update /users/manifest to return these fields
manifest_extract = """'email': p.email,
            'name': p.email.split('@')[0].replace('.', ' ').title(),
            'badgeNumber': f"LEO-{1000 + p.id}","""
manifest_extract_new = """'email': p.email,
            'name': p.officer_name or p.email.split('@')[0].replace('.', ' ').title(),
            'badgeNumber': p.badge_number or f"LEO-{1000 + p.id}",
            'phone': p.phone_number,
            'unit': p.department or 'CrimeNet State Bureau',"""
code = code.replace(manifest_extract, manifest_extract_new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Access requests fixed.")
