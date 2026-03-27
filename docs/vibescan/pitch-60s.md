# VibeScan — 60-second pitch (poster competition)

**Target:** ~140–150 words at conversational pace (roughly 55–65 seconds).  
**QC:** The script below includes the DVNA one-liner (~142 words)—time yourself and trim a clause if you run over ~65s.  
**Practice:** Time yourself; trim or add a short clause if you run long.

---

## Spoken script

Research keeps showing the same pattern: AI-generated backend code can look correct but still ship exploitable security flaws. **VibeScan** is a practical safety layer for that workflow. It is a static scanner for Node/Express-style JavaScript and TypeScript projects with **AST security rules**, **taint-style flow checks**, **route and middleware heuristics**, an optional **registry slopsquat check**, and optional **generated test scaffolds** for CI. On our current DVNA benchmark snapshot, we captured and adjudicated VibeScan, eslint-plugin-security, Bearer, and Snyk Code under frozen run artifacts. Under the current first-party rubric, provisional recall is **36.4%** for VibeScan, **72.7%** for Bearer, **63.6%** for Snyk Code, and **9.1%** for eslint-plugin-security. Our claim is conservative: this is not a universal ranking, but it shows why downstream scanning belongs in AI-assisted pipelines.

---

## Judge Q&A cue cards (bullets only)

### 1. What makes this different from eslint-plugin-security or npm audit?

- **eslint-plugin-security:** great generic rules; VibeScan adds **route graph**, **LLM-default secrets**, **generated security tests**, and **npm registry (slopsquat) checks** tuned for generated code.
- **npm audit:** dependency CVEs only; misses **bad code**, **wrong packages that don’t exist**, and **auth/config mistakes** in your repo.

### 2. How did you evaluate it? What are your numbers?

- **DVNA** benchmark with frozen artifacts under `benchmarks/results/` for VibeScan, eslint-plugin-security, Bearer, and Snyk Code.
- Current first-party adjudicated recall: VibeScan `4/11`, Bearer `8/11`, Snyk Code `7/11`, eslint-plugin-security `1/11` (see `results/dvna-evaluation.md` and `results/dvna-adjudication.md`).

### 3. Why not just use AI to fix the security issues?

- Chat fixes are **non-deterministic** and **not committed**; VibeScan emits **repeatable findings + tests** for CI.
- Models **reintroduce** the same default secrets and bad deps; **downstream scanning** catches regressions.

### 4. What is the false positive rate?

- **Honest answer:** “Current DVNA snapshot precision is `80.0%` for VibeScan and `90.0%` for Bearer, with out-of-scope items excluded; broader rates still need more datasets.”
- Static analysis always trades **noise vs coverage**; slopsquat uses **registry 404** to stay conservative.

### 5. What’s next for this project?

- More **frameworks** (Fastify, Nest), richer **BOLA/RLS** patterns, **IDE integration**, and a **public rule count** on the poster once frozen.

### 6. Why does this matter beyond computer science?

- **Public data** (IDs, health, payments) rides on these stacks—**Tea App**, **Supabase RLS** incidents, **subscription bypass** shutdowns show **real harm**, not lab scores.
- **Supply-chain + default secrets** are **policy-relevant** (consumer protection, gov digital services).
