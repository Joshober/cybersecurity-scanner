# Evaluation plan (draft)

## Objectives

1. Demonstrate that VibeScan produces **actionable, reviewable findings** on a standard vulnerable Node app (**DVNA**).
2. Compare **adjudicated** detection counts (and optionally precision/recall on seeded sets) against **eslint-plugin-security** and complementary **npm audit**.
3. Keep claims **bounded** to pinned versions, explicit file scope, and documented adjudication.

This plan extends the current preliminary DVNA work into a cleaner, academically defensible evaluation package without inventing data.

## Phase 1 — Freeze the protocol (before writing final numbers)

- [ ] Record DVNA **URL + commit** in manifest.
- [ ] Record **scanner repo commit** and `vibescan` version.
- [ ] Define **in-scope paths** (e.g. exclude `node_modules/`, tests if agreed).
- [ ] Save raw outputs: VibeScan JSON, ESLint JSON, `npm audit --json`, optional Bearer.

Commands and folder layout: [`benchmarking-runbook.md`](./benchmarking-runbook.md).

## DVNA benchmark cleanup (concrete checklist)

1. Freeze DVNA revision (record commit SHA) and rerun all tools against the same snapshot.
2. Enforce an explicit first-party scope:
   - Exclude vendor/minified assets in the primary table.
   - Optionally report vendor-inclusive sensitivity in appendix.
3. Keep the current adjudication logic from `results/dvna-evaluation.md`, but formalize it into a reproducible adjudication sheet.
4. Re-run baselines in a compatible environment when scope policy changes, and store raw logs/artifacts in `benchmarks/results/`.
5. Regenerate summary table with no “implied completeness” wording.

## Phase 2 — Adjudication

- [ ] Import findings into a spreadsheet from machine-readable outputs.
- [ ] Label each row using [`../vibescan/adjudication-template.md`](../vibescan/adjudication-template.md).
- [ ] Summarize by **OWASP theme** or **CWE family** (match poster table).

## Phase 3 — Metrics

- [ ] Fill summary tables in [`metrics-templates.md`](./metrics-templates.md).
- [ ] Separate **motivation citations** (industry/preprint) from **your** adjudicated counts in prose (see [`../vibescan/judging-pack.md`](../vibescan/judging-pack.md)).

## Phase 4 — Seeded benchmark (recommended extension)

- [ ] Implement minimal `benchmarks/seeded/` per [`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md).
- [ ] Report per-rule **detection rate** on positives and **false alarm rate** on negatives (where labels are unambiguous).

## Baseline tools to compare against

- **VibeScan** (primary system under test).
- **eslint-plugin-security** (syntax/rule baseline).
- **Bearer** (SAST baseline).
- **Snyk Code** (SAST baseline; keep sensitivity analysis separate when scope differs).
- **npm audit** (dependency advisory baseline; report in separate dependency-focused table).

## Baseline fairness checklist

- ESLint: same Node project, documented config, same paths as VibeScan where possible.
- npm audit: run from app root; clarify it does **not** target the same defect classes as static first-party rules.
- Bearer/Snyk Code: run with documented versions; if scope differs, separate primary table vs sensitivity appendix.

## Exact metrics

For line-level/static findings (VibeScan, eslint, Bearer):

- TP, FP, FN (per benchmark and overall).
- Precision, recall.
- Per-category coverage:
  - crypto-related,
  - injection-related,
  - middleware/config-related,
  - project-level dependency checks (reported separately where appropriate).

Supporting metrics:

- First-party-only vs vendor-inclusive finding counts.
- Rule-level contribution counts (which VibeScan rules generate TPs).
- Runtime cost per tool (optional but useful for practical discussion).

For `npm audit`:

- Advisory counts and severity distribution (do not directly merge into line-level TP/FP/FN unless mapping protocol is explicitly defined).

## Deliverables for the paper/poster

| Deliverable | Location |
|-------------|----------|
| Raw logs | `results/` or `benchmarks/results/<run-id>/` |
| Methodology prose | This file + [`methodology.md`](./methodology.md) |
| Rule ↔ evidence | [`../vibescan/rule-coverage-audit.md`](../vibescan/rule-coverage-audit.md) |
| Contribution boundaries | [`contribution-audit.md`](./contribution-audit.md) |

## Expected poster/paper outputs (optional structure)

### Table_A_BenchmarkSetup

- Dataset, commit SHA, file-scope policy, tool versions, command lines.

### Table_B_MainDetectionMetrics_FirstPartyOnly

- Tool vs TP/FP/FN/Precision/Recall.

### Table_C_PerCategoryCoverage

- Category rows; tools as columns.

### Table_D_DependencyLevelFindings_Separate

- `npm audit` and optional VibeScan project-level checks (`SLOP-001`) where applicable.

### Figure_1_PipelineDiagram

- VibeScan architecture (AST rules + taint + route graph + optional registry checks).

### Figure_2_ErrorProfile

- Stacked bars for FP vs TP by category across tools.

## Conservative interpretation policy

- Treat current DVNA results as a **scope-limited snapshot** until multi-target replication is complete.
- Avoid claims of “best overall” without cross-benchmark parity and fixed scope policy.
- Keep a dedicated limitations paragraph tied to benchmark representativeness and adjudication subjectivity.
