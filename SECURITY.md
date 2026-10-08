# Security policy — AJN Site (Astro)

## Supported branch

The `main` branch receives security fixes. Feature branches and previews are not supported deployments.

## Reporting a vulnerability

Please report vulnerabilities privately. Use GitHub's **Report a vulnerability** / private vulnerability reporting at:
https://github.com/wandersongandra/ajn-site/security/advisories/new

If private vulnerability reporting is unavailable, contact the AJN team at
**faleconosco@ajnengenharia.com.br** with the subject **Security report — ajn-site**.
Do **not** put tokens, passwords, exploits containing personal data, or customer information in public issues or pull requests.

Please include the affected route or file, steps to reproduce without exposing secrets, potential impact, and a safe contact method. We will triage the report before publishing details.

## Operational rules

- All changes should go through pull requests with successful automated checks.
- Never commit production credentials, private exports, WordPress backups, database dumps or personal information.
- Staging should remain unindexed and must not receive production secrets.
- GitHub Actions tokens should use minimum required permissions.
- A successful CI run does not replace penetration testing, runtime security headers, server configuration or manual review.
- The static build includes `public/.htaccess` with CSP, clickjacking, MIME-sniffing, referrer and permissions headers for Apache-compatible hosting. Verify those headers on the deployed host; the repository cannot prove provider behavior.
- `npm run audit:security` checks the repository baseline for dangerous DOM sinks, client-side storage, inline executable scripts, unsafe CSP directives and duplicated site-origin configuration.
- If a secret was exposed in any Git history, rotate/revoke it; merely deleting it from the latest commit is insufficient.

## Repository settings required

An administrator should enable branch protection for `main` (pull requests, status checks, no force-pushes/deletions), GitHub secret scanning/push protection when available, Dependabot alerts, dependency graph, and private vulnerability reporting. Repository rules are GitHub account settings, not files committed by this change.
