with open('src/components/authority/AuthorityDashboardView.tsx', 'r') as f:
    code = f.read()

code = code.replace("useState<UserRole>('Investigator')", "useState<UserRole>('INVESTIGATOR')")
code = code.replace('<option value="Senior Investigator">Senior Investigator (Lead Case Officer)</option>', '<option value="ADMIN">ADMIN</option>')
code = code.replace('<option value="Investigator">Investigator (Field Inquiries)</option>', '<option value="INVESTIGATOR">INVESTIGATOR</option>')
code = code.replace('<option value="Analyst / Viewer">Analyst / Viewer (Read-only Graph)</option>', '<option value="ANALYST">ANALYST</option>')
code = code.replace('<option value="Senior Authority">Senior Authority (Approval Station)</option>', '<option value="AUDITOR">AUDITOR</option>')

with open('src/components/authority/AuthorityDashboardView.tsx', 'w') as f:
    f.write(code)

with open('src/components/common/UIStates.tsx', 'r') as f:
    code = f.read()

code = code.replace("login('v.rao@cid.police.gov.in', 'Senior Investigator')", "login('v.rao@cid.police.gov.in', 'INVESTIGATOR')")

with open('src/components/common/UIStates.tsx', 'w') as f:
    f.write(code)
