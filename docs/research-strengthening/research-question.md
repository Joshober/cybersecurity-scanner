# Research questions and hypotheses

Canonical academic framing for VibeScan. Judge-facing phrasing and novelty one-liners also live in [`../vibescan/judging-pack.md`](../vibescan/judging-pack.md).

## Primary research question

Can **VibeScan**, a static scanner tailored to AI-assisted JavaScript/Node.js development, detect relevant security issues in benchmark applications more effectively than baseline tools while remaining academically honest about scope and limitations?

## Alternative primary research question (API surface / trust boundaries)

How effectively can a static analyzer tailored to LLM-generated JavaScript/TypeScript backends (**VibeScan**) detect **trust-boundary and API-surface** issues—not only injection payloads—alongside crypto and configuration failures, compared with commonly used SAST baselines, under a transparent manual adjudication protocol?

## Secondary research questions

1. Which vulnerability categories already implemented in VibeScan show the clearest detection advantage over baseline tools such as `eslint-plugin-security` and `npm audit`?
2. Do VibeScan’s AI-oriented checks, such as **SLOP-001** for suspicious npm dependencies and weak-secret / environment-fallback rules, add signal that general-purpose baselines do not emphasize?
3. Which VibeScan components contribute most to useful signal in practice: AST pattern rules, taint-flow checks, **Express route graph + middleware heuristics**, **OpenAPI-vs-code drift (API inventory)**, and optional project-level registry checks?
4. On benchmarked Node/Express applications, how does VibeScan’s coverage of **OWASP API Security (2023)**-relevant themes (e.g. inventory, missing auth on object-scoped routes, spec drift) compare to baselines such as **eslint-plugin-security** and **Snyk Code** that do not perform OpenAPI reconciliation?
5. How does category-level coverage (crypto, injection, middleware, **api_inventory**) compare to baseline tools with different scope assumptions?

## Hypotheses

### H1

On benchmark applications containing known first-party security issues, VibeScan will identify more manually adjudicated true positives than `eslint-plugin-security`.

### H2

For categories already implemented in the repository, especially weak secrets, environment fallbacks, injection patterns, and suspicious dependency checks, VibeScan will provide category coverage not fully matched by dependency-only tooling such as `npm audit`.

### H3

A reproducible benchmark protocol with frozen versions, clear inclusion/exclusion criteria, and manual adjudication will show that VibeScan is a credible **prototype research artifact**, even if the evaluation remains limited in sample size and external validity.

### H4

On seeded apps with an OpenAPI file paired with Express routes (`tests/fixtures/openapi-drift/`), VibeScan will emit **API-INV-001** / **API-INV-002** findings that **eslint-plugin-security** and baseline tools that do not reconcile OpenAPI-to-code will not produce in the same form, because those tools do not statically diff **documented vs implemented** HTTP operations by default.

## Scope guardrails

These questions are intentionally narrower than broad claims such as “VibeScan proves AI-generated code is insecure” or “VibeScan outperforms all security tools.” The current repository supports a **prototype scanner** and an **early-stage benchmark**, not universal claims.

## Claim boundaries

- These hypotheses concern **detection behavior**, not exploitability proof. **BOLA/IDOR** claims remain **heuristic**: static rules flag missing auth plumbing and inventory gaps; cross-user object access requires tests or runtime evidence.
- Baseline comparisons remain **incomplete** until all chosen tools are run under the same environment and inclusion/exclusion criteria.
- Registry-check hypotheses apply only when `--check-registry` is enabled and network conditions permit npm registry resolution.
- OpenAPI drift analysis applies when a valid **OpenAPI 3.x** or **Swagger 2.0** spec is supplied or discovered; Express route extraction remains **framework-limited** for the code side of the diff.

## Non-goals (explicit)

- Proving security of real production systems at scale.
- Replacing manual code review or dynamic testing.
- Claiming secure-arch or IDE adapter tooling as the evaluated scientific contribution unless a separate evaluation is added.

## OWASP mapping (reference)

- **OWASP Top 10 (2021):** crypto (`A02`), injection (`A03`), access control (`A01`) — via middleware/auth heuristics, not full authorization proofs.
- **OWASP API Security Top 10 (2023):** **API3** Broken Object Property Level Authorization (heuristic prep: `AUTH-005`, `API-POSTURE-001`), **API5** Broken Function Level Authorization (partial overlap with missing auth on routes), **API9** Improper Inventory Management (`API-INV-*`, `routeInventory`).
