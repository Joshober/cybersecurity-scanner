# VulnLab — ground truth (VibeScan)

This file documents **intentional** weaknesses by **route / code region**. Use it to label adjudication CSV rows (`reviewerVerdict`: `tp` / `fp` / `fn`).

**Verify** after edits to `server.js`:

```bash
npm run build -w vibescan
node vibescan/dist/system/cli/index.js scan benchmarks/vuln-lab --format json --exclude-vendor
```

## Design intent by route

| Region / route | Intended weakness | Expected VibeScan signal (non-exhaustive) |
|----------------|-------------------|---------------------------------------------|
| Global | Permissive CORS | `MW-004` |
| Global | Express app without `helmet()` | `MW-003` |
| `POST /api/login` | SQL via string concat + taint | `injection.sql.string-concat`, `injection.sql.tainted-flow` |
| `POST /api/login` | Sensitive path, no CSRF token pattern | `MW-001` |
| `POST /api/login` | Sensitive path, no rate limit | `MW-002`, `AUTH-003` |
| `POST /admin/roles` | Admin path without auth | `AUTH-004`, `MW-001` |
| `POST /webhooks/stripe` | Webhook body without verification | `WEBHOOK-001`, `AUTH-003`, `MW-001`, `MW-002` |
| `POST /api/run` | Command injection | `injection.command`, `MW-001` |
| `GET /api/file` | Path traversal | `injection.path-traversal`, `MW-001` |
| `POST /api/dyn` | `eval` | `injection.eval`, `MW-001` |
| `POST /api/digest` | MD5 | `crypto.hash.weak`, `MW-001` |
| `GET /api/token-weak` | `Math.random` for secrets | `crypto.random.insecure`, `MW-001` |
| `GET /api/config` | Hardcoded API key shape | `crypto.secrets.hardcoded`, `MW-001` |
| `GET /api/session-secret` | Weak env fallback | `SEC-004`, `MW-001` |
| `POST /api/jwt-issue` | Weak JWT sign secret | `crypto.jwt.weak-secret-literal`, `MW-001` |
| `POST /api/jwt-check` | Weak JWT verify secret | `crypto.jwt.weak-secret-verify`, `MW-001` |
| `GET /api/insecure-fetch` | `rejectUnauthorized: false` | `crypto.tls.reject-unauthorized`, `MW-001` |
| `GET /api/proxy` | `ip.isPublic` as SSRF gate + outbound fetch | `SSRF-003`, `injection.ssrf.tainted-flow`, `MW-001` |
| `POST /api/merge-profile` | `Object.assign` with `req.body` | `RULE-PROTO-001`, `MW-001` |
| `POST /api/deep-set` | `_.set` with user path | `RULE-PROTO-001`, `injection.prototype-pollution.tainted-flow`, `MW-001` |
| `POST /api/log` | Log injection | `injection.log`, `injection.log.tainted-flow`, `MW-001` |
| `listen` callback | `console.log` | `injection.log` (informational noise — label `ignore` in adjudication if desired) |

## Counts (reference)

A full-project scan typically yields **on the order of 40+ findings** because **middleware audits** (`MW-*`, `AUTH-*`) fire **per route**. That is expected; use **per-finding** adjudication, not raw counts, for precision/recall.

## False positive expectations

- Some **`MW-*` / `AUTH-*`** rows may be **acceptable** in a toy app; label `fp` or `ignore` if your methodology treats them as out-of-scope.
- **`injection.sql.tainted-flow`** may appear on lines where SQL and other sinks coexist in one handler — adjudicate against the **intended** sink.
