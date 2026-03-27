# Benchmark run outputs

**Naming:** `YYYY-MM-DD_<benchmarkSlug>_<toolOrBundle>_v<semverOrGitShort>/`

Each run folder should contain:

- `manifest.json` — from [`docs/vibescan/benchmark-manifest-template.json`](../../docs/vibescan/benchmark-manifest-template.json)
- Tool artifacts (`vibescan.json`, `eslint.json`, `bearer.json`, `npm-audit.json`, …)
- Optional `notes.md` (environment, partial runs, Docker failures)

Recommended extras when available:

- `adjudication/` folder (CSV/JSON or markdown labels)
- `reports/metrics.md` and `reports/ablation.md` from `benchmarks/reporting/generate-metrics.mjs`

**Legacy captures:** Historical markdown and logs remain in [`../../results/`](../../results/); see [`archive/README.md`](./archive/README.md).

Do not commit large clones or `node_modules` from benchmark apps.
