# VibeScan rule verification matrix

This matrix records, per **rule ID**, what verification artifacts exist today. It supports the goal of evolving VibeScan from “scanner only” toward **pipeline-grade assurance** (static detection + fixtures + generated tests + policy), without overclaiming coverage.

**Column definitions**

| Column | Meaning |
|--------|--------|
| **Implemented** | Emitted in static (or registry) mode in current codebase. |
| **Unit test** | Covered in `vibescan/tests/unit/*.test.mjs` (direct `ruleId` or engine suite). |
| **Vulnerable fixture** | Committed file under `vibescan/tests/fixtures/`, `benchmarks/seeded/`, or `benchmarks/gold-path-demo/` intended to trigger the rule. |
| **Safe fixture** | Paired “fixed” or clean file showing non-violation where applicable. |
| **Generated test feasible** | `--generate-tests` or roadmap: can emit a meaningful automated test stub (not always an exploit PoC). |
| **Policy-enforceable** | Mappable to `policy-core.mjs` boolean flags and/or `denyRuleIds` (see [`secure-arch-policy-bridge.md`](./secure-arch-policy-bridge.md)). |
| **Benchmarked** | Used in seeded benchmark plan, DVNA-style eval, or gold-path demo. |
| **Notes** | Honest limits (heuristics, false negatives, needs OpenAPI, etc.). |

Legend: Yes / Partial / No

## Pattern rules (registered in `attacks/index.ts`)

| Rule ID | Implemented | Unit test | Vulnerable fixture | Safe fixture | Generated test feasible | Policy-enforceable | Benchmarked | Notes |
|---------|-------------|-----------|-------------------|--------------|-------------------------|-------------------|-------------|-------|
| `crypto.hash.weak` | Yes | Yes | Yes (`weak-hashing/vulnerable.js`) | Partial (`crypto-safe`) | Partial (stub) | Via `denyRuleIds` | Seeded | |
| `crypto.cipher.weak` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `crypto.cipher.deprecated` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `crypto.cipher.fixed-iv` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `crypto.random.insecure` | Yes | Yes | No | Partial | Partial | `strongSecretsRequired` | Seeded | |
| `crypto.secrets.hardcoded` | Yes | Yes | No | Partial | Partial | `strongSecretsRequired` | Seeded / DVNA | |
| `SEC-004` | Yes | Yes | Yes (`env-fallback/vulnerable.js`) | Partial | Partial | `strongSecretsRequired` | Seeded / Gold | |
| `crypto.jwt.weak-secret-literal` | Yes | Yes | No | Partial | Partial | `strongSecretsRequired` | Seeded / Gold | |
| `crypto.jwt.weak-secret-verify` | Yes | Yes | No | Partial | Partial | `strongSecretsRequired` | — | |
| `crypto.tls.reject-unauthorized` | Yes | Yes | Yes (`disabled-tls/vulnerable.js`) | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `injection.eval` | Yes | Yes | Partial (`unsafe/`) | Partial | Partial | Via `denyRuleIds` | — | |
| `injection.sql.string-concat` | Yes | Yes | Yes (`sql-injection/vulnerable.js`) | Yes (`sql-injection/safe.js`) | **Yes** (roadmap) | Via `denyRuleIds` | Seeded / Gold | Taint may add `injection.sql.tainted-flow` |
| `injection.command` | Yes | Yes | No | Partial | **Yes** (roadmap) | Via `denyRuleIds` | Seeded | |
| `injection.path-traversal` | Yes | Yes | Yes (`path-traversal/`) | Yes (`path-traversal/safe.js`) | **Yes** (roadmap) | Via `denyRuleIds` | Seeded / Gold | |
| `injection.xss` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `injection.llm.dynamic-system-prompt` | Yes | Yes | Yes (`benchmarks/seeded/llm/`) | No | Partial | `llmUnsafeIntegrationDisallowed` | Seeded | Heuristic |
| `injection.llm.rag-template-mixing` | Yes | Yes | Yes (`benchmarks/seeded/llm/`) | No | Partial | `llmUnsafeIntegrationDisallowed` | Seeded | Heuristic |
| `injection.llm.unsafe-html-output` | Yes | Yes | Yes (`benchmarks/seeded/llm/`) | No | Partial | `llmUnsafeIntegrationDisallowed` | Seeded | Heuristic |
| `injection.noql` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `injection.xpath` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | — | |
| `injection.log` | Yes | Yes | No | Partial | Partial | `loggingRequiredOnSensitiveActions` (gap) | Seeded | Policy mapping reserved |
| `mw.cookie.missing-flags` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | — | |
| `SSRF-003` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `RULE-SSRF-002` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `RULE-PROTO-001` | Yes | Yes | Partial (prototype tests) | Partial | Partial | Via `denyRuleIds` | Seeded | |

