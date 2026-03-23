# VibeScan Final Evaluation Plan

This plan extends the current preliminary DVNA work into a cleaner, academically defensible evaluation package without inventing data.

## 1) DVNA benchmark cleanup

1. Freeze DVNA revision (record commit SHA) and rerun all tools against the same snapshot.
2. Enforce an explicit first-party scope:
   - Exclude vendor/minified assets in the primary table.
   - Optionally report vendor-inclusive sensitivity in appendix.
3. Keep the current adjudication logic from `benchmarks/results/legacy/dvna-evaluation.md`, but formalize it into a reproducible adjudication sheet.
4. Run pending baseline (Bearer) in a compatible environment and store raw logs under `benchmarks/results/<run-id>/`.
5. Regenerate summary table with no "implied completeness" wording.

## 2) Additional seeded benchmark suite

Use a small, transparent seeded Node/Express suite (planned in `docs/vibescan/seeded-benchmark-plan.md`) to evaluate:

- Rule-trigger correctness for implemented VibeScan rules.
- Coverage on LLM-relevant patterns (weak defaults, env fallback, suspicious package references).
- Comparative misses from generic baselines.

## 3) Baseline tools to compare against

- **VibeScan** (primary system under test).
- **eslint-plugin-security** (syntax/rule baseline).
- **Bearer** (SAST baseline, pending run completion).
- **npm audit** (dependency advisory baseline; report in separate dependency-focused table).

## 4) Exact metrics

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

## 5) Expected poster/paper outputs

### Table A: Benchmark setup

- Dataset, commit SHA, file-scope policy, tool versions, command lines.

### Table B: Main detection metrics (first-party only)

- Tool vs TP/FP/FN/Precision/Recall.

### Table C: Per-category coverage

- Category rows; tools as columns.

### Table D: Dependency-level findings (separate)

- `npm audit` and optional VibeScan project-level checks (`SLOP-001`) where applicable.

### Figure 1: Pipeline diagram

- VibeScan architecture (AST rules + taint + route graph + optional registry checks).

### Figure 2: Error profile

- Stacked bars for FP vs TP by category across tools.

## 6) Conservative interpretation policy

- Treat current DVNA results as **preliminary** until Bearer and seeded suite are complete.
- Avoid claims of "best overall" without complete baseline parity.
- Keep a dedicated limitations paragraph tied to benchmark representativeness and adjudication subjectivity.

