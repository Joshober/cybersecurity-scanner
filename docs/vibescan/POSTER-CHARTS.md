# Poster charts (DVNA multi-tool detection + VibeScan proof coverage)

This repo includes **data tables** and a **small generator** for conference-style figures:

- **Ground-truth case list:** `results/dvna-case-catalog.json` (eleven DVNA case families from `results/dvna-adjudication.md`).
- **Tool × case detection matrix:** `results/dvna-detection-matrix.json` (edit when adjudication changes).
- **Generator:** `benchmarks/scripts/dvna-poster-charts.mjs` → writes HTML + Chart.js under `results/charts/`.

## Generate figures

From the repository root:

```bash
node benchmarks/scripts/dvna-poster-charts.mjs
```

The script **exits with an error** if any charted SAST tool (everything except `npm audit` gaps) is missing a **boolean** `true`/`false` for one of the eleven case ids — i.e. it enforces **full matrix coverage** for the figure.

Optional: attach a VibeScan project JSON so **proof markers** (larger points) map to cases that have `proofGeneration` with `provable_locally` + `wasGenerated`:

```bash
node benchmarks/scripts/dvna-poster-charts.mjs ^
  --vibescan-json benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/vibescan-project.json
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

`vibescan` exits **1** when the corpus has error-/critical-severity findings (normal for DVNA). The runner still **writes** `vibescan-project.json` from stdout JSON; only unexpected exit codes fail the script.

Optional proof emission:

```bash
node benchmarks/scripts/run-dvna-vibescan-scan.mjs --benchmark-metadata --generate-tests benchmarks/results/<your-run>/proofs
```

## Angular + Next.js seed corpus (line anchors)

Controlled snippets under `benchmarks/seeds/framework-vulns/` pair with `results/framework-vuln-case-catalog.json`. **Unit tests** (`vibescan/tests/unit/framework-seed-benchmark.test.mjs`) assert expected rule ids on catalog line numbers. To capture JSON under `benchmarks/results/`:

```bash
node benchmarks/scripts/run-framework-vuln-scan.mjs
```

## Academic scope note (chart subtitle)

Use the same language as your poster: **only families with an explicit ground-truth row appear on the X-axis** (here, the eleven DVNA case keys). Tools that do not provide line-level SAST parity for those cases (e.g. **npm audit**) are omitted or shown as gaps—not as artificial zeroes.

## Companion chart

`dvna-proof-coverage-poster.html` reads `summary.proofCoverage` from the optional VibeScan JSON to contrast **detection** vs **proof tier/actionability**.
