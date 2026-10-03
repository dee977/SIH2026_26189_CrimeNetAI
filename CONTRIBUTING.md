# Contributing to CrimeNet AI

Thank you for contributing to CrimeNet AI.

## Getting Started

1. Fork the repository.
2. Clone your fork.
3. Create a new branch.
4. Make your changes.
5. Test your changes.
6. Open a pull request.

## Branch Naming

| Branch type | Format |
|---|---|
| Feature | `feature/short-description` |
| Bug fix | `fix/short-description` |
| Documentation | `docs/short-description` |
| Security | `security/short-description` |
| Refactor | `refactor/short-description` |

Examples:

```bash
git checkout -b feature/case-isolation-tests
git checkout -b fix/neo4j-query-scoping
git checkout -b docs/api-reference
```

## Commit Messages

Use clear and descriptive commit messages.

Format:

```text
type: short description
```

Examples:

```text
feat: add case-scoped Neo4j query service
fix: prevent cross-case graph access
docs: add evidence integrity documentation
security: enforce case membership authorization
test: add RBAC authorization tests
```

## Code Standards

- Follow existing project structure.
- Write clean, readable, and typed code.
- Add tests for backend authorization and critical workflows.
- Do not commit `.env`, API keys, passwords, or private datasets.
- Keep API responses consistent.
- Ensure all case-scoped features respect case membership.

## Pull Request Process

1. Update documentation if behavior changes.
2. Ensure the app builds successfully.
3. Run backend tests.
4. Describe what changed and why.
5. Link related issue or task.
6. Request review from a team member.

## Reporting Issues

When reporting an issue, include:

- Expected behavior
- Actual behavior
- Steps to reproduce
- Screenshots or logs
- Browser/OS information
- Relevant API endpoint or file path

## Security Issues

Do not create public GitHub issues for security vulnerabilities.  
See `SECURITY.md` for responsible disclosure instructions.
