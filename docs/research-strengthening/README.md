# Research strengthening — academic track (VibeScan)

This folder is the **paper/poster spine**: research question, methodology, evaluation, seeded benchmarks, metrics, and contribution boundaries. It deliberately **does not** own product positioning for **secure-arch** (see [Product vs research](#product-vs-research-secure-arch) below).

**Related materials**

| Audience | Location |
|----------|----------|
| Judges, poster tone | [`../vibescan/research-framing.md`](../vibescan/research-framing.md), [`../vibescan/judge-prep-score-and-sources.md`](../vibescan/judge-prep-score-and-sources.md) |
| Conference abstract (working draft) | [`../vibescan/abstract.md`](../vibescan/abstract.md) |
| Reproducibility + benchmarks | [`../vibescan/reproducible-runs.md`](../vibescan/reproducible-runs.md), [`../vibescan/benchmark-layout.md`](../vibescan/benchmark-layout.md), [`../vibescan/evaluation-implementation-checklist.md`](../vibescan/evaluation-implementation-checklist.md) |
| Rule inventory vs tests | [`../vibescan/rule-coverage-audit.md`](../vibescan/rule-coverage-audit.md) |

## Documents in this folder

| File | Purpose |
|------|---------|
| [`research-question.md`](./research-question.md) | RQ, secondary questions, hypotheses, scope guardrails |
| [`methodology.md`](./methodology.md) | Study design, datasets, adjudication, threats to validity |
| [`evaluation-plan.md`](./evaluation-plan.md) | DVNA protocol, baselines, what gets scored |
| [`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md) | Synthetic corpus design tied to rule IDs |
| [`contribution-audit.md`](./contribution-audit.md) | What the paper claims vs what the repo proves |
| [`metrics-templates.md`](./metrics-templates.md) | Tables and definitions for TP/FP/FN and summaries |
| [`abstract-revision-notes.md`](./abstract-revision-notes.md) | Cleanup checklist for `docs/vibescan/abstract.md` |
| [`jober-newlayout-merge-strategy.md`](./jober-newlayout-merge-strategy.md) | How to split the layout branch without mixing tracks |

## Three tracks (keep mentally separate)

### 1. Research track (this folder + `docs/vibescan/`)

Ship on **`master`** via branch `docs/research-strengthening` (or equivalent): strengthen RQ, methodology, evaluation, seeded plan, metrics, abstract. **No dependency** on a monorepo rename landing first.

### 2. Product track (secure-arch)

**Worth keeping**, vendor-agnostic adapters and YAML settings are a **credible product extension**. For the **academic artifact**, treat secure-arch as **future work built on top of VibeScan**, not the evaluated core contribution—so the paper stays about the scanner + benchmark, not the architecture CLI.

### 3. Architecture / refactor track (`Jober/NewLayout`)

Merge **only after** build, tests, `vibescan`, and docs commands are verified—and **prefer small PRs** (secure-arch-only, or package-path-only), not one megamerge during benchmark freeze. See [`jober-newlayout-merge-strategy.md`](./jober-newlayout-merge-strategy.md).

## Merge order (recommended)

1. **Merge research docs into `master`** (evaluation + methodology + abstract cleanup). Keeps the academic story stable while benchmarks are finalized.
2. **Keep `Jober/NewLayout` open** for product/refactor validation; **do not** block research merges on it.
3. **Carve `Jober/NewLayout`** into mergeable pieces after `npm install && npm run build && npm test` and `npx secure-arch check` / `npx vibescan scan …` are confirmed on that branch.

## Product vs research (secure-arch)

| Topic | Research paper | Product roadmap |
|-------|----------------|-----------------|
| VibeScan scanner + DVNA / seeded eval | **Primary** | Ships as npm / CLI |
| secure-arch, adapters, YAML rulepack | **Optional “future work”** or appendix | **Primary** for that product line |

This separation avoids reviewer confusion: one contribution story per submission.
