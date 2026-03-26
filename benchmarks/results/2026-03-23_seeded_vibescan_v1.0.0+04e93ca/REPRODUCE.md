# Reproduce this run

Run folder: `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/`

## Prerequisites

- Node 18+ (this run used Node + npm versions recorded in `manifest.json`)
- Repo dependencies installed and build completed:

```bash
npm install
npm run build -w vibescan
```

## Re-run VibeScan on the seeded corpus

From the repo root:

```bash
node vibescan/dist/system/cli/index.js scan benchmarks/seeded --format json --project-root benchmarks/seeded --exclude-vendor --benchmark-metadata --export-adjudication benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/vibescan-adjudication
```

Notes:

- VibeScan may exit non-zero when it emits ERROR-severity findings; outputs are still written.
- This run’s artifacts (`vibescan-adjudication.csv/.json`) are already committed in the run folder.

## Regenerate metrics tables from adjudication

This converts `adjudication/adjudication.csv` into markdown tables under `reports/`.

```bash
node benchmarks/reporting/generate-metrics.mjs --run benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca
```

Expected outputs:

- `reports/metrics.md`
- `reports/ablation.md`

