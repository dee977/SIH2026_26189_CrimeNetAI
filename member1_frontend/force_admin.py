import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

new_logic = """
          requestedRole: beUser.role,
          grantedRole: session.user.email === 'admin123@gov.in' ? 'ADMIN' : (beUser.grantedRole || 'RESTRICTED').toUpperCase(),
          status: beUser.isActive ? 'APPROVED' : 'SUSPENDED',
          permissions: session.user.email === 'admin123@gov.in' ? [
            'dashboard:read', 'case:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read',
            'evidence:read', 'evidence:write', 'ingest:upload', 'report:generate', 'alert:read', 'alert:manage',
            'watchlist:read', 'watchlist:manage', 'gis:read', 'ai:read', 'admin:read', 'admin:write', 'audit:read',
            'verification:read', 'admin', 'admin:manage'
          ] : (beUser.permissions || []),
"""

content = re.sub(r"requestedRole: beUser\.role,\s*grantedRole: \(beUser\.grantedRole \|\| 'RESTRICTED'\)\.toUpperCase\(\),\s*status: beUser\.isActive \? 'APPROVED' : 'SUSPENDED',\s*permissions: beUser\.permissions \|\| \[\],", new_logic, content)

# Also ensure the temporary session has admin for admin123@gov.in
temp_session_logic = """
    requestedRole: 'RESTRICTED',
    grantedRole: session.user.email === 'admin123@gov.in' ? 'ADMIN' : 'RESTRICTED',
    status: 'APPROVED',
    permissions: session.user.email === 'admin123@gov.in' ? [
            'dashboard:read', 'case:read', 'case:write', 'graph:read', 'analytics:read', 'timeline:read',
            'evidence:read', 'evidence:write', 'ingest:upload', 'report:generate', 'alert:read', 'alert:manage',
            'watchlist:read', 'watchlist:manage', 'gis:read', 'ai:read', 'admin:read', 'admin:write', 'audit:read',
            'verification:read', 'admin', 'admin:manage'
    ] : [],
"""
content = re.sub(r"requestedRole: 'RESTRICTED',\s*grantedRole: 'RESTRICTED',\s*status: 'APPROVED',\s*permissions: \[\],", temp_session_logic, content)


with open('src/App.tsx', 'w') as f:
    f.write(content)
