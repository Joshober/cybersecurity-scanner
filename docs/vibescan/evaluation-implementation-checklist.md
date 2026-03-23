# VibeScan — academic evaluation implementation checklist

Use this as the working tracker for reproducible benchmarks, ground-truth adjudication, and machine-readable evidence. Detailed specs live in the linked docs.

## Execution priority (locked for this repo)

All three strands from the unfinished-features plan are in scope, in this order:

1. **Reproducible benchmarks (Phase B–D)** — Physical [`benchmarks/`](../../benchmarks/) tree, scripts, manifests, JSON metadata flags (`--benchmark-metadata`, stable finding order), and [`eval-support-changes.md`](./eval-support-changes.md) items implemented in code where listed.
2. **Bearer baseline** — Automated in [`benchmarks/scripts/`](../../benchmarks/scripts/) when Docker (or a native Bearer install) is available; until then keep [`benchmarks/results/legacy/bearer-dvna.txt`](../../benchmarks/results/legacy/bearer-dvna.txt) as the honest “not run” record and drop `bearer.json` under [`benchmarks/results/`](../../benchmarks/results/) after a successful run.
3. **Conference polish** — Poster PDF, print proof, and pitch timing stay human tasks; rubric notes remain in [`rubric-status-updated.md`](./rubric-status-updated.md).

## Phase A — Documentation and layout (this pass)

- [x] **Rule coverage audit** — [`rule-coverage-audit.md`](./rule-coverage-audit.md)
- [x] **Benchmark folder proposal** — [`benchmark-layout.md`](./benchmark-layout.md)
- [x] **Reproducible runbook** — [`reproducible-runs.md`](./reproducible-runs.md)
- [x] **Benchmark manifest template** — [`benchmark-manifest-template.json`](./benchmark-manifest-template.json)
- [x] **Adjudication template** — [`adjudication-template.md`](./adjudication-template.md)
- [x] **Output support audit** — [`output-support-audit.md`](./output-support-audit.md)
- [x] **Eval-oriented code change proposals** — [`eval-support-changes.md`](./eval-support-changes.md)

## Phase B — Repository layout (physical)

- [x] Create `benchmarks/dvna/` (README + clone path; actual clone is gitignored — see [`benchmarks/dvna/README.md`](../../benchmarks/dvna/README.md))
- [x] Create `benchmarks/seeded/` (minimal synthetic corpora per rule family — starter set committed)
- [x] Create `benchmarks/results/` (timestamped raw outputs + manifests — see README; DVNA markdown + logs in [`legacy/`](../../benchmarks/results/legacy/), indexed from [`archive/README.md`](../../benchmarks/results/archive/README.md))
- [x] Create `benchmarks/scripts/` (shell/PowerShell runners wrapping this repo’s tools)
- [x] [`benchmarks/results/legacy/`](../../benchmarks/results/legacy/) cross-linked from `benchmarks/results/archive/README.md`

## Phase C — Ground truth and scoring

- [x] For each benchmark run, fill a copy of `benchmark-manifest-template.json` (seeded golden run: [`benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/manifest.json`](../../benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/manifest.json))
- [x] Sample findings into `adjudication-template.md` (seeded golden run: [`benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/adjudication.md`](../../benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/adjudication.md))
- [x] Define primary metrics (precision/recall per rule, or clustered CWE families) and document in `dvna-evaluation.md` successor (`./metrics-definitions.md`)

## Phase D — Scanner output (small code changes)

- [x] Implement agreed items from [`eval-support-changes.md`](./eval-support-changes.md): `--ignore-glob`, `--benchmark-metadata` (+ `VIBESCAN_BENCHMARK=1`), stable JSON finding order, optional `ruleFamily` on findings, [`vibescan-benchmark-output.schema.json`](./vibescan-benchmark-output.schema.json)
- [x] Regenerate benchmark JSON with new fields after each tool-version bump; keep a frozen “before” copy per run folder under `benchmarks/results/` (seeded golden run: `vibescan-project.frozen.json` present in the run folder)

## Related repo docs

- Root [README.md](../../README.md) — rule catalog and CLI usage
- [`docs/REPO-HANDOFF.md`](../REPO-HANDOFF.md) — architecture and pipeline