## Taint-derived rule IDs (`taintEngine.ts`)

| Rule ID | Implemented | Unit test | Vulnerable fixture | Safe fixture | Generated test feasible | Policy-enforceable | Benchmarked | Notes |
|---------|-------------|-----------|-------------------|--------------|-------------------------|-------------------|-------------|-------|
| `injection.sql.tainted-flow` | Yes | Yes | Yes (SQL fixture / gold) | Yes (`sql-injection/safe.js`) | **Yes** | Via `denyRuleIds` | Gold | Same policy bucket as SQL family |
| `injection.command.tainted-flow` | Yes | Yes | Partial | Partial | **Yes** | Via `denyRuleIds` | — | |
| `injection.path-traversal.tainted-flow` | Yes | Yes | Yes (`path-traversal/`) | Yes | **Yes** | Via `denyRuleIds` | Gold | |
| `injection.xpath.tainted-flow` | Yes | Yes | Partial | Partial | Partial | Via `denyRuleIds` | — | |
| `injection.log.tainted-flow` | Yes | Yes | Partial | Partial | Partial | Via `denyRuleIds` | — | |
| `injection.prototype-pollution.tainted-flow` | Yes | Yes | Partial | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `injection.ssrf.tainted-flow` | Yes | Partial | No | Partial | Partial | Via `denyRuleIds` | — | |

## Express / project graph / registry (`engine/`, `slopsquat.ts`)

| Rule ID | Implemented | Unit test | Vulnerable fixture | Safe fixture | Generated test feasible | Policy-enforceable | Benchmarked | Notes |
|---------|-------------|-----------|-------------------|--------------|-------------------------|-------------------|-------------|-------|
| `AUTH-003` | Yes | Partial | Partial | Partial | Partial | Via `denyRuleIds` | — | Heuristic middleware chain |
| `AUTH-004` | Yes | Yes | Gold demo | Gold demo | **Yes** (Express harness) | `authRequiredOnAdminRoutes` | Gold | |
| `AUTH-005` | Yes | Partial | Partial (`openapi-drift` inventory) | Partial | Partial | Via `denyRuleIds` | Seeded | |
| `MW-001` | Yes | Partial | Partial | Partial | Partial | Via `denyRuleIds` | — | CSRF heuristic |
| `MW-002` | Yes | Yes | Gold demo | Gold demo | **Yes** (Supertest) | `rateLimitRequiredOnSensitiveRoutes` | Gold | |
| `MW-003` | Yes | Yes | No | Partial | Partial | Via `denyRuleIds` | — | |
| `MW-004` | Yes | Partial | No | Partial | Partial | `corsWildcardDisallowed` | — | |
| `WEBHOOK-001` | Yes | Yes | Gold demo | Gold demo | **Yes** (Supertest) | `webhookSignatureVerificationRequired` | Gold | Verification heuristic |
| `API-INV-001` | Yes | Yes | Yes (`openapi-drift/`) | — | Partial | Via `denyRuleIds` | Seeded | Needs OpenAPI spec |
| `API-INV-002` | Yes | Yes | Yes (`openapi-drift/`) | — | Partial | Via `denyRuleIds` | Seeded | |
| `API-POSTURE-001` | Yes | Partial | Via openapi fixture | — | Partial | Via `denyRuleIds` | Seeded | Informational aggregate |
| `SLOP-001` | Yes | Yes | Yes (`benchmarks/seeded/slop-case/`) | Partial | No | Via `denyRuleIds` | Seeded | Registry / network |
| `ARCH-DB-001` | Reserved | No | No | No | No | `publicDatabaseDisallowed` | — | Correlated finding when present |
| `LOG-001` | Reserved | No | No | No | No | `loggingRequiredOnSensitiveActions` | — | Gap |

## Non-rules

| Artifact | Notes |
|----------|--------|
| `entropy.ts` | Helper for secret detection; not a standalone rule. |

## Related docs

- [`verification-tier-plan.md`](./verification-tier-plan.md) — Gold / Silver / Bronze tiers per rule family.
- [`generated-test-roadmap.md`](./generated-test-roadmap.md) — First classes for Vitest/Jest + Supertest.
- [`pipeline-protection-roadmap.md`](./pipeline-protection-roadmap.md) — CI ordering.
- [`rule-coverage-audit.md`](./rule-coverage-audit.md) — Historical audit snapshot.
