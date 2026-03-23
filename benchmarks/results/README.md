# Benchmark run outputs

**Naming:** `YYYY-MM-DD_<benchmarkSlug>_<toolOrBundle>_v<semverOrGitShort>/`

Each run folder should contain:

- `manifest.json` — from [`../../docs/vibescan/benchmark-manifest-template.json`](../../docs/vibescan/benchmark-manifest-template.json)
- Tool artifacts (`vibescan.json`, `eslint.json`, `bearer.json`, `npm-audit.json`, …)
- Optional `notes.md` (environment, partial runs, Docker failures)

**Legacy DVNA captures (markdown + raw logs):** [`legacy/`](./legacy/) — historical evaluation prose and tool output from before everything lived under `benchmarks/`. See also [`archive/README.md`](./archive/README.md).

Do not commit large clones or `node_modules` from benchmark apps.
