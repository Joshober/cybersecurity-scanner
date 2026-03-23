# Snyk baseline plan (comparison, not competition)

## Role of Snyk in evaluation

Snyk (SCA, and optionally Snyk Code) is a **credible baseline** for **dependency vulnerability intelligence** and some **first-party** issues when configured. VibeScan should appear **alongside** Snyk, not as a drop-in replacement.

## Comparable categories (with caveats)

| Category | Comparison notes |
|----------|------------------|
| Known vulnerable dependencies | Snyk excels; VibeScan’s `SLOP-001` / registry check addresses **non-published** package names—different signal. |
| First-party injection/crypto patterns | May overlap Snyk Code or ESLint-based tools; align file scope and rule mapping before claiming superiority. |
| License / policy | Snyk feature; VibeScan does not target this. |

## Not directly comparable

| Category | Why |
|----------|-----|
| Live exploitability | Snyk does not replace DAST; VibeScan is static. |
| Express middleware gaps | VibeScan-specific heuristics unless Snyk Code has equivalent queries. |
| Webhook signature verification | Heuristic in VibeScan; rarely a direct Snyk rule category. |

## Honest reporting

1. **State configuration** for each tool (Snyk: monitor scope, dev vs prod deps, policy).
2. **Separate tables** for dependency findings vs first-party static findings.
3. **Avoid** merging incompatible counts into a single “total vulnerabilities.”
4. **Adjudicate** a sampled subset if full manual review is infeasible; disclose sample design.

## Intended use in papers/posters

Position Snyk as **industry-standard dependency signal**; position VibeScan as **LLM- and Express-surface–oriented static complement** with transparent limitations.
