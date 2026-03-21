# VibeScan — academic evaluation implementation checklist

Use this as the working tracker for reproducible benchmarks, ground-truth adjudication, and machine-readable evidence. Detailed specs live in the linked docs.

## Phase A — Documentation and layout (this pass)

- [x] **Rule coverage audit** — [`rule-coverage-audit.md`](./rule-coverage-audit.md)
- [x] **Benchmark folder proposal** — [`benchmark-layout.md`](./benchmark-layout.md)
- [x] **Reproducible runbook** — [`reproducible-runs.md`](./reproducible-runs.md)
- [x] **Benchmark manifest template** — [`benchmark-manifest-template.json`](./benchmark-manifest-template.json)
- [x] **Adjudication template** — [`adjudication-template.md`](./adjudication-template.md)
- [x] **Output support audit** — [`output-support-audit.md`](./output-support-audit.md)
- [x] **Eval-oriented code change proposals** — [`eval-support-changes.md`](./eval-support-changes.md)

## Phase B — Repository layout (physical)

- [ ] Create `benchmarks/dvna/` (pinned clone or submodule of DVNA / chosen fork)
- [ ] Create `benchmarks/seeded/` (minimal synthetic corpora per rule family)
- [ ] Create `benchmarks/results/` (timestamped raw outputs + manifests)
- [ ] Create `benchmarks/scripts/` (shell/PowerShell runners wrapping this repo’s tools)
- [ ] Optionally migrate legacy [`results/`](../../results/) artifacts under `benchmarks/results/archive/` with a manifest pointing to commit hashes

## Phase C — Ground truth and scoring

- [ ] For each benchmark run, fill a copy of `benchmark-manifest-template.json`
- [ ] Sample findings into `adjudication-template.md` (stratify by rule ID and file)
- [ ] Define primary metrics (precision/recall per rule, or clustered CWE families) and document in `dvna-evaluation.md` successor

## Phase D — Scanner output (small code changes)

- [ ] Implement agreed items from [`eval-support-changes.md`](./eval-support-changes.md) behind flags where possible
- [ ] Regenerate benchmark JSON with new summary fields; keep a frozen “before” copy for paper reproducibility

## Related repo docs

- Root [README.md](../../README.md) — rule catalog and CLI usage
- [`docs/REPO-HANDOFF.md`](../REPO-HANDOFF.md) — architecture and pipeline
- [`packages/secure-code-scanner/README.md`](../../packages/secure-code-scanner/README.md) — package entry point
