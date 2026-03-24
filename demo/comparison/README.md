# VibeScan comparison harness (demo)

Curated **synthetic** cases only — content is mirrored from `benchmarks/gold-path-demo/cases/` (not real production sites). Each case has `vulnerable/`, `fixed/`, `meta.json`, `expected.json`, optional `prompt.md`, and `test/README.md` pointing at the monorepo regression tests.

## Layout

| Path | Purpose |
|------|---------|
| `cases/` | Six gold-path scenarios (SQLi, path traversal, admin auth, rate limit, webhook, weak JWT) |
| `tools/vibescan/` | Notes for in-process VibeScan |
| `tools/baselines/` | Shared ESLint config for `eslint-plugin-security` |
| `tools/ai/` | Template + instructions for **manual** AI captures |
| `scripts/run-comparison.mjs` | Runner |
| `results/<YYYY-MM-DD>/` | Generated per run (commit or ignore locally as you prefer) |

## Prerequisites

- Node 18+
- VibeScan built: `npm run build -w vibescan`
- Optional: `npm install` inside `demo/comparison/` so **npm audit** has a lockfile surface
- Optional CLI on PATH: `bearer`, `snyk` (runner skips gracefully if missing)

## Run

From monorepo root:

```bash
npm install --prefix demo/comparison
npm run comparison:run
```

Or directly:

```bash
npm run build -w vibescan
node demo/comparison/scripts/run-comparison.mjs
```

Options:

- `--date 2026-03-23` — output folder under `results/`
- `--cases 01-sql-injection,06-weak-jwt` — subset
- `--check-determinism` — two VibeScan passes per case; sets `stableAcrossReruns` from rule-id equality

## Outputs

For each case:

- `vibescan.json` — slim findings + scored `record` (expected-rule match, FP notes, CI/regression flags)
- `eslint.json` — raw ESLint JSON + `record`
- `npm-audit.json` — pointer to shared audit + `record` (same dependency signal for every case)
- `bearer.json` / `snyk.json` — raw + `record` or skipped
- `ai.json` — placeholder until you paste a manual run; then findings + `record`
- `summary.json` — per-case rollup

Aggregate:

- `summary-table.json` / `summary-table.csv` — poster-friendly table
- `npm-audit-shared.json` — single npm audit payload for the run

## Interpreting the comparison

- **VibeScan** rows use **explicit** `expectedRuleIds` from `expected.json` / `meta.json`.
- **ESLint** “detects” means *any* `eslint-plugin-security` message in `vulnerable/` — not mapped to VibeScan rules.
- **npm audit** reflects **harness** dependencies only; it does not validate each inline bug class.
- **AI** is **semi-automated**: add `detectedExpectedIssue`, `findingsSummary`, optional `fixAssessedCorrect`, etc., per `tools/ai/result.template.json`.

This supports a defensible narrative: auditable, deterministic scanner output vs. helpful but less repeatable AI review — without claiming a fully automatic AI benchmark.
