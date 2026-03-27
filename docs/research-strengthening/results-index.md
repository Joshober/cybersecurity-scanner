# Results index (DVNA + benchmark runs)

This is the canonical index for evaluation evidence in the repo.

## 1) DVNA narrative + preliminary tables (legacy location)

- `results/dvna-evaluation.md`: current DVNA comparison writeup (frozen runs + adjudicated status snapshot).
- `results/dvna-adjudication.md`: canonical per-finding TP/FP/FN adjudication sheet and FN policy.
- Legacy raw logs (DVNA run captures):
  - `results/vibescan-dvna.txt`
  - `results/eslint-dvna.txt`
  - `results/npm-audit-dvna.txt`
  - `results/bearer-dvna.txt`

These legacy captures pre-date the standardized `benchmarks/results/` run-folder layout.

## 2) Standardized benchmark run outputs (canonical artifact tree)

Run folders live under:

- `benchmarks/results/`

Each run folder should contain:

- `manifest.json` (copied from `docs/vibescan/benchmark-manifest-template.json`)
- tool artifacts (JSON/logs)
- optional `notes.md`
- optional adjudication exports (e.g., `adjudication.md`, `findings.csv`)

See:

- `benchmarks/results/README.md` for naming and folder expectations
- `benchmarks/results/archive/README.md` for the pointer back to legacy `results/`

## 3) Scripts that generate benchmark runs

- `benchmarks/scripts/README.md` for the runner scripts and environment variables.

## 4) How to “graduate” a legacy DVNA capture into a paper-grade run

1. Re-run tools on a pinned DVNA commit with an explicit scope policy.
2. Create a dated run folder under `benchmarks/results/<run-id>/`.
3. Copy in tool outputs and fill `manifest.json`.
4. Link the run folder from `results/dvna-evaluation.md` (or a successor writeup if you move that narrative later).

