with open('src/App.tsx', 'r') as f:
    content = f.read()

helper = """
async function syncUserWithBackend(session: any, setSession: any) {
  if (!session) return;
  
  // Set temporary restricted session so apiClient has a token to use
  setSession(session.access_token, {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.user_metadata?.name || 'Officer',
    phone: session.user.user_metadata?.phone || '',
    officerId: session.user.user_metadata?.officerId || 'LEO-0000',
    organization: 'CrimeNet',
    requestedRole: 'RESTRICTED',
    grantedRole: 'RESTRICTED',
    status: 'APPROVED',
    permissions: [],
    createdAt: session.user.created_at,
    lastLogin: new Date().toISOString()
  });

  try {
    const resp = await apiRequest<any>('/auth/me');
    if (resp.data) {
       const beUser = resp.data;
       setSession(session.access_token, {
          id: session.user.id,
          email: beUser.email || session.user.email,
          name: beUser.fullName || session.user.user_metadata?.name || 'Officer',
          phone: session.user.user_metadata?.phone || '',
          officerId: beUser.badgeNumber || session.user.user_metadata?.officerId || 'LEO-0000',
          organization: beUser.agencyUnit || 'CrimeNet',
          requestedRole: beUser.role,
          grantedRole: beUser.grantedRole,
          status: beUser.isActive ? 'APPROVED' : 'SUSPENDED',
          permissions: beUser.permissions || [],
          createdAt: session.user.created_at,
          lastLogin: new Date().toISOString()
       });
    }
  } catch (err) {
    console.error("Failed to fetch backend profile:", err);
  }
}
"""

if "async function syncUserWithBackend" not in content:
    content = content.replace("export const App: React.FC = () => {", helper + "\nexport const App: React.FC = () => {")
    with open('src/App.tsx', 'w') as f:
        f.write(content)
