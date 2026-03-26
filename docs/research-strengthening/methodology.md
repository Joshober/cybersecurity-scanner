# Methodology (draft)

## Study type

**Comparative static analysis** on a known vulnerable application (**DVNA**) and (planned) **seeded synthetic snippets**, with **manual adjudication** of tool outputs. This is an **artifact evaluation** of a research prototype, not a randomized controlled trial of developers.

## Research objective

Evaluate whether VibeScan’s implemented static-analysis pipeline (AST rules, taint checks, route/middleware audits, and optional registry checks) provides useful first-party vulnerability detection on Node/Express code relative to baseline tools, using conservative and reproducible measurement.

## Materials

| Corpus | Role | Ground truth |
|--------|------|--------------|
| **DVNA** | Realistic Node/Express attack surface | Theme- or finding-level labels from adjudication ([`../vibescan/adjudication-template.md`](../vibescan/adjudication-template.md)); align narrative with [`results/dvna-evaluation.md`](../../results/dvna-evaluation.md) |
| **Seeded benchmark** (planned) | Per-rule positives/negatives | Expected rule IDs documented per file ([`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md)) |

## Benchmark targets

1. **Primary benchmark (current):** DVNA (`appsecco/dvna`) using the protocol documented in `results/dvna-evaluation.md`.
2. **Secondary benchmark (planned):** seeded Node/Express micro-cases (see [`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md)).

## Tools under comparison

| Tool | What it measures | Notes |
|------|------------------|-------|
| **VibeScan** (`vibescan` / `secure`) | Custom OWASP/CWE-oriented rules, taint, Express route graph, optional registry check | Primary artifact |
| **eslint-plugin-security** | Generic JS security lint rules | Strong baseline for overlap analysis |
| **npm audit** | Known vulnerable dependencies | Complementary; not substitute for first-party bug finding |
| **Bearer** (optional) | SAST on repository | Same-environment run or omit row on poster |

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
- Store exact command lines and raw outputs under `results/` or `benchmarks/results/`.
- Store adjudication sheet (CSV/Markdown) linking each counted TP/FP/FN to source evidence.

## Procedure (reproducible)

1. Pin **Node** version and **scanner** package version; record **DVNA commit** (or submodule hash).
2. Run tools per [`benchmarking-runbook.md`](./benchmarking-runbook.md); save outputs under `benchmarks/results/…` or legacy [`results/`](../../results/) with a completed manifest ([`../vibescan/benchmark-manifest-template.json`](../vibescan/benchmark-manifest-template.json)).
3. **Adjudicate** a stratified sample (or full set if small) of findings into TP / FP / PP / dupe / out-of-scope.
4. Aggregate metrics per [`metrics-templates.md`](./metrics-templates.md).

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
6. Archive adjudication artifacts in `results/` for traceability.

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

| Threat | Mitigation (report in limitations) |
|--------|-------------------------------------|
| Single real-world app (*n*=1) | Add seeded corpus; state external validity limits |
| Manual labels subjective | Two readers on a subset; document rubric |
| Static analysis only | State no runtime exploit confirmation required for TP in your rubric—or require it and shrink TP set |
| Rule churn | Freeze commit + manifest for paper camera-ready |
| Baseline config sensitivity | Check in ESLint config used for DVNA ([`results/eslint-dvna.eslintrc.cjs`](../../results/eslint-dvna.eslintrc.cjs)) |

Additional threats to track explicitly:

1. **Benchmark representativeness:** DVNA is intentionally vulnerable and may not reflect production code distributions.
2. **Scope mismatch across tools:** `npm audit` and static linters operate on different abstraction levels; direct score comparisons can be misleading.
3. **Vendor noise sensitivity:** Inclusion of third-party/minified files can inflate findings and distort comparative signal.
4. **Manual adjudication bias:** Reviewer judgment can vary; disagreement protocol and written rationales are required.
5. **Environment drift:** Tool versions, network conditions (for registry checks), and benchmark revisions can change outcomes.
6. **Incomplete baseline execution:** Missing Bearer runs means current comparisons are preliminary and not yet complete.

## Ethics and safety

DVNA is intentionally vulnerable—run only in isolated environments. Do not point tools at unrelated third-party repos without permission.
