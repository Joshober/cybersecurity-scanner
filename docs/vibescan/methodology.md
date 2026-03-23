# VibeScan Methodology

## Research objective

Evaluate whether VibeScan's implemented static-analysis pipeline (AST rules, taint checks, route/middleware audits, and optional registry checks) provides useful first-party vulnerability detection on Node/Express code relative to baseline tools, using conservative and reproducible measurement.

## Benchmark targets

1. **Primary benchmark (current):** DVNA (`appsecco/dvna`) using the protocol documented in `benchmarks/results/legacy/dvna-evaluation.md`.
2. **Secondary benchmark (planned):** seeded Node/Express micro-cases defined in `docs/vibescan/seeded-benchmark-plan.md`.

## Tool baselines

- **VibeScan** (`vibescan` / `secure`) with static mode and explicit options.
- **eslint-plugin-security** with a pinned config and clear file-scope rules.
- **npm audit** as dependency advisory baseline (reported separately because scope is dependency-level, not line-level code finding parity).
- **Bearer** as planned baseline; currently pending same-environment execution.

## Version control / reproducibility requirements

- Record exact commit SHA for this repository.
- Record benchmark revision:
  - DVNA repository URL and commit/branch used.
- Freeze and record runtime/tool versions:
  - Node version
  - npm version
  - VibeScan version/commit
  - eslint version
  - eslint-plugin-security version
  - Bearer version (when run)
- Store exact command lines and raw outputs under `benchmarks/results/<run-id>/` (or `benchmarks/results/legacy/` for the historical DVNA bundle).
- Store adjudication sheet (CSV/Markdown) linking each counted TP/FP/FN to source evidence.

## Inclusion and exclusion criteria

### Inclusion

- First-party benchmark source files intended for app logic (`.js/.ts/.mjs/.cjs`) in agreed benchmark scope.
- Findings attributable to a specific rule and file location.

### Exclusion

- Third-party/vendor/minified assets unless explicitly evaluated as a separate condition.
- Generated output folders (`dist`, build artifacts) unless benchmark objective explicitly includes generated code.
- Findings lacking enough context to adjudicate (mark as unresolved, do not force into TP/FP counts).

## Definition of true positive, false positive, false negative

- **True positive (TP):** Tool finding correctly identifies a seeded or benchmark-documented vulnerability-relevant condition within in-scope code under the selected protocol.
- **False positive (FP):** Tool finding classified as security-relevant by the tool but judged non-vulnerable/non-relevant for the benchmark objective after manual review.
- **False negative (FN):** A benchmark-documented or seeded vulnerability condition present in in-scope code that the tool fails to report.

Notes:
- For dependency scanners (`npm audit`), TP/FP/FN should be tracked in a **separate dependency-advisory table** to avoid false equivalence with line-level static findings.
- Some findings may be tagged as **Partial coverage** when the signal is related but does not directly satisfy the target benchmark condition.

## Manual adjudication process

1. Export findings for each tool with stable identifiers (`ruleId`, file, line, message).
2. Build a merged adjudication table with one row per benchmark condition and per-tool outcome.
3. Require two-pass review:
   - Pass A: initial label by reviewer 1.
   - Pass B: independent verification by reviewer 2 (or delayed second pass by same reviewer with blinded prior labels if team size constrained).
4. Resolve disagreements with written rationale and final consensus label.
5. Keep unresolved items separate from headline TP/FP/FN counts.
6. Archive adjudication artifacts under `benchmarks/results/` for traceability.

## Metrics to report

### Core metrics

- TP, FP, FN by tool.
- Precision = TP / (TP + FP).
- Recall = TP / (TP + FN).
- Category-level coverage (crypto vs injection vs project-level dependency signals).

### Supporting metrics

- Findings per KLOC (optional, for noise discussion).
- First-party vs vendor finding split.
- Rule-level contribution counts for VibeScan (which rules drove TPs).

## Threats to validity

1. **Benchmark representativeness:** DVNA is intentionally vulnerable and may not reflect production code distributions.
2. **Scope mismatch across tools:** `npm audit` and static linters operate on different abstraction levels; direct score comparisons can be misleading.
3. **Vendor noise sensitivity:** Inclusion of third-party/minified files can inflate findings and distort comparative signal.
4. **Manual adjudication bias:** Reviewer judgment can vary; disagreement protocol and written rationales are required.
5. **Environment drift:** Tool versions, network conditions (for registry checks), and benchmark revisions can change outcomes.
6. **Incomplete baseline execution:** Missing Bearer runs means current comparisons are preliminary and not yet complete.

