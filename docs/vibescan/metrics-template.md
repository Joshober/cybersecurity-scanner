# Metrics Template (Ready to Fill)

Use this template for DVNA and seeded benchmark reporting. Keep tool scopes explicit.

## A) Per-tool TP / FP / FN

### A1. Main static findings (first-party code scope)

| Tool | TP | FP | FN | Notes |
|---|---:|---:|---:|---|
| VibeScan | TODO | TODO | TODO | |
| eslint-plugin-security | TODO | TODO | TODO | |
| Bearer | TODO | TODO | TODO | Pending if not run |

### A2. Dependency/project-level findings (separate scope)

| Tool | Matched vulnerable dependency/project condition (count) | Unmatched alerts (count) | Notes |
|---|---:|---:|---|
| npm audit | TODO | TODO | Advisory-level, not line-level |
| VibeScan (`--check-registry`) | TODO | TODO | `SLOP-001` project-level findings |

## B) Precision / Recall

For each tool (where TP/FP/FN are defined in same scope):

- Precision = TP / (TP + FP)
- Recall = TP / (TP + FN)

| Tool | Precision | Recall | F1 (optional) | Scope |
|---|---:|---:|---:|---|
| VibeScan | TODO | TODO | TODO | first-party static |
| eslint-plugin-security | TODO | TODO | TODO | first-party static |
| Bearer | TODO | TODO | TODO | first-party static |

## C) Per-category coverage

| Category | Benchmark positives | VibeScan TP | eslint TP | Bearer TP | Notes |
|---|---:|---:|---:|---:|---|
| Injection | TODO | TODO | TODO | TODO | |
| Crypto / secrets | TODO | TODO | TODO | TODO | |
| SSRF-related checks | TODO | TODO | TODO | TODO | |
| Prototype pollution | TODO | TODO | TODO | TODO | |
| Middleware / config signals | TODO | TODO | TODO | TODO | |
| Project-level dependency checks | TODO | TODO | TODO | TODO | separate-scope caveat |

## D) Benchmark summary

| Benchmark | Repo / dataset revision | File scope policy | Tools run | Completion status |
|---|---|---|---|---|
| DVNA | TODO SHA | TODO | VibeScan, eslint, npm audit, Bearer | TODO |
| Seeded suite | TODO revision | TODO | VibeScan, eslint, Bearer | TODO |

## E) Qualitative lessons learned

| Theme | Evidence | Confidence (low/med/high) | Action |
|---|---|---|---|
| Tool-scope mismatch affects comparability | TODO | TODO | Keep separate tables by scope |
| Vendor/minified code inflates noise | TODO | TODO | Enforce first-party policy |
| Specialized rules provide unique signals | TODO | TODO | Report rule-level contribution counts |
| Baseline incompleteness limits claims | TODO | TODO | Mark as preliminary until completed |

## F) Reproducibility log snippet

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

