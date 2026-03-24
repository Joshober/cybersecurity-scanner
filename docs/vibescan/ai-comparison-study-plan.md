# AI comparison study plan (VibeScan vs AI-only review/fix)

This document defines a **conservative, reviewable** comparison suitable for academic or engineering reporting. Claims should under-promise: LLM-assisted workflows vary by model, prompt, tooling, and human operator.

## Arms

1. **VibeScan (static + policy)**  
   - Version-pinned CLI (`vibescan`), fixed `severityThreshold`, documented rule set.  
   - Optional `policy-check` with frozen policy JSON.  
   - Outputs: JSON / SARIF + policy result JSON.

2. **AI-only vulnerability find/fix workflow**  
   - Defined protocol: model family + version, system prompt template, max tokens, temperature **0** (or reported), allowed tools (file read, terminal, etc.).  
   - Human may **not** intervene mid-run beyond the initial task description (document if otherwise).

## Tasks (corpora)

- **Synthetic**: [`benchmarks/gold-path-demo/`](../../benchmarks/gold-path-demo/) vulnerable variants (ground truth from [`rule-verification-matrix.md`](./rule-verification-matrix.md)).  
- **Optional real-world**: DVNA-style or open benchmark; record license and commit hash.

## Metrics (operational definitions)

| Metric | Definition | Conservative reporting |
|--------|------------|-------------------------|
| **Detection success** | Ground-truth vulnerability location flagged by tool or named in AI output within N lines | Report **partial credit** separately if only CWE-level mention |
| **Fix success** | Post-change artifact passes: (a) VibeScan clean for targeted rule **or** (b) scripted behavioral test | Require independent re-scan; AI self-claim insufficient |
| **Rerun consistency** | Same inputs, K independent runs; measure variance in findings / diff stat | Report Cohen’s kappa or simple agreement rate for AI; VibeScan expected **1.0** on static arm |
| **False reassurance rate** | “No issues” / “safe” when ground truth says vuln present | Critical safety metric; report separately from precision |
| **Explicit coverage accounting** | Enumerate rule IDs or CWEs each arm can theoretically detect | VibeScan: rule catalog; AI: extract from prompt + output checklist |
| **Regression protection** | After fix, previously passing tests still pass; new unsafe change fails CI | Measure with **git revert** of fix on a branch |

## Bias controls

- Blind scoring where feasible: scorer does not see arm label.  
- Fixed time budget per arm per task.  
- Record total tokens / cost for AI arm.

## Expected outcomes (hypotheses, not guarantees)

- VibeScan: higher **rerun consistency** on static rules; bounded **false reassurance** if policy + tests are configured.  
- AI: potentially higher recall on **novel** patterns not encoded as rules; higher variance and **false reassurance** risk without independent verification.

## Deliverables

- Frozen run manifests (see [`reproducible-runs.md`](./reproducible-runs.md)).  
- Adjudication sheet per finding (see [`adjudication-template.md`](./adjudication-template.md)).  
- Short discussion of **ethical** use of adversarial prompts (test systems only).
