# Benchmark reporting

This folder contains small, dependency-free scripts to convert `benchmarks/results/<run-id>/` artifacts into paper-friendly tables.

## Generate metrics + per-rule breakdown

Prerequisites: Node 18+.

```bash
node benchmarks/reporting/generate-metrics.mjs --run benchmarks/results/<run-id>
```

Expected inputs inside the run folder:

- `manifest.json`
- `adjudication/adjudication.csv`

Outputs (written/overwritten):

- `reports/metrics.md`
- `reports/ablation.md`

