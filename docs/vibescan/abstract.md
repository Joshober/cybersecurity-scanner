# VibeScan — Revised conservative abstract

## Prior literature motivation

Recent literature suggests that security quality in LLM-generated backend code remains inconsistent even when systems appear functionally correct. SusVibes reports low security pass rates under prompt-based hardening (arXiv:2512.03262), BaxBench reports substantial residual exploitability in passing backends (arXiv:2502.11844), and other reports highlight recurring weak-secret and package-selection risks, including hallucinated npm package references (Spracklen et al., USENIX Security 2025; Invicti 2025). These findings motivate toolchain-level safeguards rather than prompt-only interventions.

## Our implemented contribution

VibeScan is a static JavaScript/TypeScript scanner focused on Node/Express-style applications. In the current repository, it implements: (1) AST rule-based detection for crypto and injection patterns, (2) taint-style source-to-sink checks, (3) route/middleware analysis support, (4) optional project-level npm registry checks for slopsquat-style dependency signals (`SLOP-001`), and (5) optional generated security test stubs. These are implementation claims, not all are fully benchmark-validated yet.

## Our measured findings (current evidence)

Our current evaluation package includes a preliminary DVNA benchmark (`results/dvna-evaluation.md`). Under a first-party-code manual adjudication protocol, VibeScan produced more counted true-positive signals than `eslint-plugin-security` in this setup (8 vs 1 across listed DVNA themes). However, this result is explicitly early-stage: Bearer baseline execution is still pending in the same environment, tool scopes differ (line-level static findings vs dependency advisories), and full TP/FP/FN precision/recall reporting remains future work.

## Future work

To support publication-strength claims, we plan to finalize a reproducible multi-baseline benchmark package with frozen versions, complete Bearer runs, seeded Node/Express cases, and adjudicated TP/FP/FN metrics. The project’s central design claim remains cautious: downstream scanning appears promising as a practical safety layer for LLM-assisted development, but stronger comparative evidence is still being assembled.

---

### Citation anchors used in this abstract

- Spracklen et al., USENIX Security 2025 (hallucinated npm suggestions)  
- SusVibes, arXiv:2512.03262  
- BaxBench, arXiv:2502.11844  
- Invicti, 2025 (`supersecretkey` prevalence)
