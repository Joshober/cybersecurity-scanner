# Demo Folder Plan

This plan standardizes the “safe conference demo set” layout for intentionally vulnerable local apps that VibeScan can scan with deterministic, rule-aligned ground truth.

## Repository root (new top-level directories)

Proposed:

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

## `demo-apps/` (the tiny local “showcase code”)
Each app should be:

- Minimal: just enough Express endpoints (or small HTTP server) to trigger the intended VibeScan rule(s).
- Deterministic: no network calls, no random secrets, no time-based logic that affects behavior.
- Designed for rule alignment:
  - The vulnerable behavior should be in the handler code path that VibeScan reads.
  - The fixed behavior should be the same route pattern but with the safe implementation.

Each app includes:

- `expected-vibescan-findings.json`: a machine-readable “ground truth” list of expected rule IDs for the vulnerable route(s) (and optionally an empty list for fixed route(s)).
- A `README.md` that explains:
  - Vulnerable behavior vs fixed behavior at a human level
  - How to run locally (`npm test`, `npm start`)
  - How VibeScan should be run for the demo (`npx vibescan scan ...`)

## `demo-tests/` (automation + assertions)
`demo-tests/` owns the “demo suite runner”:

- Runs `npm test` for each seeded app (to sanity-check the fixed vs vulnerable routes).
- Runs VibeScan scan for each seeded app in a consistent scope policy (exclude vendor/dist).
- Asserts that:
  - Vulnerable routes trigger the expected rule IDs.
  - Fixed routes do not trigger the rule IDs (or trigger only documented adjacent rules).

## `demo-results/` (immutable evidence)
Treat `demo-results/` as append-only:

- Every suite run gets a dated run folder.
- Store:
  - `manifest.json` (command + tool versions + scan scope)
  - VibeScan JSON outputs per app
  - human adjudication notes (only if needed for partial/adjacent matches)

This makes the conference demo reproducible and easy to reference in a submission appendix.

