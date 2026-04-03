# CCSC poster remake — research strategy and execution plan

This document captures a **scoped, evidence-first** plan to strengthen the VibeScan poster for CCSC’s top categories: move from “interesting tool + honest limitations” to a clear **mechanism + measured outcome** story. It aligns with [`PROJECT-OVERVIEW.md`](../../PROJECT-OVERVIEW.md) and existing DVNA materials under [`results/`](../../results/).

**Related assets:** benchmark schema [`vibescan-benchmark-output.schema.json`](vibescan-benchmark-output.schema.json), poster HTML [`vibescan-research-poster.html`](vibescan-research-poster.html). **Differentiation roadmap (features + poster lines):** [`WINNING-STRATEGY-DIFFERENTIATION.md`](WINNING-STRATEGY-DIFFERENTIATION.md).

---

## 1. Narrow the claim you want to win on

Do not claim VibeScan is “better at everything.” The project overview supports a cleaner lane:

- **JS/TS–centric**, **local-first**, **CI-friendly**
- **Route- and middleware-aware**, **OpenAPI-aware**
- **Deterministic proof-oriented tests** where the architecture supports them

**Proposed winning claim (specific and defensible):**

> VibeScan outperforms comparable security CI/CD tools on **developer actionability** for JavaScript/TypeScript apps, on **route-aware** and **proof-supported** findings.

This avoids overclaiming against dependency-only scanners or broad multi-language SAST; frame comparisons as **design choices and scoped metrics**, not universal rankings.

---

## 2. Build features that create measurable “why”

Every enhancement should answer: **What technical reason lets VibeScan outperform on actionability?** Prefer depth over raw rule count.

### A. Proof coverage tiers

Formalize labels already used in outputs (e.g. `provable_locally`, `needs_manual_completion`) into a **coverage model**:

| Tier | Meaning |
|------|--------|
| **1** | Fully deterministic local proof |
| **2** | Partial proof with extracted context |
| **3** | Structural evidence only |
| **4** | Detection only |

**Report results by tier** so judges see classification of how close each finding is to validation, not only that issues were found.

### B. Path explanation for proof-supported findings

Add a short **explanation object** per supported result, leveraging existing taint, route, and middleware context, e.g.:

- `source → transform → sink`
- `route → missing middleware → protected action`

This makes the **finding-to-proof bridge** explainable and contrasts with tools that stop at warning text.

### C. Strengthen weaker families (highest research ROI)

The poster already notes limits on **BOLA/IDOR** and **SSRF**. Prioritize:

- **BOLA/IDOR:** route parameter → object access traces
- **SSRF:** request-origin and URL construction traces
- **Auth gaps:** middleware-aware extraction for route handlers

**Before/after evidence** on benchmark cases for one or two families beats adding many small unrelated rules.

### D. OpenAPI drift as evaluable security signal

Treat API inventory as a **research feature**, not a sidebar:

- Undocumented route detected
- Documented operation missing in code
- Route present but missing expected auth middleware

This differentiates from tools without API-inventory awareness and ties to governance / secure SDLC.

---

## 3. Turn “outperform” into fair, scoped metrics

Center the remake on **detection vs actionability** as separate dimensions.

**Benchmark table — suggested minimum columns:**

| Metric | Role |
|--------|------|
| Detection recall (in-scope findings) | Fair detection story |
| Precision / false-positive rate | Trust |
| Proof-supported rate | VibeScan differentiator |
| Time-to-validation | Workflow value |
| Context richness score | Explainability |
| CI usability score | Adoption |

**Framing (believable and publishable):**

> Competing tools may match or beat raw detection in some categories. **VibeScan’s target win** is **validated developer workflow value** for supported families (proof bridge + context).

---

## 4. Expand the research design (beyond scoped DVNA)

Keep **DVNA**, frozen outputs, manifests, and adjudication. Add:

| Part | Purpose |
|------|--------|
| **1 — Controlled benchmark** | DVNA, frozen versions, identical scope across tools |
| **2 — Mini real-world corpus** | Small set of open Node/Express repos or curated mini-apps — show the approach is not benchmark-only |
| **3 — Ablation study** | Modes: detection only → + route context → + route context + proof generation |

If actionability metrics **jump when proof generation is on**, that is direct evidence for the product thesis.

---

## 5. One human-centered study (Research Implications)

Small scale is enough if presented honestly (e.g. **6–12** participants):

- **Control:** traditional scanner output only  
- **Treatment:** VibeScan findings + proof artifacts  

**Measure:**

- Time to decide whether a finding is real  
- Confidence in the decision  
- Correctness of prioritization  
- Ability to explain the issue back  

**Implications narrative:** reduced alert fatigue, security education, junior onboarding, trust in CI — CCSC “extends beyond computing” angle.

---

## 6. Rebuild the poster around one comparison question

**Spine question:**

> When do **deterministic local proof artifacts** make static security findings **more actionable** than conventional CI/CD security tooling?

**Suggested layout:**

| Region | Content |
|--------|--------|
| **Top** | Title, one-sentence thesis, QR |
| **Column 1** | Problem + research question + why existing tools fall short |
| **Column 2** | Technical novelty: route-aware analysis + proof generator + coverage tiers |
| **Column 3** | Evaluation: benchmark, ablation, human study, key numbers |
| **Bottom** | Threats to validity, scope, practical implications |

Evidence (tables, charts) should be the **visual star**, not long feature lists.

---

## 7. Strongest defensible “outperform” angles

1. **Built-in finding-to-proof bridge** — headline differentiator if the workflow table holds.  
2. **JS/TS + Node/Express depth** — specialization over shallow multi-language coverage.  
3. **Route and middleware awareness** — auth gaps, CSRF, API posture vs generic static warnings.  
4. **Local-first reproducibility** — no API key, no remote target, no external AI for core scan/proof.  
5. **OpenAPI + governance** — `export-ai-rules`, secure-arch: implementation, docs, and policy alignment.

---

## 8. Practical roadmap (weeks to poster remake)

| Week | Focus |
|------|--------|
| **1** | Deepen one weak family (prefer SSRF or BOLA/IDOR); route/context extraction; before/after on benchmark cases |
| **2** | Proof coverage tiers + explanation traces in outputs; poster-ready visuals |
| **3** | Ablation runs; core metrics: proof-supported rate, time-to-validation, context richness |
| **4** | Small developer study; workflow metrics |
| **5** | Poster remake: center section = numbers and comparisons, not inventory |

---

## 9. What to reduce vs amplify on the new poster

**Reduce:**

- Generic feature bullets  
- Long definitional prose  
- Broad tool comparison **without** numbers  

**Increase:**

- One architecture diagram  
- One benchmark table  
- One ablation chart  
- One workflow / time-to-validation chart  
- One **“where VibeScan wins / where it does not”** box (scoped honesty builds trust)

---

## Threats to validity (keep on poster bottom strip)

- Static analysis cannot prove security; benchmarks are scoped; DVNA is one vulnerable app class.  
- Human study: small *n*, lab vs production triage may differ.  
- Competing tools differ in default configs and scopes — document frozen versions and adjudication rules.

This plan is meant to pair **honest limitations** (already on the poster) with **stronger mechanism + evidence** where VibeScan is designed to win.
