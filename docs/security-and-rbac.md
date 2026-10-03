# CrimeNet AI — Security and RBAC

CrimeNet AI handles sensitive investigative data. Security is based on backend-enforced authentication, role-based access control, case membership, case isolation, private storage, and audit logging.

---

## Security Principles

- Frontend restrictions are not security controls.
- Every API request must be authenticated.
- Every case-scoped request must validate case membership.
- Neo4j queries must be scoped by `caseId`.
- Original evidence files must remain immutable.
- Service-role credentials must never be exposed to the frontend.
- Sensitive actions must be recorded in audit logs.

---

## Authentication

CrimeNet AI uses Supabase Auth with JWT-based authentication.

The backend validates:

- JWT signature
- Token expiration
- Issuer
- Audience
- Required claims
- User account status
- Case membership

Supabase documentation states that JWTs must be validated before trusting their claims and that service-role credentials bypass Row Level Security. [3][5]

---

## Roles

| Role | Description |
|---|---|
| `ADMIN` | Manages users, roles, system settings, and administrative configuration |
| `INVESTIGATOR` | Investigates cases, reviews evidence, creates reports, manages notes |
| `ANALYST` | Analyzes graph, timeline, communications, transactions, and patterns |
| `AUDITOR` | Reviews evidence integrity, audit logs, and compliance-related information |

---

## Authorization Flow

```text
JWT Token
   ↓
FastAPI Authentication
   ↓
User Role Check
   ↓
Case Membership Check
   ↓
PostgreSQL Case-Scoped Query
   ↓
Neo4j Case-Scoped Query
   ↓
Authorized Result
```

---

## Case Isolation

Case isolation is the most important security control in CrimeNet AI.

A user can access only cases where they have an active membership.

### Required checks

For every case-scoped API request:

1. Validate JWT.
2. Load user profile.
3. Load case membership.
4. Verify case status.
5. Apply role-based permission.
6. Filter PostgreSQL queries by `case_id`.
7. Filter Neo4j queries by `case_id`.
8. Log the access attempt.

### Example denied access

```text
User A is a member of Case 101.
User A requests data from Case 202.
Backend checks case_memberships.
No active membership found.
Response: 403 Forbidden.
```

---

## RBAC Permission Matrix

| Action | ADMIN | INVESTIGATOR | ANALYST | AUDITOR |
|---|---:|---:|---:|---:|
| Create case | Yes | Yes | No | No |
| View assigned case | Yes | Yes | Yes | Yes |
| Edit case metadata | Yes | Yes | No | No |
| Add case member | Yes | Yes | No | No |
| Upload evidence | Yes | Yes | Yes | No |
| View evidence | Yes | Yes | Yes | Yes |
| Verify evidence hash | Yes | Yes | No | Yes |
| Run graph analytics | Yes | Yes | Yes | Yes |
| Create investigation report | Yes | Yes | No | No |
| View audit logs | Yes | No | No | Yes |
| Manage users and roles | Yes | No | No | No |

---

## Supabase Security

### Row Level Security

PostgreSQL Row Level Security should be enabled for all sensitive tables.

Policies must use authenticated user identity and case membership, not client-supplied fields.

Example policy concept:

```sql
CREATE POLICY case_access_policy
ON cases
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM case_memberships cm
    WHERE cm.case_id = cases.id
      AND cm.user_id = auth.uid()
      AND cm.is_active = true
  )
);
```

### Service Role

The Supabase service-role key bypasses RLS.

Therefore:

- Never expose it in the React frontend.
- Never commit it to GitHub.
- Never place it in browser storage.
- Use it only in the FastAPI backend.
- If the backend uses service role, it must perform its own strict authorization checks.

---

## Supabase Storage Security

The evidence bucket is private:

```text
case-documents/
    CASE-ID/
        FIR/
        CDR/
        Transactions/
        Evidence/
        Reports/
```

Rules:

- Bucket must be private.
- Files must be accessed using short-lived signed URLs.
- Signed URL generation must validate case membership.
- Storage paths must be validated to prevent path traversal.
- Original evidence must not be overwritten.
- Derived artifacts must be stored separately.

---

## Evidence Security

- SHA-256 hash is generated at upload.
- Hash can be reverified at any time.
- Chain-of-custody events are recorded.
- Evidence access is logged.
- Original evidence is immutable.
- OCR text, extracted entities, and AI summaries are derived artifacts.

---

## Audit Logging

Audit logs record:

- Actor
- Action
- Object type
- Object ID
- Case ID
- Timestamp
- IP address
- Request metadata
- Success/failure status

Sensitive actions include:

- Login attempts
- Case creation
- Case membership changes
- Evidence upload
- Evidence access
- Evidence verification
- Report generation
- Graph queries
- AI assistant queries
- Admin actions

---

## API Security Checklist

- [ ] Unauthenticated requests are rejected.
- [ ] Invalid or expired JWTs are rejected.
- [ ] Users cannot access cases without membership.
- [ ] Users cannot query another case’s graph.
- [ ] Users cannot access another case’s evidence.
- [ ] Neo4j queries cannot leak cross-case relationships.
- [ ] Signed URLs cannot be generated for unauthorized evidence.
- [ ] Service-role key is not exposed in frontend bundle.
- [ ] Sensitive actions are audit-logged.
- [ ] Database credentials are not committed to Git.

OWASP identifies Broken Object Level Authorization as a critical API risk when object IDs are accepted without server-side authorization checks. [34]
