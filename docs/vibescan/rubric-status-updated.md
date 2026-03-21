# CCSC-style rubric — **updated status** (where you are now)

*Aligned with repo state: `results/dvna-evaluation.md`, `results/person-b-handoff.md`, `docs/vibescan/*` poster materials, and pushed `master`.*

---

## 40% — Research Quality  
*Substantial, engaging, high scientific quality?*

### STRONG (unchanged)

- **Four novel contributions** are real and citable: spec-free AST / route-oriented extraction, persistent `.test.js` generation, LLM default-secret corpus (**85** deduped strings in `ALL_SECRETS`; see `person-b-handoff.md`), **SLOP-001** slopsquatting / registry check — positioned as npm-level gaps vs generic linting.
- **Rule inventory** is now concrete: **20** AST pattern rules (+ taint engine + optional registry check + middleware audit) — use this when judges ask “how big is the tool?”
- **Slopsquatting** remains timely: **19.7%** hallucinated npm suggestions (Spracklen et al., USENIX Security 2025) — still a strong hook for CS faculty.

### GAP (revised — was “zero evaluation”)

- You are **no longer at zero**: Person A produced a **DVNA preliminary benchmark** with methodology, OWASP mapping, and **manual true-positive counts** on **first-party** DVNA code only ([`results/dvna-evaluation.md`](../../results/dvna-evaluation.md)).
- **Bearer** is still **not run** in your environment (documented in [`results/bearer-dvna.txt`](../../results/bearer-dvna.txt)) — judges who know Bearer will notice the hole; frame as *incomplete baseline*, not hidden.
- **Poster + abstract** still show **TBD** in the DVNA table in [`vibescan-research-poster.html`](./vibescan-research-poster.html) — deliverables lag the repo; until you sync, live judges may think you have no numbers.

### FIX (revised)

1. **Paste the real comparison into the poster and abstract**  
   - Sound bite (first-party DVNA, TP counts from `dvna-evaluation.md`): **VibeScan 8** theme-aligned TPs across Injection (3), Broken Authentication (2), Sensitive data/crypto (2), Logging (1) vs **eslint-plugin-security 1** (Injection only).  
   - Add one honest sentence: **Bearer TBD** (Docker/Linux repro instructions already in repo); **npm audit** is dependency-scope, not line-level app TPs — don’t conflate.

2. **Optional but powerful before Mar 27**  
   - Run Bearer once (Docker on a lab machine or WSL) and drop **Bearer TPs** into the same table — closes the biggest “incomplete” objection.

3. **Frame explicitly**  
   - Call it **preliminary, adjudicated TPs on DVNA first-party code**; cite **future work** (frozen tool versions, full label set, no vendor noise) — already drafted in `dvna-evaluation.md` § “Preliminary evaluation (for Person B)”.

---

## 30% — Research Implications  
*Impact beyond computing? Lessons learned?*

### STRONG (unchanged + reinforced)

- **Vibe coding** as a cultural problem — still your narrative anchor.
- **Lessons learned** are on the poster (four bullets, citable: SusVibes, BaxBench, Invicti, Spracklen).
- **Real-world impact** panel is **already on the poster**: Enrichlead, Tea App, CVE-2025-48757 with “VibeScan would have flagged …” lines — this addresses the earlier “add a real-world impact section” fix.

### GAP (narrowed)

- Rubric language asks for impact **beyond computing** — you have the *cases*; make sure **one spoken sentence** ties them to **people** (IDs, subscriptions, small businesses, students shipping without security review), not only to CVE IDs.

### FIX (tighten, don’t rebuild)

- In the **60s pitch**, add **one clause**: e.g. *“Those aren’t abstract bugs — they’re real users’ government IDs and billing data.”*  
- Optional: one **subheading** under Real-world impact: *“Why non-CS stakeholders should care”* (single line).

---

## 15% — Presentation Artifacts  
*Poster organized, aesthetic, readable at the board?*

### STRONG (unchanged)

- Dark theme, structure, stat bar — still above typical undergraduate poster bar.

### GAP (partially addressed)

- **Density / 6-foot scan** — you added a **large hook**, **prominent stats**, **larger 01–04**, **QR + URL** — good.  
- Risk remains: **too much body text** for a 2–3 minute board visit; judges may still need to step close.

### FIX (revised)

1. **Sync poster DVNA table** with `results/dvna-evaluation.md` — removes cognitive dissonance (“you said you have numbers but the board says TBD”).
2. **Hierarchy pass** — ensure the **hook + stat bar + four contribution titles** are the **largest** type on the sheet; consider trimming or shortening **Motivation / Approach** if you need whitespace.
3. **Print test** — zoom to ~25–35% on a large monitor or print a draft; anything you can’t read at arm’s length, **enlarge or cut**.

---

## 15% — Live Presentation  
*1–3 min summary + Q&A depth?*

### STRONG (new)

- You have a **memorizable script** and **six Q&A cue cards** in [`pitch-60s.md`](./pitch-60s.md) — including eslint vs npm audit, evaluation, AI-fix critique, FPs, future work, broader impact.

### GAP (unchanged in substance)

- **Highest risk** is still **execution**: without rehearsal, you’ll drift into architecture dumps. Judges decide in **~60 seconds**.

### FIX (unchanged emphasis)

1. **Time the pitch** (55–65 s); **insert the real DVNA one-liner** where the bracket placeholder is.
2. **Rehearse** the five “usual” probes with **numbers in mouth**: 8 vs 1 TPs, 19.7%, 20 rules, 85 secrets, Bearer pending.
3. **Mock session** with a friend playing skeptical faculty.

---

## Quick checklist vs original feedback

| Original gap | Current status |
|--------------|----------------|
| Zero evaluation numbers | **Fixed in repo** (`dvna-evaluation.md`); **not yet on printed poster** if HTML still TBD |
| No real-world impact section | **On poster** |
| No QR / one-liner | **QR + hook + URL** in poster HTML |
| No 60s pitch / Q&A prep | **In `pitch-60s.md`** — needs rehearsal + DVNA line |
| Bearer comparison | **Still open** — document or run |

---

## One-line status for teammates

**Research quality:** Substance is strong; **numbers exist in `results/`** — **surface them on the poster and in the abstract before March 27** and optionally add Bearer. **Implications & artifacts:** Largely in place; **sharpen “beyond computing” in speech** and **reduce density**. **Live:** **Rehearse** with the new TP stats.
