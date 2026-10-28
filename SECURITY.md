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

For the `main` branch, configure a GitHub ruleset or branch protection rule that:

1. Requires a pull request and passing status checks **before** merging, without bypassing failed checks.
2. Requires these GitHub Actions job checks: `validate`, `Gitleaks`, `Dependency audit (high+)`, `CodeQL (javascript-typescript)` and `CodeQL (actions)`. Prefer GitHub Actions as the expected status-check source. These workflows run on every PR, without path filters.
3. Blocks force pushes and branch deletion, and applies restrictions to administrators when supported.
4. Requires approval from a different human maintainer and dismisses stale approvals **when a second qualified reviewer is available**. A solo repository owner cannot approve their own PR; enforcing one approval without another reviewer would block legitimate merges. Decide this policy explicitly before enabling it.
5. Uses CODEOWNERS review for sensitive paths when a qualified independent reviewer is available.

The browser smoke workflow has path filters and must **not** be marked as a required status check for every PR unless those filters are removed. The source-policy audit protects the unconditional PR triggers and critical steps of the mandatory security workflows.

Enable GitHub's Dependency Graph and, when native dependency review is available, set repository variable `ENABLE_DEPENDENCY_REVIEW=true` to activate the diff-aware review. `npm audit --audit-level=high` remains an unconditional fallback on PRs. Secret scanning/push protection and code-scanning merge protection depend on the repository's plan and enabled features.
