# Metrics templates

Copy sections into spreadsheets or the paper appendix. Definitions should match the adjudication rubric ([`../vibescan/adjudication-template.md`](../vibescan/adjudication-template.md)).

This file is the consolidated “ready to fill” template for DVNA + seeded reporting.

## 0. Definitions (for scoring)

### Scope terms

- **In-scope findings (first-party static):** findings whose file paths are within the benchmark scope after applying the run’s include/exclude policy.
- **Ground truth population:** the set of expected vulnerabilities for scoring. For seeded runs, this is the expected rule IDs listed in `benchmarks/seeded/README.md`.
- **Out-of-scope findings:** real signals that are intentionally excluded from the scoring population for the run (report separately; exclude from precision/recall denominators).

### Adjudication labels

- `tp`: true positive
- `fp`: false positive
- `pp`: partial / context-dependent
- `dupe`: duplicate of another finding
- `out_of_scope`: excluded by scope policy or outside the defined scoring population

### Computing TP/FP/FN

- **TP/FP** are derived from adjudicated, in-scope reported findings.
- **FN** must be derived from absence against an explicit ground-truth expectation list (e.g., “expected-but-not-found” section in an adjudication sheet).

### Precision/Recall variants

- **Standard (with PP)**: precision \(=\frac{TP+PP}{TP+PP+FP}\), recall \(=\frac{TP+PP}{TP+PP+FN}\)
- **Conservative**: precision \(=\frac{TP}{TP+FP}\), recall \(=\frac{TP}{TP+FN}\)

## 1. Run metadata (required)

| Field | Value |
|-------|-------|
| Run ID | |
| Date (UTC) | |
| Scanner repo commit | |
| Benchmark app + commit | |
| Node version | |
| `vibescan` version | |
| ESLint version | |
| eslint-plugin-security version | |
| npm audit (npm CLI) version | |
| Bearer version (or N/A) | |

## 2. Counts by tool (raw)

| Tool | Total findings | Files with ≥1 finding |
|------|----------------|------------------------|
| VibeScan | | |
| eslint-plugin-security | | |
| npm audit (vulnerabilities) | | |
| Bearer | | |

## 2b. Per-tool TP / FP / FN (first-party code scope)

| Tool | TP | FP | FN | Notes |
|---|---:|---:|---:|---|
| VibeScan | TODO | TODO | TODO | |
| eslint-plugin-security | TODO | TODO | TODO | |
| Bearer | TODO | TODO | TODO | Pending if not run |

## 2c. Dependency/project-level findings (separate scope)

| Tool | Matched vulnerable dependency/project condition (count) | Unmatched alerts (count) | Notes |
|---|---:|---:|---|
| npm audit | TODO | TODO | Advisory-level, not line-level |
| VibeScan (`--check-registry`) | TODO | TODO | `SLOP-001` project-level findings |

## 3. Adjudicated VibeScan (DVNA)

| Label | Count | % of VibeScan findings |
|-------|-------|-------------------------|
| TP | | |
| FP | | |
| PP (context-dependent) | | |
| Dupe | | |
| Out of scope | | |

## 4. Adjudicated baseline (eslint-plugin-security) — same rubric

| Label | Count |
|-------|-------|
| TP | |
| FP | |
| PP | |
| Dupe | |
| Out of scope | |

## 4b. Precision / Recall (scope-aligned only)

For each tool (where TP/FP/FN are defined in the same scope):

- Precision = TP / (TP + FP)
- Recall = TP / (TP + FN)

| Tool | Precision | Recall | F1 (optional) | Scope |
|---|---:|---:|---:|---|
| VibeScan | TODO | TODO | TODO | first-party static |
| eslint-plugin-security | TODO | TODO | TODO | first-party static |
| Bearer | TODO | TODO | TODO | first-party static |

## 5. Theme alignment (optional, for poster)

Map each **TP** to a column (Injection, Auth, Sensitive Data, Logging, etc.); keep mapping rules explicit in a footnote.

| Theme | VibeScan TP | Baseline TP |
|-------|-------------|-------------|
| | | |

## 5b. Per-category coverage (optional)

| Category | Benchmark positives | VibeScan TP | eslint TP | Bearer TP | Notes |
|---|---:|---:|---:|---:|---|
| Injection | TODO | TODO | TODO | TODO | |
| Crypto / secrets | TODO | TODO | TODO | TODO | |
| SSRF-related checks | TODO | TODO | TODO | TODO | |
| Prototype pollution | TODO | TODO | TODO | TODO | |
| Middleware / config signals | TODO | TODO | TODO | TODO | |
| Project-level dependency checks | TODO | TODO | TODO | TODO | separate-scope caveat |

## 6. Seeded benchmark (when available)

| Rule ID (or family) | Positives in corpus | True detections | False negatives | Negatives in corpus | False positives |
|---------------------|---------------------|-----------------|---------------|---------------------|-----------------|
| | | | | | |

## 6b. Benchmark summary

| Benchmark | Repo / dataset revision | File scope policy | Tools run | Completion status |
|---|---|---|---|---|
| DVNA | TODO SHA | TODO | VibeScan, eslint, npm audit, Bearer | TODO |
| Seeded suite | TODO revision | TODO | VibeScan, eslint, Bearer | TODO |

## 6c. Qualitative lessons learned

| Theme | Evidence | Confidence (low/med/high) | Action |
|---|---|---|---|
| Tool-scope mismatch affects comparability | TODO | TODO | Keep separate tables by scope |
| Vendor/minified code inflates noise | TODO | TODO | Enforce first-party policy |
| Specialized rules provide unique signals | TODO | TODO | Report rule-level contribution counts |
| Baseline incompleteness limits claims | TODO | TODO | Mark as preliminary until completed |

## 6d. Reproducibility log snippet

| Item | Value |
|---|---|
| VibeScan repo commit | TODO |
| Node version | TODO |
| npm version | TODO |
| eslint version | TODO |
| eslint-plugin-security version | TODO |
| Bearer version | TODO |
| Benchmark revision(s) | TODO |
| Command log path(s) | TODO |

## 7. Reporting guardrails

- Report **adjudicated** counts for headline comparisons, not raw tool output counts.
- State whether **PP** counts are grouped with TP or FP for the headline metric.
- If Bearer or any baseline is missing, write **N/A** and do not leave blank cells on the poster.
