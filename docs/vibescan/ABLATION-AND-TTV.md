# Ablation analysis and time-to-validate (TTV) study protocol

This document supports the comparative research plan: measuring **what** improves actionability (detection vs route context vs proof artifacts) and optional **human time-to-validate** studies for posters or papers.

## Ablation: three reporting modes

Goal: isolate whether **proof-oriented artifacts** improve outcomes beyond **better detection** or **route/OpenAPI context** alone.

| Mode | What to compare | How to obtain (no fork required) |
|------|-----------------|-----------------------------------|
| **A — Detection-only** | Findings as usual, de-emphasize route and proof in the narrative | Export JSON **without** running proof generation; strip or ignore `route` / `proofGeneration` fields in post-processing for participant-facing packets only. |
| **B — Detection + route/API context** | Same findings, include `route`, `route.middlewares`, OpenAPI drift (`API-INV-*`) | Use full `vibescan scan` JSON / SARIF as produced today; omit proof files from the packet. |
| **C — Full** | Findings + route context + generated `*.test.mjs` + `proofGeneration` / `proofCoverage` summary | Run `scan --generate-tests` (or `prove`); include `summarizeProofCoverage` output from project summary when using `--benchmark-metadata`. |

**Metrics from exports:**

- `proofCoverage.proof_coverage_percent` / `by_tier` — see [`vibescan/src/system/evidence.ts`](../../vibescan/src/system/evidence.ts) (`summarizeProofCoverage`).
- Per-finding `proofTier` (1–4) when evidence fields are enabled.

**Analysis script:** For a given `vibescan-project.json`, a small script can count tier distribution and median “actionability” proxies (e.g. fraction of tier-1 findings) per mode; modes A/B are **views** of the same run, not separate scans, unless you intentionally re-scan with flags off.

## Time-to-validate (TTV) — within-subject protocol

**Population:** 8–12 participants (students or professional developers) with basic Node/Express literacy.

**Design:** Within-subject; randomize order of tool **packets** to reduce learning bias.

**Materials (per task):**

1. **Semgrep:** JSON or SARIF for the same app with `--dataflow-traces` where applicable; participant receives file paths + messages + trace if present.
2. **CodeQL:** SARIF or CLI SARIF with path-problem flows visible in IDE or documented line ranges.
3. **Snyk Code:** `snyk code test --json` (or frozen artifact).
4. **VibeScan:** Same-app JSON **plus** generated proof directory; instruct participant to run `node --test <proof-dir>` when relevant.

**Task:** For each labeled finding (ground-truth known to organizers), participant decides **confirmed vulnerable** vs **not reproduced** vs **uncertain**, with a short rationale.

**Timing:** Cap each task (e.g. 6 minutes) with a visible timer; record **time to first decision** and **time to final decision**.

**Outcome measures:**

- Median TTV and IQR per tool.
- **Decision accuracy** vs adjudicated ground truth (`tp`/`fp`).
- Optional NASA-TLX or single-item **cognitive load** after each tool block.

**Ethics:** Lab-only; no real production credentials; use benchmark apps only (DVNA, NodeGoat, etc.).

## Poster-friendly figures

- **Stacked bar:** findings by proof tier (`summarizeProofCoverage`).
- **Bar chart:** median TTV by tool with `n` on caption.
- **Scatter:** x = estimated recall from adjudication, y = proof-supported rate (VibeScan thesis: high y on supported families).

## Related files

- Frozen benchmarks: [`results/dvna-evaluation.md`](../../results/dvna-evaluation.md)
- Second corpus protocol: [`BENCHMARK-SECOND-CORPUS.md`](./BENCHMARK-SECOND-CORPUS.md)
- CI proof runs: [`CI-PROVE.md`](./CI-PROVE.md)
