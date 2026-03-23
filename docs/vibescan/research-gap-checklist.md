# Research Gap Checklist (Master)

Use this as the master completion tracker for poster/paper-quality academic packaging.

## Already completed

- [x] Preliminary DVNA benchmark artifacts exist in `results/`.
- [x] Architecture and implementation handoff document exists (`docs/REPO-HANDOFF.md`).
- [x] Conservative research questions/hypotheses documented (`research-question.md`).
- [x] Methodology framework documented (`methodology.md`).
- [x] Contribution evidence audit completed (`contribution-audit.md`).
- [x] Final evaluation and seeded benchmark plans documented (`evaluation-plan.md`, `seeded-benchmark-plan.md`).
- [x] Fillable metrics template created (`metrics-template.md`).
- [x] `results/dvna-evaluation.md` revised to emphasize preliminary/incomplete status.
- [x] Abstract revised with explicit separation of motivation/implementation/measured findings/future work.
- [x] Final paper outline prepared (`final-paper-outline.md`).

## Needs evidence

- [ ] Bearer baseline run under same DVNA revision/scope as other tools.
- [ ] Frozen version table (Node/npm/tool versions) included in evaluation docs.
- [ ] Adjudication sheet with explicit TP/FP/FN rationale linked to each counted item.
- [ ] Scope-normalized precision/recall calculations for all static baselines.
- [ ] Rule-level ablation or contribution breakdown showing which VibeScan modules drive observed gains.
- [ ] Vendor-inclusive sensitivity analysis (separate from first-party primary table).

## Needs implementation

- [ ] Seeded benchmark suite implementation (12 designed cases) in runnable repository form.
- [ ] Benchmark harness scripts to run all tools with consistent input and output formatting.
- [ ] Automated report generation from raw logs into metrics tables.
- [ ] Reproducibility package (commands + environment manifest + benchmark revisions).

## Future work

- [ ] Extend beyond DVNA/seeded sets to additional Node/Express benchmarks.
- [ ] Evaluate generated-test feature quality and practical utility in CI pipelines.
- [ ] Add broader framework support and evaluate transferability.
- [ ] Conduct inter-rater reliability measurement for adjudication process.
- [ ] Publish benchmark and labels for external replication.

## Claim discipline reminders

- [ ] Do not present baseline comparison as complete until Bearer parity is finished.
- [ ] Do not present implemented features as empirically validated unless they are measured.
- [ ] Keep dependency-level findings (`npm audit`, slopsquat) separate from line-level static detection metrics.

