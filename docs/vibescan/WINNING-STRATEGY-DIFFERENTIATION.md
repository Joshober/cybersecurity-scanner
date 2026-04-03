# Winning strategy — differentiation features (CCSC / research)

**North-star question (every feature must answer it):**

> What does VibeScan **understand or prove** that other tools don’t?

That pairing drives:

- **Research Quality** → a new capability with a clear mechanism  
- **Research Implications** → a real-world advantage developers can feel  

This doc complements [`CCSC-POSTER-RESEARCH-PLAN.md`](CCSC-POSTER-RESEARCH-PLAN.md) (evaluation design, metrics, poster layout). Items below are **roadmap / framing** until implemented in the scanner and JSON schema.

---

## Poster-ready differentiation line

Use verbatim or close paraphrase on the poster:

> Unlike tools that stop at detection, VibeScan introduces a **proof-oriented** paradigm that **measures**, **validates**, and **explains** vulnerabilities in a **deterministic local** workflow.

---

## Six high-impact features (each supports a “we are better because…” argument)

### 1. Proof coverage score (primary differentiator)

**Idea:** A global metric, e.g. **Proof coverage: 78%** — share of findings that can be automatically validated (under your tier model).

**Example breakdown:**

```json
{
  "total_findings": 50,
  "provable": 38,
  "partial": 7,
  "unprovable": 5
}
```

**Claim:** Other tools detect issues; VibeScan **reports how many findings are provable**, not only how many were flagged. Many competitors **do not** define or measure this.

---

### 2. Deterministic reproduction engine

**Idea:** A command such as `vibescan reproduce <finding-id>` that runs the generated test, prints pass/fail, and surfaces the exploit or failure path **without** a live app or remote API where proofs exist.

**Claim:** Reproduction moves from **manual** and **environment-heavy** to **one command, local, zero setup** for supported families.

---

### 3. Confidence via evidence (not only a label)

**Idea:** Augment or replace opaque `"confidence": "high"` with a **`confidence_reason`** (or equivalent) grounded in analysis, e.g.:

`"Full taint path from user input → SQL query"`

**Claim:** Confidence is **traceable to evidence**, not only a heuristic score.

---

### 4. Root cause graph (visual + JSON)

**Idea:** A simple graph or structured path, e.g.:

`req.body → userInput → sanitize? (no) → SQL query → DB`

**JSON shape example:**

```json
{
  "path": ["req.body", "userInput", "query"],
  "missing": ["sanitization"]
}
```

**Claim:** Show **why** the issue exists (path + gaps), not only **where** the rule fired.

---

### 5. Fix impact preview

**Idea:** When feasible, a structured hint that a specific fix **changes the proof outcome**, e.g.:

```json
{
  "fix_preview": {
    "add": "sanitize(input)",
    "result": "proof fails → vulnerability removed"
  }
}
```

**Claim:** Move from **generic remediation text** to **evidence-linked** “if you change X, the proof result changes” where the engine can support it.

---

### 6. Proof failure analysis

**Idea:** When proof cannot be generated, explicit status and reason, e.g.:

```json
{
  "status": "needs_manual_completion",
  "reason": "dynamic input source not statically resolvable"
}
```

**Claim:** **Boundary** between static and dynamic security is **stated**, not silent — research depth and honesty.

---

## Bonus features (elevate research narrative)

### 7. Actionability time tracker

**Idea:** Measure or estimate **`time_to_prove_sec`** (or similar) for VibeScan vs baseline triage for other tools’ outputs, under a defined study protocol.

**Use:** Poster table comparing dimensions (detection vs actionability vs reproducibility), not a single “we’re better” headline.

---

### 8. Multi-dimensional comparison dashboard

**Idea:** A small matrix: **Detection**, **Precision**, **Actionability**, **Reproducibility**, **CI usability** — with **scoped** winners per row and honest ties/losses where appropriate.

---

## Poster: group capabilities into three innovations

Instead of a flat feature list:

| Innovation | Includes | One-line message |
|------------|----------|------------------|
| **Proof-oriented analysis** | Proof generation, reproduction command, proof coverage | “We **validate** vulnerabilities.” |
| **Evidence-based reasoning** | Root-cause graph, confidence reasons, proof-failure explanation | “We **explain** vulnerabilities.” |
| **Workflow integration** | CI-friendly proof mode, fix preview, actionability timing | “We **improve developer workflows**.” |

---

## Reality check: minimum set for a defensible story

You do **not** need everything above on day one.

**Strong minimum trio:**

1. **Proof coverage score** (with tier breakdown)  
2. **Reproduction engine** (`reproduce` or equivalent for supported IDs)  
3. **Root cause graph** (or structured path JSON in findings)  

That trio already supports a clear, research-grade differentiation story if evaluation is scoped honestly.

---

## Positioning shift (intent)

| Before | After |
|--------|--------|
| “A very good security tool” | “A **proof-oriented** way to **evaluate** static findings and developer workflow value” |

That framing supports CCSC’s emphasis on **novel contribution** and **implications**, not only implementation quality.
