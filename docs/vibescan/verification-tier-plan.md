# Verification tier plan (Gold / Silver / Bronze)

Tiers describe **how completely** a rule (or rule family) is wired into verification and pipeline protection—not the severity of the underlying vulnerability.

## Tier definitions

| Tier | Static detection | Reproducible vulnerable fixture | Safe / fixed fixture | Generated security test | CI policy gate |
|------|------------------|----------------------------------|----------------------|-------------------------|----------------|
| **Gold** | Yes | Yes | Yes | Feasible and planned (or stub exists) | Yes (`policy-check` + `denyRuleIds` or boolean flag) |
| **Silver** | Yes | Yes | Partial or same app with config switch | Partial / manual | Yes (policy or `denyRuleIds`) |
| **Bronze** | Yes | Partial or inline-only | No | No / future | Partial (`denyRuleIds` only) or none |

**Honesty:** Not every rule can support a **true exploit integration test** (e.g. registry `SLOP-001`, some crypto literals). For those, “generated test” means **regression on scan output** or **contract tests** on helper behavior, not a living exploit.

## Starting assignment by rule family

### Gold (initial target set — see `benchmarks/gold-path-demo/`)

| Focus | Rule IDs (representative) | Rationale |
|-------|---------------------------|-----------|
| SQL injection | `injection.sql.string-concat`, `injection.sql.tainted-flow` | Clear vuln/fix pair; Supertest + DB stub realistic |
| Path traversal | `injection.path-traversal`, `injection.path-traversal.tainted-flow` | File I/O behavior testable with temp dirs |
| Admin auth gap | `AUTH-004` | Express graph + middleware heuristic; behavioral “missing auth” |
| Rate limit gap | `MW-002` | Sensitive route heuristic; middleware presence |
| Webhook verification | `WEBHOOK-001` | Request + header behavior; signature pattern |
| Weak JWT / secrets | `crypto.jwt.weak-secret-literal`, `SEC-004` | Static + optional token mint smoke (no full auth system required) |

### Silver

| Focus | Rule IDs | Notes |
|-------|----------|-------|
| OpenAPI drift | `API-INV-001`, `API-INV-002` | Needs spec + app pair; strong static story |
| CORS wildcard | `MW-004` | `corsWildcardDisallowed` policy |
| Command injection | `injection.command`, `injection.command.tainted-flow` | Generated tests feasible; exploit tests environment-sensitive |
| SSRF heuristics | `SSRF-003`, `RULE-SSRF-002`, `injection.ssrf.tainted-flow` | Specialized patterns |
| Helmet missing | `MW-003` | Single-file app-level audit |
| Slopsquat | `SLOP-001` | Registry fixture; policy via `denyRuleIds`; network in CI |

### Bronze

| Focus | Rule IDs | Notes |
|-------|----------|-------|
| LLM integration heuristics | `injection.llm.*` | Heuristic FPs; policy optional |
| XPath / NoSQL | `injection.xpath`, `injection.noql` | Fixture gaps |
| `AUTH-003`, `AUTH-005`, `MW-001`, `API-POSTURE-001` | Heuristic / aggregate | Harder to pair clean safe/vuln without large apps |
| Weak ciphers / deprecated crypto APIs | `crypto.cipher.*`, `crypto.hash.weak` | Often no runtime “test” beyond scan |
| `crypto.tls.reject-unauthorized` | Environment-dependent TLS behavior | Scan-first |

## Promotion criteria (future)

Promote **Silver → Gold** when:

1. Vulnerable + fixed fixtures live under `benchmarks/gold-path-demo/` (or committed fixtures).
2. A **regression test** exists (scan assertion and/or Supertest).
3. `policy-check` documents the rule ID under `denyRuleIds` or an existing boolean policy bucket.

Promote **Bronze → Silver** when:

1. Dedicated unit test or fixture path is documented in [`rule-verification-matrix.md`](./rule-verification-matrix.md).
2. Policy mapping is explicit.
