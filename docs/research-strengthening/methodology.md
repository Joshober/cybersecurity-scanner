# Methodology (draft)

## Study type

**Comparative static analysis** on a known vulnerable application (**DVNA**) and (planned) **seeded synthetic snippets**, with **manual adjudication** of tool outputs. This is an **artifact evaluation** of a research prototype, not a randomized controlled trial of developers.

## Materials

| Corpus | Role | Ground truth |
|--------|------|--------------|
| **DVNA** | Realistic Node/Express attack surface | Theme- or finding-level labels from adjudication ([`../vibescan/adjudication-template.md`](../vibescan/adjudication-template.md)); align narrative with [`results/dvna-evaluation.md`](../../results/dvna-evaluation.md) |
| **Seeded benchmark** (planned) | Per-rule positives/negatives | Expected rule IDs documented per file ([`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md)) |

## Tools under comparison

| Tool | What it measures | Notes |
|------|------------------|-------|
| **VibeScan** (`vibescan` / `secure`) | Custom OWASP/CWE-oriented rules, taint, Express route graph, optional registry check | Primary artifact |
| **eslint-plugin-security** | Generic JS security lint rules | Strong baseline for overlap analysis |
| **npm audit** | Known vulnerable dependencies | Complementary; not substitute for first-party bug finding |
| **Bearer** (optional) | SAST on repository | Same-environment run or omit row on poster |

## Procedure (reproducible)

1. Pin **Node** version and **scanner** package version; record **DVNA commit** (or submodule hash).
2. Run tools per [`../vibescan/reproducible-runs.md`](../vibescan/reproducible-runs.md); save outputs under `benchmarks/results/…` or legacy [`results/`](../../results/) with a completed manifest ([`../vibescan/benchmark-manifest-template.json`](../vibescan/benchmark-manifest-template.json)).
3. **Adjudicate** a stratified sample (or full set if small) of findings into TP / FP / PP / dupe / out-of-scope.
4. Aggregate metrics per [`metrics-templates.md`](./metrics-templates.md).

## Threats to validity

| Threat | Mitigation (report in limitations) |
|--------|-------------------------------------|
| Single real-world app (*n*=1) | Add seeded corpus; state external validity limits |
| Manual labels subjective | Two readers on a subset; document rubric |
| Static analysis only | State no runtime exploit confirmation required for TP in your rubric—or require it and shrink TP set |
| Rule churn | Freeze commit + manifest for paper camera-ready |
| Baseline config sensitivity | Check in ESLint config used for DVNA ([`results/eslint-dvna.eslintrc.cjs`](../../results/eslint-dvna.eslintrc.cjs)) |

## Ethics and safety

DVNA is intentionally vulnerable—run only in isolated environments. Do not point tools at unrelated third-party repos without permission.
