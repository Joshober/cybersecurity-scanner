# Ground-truth adjudication (Seeded golden run)

**Purpose:** Manually label tool findings for precision/recall, confusion analysis, and qualitative discussion.

**Study / run ID:** `2026-03-23_seeded_vibescan_v1.0.0+04e93ca`  
**Benchmark:** `seeded`  
**Corpus commit:** `04e93ca69895834ca565af3516482c5d5771f538`  
**Adjudication date:** 2026-03-23  

## Per-finding adjudication log

| tool | file | line | rule | claimed vulnerability | adjudicated label | rationale | reviewer initials |
|------|------|------|------|------------------------|-------------------|-----------|---------------------|
| vibescan | `crypto/pos-weak-hash.js` | 3 | `crypto.hash.weak` | Avoid weak hash algorithm 'md5' | `tp` | Seeded corpus explicitly expects `crypto.hash.weak`, and the file uses `crypto.createHash("md5")`. |  |
| vibescan | `injection/pos-sql-concat.js` | 1 | `MW-003` | No `helmet()` call detected | `out_of_scope` | This seeded corpus ground truth table does not include middleware header presence signals; `MW-003` is excluded from scoring for this golden run. |  |

## Expected-but-not-found (FN tracking)

Seeded ground truth expects an injection string-concat / taint signal in `injection/pos-sql-concat.js`, but VibeScan emitted no matching injection finding in this run.

| expected rule family | file | FN count |
|---|---|---:|
| injection string-concat / taint signal | `injection/pos-sql-concat.js` | 1 |

## Summary block

| Metric | Value |
|--------|-------|
| Tool | VibeScan |
| Total findings adjudicated | 2 |
| TP / FP / PP / Dupe / Out of scope | `tp=1`, `fp=0`, `pp=0`, `dupe=0`, `out_of_scope=1` |
| Notes on systematic FP patterns | `MW-003` appears as an extra misconfiguration signal in seeded Express snippets; excluded from this seeded corpus scoring definition. |

