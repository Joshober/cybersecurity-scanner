# Person B — poster handoff (VibeScan)

## DVNA benchmark

- Summary table, TP counts, and **Preliminary Evaluation** paragraph: [`dvna-evaluation.md`](./dvna-evaluation.md)
- Raw tool outputs: `vibescan-dvna.txt`, `eslint-dvna.txt`, `bearer-dvna.txt`, `npm-audit-dvna.txt`

## Secret dictionary (Contribution #3)

| Metric | Value |
|--------|------:|
| Tier 1 strings (`TIER1_SECRETS`) | 28 |
| Tier 2 strings (`TIER2_SECRETS`) | 57 |
| `ALL_SECRETS` (set size; deduped) | 85 |

Entropy filter: `isLikelyRealSecret()` in [`src/attacks/crypto/secretDict.ts`](../src/attacks/crypto/secretDict.ts) (re-exported from `entropy.ts`) — skips literals with Shannon entropy **> 4.5** and length **> 20**, and known cloud/API key shapes (AWS, OpenAI, GitHub PAT, PEM blocks).

## Rule count (static AST rules in registry)

- **Crypto rules:** 9 (`cryptoRules` in `src/attacks/index.ts`)
- **Injection rules:** 11 (`injectionRules` — includes `SSRF-003`, `RULE-SSRF-002`)
- **Optional project finding:** **SLOP-001** (npm registry HEAD) when `--check-registry` is set — not part of per-file AST rules

**Total pattern rules in CLI scan:** 20 AST rules + taint-engine findings + optional slopsquat + middleware audit.

## Novel / research rules (for callouts)

| ID | CWE | Notes |
|----|-----|--------|
| **SEC-004** | 547 | Weak `process.env` `\|\|` literal fallback |
| **SSRF-003** | 918 | `ip.isPublic` / `ip.isPrivate` gating `fetch` / HTTP clients |
| **RULE-SSRF-002** | 918 | axios `baseURL` + user URL bypass class |
| **SLOP-001** | 829 | Registry 404 dependency signal |

Prototype pollution payloads: [`src/attacks/injection/prototypePollution.ts`](../src/attacks/injection/prototypePollution.ts)
