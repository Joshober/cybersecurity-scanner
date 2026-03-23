# Conference Demo Examples Recommendation

## Objective
Choose a small set of “conference-ready” examples that:

- Show VibeScan’s coverage across multiple rule families (crypto/injection/authz/webhook).
- Have deterministic, rule-aligned ground truth for automated scan assertions.
- Fit into a short live demo window without complex setup.

## Recommendation (final set: 5 examples)

1. **DVNA (primary benchmark)**: use it as the credibility anchor and to set context for “real code, real findings.”
2. **Seeded SQL injection**: demonstrate `injection.sql.string-concat` with before/after parameterization.
3. **Seeded path traversal**: demonstrate `injection.path-traversal` with before/after safe path resolution / allowlist.
4. **Seeded missing auth on admin route**: demonstrate `AUTH-004` by toggling route-level middleware presence.
5. **Seeded webhook signature verification omission**: demonstrate `WEBHOOK-001` by comparing handler logic that lacks verification tokens vs handler logic that verifies before trusting `req.body`.

This set satisfies the “rule-aligned showcase” requirement: each example is engineered to trigger one dominant rule ID in the vulnerable route and not trigger it in the fixed route.

## Why not include the secondary vulnerable Node repo in the main conference set
The secondary repo is valuable for robustness, but it tends to add:

- build/setup uncertainty,
- scope ambiguity (what to exclude/include),
- and longer scan runtime for live stage use.

Instead, treat it as:

- an extended benchmark option (optional appendix), or
- a backup example if DVNA or a seeded app has an unexpected environment issue during the final run.

## What to say on stage (short rationale)
The demo set combines:

- DVNA for external validity,
- seeded local apps for deterministic rule alignment,
- and paired vulnerable/fixed routes so the audience sees both detection and remediation.

