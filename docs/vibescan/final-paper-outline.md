# VibeScan Final Paper Outline

## 1. Introduction

- Problem context: LLM-assisted backend development accelerates delivery but introduces recurring security failure modes.
- Motivation signal: literature on low SecPass / residual exploitability / hallucinated dependencies.
- Project framing: VibeScan as a static-analysis layer for JS/TS Node/Express workflows.
- Contributions summary (implementation-grounded, not overclaimed).
- High-level result statement: preliminary DVNA evidence, with explicit incompleteness.

## 2. Background and Related Work

- AI-generated code security studies (SusVibes, BaxBench, related post-2024 studies).
- Traditional static analysis and linter baselines for JavaScript security.
- Dependency/advisory tooling (npm audit) and differences in scope.
- Prior slopsquatting/hallucinated package literature and supply-chain relevance.
- Positioning VibeScan relative to baseline tools and known gaps.

## 3. System Design

- Architecture overview from `docs/REPO-HANDOFF.md`:
  - AST rule engine
  - taint engine (sources/sinks/sanitizers)
  - route graph + middleware audit
  - optional registry check (`SLOP-001`)
  - optional generated test stubs
- Rule taxonomy and representative implemented rule IDs.
- CLI and integration pathways (CLI and ESLint plugin).
- Intended use boundaries and non-goals.

## 4. Methodology

- Research questions and hypotheses (from `../research-strengthening/research-question.md`).
- Benchmark selection and scope policy:
  - DVNA first-party focus
  - seeded benchmark suite design
- Baseline selection rationale.
- Reproducibility protocol:
  - versions, commits, commands, artifact storage.
- Manual adjudication procedure and definitions:
  - TP, FP, FN, unresolved.

## 5. Evaluation

- DVNA preliminary results:
  - current measured values
  - caveats (Bearer pending, scope mismatch).
- Seeded benchmark results (when completed):
  - per-case table
  - per-rule/category coverage.
- Comparative metrics:
  - TP/FP/FN, precision, recall (scope-aligned only).
- Qualitative observations:
  - where VibeScan produced unique signals.

## 6. Limitations

- Incomplete baseline execution (if Bearer still pending).
- Benchmark representativeness limitations (intentional vulnerabilities vs production).
- Manual adjudication subjectivity and reviewer variance.
- Scope mismatch across tools (line-level vs dependency advisory).
- Potential network/environment variance for registry checks.

## 7. Future Work

- Complete baseline parity and automation in CI.
- Expand seeded benchmark suite and public benchmark packaging.
- Improve reporting granularity and false-positive analysis.
- Broaden framework coverage beyond Express-centric patterns.
- Evaluate generated-test utility empirically.

## 8. Conclusion

- Restate conservative contribution: implemented scanner with preliminary comparative evidence.
- Emphasize practical value of downstream scanning with explicit evidence boundaries.
- Close with what is already validated vs what remains to be validated.

