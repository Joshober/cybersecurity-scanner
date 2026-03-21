# Contribution audit — claims vs repository

Use this table to keep the **paper/poster** aligned with what is **actually evaluated** and shipped in the repo.

## Tier A — Safe to claim as primary contributions (if evaluation supports)

| Claim | Evidence in repo | Risk if overstated |
|-------|------------------|--------------------|
| Static rule set for crypto + injection-oriented JS/TS patterns | `packages/secure-code-scanner/src/attacks/`, root README rule table | “Catches all bugs” |
| Express route extraction + middleware-style audits | `routeGraph`, `middlewareAudit`, `appLevelAudit` | Only fires on patterns the graph recognizes |
| Optional npm registry check (slopsquat signal) | `SLOP-001`, `--check-registry` | Network-dependent; define “skip” handling |
| Open prototype + reproducible CLI | `vibescan` / `secure`, build scripts | Maturity not same as commercial SAST |
| Comparative evaluation vs baseline(s) on DVNA | `results/dvna-evaluation.md` + adjudication | *n*, label subjectivity |

## Tier B — Mention as engineering features; evaluation optional

| Claim | Evidence | Note |
|-------|----------|------|
| Generated security test stubs | `--generate-tests`, `testWriter` | Separate user study needed to claim impact |
| AI scan mode | `--mode ai` | Disclosure: model-dependent; not default static eval |
| ESLint plugin surface | `eslint-plugin` export | Good for adoption; not required for DVNA story |

## Tier C — Product / architecture extension (not the core paper contribution unless separately evaluated)

| Topic | Location | Paper treatment |
|-------|----------|-----------------|
| secure-arch CLI, YAML settings, evidence checks | `packages/secure-arch-*`, `docs/secure-arch/` | **Future work** or one sentence “orthogonal tooling” |
| Cursor / Amazon Q adapters | `packages/secure-arch-adapters` | Same |

## Tier D — Not currently part of the default scanner

| Artifact | Status |
|----------|--------|
| `prototypePollution.ts` | Present; **not** registered in `attacks/index.ts` |
| `jwt-weak-test.ts` | Built; **not** in active rule list |

Do not claim these as evaluated rules unless you wire + test + benchmark them.

## secure-arch vs VibeScan (one sentence for abstract)

> **VibeScan** is the evaluated static scanner; **secure-arch** is a separate, portable architecture-and-settings layer that can sit beside it in a product stack but is **out of scope** for the current benchmark numbers.

Adjust if you later run an evaluation that includes secure-arch checks.
