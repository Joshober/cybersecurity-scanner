# VibeScan Contribution Audit

Evidence basis:

- `README.md`
- `docs/REPO-HANDOFF.md`
- `docs/vibescan/abstract.md`
- `results/dvna-evaluation.md`

## Contribution evidence matrix

| Claimed contribution | Where implemented in repo | Where demonstrated | Where evaluated | Status |
|---|---|---|---|---|
| Spec-free AST endpoint extraction and route graphing for Express-style backends | `src/system/parser/routeGraph.ts`, `src/system/scanner.ts`, documented in `docs/REPO-HANDOFF.md` | CLI pipeline docs in `README.md` and `docs/REPO-HANDOFF.md`; available in code path during `scanProjectAsync` | No dedicated quantitative ablation isolating route-graph contribution in `results/dvna-evaluation.md` | **Partially supported** |
| Persistent generated security test files (`--generate-tests`) | `src/system/engine/testWriter.ts`, CLI flags in `src/system/cli/index.ts` | Feature documented in `README.md`; callable via CLI | No benchmark section measuring generated-test quality or impact | **Partially supported** |
| LLM default secret dictionary and weak fallback detection | `src/attacks/crypto/secretDict.ts`, `src/attacks/crypto/default-secret-fallback.ts`, `src/attacks/crypto/jwt-weak-sign.ts`; counts in `results/person-b-handoff.md` | Rule list in `README.md`; implementation details in `docs/REPO-HANDOFF.md` | DVNA notes include some crypto/secret-related TPs, but no isolated dictionary benchmark yet | **Partially supported** |
| Slopsquatting detector via npm registry checks (`SLOP-001`) | `src/system/ai/slopsquat.ts`, wired in `src/system/scanner.ts` and CLI `--check-registry` | Documented usage in `README.md` and architecture in `docs/REPO-HANDOFF.md` | Not separately quantified in DVNA comparison tables; Bearer comparison pending | **Partially supported** |
| Taint-style source-to-sink detection for injection classes | `src/system/engine/taintEngine.ts` and sinks/sources modules under `src/system/sinks` and `src/system/sources` | Described in `docs/REPO-HANDOFF.md`; surfaced in findings (e.g., SQL tainted flow) | Preliminary DVNA table reports injection-related TPs | **Partially supported** |
| Comparative advantage over eslint-plugin-security on DVNA first-party code | Implemented via tool runs and manual adjudication artifacts in `results/` | Summarized in `results/dvna-evaluation.md` | Reported as preliminary: VibeScan vs eslint on first-party adjudicated TPs | **Partially supported** |
| Complete multi-baseline comparison including Bearer | Planned baseline in `results/dvna-evaluation.md` and `results/bearer-dvna.txt` | Bearer command guidance exists | Bearer run is explicitly pending in current environment | **Future work** |

## Abstract claim-strength check

The current abstract is directionally aligned but has several claims that should remain carefully bounded:

1. **Claim:** DVNA comparison is presented with a strong numeric contrast vs eslint.  
   **Evidence status:** Supported as **preliminary/manual adjudication** in `results/dvna-evaluation.md`.  
   **Risk:** Can be read as a complete baseline study if caveats are not explicit.  
   **Recommendation:** Keep wording as "preliminary" and preserve Bearer-pending caveat in same paragraph.

2. **Claim:** Four contributions are framed as established project advances.  
   **Evidence status:** Implemented in code and docs; quantitative validation is incomplete for several contributions.  
   **Risk:** Readers may infer all four contributions are empirically validated.  
   **Recommendation:** Separate "implemented contributions" from "measured findings" in abstract structure.

3. **Claim:** Architectural lesson (downstream scanning > prompt engineering) is presented strongly.  
   **Evidence status:** Motivated by prior literature and project experience, but not fully causal-tested within this repo.  
   **Risk:** Overinterpretation as a causal conclusion from current experiments alone.  
   **Recommendation:** Attribute this as a design position informed by literature plus preliminary benchmark evidence.

## Overclaim guardrails for poster/paper

- Do not describe Bearer comparison as complete until results are produced.
- Do not present seeded-benchmark outcomes until cases are implemented and adjudicated.
- Distinguish **implemented** features from **evaluated** features in all tables.

