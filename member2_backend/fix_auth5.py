filepath = "app/services/m6_security_evidence.py"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

target = """            return UserProfile(
                id='usr-dev-bypass',
                email='yakshvachhani1108@gmail.com',
                name='Yaksh Vachhani',
                officerId='LEO-1108',
                organization='CrimeNet Administration',
                role='ADMIN',
                grantedRole='ADMIN',
                status='APPROVED',
                permissions=['cases:read', 'cases:write', 'evidence:read', 'evidence:write']
            )"""

replacement = """            return UserProfile(
                userId='usr-dev-bypass',
                email='yakshvachhani1108@gmail.com',
                fullName='Yaksh Vachhani',
                badgeNumber='LEO-1108',
                agencyUnit='CrimeNet Administration',
                role='ADMIN',
                grantedRole='ADMIN',
                isActive=True,
                permissions=['cases:read', 'cases:write', 'evidence:read', 'evidence:write']
            )"""

code = code.replace(target, replacement)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Backend UserProfile keys fixed.")
