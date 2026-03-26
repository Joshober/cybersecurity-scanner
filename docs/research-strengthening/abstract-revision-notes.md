# Abstract revision notes

Working draft: [`../vibescan/abstract.md`](../vibescan/abstract.md).  
Framing reference: [`../vibescan/judging-pack.md`](../vibescan/judging-pack.md).

## Cleanup checklist

- [ ] **Lead with RQ + evaluation** in the first sentence or two (form word limit may require shortening lit review).
- [ ] **Separate** motivation statistics (Spracklen, SusVibes, BaxBench, etc.) from **your** DVNA adjudicated numbers—one paragraph boundary minimum.
- [ ] **Bearer:** either same-environment result, explicit “not run,” or remove the row from any comparison table referenced in the abstract.
- [ ] **Cite tiers:** mark industry vs peer-reviewed consistently with [`../vibescan/judging-pack.md`](../vibescan/judging-pack.md).
- [ ] **Contribution list:** align bullet wording with [`contribution-audit.md`](./contribution-audit.md)—drop or soften features not in Tier A unless you evaluate them.
- [ ] **secure-arch / adapters:** omit from abstract unless the submission is explicitly about that product; if mentioned, one clause as **future / orthogonal** tooling.
- [ ] **Reproducibility:** one clause pointing to `results/` or `benchmarks/results/` + manifest (after you migrate).
- [ ] **Limitations:** one sentence (static, heuristic, Node-focused, small *n*).

## Suggested paragraph order (research-led)

1. **RQ** + one-line method (static scanner for AI-assisted Node stacks).
2. **Evaluation** — DVNA + adjudication + baseline tool(s); where raw artifacts live.
3. **Headline result** — adjudicated TP comparison (if frozen).
4. **Motivation** — 1–2 citations, properly tiered.
5. **Takeaway** — pipeline / shift-left lesson without overclaiming.

## Word-count discipline

After edits, re-count against the web form limit. Prefer cutting duplicate adjectives and secondary citations over dropping evaluation or reproducibility clauses.
