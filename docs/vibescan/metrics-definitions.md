# Metrics definitions (VibeScan evaluation)

This doc defines how precision/recall-style metrics are computed from VibeScan outputs and human adjudication labels.

## 1) Scope terms

- **In-scope findings (first-party static):** VibeScan `findings[]` whose `file` path is within the benchmark corpus scope (after applying `includedFiles` / `excludedFiles` and `excludedGlobs` from the run manifest).
- **Ground truth population:** the set of vulnerabilities the corpus expects. For the seeded suite, this is the expected rule ID(s) listed in `benchmarks/seeded/README.md`.
- **Out-of-scope findings:** VibeScan findings that are real signals but not part of the ground truth population used for scoring in a given run (reported, but excluded from precision/recall denominators).

## 2) Adjudication labels

- `tp` — True positive: the finding corresponds to a real ground-truth vulnerability in context.
- `fp` — False positive: the finding does not correspond to a ground-truth vulnerability (safe in context, dead code, or rule misread).
- `pp` — Partial / context-dependent: the finding likely matches, but evidence is incomplete or depends on runtime/context. Use when reviewers would not want to call it fully `tp`.
- `dupe` — Duplicate: duplicate of another finding; does not add to TP/FP counts.
- `out_of_scope` — The finding is not part of this run’s ground-truth scoring population; excluded from TP/FP/FN denominators.

## 3) Computing TP/FP/FN

For each benchmark run:

- **TP / FP (reported findings):**
  - A VibeScan finding is `tp` if it matches a ground-truth expected rule (within the same corpus file scope).
  - A VibeScan finding is `fp` if it is in-scope by file scope but matches no ground-truth expected rule.
  - A VibeScan finding is `out_of_scope` if it matches no ground-truth expected rule because that rule family is intentionally excluded from this run’s scoring definition.
- **FN (missing ground-truth):**
  - For each ground-truth expected rule family in the corpus, compute `FN=1` if VibeScan emits no matching in-scope finding for that expectation in the current run.
  - FN counts are derived from absence, so they must be tracked in an explicit “expected-but-not-found” section (e.g., the adjudication sheet).

## 4) Precision / Recall

Where TP/FP/FN are defined for the same run scope:

- **Precision** = (TP + PP) / (TP + PP + FP)
- **Recall** = (TP + PP) / (TP + PP + FN)

If you need a conservative variant, you can report:

- **Conservative Precision** = TP / (TP + FP)
- **Conservative Recall** = TP / (TP + FN)

## 5) Reporting granularity

- **Per-rule:** compute metrics separately for each expected rule ID family in the ground truth table.
- **Clustered families:** optionally group rules into CWE/OWASP families; ensure the ground truth expectations are translated consistently before computing metrics.

