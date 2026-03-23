# Evaluation plan (draft)

## Objectives

1. Demonstrate that VibeScan produces **actionable, reviewable findings** on a standard vulnerable Node app (**DVNA**).
2. Compare **adjudicated** detection counts (and optionally precision/recall on seeded sets) against **eslint-plugin-security** and complementary **npm audit**.
3. Keep claims **bounded** to pinned versions, explicit file scope, and documented adjudication.

## Phase 1 — Freeze the protocol (before writing final numbers)

- [ ] Record DVNA **URL + commit** in manifest.
- [ ] Record **scanner repo commit** and `vibescan` version.
- [ ] Define **in-scope paths** (e.g. exclude `node_modules/`, tests if agreed).
- [ ] Save raw outputs: VibeScan JSON, ESLint JSON, `npm audit --json`, optional Bearer.

Commands and folder layout: [`../vibescan/reproducible-runs.md`](../vibescan/reproducible-runs.md), [`../vibescan/benchmark-layout.md`](../vibescan/benchmark-layout.md).

## Phase 2 — Adjudication

- [ ] Import findings into a spreadsheet from machine-readable outputs.
- [ ] Label each row using [`../vibescan/adjudication-template.md`](../vibescan/adjudication-template.md).
- [ ] Summarize by **OWASP theme** or **CWE family** (match poster table).

## Phase 3 — Metrics

- [ ] Fill summary tables in [`metrics-templates.md`](./metrics-templates.md).
- [ ] Separate **motivation citations** (industry/preprint) from **your** adjudicated counts in prose (see [`../vibescan/research-framing.md`](../vibescan/research-framing.md)).

## Phase 4 — Seeded benchmark (recommended extension)

- [ ] Implement minimal `benchmarks/seeded/` per [`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md).
- [ ] Report per-rule **detection rate** on positives and **false alarm rate** on negatives (where labels are unambiguous).

## Baseline fairness checklist

- ESLint: same Node project, documented config, same paths as VibeScan where possible.
- npm audit: run from app root; clarify it does **not** target the same defect classes as static first-party rules.
- Bearer: run with documented version or **omit** from comparative table.

## Deliverables for the paper/poster

| Deliverable | Location |
|-------------|----------|
| Raw logs | `benchmarks/results/<run-id>/` (and `benchmarks/results/legacy/` for the historical DVNA bundle) |
| Methodology prose | This file + [`methodology.md`](./methodology.md) |
| Rule ↔ evidence | [`../vibescan/rule-coverage-audit.md`](../vibescan/rule-coverage-audit.md) |
| Contribution boundaries | [`contribution-audit.md`](./contribution-audit.md) |
