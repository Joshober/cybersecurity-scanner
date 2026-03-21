# VibeScan — judge prep (score, sources, gaps)

Internal narrative for rehearsals—not for the poster verbatim. Use the **Source verification** section if a judge asks “where did that number come from?”

---

## Score breakdown

**Estimated ~79/100** on a typical CS poster rubric (research quality + delivery + visuals) with the main risks being: incomplete Bearer row, mixed citation tiers, and any **broken repo link / QR** undermining the slopsquat story.

**With the public GitHub URL + QR aligned to the real repo** (done in this repo: `github.com/Joshober/cybersecurity-scanner` + `qr-github.svg`) **and one focused rehearsal** (timing + Q&A), a realistic band is **~87/100**—credibility and oral defense jump more than the rubric math suggests.

Why the URL matters: hallucinated package names are not theoretical—**squatting on names developers might install** is a concrete supply-chain threat. A QR that 404s or points at a placeholder reads as “we don’t verify our own metadata,” which is the opposite of the product story.

---

## Source verification

### Tier A — strong for “peer-reviewed / reproducible” answers

| Claim | Say this if pressed |
|--------|---------------------|
| **10.5% SecPass** | **SusVibes** (arXiv:2512.03262)—the **10.5%** figure is **stated in the paper** for their setup; arXiv is a **preprint server** (not a peer-review venue). If a later conference or journal version exists, prefer that citation; with picky judges, say **“arXiv preprint.”** |
| **19.7% hallucinated npm-style packages** | **Spracklen et al., USENIX Security 2025**—peer-reviewed venue; methodology reinforced by the public repo **github.com/Spracks/PackageHallucination** (large-scale samples across many models). |
| **43% / 58% repetition of hallucinated names** | Same Spracklen et al. paper (e.g. repeated hallucinations across queries)—use for “not one-off noise; models repeat bad suggestions.” |
| **~50% exploitable despite passing checks** | **BaxBench** (arXiv:2502.11844)—preprint; same honesty: **arXiv**, not “published at \_\_\_.” |

### Tier B — fine on a poster; label honestly if asked

| Claim | Say this if pressed |
|--------|---------------------|
| **1,182 apps, `supersecretkey`** | **Invicti (2025)—industry empirical study / vendor research write-up**, not a peer-reviewed paper. Legitimate for motivation; don’t imply USENIX-style review. |
| **100% SSRF vs 0% CSRF** | **Tenzai (Jan 2026)—industry benchmark / vendor blog-line report**, not conference proceedings. Good for “coverage is uneven”; avoid “peer-reviewed study.” |

Judges who care about tiers **respect explicit labeling** more than finding the mismatch themselves.

---

## What to add

1. **Oral defense:** One rehearsal with a skeptical listener—drill Tier A vs Tier B wording for Invicti and Tenzai (five seconds each).
2. **Optional research closure:** Bearer on DVNA → fill the poster table; biggest remaining “incomplete baseline” objection.
3. **Repo visibility:** QR must resolve to a **public** repo before print day (settings task for the owner).
4. **If a judge asks “is arXiv peer-reviewed?”** Answer: **No—preprint**; USENIX Security **is** peer-reviewed (Spracklen); Invicti/Tenzai are **industry reports**—still useful for motivation and context.

---

## Research upgrade (score with judges, not “strategy”)

The rubric bump from **~79 → ~87** is mostly **credibility + defense**. The next bump is **framing**: judges should hear a **research question**, **your** measured outcomes, and **baselines + limitations**—not only motivation stats from SusVibes/BaxBench/etc.

- **Canonical doc:** [`research-framing.md`](research-framing.md) — RQ, novelty one-liner, safe/risky claims, six deliverables, benchmark columns, rigor Q&A.
- **Poster / abstract:** Lead with **question + method + your numbers**; keep literature as **support**, not the headline. Incomplete Bearer row → **finish** or **remove / mark N/A**.
- **Headline stats:** Reserve the poster for **2–4 project-owned** results (e.g. DVNA adjudicated 8 vs 1); external percentages belong in **Problem** or **Related work**, clearly labeled.
