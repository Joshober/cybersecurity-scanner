# Person B handoff (poster + demo notes)

This file is a lightweight handoff for poster/demo preparation: where to find canonical docs, which benchmark artifacts are frozen, and what still needs manual updates before printing final materials.

## Canonical docs

- Repo + architecture overview: `docs/REPO-HANDOFF.md`
- Research spine: `docs/research-strengthening/README.md`
- Poster/demo assets: `docs/vibescan/README.md`
- Benchmark run layout: `docs/research-strengthening/benchmarking-runbook.md`

## Frozen benchmark artifacts (current)

- Seeded canonical run (manifest + adjudication + metrics):
  - `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/`
- DVNA frozen runs (manifests + raw outputs):
  - `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/`
  - `benchmarks/results/2026-03-25_223217_dvna_bearer/`

## Poster update checklist (quick)

- If the poster includes a baseline row for Snyk Code, authenticate and capture the raw JSON (see the “vendor sensitivity” run notes under `benchmarks/results/*snykcode*/reports/sensitivity.md`).
- If the poster includes rule counts, regenerate them only after the scanner rule list is frozen (see root `README.md` rule table).

