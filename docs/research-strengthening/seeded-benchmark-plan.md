# Seeded benchmark plan (design)

## Purpose

DVNA gives **realism** but a small *n* and noisy labels. A **seeded** corpus gives:

- Per-rule **positive** and **negative** examples with **expected** rule IDs (or expected silence).
- Regression support when output format or ordering changes.
- Clearer **precision/recall** stories for specific CWE families.

## Physical layout (repo)

Align with [`../vibescan/benchmark-layout.md`](../vibescan/benchmark-layout.md):

```text
benchmarks/seeded/
├── README.md              # Ground-truth table: path → expected rule IDs / none
├── crypto/
├── injection/
├── middleware/            # Express-only cases for AUTH/MW-* if desired
└── mixed/
```

Start by **promoting** high-value cases from [`vibescan/tests/fixtures/`](../../vibescan/tests/fixtures/) and inline strings in `vibescan/tests/unit/*.test.mjs`, then deduplicate.

## Ground-truth table (required)

In `benchmarks/seeded/README.md`, maintain a matrix:

| Relative path | Expect rule IDs (substring or exact) | Expect zero high-severity? | Notes |
|---------------|----------------------------------------|----------------------------|-------|

Use the same `ruleId` strings VibeScan emits (see [`../vibescan/rule-coverage-audit.md`](../vibescan/rule-coverage-audit.md)).

## Coverage priorities (from current test gaps)

Prioritize seeds for rules that lack dedicated unit tests today, e.g.:

- `crypto.jwt.weak-secret-literal`
- `mw.cookie.missing-flags`
- `RULE-SSRF-002`
- Engine IDs `MW-002`, `MW-003`, `MW-004` (if in scope for the paper)

## Running the seeded suite

Use the same command as DVNA, pointed at `benchmarks/seeded/`:

```bash
npx vibescan scan benchmarks/seeded --format json --project-root benchmarks/seeded > benchmarks/results/<run-id>/vibescan-seeded.json
```

Automated checking can be a **small script** (future work) that parses JSON and compares to the README table—keep it out of the core scanner if you want zero detection churn.

## Relationship to academic claims

- **DVNA** supports external validity (“real app”).
- **Seeded** supports internal validity (“rule does what we say on controlled samples”).
- The paper should state which metrics come from which corpus.
