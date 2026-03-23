# VibeScan — research framing (for judges, not “strategy”)

Use this to shift the story from **“we built a scanner + cited scary stats”** to **“we posed a question, built a method, and evaluated it with reproducible evidence.”**  
Motivation numbers from SusVibes, Spracklen, BaxBench, etc. **support the problem**; they are **not** your primary results.

---

## The five questions judges are asking

| Question | Where VibeScan should answer it |
|----------|----------------------------------|
| **What is the research question?** | Poster title block + abstract **first** sentence (see below). |
| **What is new here?** | One **novelty sentence** + contribution bullets (not a feature list alone). |
| **How did you test it?** | **Dataset** (DVNA + any AI-generated benchmark), **ground truth** (manual labels), **procedure** (same machine, same commands—`results/`). |
| **Why trust the numbers?** | Adjudication method in `results/dvna-evaluation.md`; separate **prior work** from **your** TP/FP/FN counts. |
| **Compared to what?** | Baseline table: at minimum eslint-plugin-security; **remove Bearer row** or label **“not run—N/A”** so the table is honest. |

---

## Core research questions (use verbatim or tighten)

**Primary**  
*Can a static scanner tailored to AI-assisted Node.js / Express workflows detect risky patterns—including dependency and default-configuration failures—that general-purpose tools or shallow review commonly miss?*

**Secondary (optional)**  
*Are failure modes such as nonexistent package suggestions, weak or literal secrets, and unsafe defaults common enough in generated-style code to justify specialized checks beyond generic linting and CVE-only scans?*

---

## Novelty (one sentence)

**VibeScan targets failure modes that show up disproportionately in AI-assisted and “vibe-coded” workflows—hallucinated or unverified package names, insecure defaults and env fallbacks, predictable secret literals, and Node/Express patterns that look “working” while remaining exploitable—while still mapping findings to OWASP/CWE-style categories.**

Avoid sounding like: “another static analyzer.” Sound like: **deliberate threat model + evaluation**.

---

## Contribution bullets (research-style)

1. **Rule set / method** — OWASP-aligned crypto + injection rules, taint-style flows, Express route graph, optional registry verification (SLOP-001), optional generated tests.  
2. **Artifact** — Open prototype (`vibescan` npm package / `vibescan` CLI) with reproducible build and scan commands.  
3. **Evaluation** — Labeled comparison on **DVNA** vs baseline(s); methodology and logs in `results/` (extend with a **small labeled AI-generated benchmark** if time).  
4. **Finding** — Your **headline numbers** (e.g. 8 vs 1 on adjudicated DVNA themes)—not the 10.5% / 19.7% literature figures.

---

## Safe claims vs risky claims

**Safe**  
- We identify a **gap** in how AI-generated Node stacks are checked in practice.  
- We **prototype** a scanner aimed at that gap and **evaluate** it on a known vulnerable app and baseline tool(s).  
- We **separate** motivation (prior + industry reports) from **our** measured detections.

**Risky**  
- “Proves all AI code is insecure.”  
- “Beats every scanner.”  
- “Industry percentages apply to all developers.”

---

## Headline numbers: yours vs theirs

| Role | Examples |
|------|-----------|
| **Theirs (motivation)** | 19.7% hallucinated packages (Spracklen), 10.5% SecPass (SusVibes), BaxBench/Tenzai/Invicti—**cite tier honestly** (see `judge-prep-score-and-sources.md`). |
| **Yours (results)** | DVNA adjudicated counts, per-category hits, seeded test pass rate, precision/recall **if** you label a benchmark—**2–4 numbers on the poster**, not a wall of external stats. |

---

## Six concrete deliverables (checklist)

| # | Deliverable | Status / pointer |
|---|-------------|------------------|
| A | **Benchmark appendix** — list samples + labels | Start from DVNA + add rows in a spreadsheet; optional `docs/vibescan/benchmark-appendix.md` |
| B | **Rule ↔ source matrix** — rule ID, CWE/OWASP, rationale, example | Extend `README.md` table + one line per rule |
| C | **Baseline comparison table** | `results/dvna-evaluation.md` + poster; **complete or drop** Bearer |
| D | **TP / FP / FN** (by category if possible) | Add a small confusion summary once labels exist |
| E | **Reproducibility** — repo, Node version, commands | `README.md` + `results/` raw logs |
| F | **Limitations** — static only, Node-focused, heuristic rules, small *n* | Poster box; increases trust |

---

## Benchmark spreadsheet (minimal columns)

Use even for 15–20 samples:

`sample_id` · `app_type` · `source` (e.g. DVNA / generated prompt) · `vuln_type` · `severity` · `ground_truth` (Y/N) · `vibescan` (TP/FP/FN) · `baseline_eslint` · `notes`

---

## If a judge pushes on rigor

- **Literature vs you:** “Prior work **motivates** the problem; our **contribution** is the scanner design plus **evaluation** against labeled findings and baseline tools on the same benchmark.”  
- **Sample size:** “This is an **initial** benchmark; we emphasize **reproducibility** and **category coverage**, not universal prevalence in industry.”  
- **arXiv / vendor:** “We label **preprints** and **industry reports** explicitly; **USENIX Security 2025** (Spracklen) is peer-reviewed for the hallucination rate.”

---

## Abstract / pitch ordering (quick fix)

1. **One line:** research question or thesis.  
2. **One line:** why existing tools + workflows leave a gap (can cite **one** strong stat).  
3. **Method + evaluation** (DVNA, baselines, where logs live).  
4. **Your numbers.**  
5. **Limitations** (one clause).

Full paste-up variants: see **`abstract.md`** (RQ-led optional block) and **`pitch-60s.md`** (trim lit; lead with question + your result).
