# Contribution audit — claims vs repository

Use this table to keep the **paper/poster** aligned with what is **actually evaluated** and shipped in the repo.

## Contribution evidence matrix (detailed)

Evidence basis:

- `README.md`
- `docs/REPO-HANDOFF.md`
- `docs/vibescan/abstract.md`
- `results/dvna-evaluation.md`

| Claimed contribution | Where implemented in repo | Where demonstrated | Where evaluated | Status |
|---|---|---|---|---|
| Spec-free AST endpoint extraction and route graphing for Express-style backends | `vibescan/src/system/parser/routeGraph.ts`, `vibescan/src/system/scanner.ts`, documented in `docs/REPO-HANDOFF.md` | CLI pipeline docs in `README.md` and `docs/REPO-HANDOFF.md`; available in code path during `scanProjectAsync` | No dedicated quantitative ablation isolating route-graph contribution in `results/dvna-evaluation.md` | **Partially supported** |
| Persistent generated security test files (`--generate-tests`) | `vibescan/src/system/engine/testWriter.ts`, CLI flags in `vibescan/src/system/cli/index.ts` | Feature documented in `README.md`; callable via CLI | No benchmark section measuring generated-test quality or impact | **Partially supported** |
| LLM default secret dictionary and weak fallback detection | `vibescan/src/attacks/crypto/secretDict.ts`, `vibescan/src/attacks/crypto/default-secret-fallback.ts`, `vibescan/src/attacks/crypto/jwt-weak-sign.ts` | Rule list in `README.md`; implementation details in `docs/REPO-HANDOFF.md` | DVNA notes include crypto/secret-related signals, but no isolated dictionary ablation yet | **Partially supported** |
| Slopsquatting detector via npm registry checks (`SLOP-001`) | `vibescan/src/system/ai/slopsquat.ts`, wired in `vibescan/src/system/scanner.ts` and CLI `--check-registry` | Documented usage in `README.md` and architecture in `docs/REPO-HANDOFF.md` | Not separately quantified in current DVNA comparison tables | **Partially supported** |
| Taint-style source-to-sink detection for injection classes | `vibescan/src/system/engine/taintEngine.ts` and sinks/sources modules under `vibescan/src/system/sinks` and `vibescan/src/system/sources` | Described in `docs/REPO-HANDOFF.md`; surfaced in findings (e.g., SQL tainted flow) | Preliminary DVNA table reports injection-related TPs | **Partially supported** |
| Comparative advantage over eslint-plugin-security on DVNA first-party code | Implemented via tool runs and manual adjudication artifacts in `results/` | Summarized in `results/dvna-evaluation.md` | Reported as preliminary: VibeScan vs eslint on first-party adjudicated TPs | **Partially supported** |
| Complete multi-baseline comparison including Bearer and Snyk Code | Baseline artifacts in `benchmarks/results/` and narrative in `results/dvna-evaluation.md` | Captured run manifests and outputs for VibeScan, eslint-plugin-security, Bearer, and Snyk Code | Available as DVNA snapshot; cross-benchmark replication still future work | **Partially supported** |

## Tier A — Safe to claim as primary contributions (if evaluation supports)

| Claim | Evidence in repo | Risk if overstated |
|-------|------------------|--------------------|
| Static rule set for crypto + injection-oriented JS/TS patterns | `vibescan/src/attacks/`, root README rule table | “Catches all bugs” |
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
| secure-arch CLI, YAML settings, evidence checks | `vibescan/packages/secure-arch-*`, `docs/secure-arch/` | **Future work** or one sentence “orthogonal tooling” |
| Cursor / Amazon Q adapters | `vibescan/packages/secure-arch-adapters` | Same |

## Tier D — Not currently part of the default scanner

| Artifact | Status |
|----------|--------|
| `prototypePollution.ts` | Present; **not** registered in `attacks/index.ts` |
| `jwt-weak-test.ts` | Built; **not** in active rule list |

Do not claim these as evaluated rules unless you wire + test + benchmark them.

## Abstract claim-strength check (guardrails)

The current abstract is directionally aligned but has several claims that should remain carefully bounded:

1. **Claim:** DVNA comparison is presented with cross-tool numeric contrast.\n   **Evidence status:** Supported as a **scope-limited snapshot/manual adjudication** in `results/dvna-evaluation.md`.\n   **Risk:** Can be read as a universal ranking if caveats are not explicit.\n   **Recommendation:** Keep wording as “snapshot” and pair all numbers with scope limitations.
2. **Claim:** Several contributions are framed as established project advances.\n   **Evidence status:** Implemented in code and docs; quantitative validation is incomplete for some.\n   **Risk:** Readers may infer all contributions are empirically validated.\n   **Recommendation:** Separate “implemented contributions” from “measured findings” in abstract structure.
3. **Claim:** Architectural lesson (downstream scanning > prompt engineering) is presented strongly.\n   **Evidence status:** Motivated by literature and project experience, but not fully causal-tested within this repo.\n   **Risk:** Overinterpretation as a causal conclusion from current experiments alone.\n   **Recommendation:** Attribute as a design position informed by literature plus preliminary benchmark evidence.

## Overclaim guardrails for poster/paper

- Do not describe DVNA snapshot results as universal across apps or frameworks.
- Do not present seeded-benchmark outcomes until cases are implemented and adjudicated.
- Distinguish **implemented** features from **evaluated** features in all tables.

## secure-arch vs VibeScan (one sentence for abstract)

> **VibeScan** is the evaluated static scanner; **secure-arch** is a separate, portable architecture-and-settings layer that can sit beside it in a product stack but is **out of scope** for the current benchmark numbers.

Adjust if you later run an evaluation that includes secure-arch checks.
