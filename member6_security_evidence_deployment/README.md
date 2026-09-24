# Member 6 - Security, Evidence Integrity & Deployment

## Overview
This module handles all security operations for CrimeNet AI, focusing on authentication, hierarchical RBAC, Row Level Security (RLS) in Supabase, evidence integrity (SHA-256 validation), an append-only cryptographic ledger, and full chain of custody generation including BSA Evidence Certificates. It also provides the Docker and deployment configurations for the entire platform.

## Authentication Architecture
- **Provider:** Supabase Auth
- **Methods:** Email/Password (with provisions for Phone Auth)
- **Token:** JWT-based session management
- **Security:** Passwords are never stored in plain text. JWT secrets and service role keys are managed securely via environment variables.

## Role Hierarchy & Permission Matrix
### Hierarchy
1. **SYSTEM ADMIN** (Highest)
2. **SENIOR AUTHORITY**
3. **SENIOR INVESTIGATOR**
4. **INVESTIGATOR**
5. **ANALYST / VIEWER** (Lowest)

### Permission Matrix
| Permission | Analyst/Viewer | Investigator | Senior Investigator | Senior Authority | System Admin |
|------------|----------------|--------------|---------------------|------------------|--------------|
| View Cases | ✅ | ✅ | ✅ | ✅ | ✅ |
| Search Entities | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Network Graph | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Timeline | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Cases | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit Cases | ❌ | ✅ | ✅ | ✅ | ✅ |
| Perform Network Analysis | ❌ | ✅ | ✅ | ✅ | ✅ |
| View Sensitive Evidence | ❌ | ✅ | ✅ | ✅ | ✅ |
| Upload Evidence | ❌ | ✅ | ✅ | ✅ | ✅ |
| Verify Evidence | ❌ | ✅ | ✅ | ✅ | ✅ |
| Export Evidence | ❌ | ✅ | ✅ | ✅ | ✅ |
| Generate Reports | ❌ | ✅ | ✅ | ✅ | ✅ |
| Use AI Assistant | ❌ | ✅ | ✅ | ✅ | ✅ |
| View GIS Map | ❌ | ✅ | ✅ | ✅ | ✅ |
| Manage Watchlist | ❌ | ❌ | ✅ | ✅ | ✅ |
| View Alerts | ❌ | ❌ | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Approve Role Requests | ❌ | ❌ | ❌ | ✅ | ✅ |
| Assign Roles | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage Permissions | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Audit Logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Export Investigation Data | ❌ | ❌ | ✅ | ✅ | ✅ |

## Access Request Flow
1. **REGISTER:** User registers via Supabase Auth.
2. **REQUEST ROLE:** User submits a role request via the frontend.
3. **PENDING_APPROVAL:** The request enters the `role_requests` table.
4. **REVIEW:** Senior Authority or System Admin reviews the request.
5. **APPROVE/REJECT:** Upon approval, permissions and roles are written to the `user_roles` and `user_permissions` tables, and an audit event is logged.
6. **LOGIN:** User logs in and receives a JWT. The backend middleware validates the JWT and checks the actual permissions stored in the database.

## Authorization Model & RLS Policies
Authorization is enforced both at the application tier (FastAPI dependencies) and the data tier (Supabase Row Level Security).
- **Application Tier:** FastAPI Dependency `require_permissions` decodes the JWT, fetches the user's granted permissions, and rejects unauthorized requests with a `403 Forbidden`.
- **Database Tier:** RLS policies on tables (like `cases`, `evidence`, `audit_logs`) ensure that even if the API layer is bypassed or there is a generic database query, the database itself denies unauthorized access based on `auth.uid()`.

## Evidence Schema & Integrity (SHA-256)
- When evidence is uploaded, a SHA-256 hash is immediately calculated and stored.
- **Verification:** During a verification event, the current file hash is calculated and compared to the original.
  - **Match:** Verified.
  - **Mismatch:** Tamper Indication.
- The original hash is NEVER silently replaced.

## Append-Only Evidence Ledger & Chain of Custody
- All evidence changes, verification events, and accesses are logged in `evidence_ledger`.
- The ledger is cryptographically linked: `current_record_hash = SHA-256(previous_hash + evidence_hash + timestamp + action)`.
- It cannot be modified (`UPDATE` and `DELETE` are disabled via RLS and Triggers).
- Provides a full Chain of Custody for legal use.

## BSA Evidence Certificate
- The system generates a PDF report using `ReportLab` conforming to Bharatiya Sakshya Adhiniyam (BSA) standards.
- It includes Evidence ID, SHA-256 hash, timestamps, verification history, and chain of custody data.

## Audit Schema
The `audit_logs` table records every sensitive action:
- `timestamp`, `user_id`, `action`, `resource_type`, `resource_id`, `result`, `ip_address` (if available).
- Actions include: Login, View Evidence, Download Evidence, Role Change, Approval, Rejection, etc.

## Deployment Configurations
- **Docker:** Multi-stage `Dockerfile` for the backend and stub for the frontend.
- **Docker Compose:** Orchestrates FastAPI Backend, Frontend, Redis, Celery, and other supporting services.
- **Environment Variables:** All secrets are passed via `.env` (see `.env.example`). No hardcoded secrets.

## Security Tests
1. Test missing or invalid JWT.
2. Test valid JWT but lacking specific permissions.
3. Test RLS bypass attempts (try fetching cases a user shouldn't see).
4. Test SHA-256 mismatch detection.
5. Test audit log generation on sensitive endpoints.
