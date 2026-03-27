# VibeScan - revised abstract (current evidence)

## Motivation

Recent work on AI-assisted software development shows that functionally correct code can still ship with exploitable security weaknesses. SusVibes and BaxBench report low security pass rates and residual exploitability in generated backend stacks, while other studies and industry datasets highlight weak default secrets and hallucinated package names. These trends motivate a practical, downstream scanner layer rather than relying on prompt hardening alone.

## System contribution

VibeScan is a static JavaScript/TypeScript scanner for Node/Express-style projects. The current implementation combines AST pattern rules (crypto and injection families), taint-style source-to-sink checks, route and middleware heuristics, optional registry verification for slopsquat-style package signals (`SLOP-001`), and optional proof-oriented test scaffolding. Findings map to OWASP/CWE-aligned categories and can be exported in benchmark-friendly JSON/SARIF formats.

## Current measured evidence

Our DVNA snapshot now includes captured and adjudicated outputs for VibeScan, eslint-plugin-security, Bearer, and Snyk Code, with frozen run artifacts under `benchmarks/results/` and narrative/adjudication under `results/`. Under the current first-party adjudication protocol (`results/dvna-adjudication.md`), provisional recall is: VibeScan `4/11` (`36.4%`), Bearer `8/11` (`72.7%`), Snyk Code `7/11` (`63.6%`), and eslint-plugin-security `1/11` (`9.1%`). Provisional precision currently reported is VibeScan `80.0%` and Bearer `90.0%` (out-of-scope excluded).

## Interpretation and next steps

These results are still scope-limited and should not be treated as universal scanner rankings. Tool coverage differs (line-level app findings vs dependency or broader policy checks), and additional seeded and multi-target evaluations remain necessary. The practical claim is conservative: downstream static analysis provides measurable safety signal for AI-assisted workflows, but publication-grade comparative conclusions require continued scope normalization and replication.

---

### Citation anchors

- Spracklen et al., USENIX Security 2025 (hallucinated npm package suggestions)
- SusVibes, arXiv:2512.03262
- BaxBench, arXiv:2502.11844
- Invicti, 2025 (`supersecretkey` prevalence)
