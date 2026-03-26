# VibeScan demo plan (conference-ready)

This document consolidates the conference demo planning docs into one place: **what to demo**, **why**, **how to keep it reproducible**, and **what tiny apps to build**.

## Objectives

Choose a small set of “conference-ready” examples that:

- Show coverage across multiple rule families (crypto/injection/authz/webhook).
- Have deterministic, rule-aligned ground truth for automated scan assertions.
- Fit in a short live demo window without complex setup.

## Recommended demo set (5 examples)

1. **DVNA (primary benchmark)**: credibility anchor (“real code, real findings”).
2. **Seeded SQL injection**: `injection.sql.string-concat` (before/after parameterization).
3. **Seeded path traversal**: `injection.path-traversal` (before/after safe path handling).
4. **Seeded missing auth on admin route**: `AUTH-004` (before/after middleware chain).
5. **Seeded webhook signature verification omission**: `WEBHOOK-001` (before/after inline verification markers).

Why not a secondary external vulnerable repo in the main conference set:

- It tends to add build/setup uncertainty, scope ambiguity, and longer scan runtime.
- Treat it as an appendix/extended benchmark option instead of the live-stage core.

## Why mix DVNA + seeded local apps

- **External validity**: DVNA provides a shared reference point for claims and comparisons.
- **Determinism**: seeded apps give a clean “one finding → one line → one fix” story.
- **Rule alignment**: you can engineer the app so the vulnerable mechanism is visible to the scanner in the handler source (important for heuristics like `WEBHOOK-001`).

## Demo suite folder layout (proposed)

```text
demo-apps/
  sql-injection-seeded/
    README.md
    package.json
    src/
    test/
    expected-vibescan-findings.json
  path-traversal-seeded/
    ...
  missing-auth-admin-seeded/
    ...
  webhook-signature-seeded/
    ...

demo-tests/
  README.md
  run-demo-suite.ps1
  run-demo-suite.sh
  expectations/
    global-expected-rules.json
  lib/
    scan-and-assert.ts

demo-results/
  README.md
  YYYY-MM-DD_demo-suite_v1/
    manifest.json
    vibescan/
      sql-injection-seeded.json
      path-traversal-seeded.json
      missing-auth-admin-seeded.json
      webhook-signature-seeded.json
    notes/
      adjudication-notes.md
```

### `demo-apps/`

Each app should be:

- Minimal: just enough routes/handlers to trigger the intended rule(s).
- Deterministic: no network calls, no random secrets, no time-dependent logic.
- Safe: no real command execution, no real DB harm, no arbitrary filesystem reads.

Each app includes:

- `expected-vibescan-findings.json`: “ground truth” expected rule IDs for vulnerable route(s) (and optionally expected silence for fixed route(s)).
- A `README.md` describing:
  - vulnerable vs fixed behavior,
  - how to run locally,
  - the exact scan command used for the demo.

### `demo-tests/`

The suite runner:

- runs `npm test` for each app,
- runs VibeScan with a consistent scope policy,
- asserts vulnerable routes trigger expected rule IDs and fixed routes do not (or only trigger documented adjacent rules).

### `demo-results/`

Treat as append-only:

- every run produces a dated folder with a manifest, tool outputs, and any adjudication notes.

## Seeded demo app designs (tiny, rule-aligned)

Design principles:

- Every app includes a vulnerable route and a fixed route with the same functional goal.
- VibeScan should flag only the vulnerable route(s) (and ideally not the fixed route).

### 1) Seeded SQL injection (string concat)

- **App slug**: `sql-injection-seeded`
- **Vulnerable route**: `GET /vuln/sql?user=...`
- **Pattern**: build SQL via string concatenation in-handler; use a stubbed query runner for safety.
- **Fixed route**: `GET /fixed/sql?user=...` with parameterized query.
- **Expected finding**: `injection.sql.string-concat`

### 2) Seeded path traversal

- **App slug**: `path-traversal-seeded`
- **Vulnerable route**: `GET /vuln/file?name=...`
- **Pattern**: user-influenced path concatenation to a file read sink; use an in-memory file store.
- **Fixed route**: `GET /fixed/file?name=...` with normalization + allowlist/prefix enforcement.
- **Expected finding**: `injection.path-traversal`

### 3) Seeded missing auth on admin route

- **App slug**: `missing-auth-admin-seeded`
- **Vulnerable route**: `POST /admin/rotate-keys` without recognizable auth middleware.
- **Fixed route**: same sensitive behavior but with explicit `requireAuth` middleware in the route chain.
- **Expected finding**: `AUTH-004`

### 4) Seeded webhook signature verification omission

- **App slug**: `webhook-signature-seeded`
- **Vulnerable route**: `POST /webhook/stripe` that uses `req.body` without inline signature verification markers.
- **Fixed route**: a variant that verifies a signature header (timing-safe compare) before trusting the body.
- **Expected finding**: `WEBHOOK-001`

## Candidate matrix (quick reference)

| source type | scenario | likely VibeScan rules | demo value | benchmark value | setup difficulty |
|---|---|---|---|---|---|
| DVNA | Broad Node/Express vulnerable corpus | injection, crypto, route/mw heuristics | High | High | Medium |
| seeded SQLi | Minimal SQLi sink | `injection.sql.string-concat` | High | High | Low |
| seeded traversal | Minimal file path sink | `injection.path-traversal` | High | High | Low |
| seeded missing auth | Admin-like route without auth | `AUTH-004` | High | Medium-High | Low |
| seeded webhook | Webhook-like route missing verification | `WEBHOOK-001` | High | Medium-High | Low-Medium |

## Conference demo scripting suggestion

- Show `/vuln/...` behavior briefly.
- Show VibeScan finding(s) for the vulnerable route(s).
- Show `/fixed/...` behavior.
- Re-run scan or show fixed route is not flagged.

