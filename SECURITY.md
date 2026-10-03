# Security Policy

CrimeNet AI is designed to handle sensitive investigative data. Security, privacy, access control, and evidence integrity are core project requirements.

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x | Yes |
| Earlier versions | No |

## Reporting a Vulnerability

Do **not** create a public GitHub issue for security vulnerabilities.

To report a security issue:

1. Email: `your-team-email@example.com`
2. Subject: `Security Report — CrimeNet AI`
3. Include:
   - Description of the vulnerability
   - Affected endpoint, module, or file
   - Steps to reproduce
   - Potential impact
   - Screenshots, logs, or proof-of-concept details
   - Suggested fix, if available

We will acknowledge reports as soon as possible and work to address valid security issues.

## Security Scope

The following areas are especially important:

- Authentication and JWT validation
- Role-based access control
- Case-membership authorization
- Cross-case data isolation
- Neo4j query scoping
- Supabase Storage access
- Evidence integrity and chain of custody
- Audit logging
- Sensitive data exposure
- Injection vulnerabilities
- Insecure direct object references

## Security Principles

- Frontend restrictions are not security controls.
- Every case-scoped API request must validate case membership on the backend.
- Neo4j queries must be scoped by `caseId`.
- Supabase service-role credentials must never be exposed to the frontend.
- Private evidence files must be accessed only through short-lived signed URLs.
- Original evidence must not be modified after upload.
- All sensitive actions must be recorded in the audit trail.

## Responsible Use

CrimeNet AI is intended for authorized investigative and educational use only. It does not make guilt determinations, generate criminal-probability scores, or replace human investigative judgment.
