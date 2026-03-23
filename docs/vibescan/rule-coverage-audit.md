# VibeScan — rule coverage audit (tests, fixtures, docs, benchmarks)

**Scope:** Rules and project-level checks that **actually run** in static mode, as wired in [`src/attacks/index.ts`](../../src/attacks/index.ts), [`src/system/scanner.ts`](../../src/system/scanner.ts), and engine audits under [`src/system/engine/`](../../src/system/engine/).
**Date:** 2025-03-20 (repo snapshot).

## Legend

| Column | Meaning |
|--------|---------|
| **Unit tests** | `tests/unit/*.test.mjs` exercises the rule (substring match on `ruleId` and/or dedicated file). |
| **Fixture in repo** | File exists under `tests/fixtures/**` that appears intended for the rule. |
| **Fixture in CI** | A test calls `scanFixture(...)` on that path (today only SQL + generic safe). |
| **README** | Documented in root [README.md](../../README.md) rule table (catalog-level, not per-rule prose). |
| **Benchmark relevance** | Expected signal on **DVNA**-class Node/Express apps, **seeded** synthetic snippets, or **dependency/registry** benchmarks. |

## Registered pattern rules (`attacks/index.ts`)

| Rule ID | Unit tests | Fixture file(s) | Fixture in CI | README table | Benchmark notes |
|---------|------------|-------------------|---------------|--------------|-----------------|
| `crypto.hash.weak` | Yes (`weak-hashing.test.mjs`) | `weak-hashing/vulnerable.js` | No | Yes | Seeded crypto corpus; occasional real-app use |
| `crypto.cipher.weak` | Yes (`weak-ciphers.test.mjs`) | — | No | Yes | Seeded / rare in typical web apps |
| `crypto.cipher.deprecated` | Yes (`deprecated-ciphers.test.mjs`) | — | No | Yes | Seeded / legacy codebases |
| `crypto.cipher.fixed-iv` | Yes (`fixed-iv.test.mjs`) | — | No | Yes | Seeded |
| `crypto.random.insecure` | Yes (`insecure-randomness.test.mjs`) | — | No | Yes | Seeded; DVNA may vary |
| `crypto.secrets.hardcoded` | Yes (`hardcoded-secrets.test.mjs`) | — | No | Yes | **High** on DVNA-style demos |
| `SEC-004` | Yes (`default-secret-fallback.test.mjs`) | `env-fallback/vulnerable.js` | No | Yes | **High** on misconfigured apps |
| `crypto.jwt.weak-secret-literal` | Yes (`jwt-weak-secret.test.mjs`) | — | No | Yes | **High** on JWT tutorials / DVNA |
| `crypto.tls.reject-unauthorized` | Yes (`disabled-tls.test.mjs`) | `disabled-tls/vulnerable.js` | No | Yes | Seeded; some integration tests |
| `injection.eval` | Yes (`code-injection.test.mjs`) | — | No | Yes | DVNA / dynamic code patterns |
| `injection.sql.string-concat` (+ taint IDs) | Yes (`sql-injection.test.mjs`) | `sql-injection/vulnerable.js`, `safe.js` | **Yes** | Yes | **High** on DVNA |
| `injection.command` | Yes (`command-injection.test.mjs`) | — | No | Yes | **Medium** on DVNA |
| `injection.path-traversal` | Yes (`path-traversal.test.mjs`) | `path-traversal/vulnerable.js`, `vulnerable-path.mjs`, `safe.js` | No | Yes | **Medium** on file-handling routes |
| `injection.xss` | Yes (`xss.test.mjs`) | — | No | Yes | **Medium** (client/server templates) |
| `injection.noql` | Yes (`nosql-injection.test.mjs`) | — | No | Yes | **Medium** if Mongo-style APIs present |
| `injection.xpath` | Yes (`xpath-injection.test.mjs`) | — | No | Yes | Low unless XPath APIs used |
| `injection.log` | Yes (`log-injection.test.mjs`) | — | No | Yes | Low–medium |
| `mw.cookie.missing-flags` | Yes (`mw-cookie-missing-flags.test.mjs`) | — | No | Yes | **Medium** on Express session apps |
| `SSRF-003` | Yes (`ip-guard-ssrf.test.mjs`) | — | No | Yes | Low unless `ip` + `fetch`/`axios` idiom |
| `RULE-SSRF-002` | Yes (`rule-ssrf-002.test.mjs`) | — | No | Yes | Low–medium; specific axios config shape |

## Project-level and engine findings

