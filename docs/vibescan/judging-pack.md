# VibeScan judging pack (framing + sources + gaps)

Internal narrative for rehearsals—not for the poster verbatim. Use this when a judge asks “what’s the research question?”, “where did that number come from?”, or pushes on rigor/citation tiering.

## The five questions judges are asking

| Question | Where VibeScan should answer it |
|----------|----------------------------------|
| What is the research question? | Poster title block + abstract first sentence. |
| What is new here? | One novelty sentence + contribution bullets (not a feature list alone). |
| How did you test it? | Dataset (DVNA + seeded), ground truth (manual labels), procedure (same machine/commands). |
| Why trust the numbers? | Adjudication method + keep “theirs” vs “ours” separate. |
| Compared to what? | Baseline table: at minimum eslint-plugin-security; if a baseline isn’t run, label it N/A. |

## Core research questions (use verbatim or tighten)

**Primary**  
Can a static scanner tailored to AI-assisted Node.js / Express workflows detect risky patterns—including dependency and default-configuration failures—that general-purpose tools or shallow review commonly miss?

**Secondary (optional)**  
Are failure modes such as nonexistent package suggestions, weak or literal secrets, and unsafe defaults common enough in generated-style code to justify specialized checks beyond generic linting and CVE-only scans?

## Novelty (one sentence)

VibeScan targets failure modes that show up disproportionately in AI-assisted and “vibe-coded” workflows—hallucinated or unverified package names, insecure defaults and env fallbacks, predictable secret literals, and Node/Express patterns that look “working” while remaining exploitable—while still mapping findings to OWASP/CWE-style categories.

## Contribution bullets (research-style)

1. Rule set / method: OWASP-aligned crypto + injection rules, taint-style flows, Express route graph, optional registry verification (SLOP-001), optional generated tests.
2. Artifact: prototype (`vibescan` npm package / CLI) with reproducible build and scan commands.
3. Evaluation: labeled comparison on DVNA vs baseline(s); methodology and logs in `results/` (extend with seeded suite).
4. Finding: your headline numbers (e.g. DVNA adjudicated 8 vs 1), not literature figures.

## Safe claims vs risky claims

**Safe**

- We identify a gap in how AI-generated Node stacks are checked in practice.
- We prototype a scanner aimed at that gap and evaluate it on a known vulnerable app vs baseline tools.
- We separate motivation (prior work/industry reports) from our measured detections.

**Risky**

- “Proves all AI code is insecure.”
- “Beats every scanner.”
- “Industry percentages apply to all developers.”

## Headline numbers: yours vs theirs

| Role | Examples |
|------|-----------|
| Theirs (motivation) | hallucinated package rates, SecPass-style figures—cite tier honestly (below). |
| Yours (results) | DVNA adjudicated counts, seeded pass rate, precision/recall if labeled—keep to 2–4 numbers on the poster. |

## Six concrete deliverables (checklist)

| # | Deliverable | Status / pointer |
|---|-------------|------------------|
| A | Benchmark appendix (list samples + labels) | DVNA + seeded; track in adjudication artifacts |
| B | Rule ↔ source matrix | root `README.md` rule table + `docs/vibescan/rule-coverage-audit.md` |
| C | Baseline comparison table | `results/dvna-evaluation.md` + poster; complete or mark N/A |
| D | TP / FP / FN summary | `docs/research-strengthening/metrics-templates.md` |
| E | Reproducibility | `docs/research-strengthening/benchmarking-runbook.md` |
| F | Limitations | poster box + `docs/research-strengthening/methodology.md` threats to validity |

## Source verification (citation tiers)

Judges who care about tiers respect explicit labeling more than a mismatch they discover themselves.

### Tier A — strong for “peer-reviewed / reproducible” answers

| Claim | Say this if pressed |
|--------|---------------------|
| 10.5% SecPass | SusVibes (arXiv preprint). Say “arXiv preprint”, not “peer-reviewed”, unless you have a venue version. |
| 19.7% hallucinated npm-style packages | Spracklen et al., USENIX Security 2025 (peer-reviewed). |
| 43% / 58% repetition of hallucinated names | Same Spracklen et al. paper. |
| ~50% exploitable despite passing checks | BaxBench (arXiv preprint). Label as preprint. |

### Tier B — fine on a poster; label honestly if asked

| Claim | Say this if pressed |
|--------|---------------------|
| 1,182 apps, `supersecretkey` | Invicti (industry empirical study / vendor write-up), not peer-reviewed. |
| 100% SSRF vs 0% CSRF | Tenzai (industry benchmark/vendor report), not conference proceedings. |

## Score band + what to add (practical)

Estimated ~79/100 on a typical CS poster rubric with main risks: incomplete Bearer row, mixed citation tiers, and any broken repo link/QR undermining credibility.

With the public GitHub URL + QR aligned and one focused rehearsal (timing + Q&A), a realistic band is ~87/100.

What to add:

1. One rehearsal with a skeptical listener—drill Tier A vs Tier B wording (five seconds each).
2. Optional research closure: run Bearer on DVNA once (same environment) and fill the table.
3. Repo visibility: QR must resolve to a public repo before print day.

## If a judge pushes on rigor (talking points)

- Literature vs you: prior work motivates the problem; your contribution is the scanner + evaluation against labeled findings/baselines on the same benchmark.
- Sample size: emphasize reproducibility and category coverage; avoid universal prevalence claims.
- arXiv/vendor: label preprints and industry reports explicitly; USENIX Security is peer-reviewed.

