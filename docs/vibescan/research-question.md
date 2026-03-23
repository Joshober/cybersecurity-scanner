# VibeScan Research Questions and Hypotheses

This file defines the research framing for VibeScan using capabilities documented in `README.md`, `docs/REPO-HANDOFF.md`, `docs/vibescan/rule-coverage-audit.md`, and `results/dvna-evaluation.md`.

## Primary research question

How effectively can a static analyzer tailored to LLM-generated JavaScript/TypeScript backends (**VibeScan**) detect **trust-boundary and API-surface** issues—not only injection payloads—alongside crypto and configuration failures, compared with commonly used SAST baselines, under a transparent manual adjudication protocol?

## Secondary research questions

1. Which VibeScan components contribute most to useful signal in practice: AST pattern rules, taint-flow checks, **Express route graph + middleware heuristics**, **OpenAPI-vs-code drift (API inventory)**, and optional project-level registry checks?
2. On benchmarked Node/Express applications, how does VibeScan’s coverage of **OWASP API Security (2023)**-relevant themes (e.g. inventory, missing auth on object-scoped routes, spec drift) compare to baselines such as **eslint-plugin-security** and **Snyk Code** that do not perform OpenAPI reconciliation?
3. How does category-level coverage (crypto, injection, middleware, **api_inventory**) compare to baseline tools with different scope assumptions?

## Testable hypotheses

1. **H1 (coverage on first-party app code):** On DVNA-style benchmark material, VibeScan will produce more manually adjudicated first-party true positives than `eslint-plugin-security` under a matched file-scope protocol for overlapping categories (injection, crypto-adjacent patterns).
2. **H2 (project-level dependency signal):** When `--check-registry` is enabled and a benchmark includes non-existent package references, VibeScan will surface project-level slopsquat-style findings (`SLOP-001`) that source-code-only linters do not report.
3. **H3 (LLM-oriented secret defaults):** On seeded benchmark cases containing weak literal secrets and weak `process.env || <literal>` fallback patterns, VibeScan rules (`crypto.secrets.hardcoded`, `SEC-004`, `crypto.jwt.weak-secret-literal`) will identify those cases at higher recall than generic baseline rulesets focused primarily on syntax-level anti-patterns.
4. **H4 (API inventory / spec drift):** On seeded apps with an OpenAPI file paired with Express routes (`tests/fixtures/openapi-drift/`), VibeScan will emit **API-INV-001** / **API-INV-002** findings that **eslint-plugin-security** and **Snyk Code** do not produce in the same form, because those tools do not statically diff **documented vs implemented** HTTP operations by default.

## Claim boundaries

- These hypotheses concern **detection behavior**, not exploitability proof. **BOLA/IDOR** claims remain **heuristic**: static rules flag missing auth plumbing and inventory gaps; cross-user object access requires tests or runtime evidence.
- Baseline comparisons remain **incomplete** until all chosen tools are run under the same environment and inclusion/exclusion criteria.
- Registry-check hypotheses apply only when `--check-registry` is enabled and network conditions permit npm registry resolution.
- OpenAPI drift analysis applies when a valid **OpenAPI 3.x** or **Swagger 2.0** spec is supplied or discovered; Express route extraction remains **framework-limited** for the code side of the diff.

## OWASP mapping (reference)

- **OWASP Top 10 (2021):** crypto (`A02`), injection (`A03`), access control (`A01`) — via middleware/auth heuristics, not full authorization proofs.
- **OWASP API Security Top 10 (2023):** **API3** Broken Object Property Level Authorization (heuristic prep: `AUTH-005`, `API-POSTURE-001`), **API5** Broken Function Level Authorization (partial overlap with missing auth on routes), **API9** Improper Inventory Management (`API-INV-*`, `routeInventory`).