| Rule ID | Source | Unit tests | Fixture | README | Benchmark notes |
|---------|--------|------------|---------|--------|-----------------|
| `AUTH-003` | `middlewareAudit.ts` | Partial (`route-graph.test.mjs` expects AUTH/MW) | — | Indirect (middleware story in handoff) | **High** on Express route graphs |
| `AUTH-005` | `middlewareAudit.ts` | **No** dedicated | — | Yes | Object-scoped GET/HEAD without auth (BOLA/IDOR prep) |
| `MW-001` | `middlewareAudit.ts` | Partial (same) | — | Indirect | **High** |
| `MW-002` | `middlewareAudit.ts` | **No** dedicated | — | Indirect | Sensitive-path dependent |
| `MW-003` | `appLevelAudit.ts` | Yes (`mw-003-missing-helmet.test.mjs`) | — | Indirect | **Medium** (helmet absent) |
| `MW-004` | `appLevelAudit.ts` | **No** dedicated | — | Indirect | **Medium** (`cors({ origin: '*' })`) |
| `SLOP-001` | `slopsquat.ts` (needs `--check-registry`) | Yes (`slopsquat.test.mjs`) | — | Yes | **Registry benchmark**; not DVNA code |

## API inventory and trust-boundary rules (project scan + OpenAPI)

| Rule ID | Source | Unit tests | Fixture | README | Benchmark notes |
|---------|--------|------------|---------|--------|-----------------|
| `API-INV-001` | `openapiDrift.ts` (spec vs code) | Yes (`openapi-drift.test.mjs`) | `tests/fixtures/openapi-drift/` | Yes | Seeded drift: undocumented Express route |
| `API-INV-002` | `openapiDrift.ts` | Yes (same) | same | Yes | Seeded drift: ghost OpenAPI operation |
| `API-POSTURE-001` | `routeInventory.ts` | Via project scan in `openapi-drift.test.mjs` | same | Yes | Informational aggregate when object-scoped routes lack auth |

**Structured output:** project JSON includes `routeInventory` (per-route `sensitivePath`, `adminPath`, `objectScoped`, `hasAuthMiddleware`). SARIF run `properties` may include `vibescanRouteInventory`, `vibescanOpenApiSpecsUsed`, `vibescanBuildId` when present.

## Optional / non-registered source (not in active rule list)

| Artifact | Status |
|----------|--------|
| [`prototypePollution.ts`](../../src/attacks/injection/prototypePollution.ts) | Present in tree; **not** exported from `attacks/index.ts` — not part of default scan. |
| [`jwt-weak-test.ts`](../../src/attacks/crypto/jwt-weak-test.ts) | Built to `dist/`; **not** registered in `attacks/index.ts`. |
| [`entropy.ts`](../../src/attacks/crypto/entropy.ts) | Helper for secret detection; **not** a standalone rule. |

## README documentation summary

- **Package README** ([`README.md`](../../README.md)): minimal — points to root README and build/scan commands.
- **Per-rule markdown:** none in-repo.
- **Catalog:** root [README.md](../../README.md) includes rule IDs, CWEs, CLI, tests — sufficient for paper supplement references.

## Fixture folder utilization

Committed fixtures under `tests/fixtures/` include `crypto-safe/`, `disabled-tls/`, `env-fallback/`, `openapi-drift/`, `path-traversal/`, `sql-injection/`, `unsafe/`, `weak-hashing/`, `safe/`. **Most are not referenced** by `scanFixture` in CI today; rules are primarily validated with **inline `scanSource`** strings. Consider wiring high-value fixtures into tests or into `benchmarks/seeded/` for evaluation stability.

## Benchmark relevance summary

| Benchmark type | Strongest VibeScan signal |
|----------------|---------------------------|
| **DVNA** (Express, injection-heavy) | SQL/command/path, many crypto/injection pattern rules, middleware audits (`AUTH-003`, `AUTH-005`, `MW-*`); OpenAPI drift if spec provided |
| **Seeded minimal snippets** | Every rule with a unit test; extend with golden files per rule ID |
| **npm/registry** | `SLOP-001` with `--check-registry` |
| **Compare to eslint-plugin-security / Bearer** | Overlap on injection, unsafe regex (eslint-plugin), and some crypto — map in adjudication template |

---

## Implementation checklist (gaps to close for evaluation rigor)

1. Add **unit tests** for: `crypto.jwt.weak-secret-literal`, `mw.cookie.missing-flags`, `RULE-SSRF-002`, and **middleware** `MW-002` / app-level `MW-003`–`MW-004` if those IDs are in the paper’s scope.
2. Reference or copy **fixtures** from `tests/fixtures/` into `benchmarks/seeded/` with manifests (see [`benchmark-layout.md`](./benchmark-layout.md)).
3. Standardize **outputs** using [`reproducible-runs.md`](./reproducible-runs.md) and [`benchmark-manifest-template.json`](./benchmark-manifest-template.json).
4. Track **ground truth** with [`adjudication-template.md`](./adjudication-template.md).
5. Optionally implement **JSON summary** hooks described in [`output-support-audit.md`](./output-support-audit.md) and [`eval-support-changes.md`](./eval-support-changes.md).
6. Add **Snyk Code** (`snyk code test`) as a documented SAST baseline alongside eslint; see [`results/dvna-evaluation.md`](../../results/dvna-evaluation.md).
7. Add dedicated **unit tests** for `AUTH-005` if it becomes in-scope for the paper’s access-control claims.
