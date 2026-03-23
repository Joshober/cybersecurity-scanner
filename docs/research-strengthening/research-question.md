# Research questions and hypotheses

Canonical academic framing for VibeScan. Judge-facing phrasing and novelty one-liners also live in [`../vibescan/research-framing.md`](../vibescan/research-framing.md).

## Primary research question

Can **VibeScan**, a static scanner tailored to AI-assisted JavaScript/Node.js development, detect relevant security issues in benchmark applications more effectively than baseline tools while remaining academically honest about scope and limitations?

## Secondary research questions

1. Which vulnerability categories already implemented in VibeScan show the clearest detection advantage over baseline tools such as `eslint-plugin-security` and `npm audit`?
2. Do VibeScan’s AI-oriented checks, such as **SLOP-001** for suspicious npm dependencies and weak-secret / environment-fallback rules, add signal that general-purpose baselines do not emphasize?

## Hypotheses

### H1

On benchmark applications containing known first-party security issues, VibeScan will identify more manually adjudicated true positives than `eslint-plugin-security`.

### H2

For categories already implemented in the repository, especially weak secrets, environment fallbacks, injection patterns, and suspicious dependency checks, VibeScan will provide category coverage not fully matched by dependency-only tooling such as `npm audit`.

### H3

A reproducible benchmark protocol with frozen versions, clear inclusion/exclusion criteria, and manual adjudication will show that VibeScan is a credible **prototype research artifact**, even if the evaluation remains limited in sample size and external validity.

## Scope guardrails

These questions are intentionally narrower than broad claims such as “VibeScan proves AI-generated code is insecure” or “VibeScan outperforms all security tools.” The current repository supports a **prototype scanner** and an **early-stage benchmark**, not universal claims.

## Non-goals (explicit)

- Proving security of real production systems at scale.
- Replacing manual code review or dynamic testing.
- Claiming secure-arch or IDE adapter tooling as the evaluated scientific contribution unless a separate evaluation is added.
