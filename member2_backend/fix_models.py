filepath = "app/models.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

# Add fields to UserProfileModel
user_profile_target = "is_active = Column(Boolean, default=True)"
user_profile_new = """is_active = Column(Boolean, default=True)
    phone_number = Column(String, nullable=True)
    officer_name = Column(String, nullable=True)
    badge_number = Column(String, nullable=True)
    department = Column(String, nullable=True)"""
if "phone_number = Column" not in code.split("class UserProfileModel")[1].split("class")[0]:
    code = code.replace(user_profile_target, user_profile_new)

# Add fields to AccessRequestModel
access_req_target = "badge_number = Column(String, nullable=True)"
access_req_new = """badge_number = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)"""
if "phone_number = Column" not in code.split("class AccessRequestModel")[1].split("class")[0]:
    code = code.replace(access_req_target, access_req_new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Models fixed.")
