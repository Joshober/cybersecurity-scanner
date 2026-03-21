# VibeScan — 60-second pitch (poster competition)

**Target:** ~140–150 words at conversational pace (roughly 55–65 seconds).  
**Practice:** Time yourself; trim or add a short clause if you run long.

---

## Spoken script

Almost one in five package names that coding assistants suggest for your `package.json` **do not exist** on npm—that is a measured hallucination rate from peer-reviewed security research, not a vibe. Teams are shipping whole Express backends from chat while studies show tiny SecPass rates, half of “passing” backends still exploitable, and uneven coverage like perfect SSRF finds but zero CSRF in generated stacks. **VibeScan** is the npm-side answer: it does **spec-free AST route extraction**, **persistent `.test.js` security files for CI**, an **LLM default-secret dictionary**, and a **registry slopsquat detector** that catches fake dependencies before you deploy. We are benchmarking on DVNA against eslint-plugin-security and Bearer—**[insert Person A’s one-line result here]**. The point is not cleverer prompts—it is **downstream static analysis** in your pipeline. **It’s the safety layer vibe coding never had.**

---

## Judge Q&A cue cards (bullets only)

### 1. What makes this different from eslint-plugin-security or npm audit?

- **eslint-plugin-security:** great generic rules; VibeScan adds **route graph**, **LLM-default secrets**, **generated security tests**, and **npm registry (slopsquat) checks** tuned for generated code.
- **npm audit:** dependency CVEs only; misses **bad code**, **wrong packages that don’t exist**, and **auth/config mistakes** in your repo.

### 2. How did you evaluate it? What are your numbers?

- **DVNA** (Damn Vulnerable Node Application) benchmark vs **eslint-plugin-security** and **Bearer**.
- **Fill in:** precision/recall or counts from Person A; mention **which vulnerability classes** you measured.

### 3. Why not just use AI to fix the security issues?

- Chat fixes are **non-deterministic** and **not committed**; VibeScan emits **repeatable findings + tests** for CI.
- Models **reintroduce** the same default secrets and bad deps; **downstream scanning** catches regressions.

### 4. What is the false positive rate?

- **Honest answer:** [Person A: if you have a number, state it]; else: “We’re measuring FP on DVNA and a small real-app set—early runs prioritize **high-signal rules**; tune thresholds per org.”
- Static analysis always trades **noise vs coverage**; slopsquat uses **registry 404** to stay conservative.

### 5. What’s next for this project?

- More **frameworks** (Fastify, Nest), richer **BOLA/RLS** patterns, **IDE integration**, and a **public rule count** on the poster once frozen.

### 6. Why does this matter beyond computer science?

- **Public data** (IDs, health, payments) rides on these stacks—**Tea App**, **Supabase RLS** incidents, **subscription bypass** shutdowns show **real harm**, not lab scores.
- **Supply-chain + default secrets** are **policy-relevant** (consumer protection, gov digital services).
