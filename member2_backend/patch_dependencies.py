import re

with open('app/dependencies.py', 'r') as f:
    content = f.read()

content = content.replace("db_profile = db.query(UserProfileModel).filter_by(email=user.email).first()", "db_profile = db.query(UserProfileModel).filter(UserProfileModel.email.ilike(user.email)).first()")

with open('app/dependencies.py', 'w') as f:
    f.write(content)
