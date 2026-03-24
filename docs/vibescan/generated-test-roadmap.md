# Generated security test roadmap (Jest / Vitest + Supertest)

Goal: add **repeatable** automated tests that complement static analysis—not replace it. We **do not** claim every rule gets a working exploit PoC; many tests will assert **scan stability**, **safe vs unsafe app behavior**, or **middleware presence** inferred from HTTP responses.

## Tooling choice

- **Vitest** or **Jest** for runner (team preference; monorepo default can stay `node:test` until a workspace is added).
- **Supertest** against a small **Express** `listen(0)` app exported from each fixture module.
- **Static regression**: spawn `vibescan` CLI with `--format json` and assert `ruleId` sets (works in CI without exploiting production DBs).

## First six rule classes (priority order)

| Priority | Rule class | Representative rule IDs | Generated / integration strategy |
|----------|------------|---------------------------|-----------------------------------|
| 1 | SQL injection | `injection.sql.string-concat`, `injection.sql.tainted-flow` | Supertest hits `/user?id=`; **fixed** app uses `?` placeholders. Optional in-memory SQLite only if team accepts DB in CI. Otherwise **scan-only regression** on fixture pair. |
| 2 | Path traversal | `injection.path-traversal`, `injection.path-traversal.tainted-flow` | Supertest + `tmp` sandbox: **fixed** uses `path.resolve` + root allowlist; **vuln** concatenates user segment. Assert 404 vs 200 on traversal probe. |
| 3 | Missing admin auth | `AUTH-004` | Two Express apps: **vuln** `POST /admin/...` without `requireAuth`; **fixed** mounts `requireAuth`. HTTP 401/403 on fixed; scan asserts `AUTH-004` only on vuln. |
| 4 | Missing rate limiting | `MW-002` | **Vuln** `POST /login` without `rateLimit`; **fixed** wraps `rateLimit()`. Test can assert middleware symbol or use scan-only regression (recommended v1). |
| 5 | Webhook verification | `WEBHOOK-001` | **Vuln** `POST /webhook` reads `req.body` with no signature helper; **fixed** calls `constructEvent` or equivalent verification stub. Supertest POST without signature → accept on vuln (bad) vs reject on fixed (good). |
| 6 | Weak JWT / hardcoded auth secret | `crypto.jwt.weak-secret-literal`, `SEC-004`, `crypto.jwt.weak-secret-verify` | **Primary**: scan regression on file pair. **Optional**: mint JWT with known weak secret and call protected route—only if a minimal `jsonwebtoken` devDependency is acceptable. |

## What generated tests will *not* do (by design)

- Replace cryptographic proofs or full OWASP ASVS coverage.
- Guarantee exploitability for every flagged line (taint and heuristics can over/under-approximate).
- Run destructive shell exploits in shared CI (command injection tests stay **scan-first** until sandboxed).

## Implementation notes

- Reuse shapes from [`vibescan/src/system/engine/testWriter.ts`](../../vibescan/src/system/engine/testWriter.ts) for `--generate-tests` stubs; gold-path demo shows **hand-written** canonical tests first.
- Align case IDs with [`benchmarks/gold-path-demo/README.md`](../../benchmarks/gold-path-demo/README.md).
