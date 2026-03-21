# Ground-truth adjudication template (VibeScan evaluation)

**Purpose:** Manually label tool findings for precision/recall, confusion analysis, and qualitative discussion. One row = one reported finding (or one merged location if tools duplicate).

**Study / run ID:** _________________________  
**Benchmark:** _________________________  
**Corpus commit:** _________________________  
**Adjudication date:** _________________________  

## Instructions

1. Import findings from machine-readable outputs (VibeScan JSON, ESLint JSON, Bearer JSON, etc.).
2. Normalize **file paths** relative to the benchmark root.
3. If multiple tools report the same underlying issue, you may keep separate rows (per tool) or add a `cluster_id` column in a spreadsheet copy of this table.

---

## Per-finding adjudication log

| tool | file | line | rule | claimed vulnerability | adjudicated label | rationale | reviewer initials |
|------|------|-----|------|------------------------|-------------------|-----------|---------------------|
| | | | | | | | |

### Suggested `adjudicated_label` values

Use a small closed set for scoring:

- **`tp`** — True positive: real vulnerability or dangerous practice in context.
- **`fp`** — False positive: safe in context, dead code, test-only, or pattern misread.
- **`pp`** — Partial / context-dependent: needs human review; document why.
- **`dupe`** — Duplicate of another finding (reference row or cluster).
- **`out_of_scope`** — Outside benchmark agreement (generated code, excluded path).

### Optional columns (spreadsheet)

| cluster_id | CWE (if known) | OWASP | snippet hash | fix difficulty |
|------------|----------------|-------|--------------|----------------|
| | | | | |

---

## Summary block (after adjudication)

| Metric | Value |
|--------|-------|
| Tool | |
| Total findings adjudicated | |
| TP / FP / PP / Dupe / Out of scope | |
| Notes on systematic FP patterns | |

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Primary reviewer | | |
| Second reader (optional) | | |
