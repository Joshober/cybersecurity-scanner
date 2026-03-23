# Metrics templates

Copy sections into spreadsheets or the paper appendix. Definitions should match the adjudication rubric ([`../vibescan/adjudication-template.md`](../vibescan/adjudication-template.md)).

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

## 5. Theme alignment (optional, for poster)

Map each **TP** to a column (Injection, Auth, Sensitive Data, Logging, etc.); keep mapping rules explicit in a footnote.

| Theme | VibeScan TP | Baseline TP |
|-------|-------------|-------------|
| | | |

## 6. Seeded benchmark (when available)

| Rule ID (or family) | Positives in corpus | True detections | False negatives | Negatives in corpus | False positives |
|---------------------|---------------------|-----------------|---------------|---------------------|-----------------|
| | | | | | |

## 7. Reporting guardrails

- Report **adjudicated** counts for headline comparisons, not raw tool output counts.
- State whether **PP** counts are grouped with TP or FP for the headline metric.
- If Bearer or any baseline is missing, write **N/A** and do not leave blank cells on the poster.
