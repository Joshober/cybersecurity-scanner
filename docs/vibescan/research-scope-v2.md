# Research scope v2 (VibeScan)

This document updates the research framing for a direction that **retains** AI- and Node-oriented static rules while **expanding** questions around trust boundaries, route surfaces, and prioritization. Claims stay **conservative**: hypotheses concern observable scanner outputs under defined protocols, not universal security guarantees.

## Primary research question (updated)

How effectively can VibeScan—static analysis with AI-oriented rules, Express route extraction, and conservative middleware/surface heuristics—identify **classes of security-relevant issues** in JavaScript/TypeScript backends **compared with baselines of different scope** (e.g., dependency scanning, generic SAST, optional dynamic tools), under **transparent inclusion criteria and manual adjudication**?

## Secondary questions (updated)

1. Which **components** (pattern rules, taint-style flows, registry/slopsquat checks, route graph, middleware audits) contribute most to **adjudicated** true positives on seeded and real-style benchmarks?
2. To what extent do **route- and middleware-based heuristics** (e.g., missing recognizable auth on admin-like paths, missing rate-limit hints on sensitive paths) add **incremental** signal beyond payload-only rules, and at what **false-positive cost**?
3. How should **future context-aware prioritization** (build path, dependency class, route sensitivity) be evaluated so results remain **reproducible** and **honestly bounded**?

## Testable hypotheses (academically conservative)

### H1 — AI-specific rule coverage

On benchmark suites that include LLM-typical anti-patterns (weak secrets, env fallbacks, slopsquat-style package references), VibeScan’s **documented** AI-oriented and crypto/injection rules will surface a **non-empty** set of adjudicated true positives that **source-only** generic linters may miss, under matched file scope and configuration.

*Boundary:* This is about **relative detection on seeded cases**, not completeness or exploitability.

### H2 — Endpoint and trust-boundary-oriented static signal

On Express-style applications where routes are **statically extractable** (literal paths, identifiable middleware identifiers), project-level middleware audits (e.g., admin-path auth, sensitive-path rate-limit hints, webhook verification heuristics) will produce findings that are **measurable** in precision/recall **only after** adjudication; we hypothesize **useful recall on seeded gaps** with **non-zero** false positives requiring reporting.

*Boundary:* Static analysis **cannot** prove authentication or authorization at runtime; hypotheses refer to **heuristic agreement** with benchmark ground truth.

### H3 — Context-aware prioritization (evaluation target)

If prioritization features are added (e.g., weighting by route sensitivity or production dependency paths), **ranked** finding lists will better align with adjudicator severity ratings than **unweighted** lists on the same benchmark, under a defined ranking metric (e.g., NDCG or simple top-k utility)—or the hypothesis may be **falsified** on those benchmarks.

*Boundary:* Until implemented, this remains a **planned** evaluation; no current claim of improved ranking.

## Claim boundaries

- Hypotheses concern **detection and ranking behavior on defined benchmarks**, not legal or compliance outcomes.
- Comparisons to Burp, ZAP, nuclei, sqlmap, or Snyk require **explicit scope alignment**; many categories are **not directly comparable** without hybrid protocols (see `related-tools-positioning.md`, `snyk-baseline-plan.md`, `dast-comparison-plan.md`).
- Registry-dependent hypotheses require network and configuration conditions documented in the run manifest.
