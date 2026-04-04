# Poster charts (DVNA multi-tool heatmap + VibeScan proof coverage)

This repo includes **data tables** and a **small generator** for conference-style figures:

- **Ground-truth case list:** `results/dvna-case-catalog.json` (eleven DVNA rows: `family`, `rowTitle`, `rowSubtitle`, anchors; `caseOrder` defines heatmap row order).
- **Tool × case detection matrix:** `results/dvna-detection-matrix.json` (edit when adjudication changes). Optional per-tool **`dvnaRunIssueCount`** documents frozen DVNA run volume for the comparison table: peers are charted as **0 / 0 / 0 / N** on proof tiers (N mapped to tier 4 for display only — not a native product schema).
- **Fair comparison notes:** `results/dvna-benchmark-interpretation.md` (scope, rule packs, framework context, detection vs proof).
- **Generator:** `benchmarks/scripts/dvna-poster-charts.mjs` → writes **`dvna-detection-rate-poster.html`** (HTML/CSS **heatmap**), **`dvna-proof-coverage-poster.html`** (**tier bars + cross-tool table**: VibeScan proof distribution; **Rows hit** = eleven benchmark anchors; peers use **`dvnaRunIssueCount`** as tier-4 chart normalization), and **`dvna-proof-vs-peers-poster.html`** (table-only view of that comparison).
- Optional **`--proof-coverage-json`** — use a different `vibescan-project.json` for the **tier bar chart** and **VibeScan tier table cells** (e.g. full-repo `scan --generate-tests` with more findings). Keep **`--vibescan-json`** for DVNA heatmap ◆ alignment; when both differ, the poster notes which file feeds which.

## Generate figures

From the repository root:

```bash
node benchmarks/scripts/dvna-poster-charts.mjs
```

The script **exits with an error** if any charted SAST tool (everything except `npm audit` gaps) is missing a **boolean** `true`/`false` for one of the eleven case ids — i.e. it enforces **full matrix coverage** for the figure.

Optional: attach a VibeScan project JSON so **◆ proof markers** appear on **VibeScan** cells where `proofGeneration` has `provable_locally` + `wasGenerated`:

```bash
node benchmarks/scripts/dvna-poster-charts.mjs ^
  --vibescan-json benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/vibescan-project.json
```

Optional: **wider proof corpus** for tier bars / table (heatmap ◆ still from `--vibescan-json`):

```bash
node benchmarks/scripts/dvna-poster-charts.mjs ^
  --vibescan-json benchmarks/results/<dvna-run>/vibescan-project.json ^
  --proof-coverage-json benchmarks/results/<full-repo-or-merged-run>/vibescan-project.json
```

Optional: **heuristic** CodeQL case hits from frozen SARIF (file suffix + line anchors from the catalog):

```bash
node benchmarks/scripts/dvna-poster-charts.mjs ^
  --fill-codeql benchmarks/results/2026-04-03_084922_dvna_codeql_v2.25.1/codeql.sarif
```

## Re-run VibeScan on DVNA

After `cd vibescan && npm run build`:

```bash
node benchmarks/scripts/run-dvna-vibescan-scan.mjs --benchmark-metadata
```

By default the runner adds **`--generate-tests benchmarks/results/dvna_vibescan_proofs`** so project JSON includes `proofGeneration` and accurate proof tiers (skip with **`--no-generate-tests`**; override output dir by passing your own **`--generate-tests other/dir`**).

`vibescan` exits **1** when the corpus has error-/critical-severity findings (normal for DVNA). The runner still **writes** `vibescan-project.json` from stdout JSON; only unexpected exit codes fail the script.

## Angular + Next.js seed corpus (line anchors)

Controlled snippets under `benchmarks/seeds/framework-vulns/` pair with `results/framework-vuln-case-catalog.json`. **Unit tests** (`vibescan/tests/unit/framework-seed-benchmark.test.mjs`) assert expected rule ids on catalog line numbers. To capture JSON under `benchmarks/results/`:

```bash
node benchmarks/scripts/run-framework-vuln-scan.mjs
```

## Academic scope note

The heatmap lists **eleven grounded DVNA case rows** (some share a title with different **scenario** subtitles). **npm audit** is omitted from tool columns when the matrix marks it as **gap** scope (dependency advisories ≠ first-party line SAST). See `results/dvna-benchmark-interpretation.md` for judge-facing framing.

## Companion figure

`dvna-proof-coverage-poster.html` is a **self-contained HTML/CSS** horizontal bar view of `summary.proofCoverage` (or recomputed tiers from findings)—no Chart.js CDN, so it works offline and in locked-down browsers.
