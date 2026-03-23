# VibeScan Demo Candidate Matrix

This matrix helps pick which datasets/apps to include in a conference demo and in benchmark evaluation.

Columns:

- `source type`
- `scenario`
- `likely VibeScan rules`
- `demo value`
- `benchmark value`
- `setup difficulty`

| source type | scenario | likely VibeScan rules | demo value | benchmark value | setup difficulty |
|---|---|---|---|---|---|
| DVNA (external vulnerable benchmark repo) | Baseline real-world-style Node/Express code with multiple OWASP 2017 themes; already used for preliminary DVNA counts. | High-likelihood: `injection.sql.string-concat`, `injection.command`, `injection.path-traversal`, `injection.log`, `crypto.secrets.hardcoded`, `SEC-004`, `crypto.jwt.weak-secret-literal`, plus route/middleware heuristics like `AUTH-003` and `AUTH-005` (depending on scanned code scope). | Shows VibeScan works on a widely used vulnerable corpus and gives credible “benchmark context” for the conference narrative. | Primary benchmark: provides comparability and establishes the “keep DVNA first” research spine. | Medium (DVNA clone + consistent scope policy). |
| Vulnerable-NodeJS-Application (external vulnerable repo, secondary) | One additional intentionally vulnerable Node/Express repository chosen to complement DVNA with different structure and failure modes. | TBD until scanned; likely overlap with: `injection.sql.string-concat` and/or `injection.path-traversal`, plus route/auth heuristics such as `AUTH-003`/`AUTH-004` (if the repo includes admin/mod endpoints without recognizable auth middleware). | Adds variety beyond DVNA and helps avoid “DVNA-only” conclusions. Useful for extended live troubleshooting questions. | Secondary benchmark: supports “rule robustness across repos.” | Medium (depends on repo setup, build size, and deterministic scan scope). |
| seeded SQL injection demo (local seeded app) | Minimal endpoint that builds a SQL statement via string concatenation from request input. | Primary: `injection.sql.string-concat` (and taint-backed SQL flow IDs, if present in the report). | Perfect “single finding -> single line -> single fix” demo. Easy before/after comparison with parameterized queries. | Precision/recall control: targeted ground truth for SQLi rule behavior and taint quality. | Low (small app, no external DB required if you stub DB calls). |
| seeded path traversal demo (local seeded app) | Minimal file-serving endpoint that reads from a user-influenced path without proper normalization/prefix checks. | Primary: `injection.path-traversal`. | Clear, visualizable failure mode (e.g., `../` style input) without needing a full exploit chain. | Precision control for path handling patterns and rule specificity. | Low (use a local in-memory “file registry” to avoid real filesystem risks). |
| seeded missing auth demo (local seeded app) | Admin-like route (e.g., `/admin/flags`) that performs sensitive behavior without recognizable auth middleware. | Primary: `AUTH-004` (admin/mod/report-style path without auth middleware). Potentially adjacent: middleware audits (`MW-*`) if the app includes additional missing protections. | Conference-friendly: shows “access control absence” using route-level heuristics, and pairs naturally with adding a `requireAuth` middleware. | Precision/recall control for route inventory + auth middleware chain detection. | Low (Express app with a single route graph). |
| seeded webhook demo (local seeded app) | Webhook-like POST route that uses `req.body` but omits signature verification in the inline handler logic. | Primary: `WEBHOOK-001`. (May also trigger other heuristics if the handler uses user input unsafely.) | Strong “modern endpoint” showcase: signature verification omission is easy to explain and fix. | Precision control for webhook heuristic sensitivity and false-negative behavior when logic is delegated. | Low-Medium (raw-body or request parsing needs to be set up carefully, even in a tiny app). |

## How to use this matrix
- If you need 4 conference examples: prioritize seeded SQLi, missing auth, webhook, and DVNA.
- If you need 5: include the seeded path traversal app as well.
- Keep the external secondary repo as an “extended benchmark option” unless you have enough stage time.

