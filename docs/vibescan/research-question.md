# VibeScan Research Questions and Hypotheses

This file defines the research framing for VibeScan using only currently implemented capabilities documented in `README.md`, `docs/REPO-HANDOFF.md`, and `results/dvna-evaluation.md`.

## Primary research question

How effectively can a static scanner tailored to LLM-generated JavaScript/TypeScript backends (VibeScan) detect security-relevant findings in Node/Express code compared with commonly used baselines, under a transparent manual adjudication protocol?

## Secondary research questions

1. Which currently implemented VibeScan components contribute most to detection coverage in practice: AST pattern rules, taint-flow checks, and optional project-level registry checks?
2. On benchmarked Node/Express applications, how does VibeScan's category-level coverage (crypto, injection, and selected middleware/configuration patterns) compare to baseline tools with different scope assumptions?

## Testable hypotheses

1. **H1 (coverage on first-party app code):** On DVNA-style benchmark material, VibeScan will produce more manually adjudicated first-party true positives than `eslint-plugin-security` under a matched file-scope protocol.
2. **H2 (project-level dependency signal):** When `--check-registry` is enabled and a benchmark includes non-existent package references, VibeScan will surface project-level slopsquat-style findings (`SLOP-001`) that source-code-only linters do not report.
3. **H3 (LLM-oriented secret defaults):** On seeded benchmark cases containing weak literal secrets and weak `process.env || <literal>` fallback patterns, VibeScan rules (`crypto.secrets.hardcoded`, `SEC-004`, `crypto.jwt.weak-secret-literal`) will identify those cases at higher recall than generic baseline rulesets focused primarily on syntax-level anti-patterns.

## Claim boundaries

- These hypotheses concern **detection behavior**, not exploitability proof.
- Baseline comparisons remain **incomplete** until all chosen tools are run under the same environment and inclusion/exclusion criteria.
- Registry-check hypotheses apply only when `--check-registry` is enabled and network conditions permit npm registry resolution.

