# Gold-path demo (six attack classes)

Minimal **vulnerable** vs **fixed** pairs for pipeline and regression demos. Each case includes:

- **Vulnerable** source under `cases/<id>/vulnerable/`
- **Fixed** source under `cases/<id>/fixed/`
- **`meta.json`** — expected VibeScan rule IDs and test semantics
- **Tests** — CLI scan assertions (`tests/gold-scan.test.mjs`); optional HTTP checks where dependencies exist

This does **not** prove exploitability for every rule; it proves **deterministic static signal** and (for some cases) safe API behavior.

## Cases

| # | Class | Vulnerable rules (typical) | Regression |
|---|-------|----------------------------|------------|
| 01 | SQL injection | `injection.sql.string-concat`, `injection.sql.tainted-flow` | Scan: fixed file must not report SQL concat/taint |
| 02 | Path traversal | `injection.path-traversal`, `injection.path-traversal.tainted-flow` | Scan + optional Supertest (see test file) |
| 03 | Missing admin auth | `AUTH-004` | Scan |
| 04 | Missing rate limit | `MW-002` | Scan |
| 05 | Webhook verification | `WEBHOOK-001` | Scan + Supertest status codes |
| 06 | Weak JWT secret | `crypto.jwt.weak-secret-literal` | Scan |

## Run

From monorepo root, build VibeScan first:

```bash
npm run build -w vibescan
cd benchmarks/gold-path-demo
npm install
npm test
```

## CI

Add a job that runs `npm test` in this directory after `vibescan` build, or invoke from the main workflow.

## Related docs

- [`docs/vibescan/rule-verification-matrix.md`](../../docs/vibescan/rule-verification-matrix.md)
- [`docs/vibescan/verification-tier-plan.md`](../../docs/vibescan/verification-tier-plan.md)
- [`docs/vibescan/pipeline-protection-roadmap.md`](../../docs/vibescan/pipeline-protection-roadmap.md)
