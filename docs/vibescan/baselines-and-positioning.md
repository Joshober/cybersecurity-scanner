# Baselines, comparisons, and positioning (VibeScan)

This document consolidates baseline/comparison notes into one place. VibeScan is **static, first-party-code–centric** analysis for Node/JavaScript/TypeScript with optional project checks. It complements (not replaces) dependency intelligence, DAST, or exploit frameworks.

## Positioning vs related tool categories

| Tool / category | What it is good at | What it is not designed for | Where VibeScan complements it |
|-----------------|-------------------|------------------------------|-------------------------------|
| **SAST / VibeScan** | Fast feedback on source before deploy; AI-typical weak patterns; optional route/middleware heuristics in Express | Proving runtime behavior, session logic, or business authz; full multi-language app models | Adds **local** Express route/middleware hints and LLM-oriented rules alongside generic SAST use |
| **Dependency scanning** (e.g., Snyk SCA, npm audit) | Known CVEs, outdated packages, license/policy | First-party logic errors, missing rate limits on your routes, custom webhook verification | VibeScan focuses on **your code** and **how** dependencies are used; use both for different evidence |
| **DAST / traffic tools** (Burp, ZAP) | Live endpoints, auth flows, session handling, misconfig seen over HTTP | Deep reasoning over unexposed code paths without traffic | Static inventory and heuristics **before** runtime testing; DAST **confirms** exposure and behavior |
| **Targeted exploit tools** (nuclei, sqlmap) | High-volume or deep tests against URLs/parameters | Understanding undeployed code or supply chain in the repo | Use static results to narrow what to probe dynamically; keep findings separated by evidence type |
| **Pipeline/runtime correlation platforms** | Unifying signals across build/deploy/runtime | Replacing language-specific AST analysis in the IDE | VibeScan can emit SARIF/JSON for correlation; it is a **source** signal, not a full platform |

Evaluation discipline: comparable slices (e.g., injection-related) may be scored jointly; non-overlapping slices should be reported **separately** rather than forced into a single leaderboard.

## Direction note: why trust boundaries and inventory matter

Payload-only scanning is not enough: authorization mistakes, missing protections on sensitive surfaces (rate limits, webhook verification), and reachability/context often dominate impact. Static payload checks remain valuable, but they do not by themselves describe **who can reach** a handler or whether the deployment context makes a finding actionable.

Static analysis cannot prove runtime authz, but it can flag **inconsistencies and high-risk absences** (e.g., sensitive paths with no recognizable auth middleware in the extracted chain) when scope and limitations are documented.

## Snyk baseline plan (comparison, not competition)

### Role of Snyk in evaluation

Snyk (SCA, and optionally Snyk Code) is a credible baseline for dependency intelligence and some first-party issues when configured. VibeScan should appear **alongside** Snyk, not as a drop-in replacement.

### Comparable categories (with caveats)

| Category | Comparison notes |
|----------|------------------|
| Known vulnerable dependencies | Snyk excels; VibeScan’s `SLOP-001` / registry check targets **non-published** package names—different signal. |
| First-party injection/crypto patterns | May overlap Snyk Code or ESLint-based tools; align file scope and rule mapping before claiming superiority. |
| License/policy | Snyk feature; VibeScan does not target this. |

### Not directly comparable

| Category | Why |
|----------|-----|
| Live exploitability | Snyk does not replace DAST; VibeScan is static. |
| Express middleware gaps | VibeScan-specific heuristics unless Snyk Code has equivalent queries. |
| Webhook signature verification | Heuristic in VibeScan; rarely a direct Snyk category. |

### Honest reporting checklist

1. State configuration for each tool (Snyk: scope, dev vs prod deps, policy).
2. Keep separate tables for dependency findings vs first-party static findings.
3. Avoid merging incompatible counts into a single “total vulnerabilities.”
4. Adjudicate a sampled subset if full manual review is infeasible; disclose the sample design.

## DAST comparison plan (Burp, ZAP, nuclei, sqlmap)

### What each tool tests (summary)

| Tool | Primary lens |
|------|--------------|
| **Burp Suite** | Manual/semi-automated HTTP testing, session handling, extensions |
| **OWASP ZAP** | Automated spider/scan, passive/active rules against running apps |
| **nuclei** | Template-based scanning against known URLs/hostnames |
| **sqlmap** | SQL injection exploitation against parameters/endpoints |

### What VibeScan tests

- Static JS/TS (and optional npm registry) without requiring a running server.
- Express route and middleware-chain heuristics; injection/crypto rules.

### Hybrid evaluation (recommended)

1. Static pass: VibeScan on repository (benchmark scope excludes vendor/minified).
2. Inventory handoff: use `routeInventory` / JSON routes to seed dynamic crawl lists (acknowledging static vs runtime mismatch).
3. Dynamic pass: Burp/ZAP/nuclei against a staged deployment of the same commit.
4. Adjudication: label findings by root cause (config vs code vs dependency) before comparing tools.

### Why DAST is future work, not main scope

- VibeScan’s core contribution is early, local, static signal and research on LLM-generated backends.
- Reproducible DAST environments (auth, data, CI) are high effort; treat as a milestone, not default scope.
- Many static findings (e.g., hardcoded secrets) do not require HTTP traffic to validate existence; others do—report that split clearly.

### sqlmap specifically

Use only on isolated lab targets with permission. Useful to validate specific SQLi hypotheses; not a substitute for static taint reporting or for measuring total project security.

