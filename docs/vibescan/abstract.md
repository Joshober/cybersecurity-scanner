# VibeScan — Conference abstract (paste into web form)

**Word count target:** 250–300 (within typical 100–400 form limits).  
**QC:** DVNA wording is aligned with `results/dvna-evaluation.md`; re-count if you edit the body and trim if you approach the form’s upper limit. **Bearer** comparison is still pending a same-environment run.

**Research-first option:** For forms that reward a clear **RQ + evaluation**, consider leading with the optional block below (then trim lit stats to one sentence). Full framing notes: [`research-framing.md`](research-framing.md).

---

### Optional opening (research-led; swap for paragraph 1 if word limit allows)

*We ask whether a static scanner aimed at AI-assisted Node.js workflows can surface high-risk patterns—including unverified dependencies, weak defaults, and injection-prone Express code—that general-purpose linting and CVE-only checks often miss. **VibeScan** is our prototype; we evaluate it on **DVNA** with manual adjudication against **eslint-plugin-security*** (Bearer: same-environment run pending or omit). *Then* motivate with 1–2 citations (e.g. Spracklen for hallucinated package names; SusVibes or BaxBench for SecPass / exploitable “passing” apps)—labeled preprint vs peer-reviewed per your checklist.

---

Nineteen point seven percent of npm package names that large language models recommend do not exist on the public registry—a failure mode called **slopsquatting** that turns “vibe coding” into blind supply-chain risk (Spracklen et al., USENIX Security 2025). Because assistants rarely verify registry metadata, a single hallucinated dependency line can ship straight to production without a compile-time failure, and **Express-style services** generated from chat are especially exposed when route wiring and `package.json` churn move faster than human review. Developers now ship full-stack Node and Express backends from chat, yet the stack still fails systematically: SusVibes reports only about **10.5% SecPass** when security is evaluated honestly (arXiv:2512.03262), BaxBench shows **roughly half** of backends that pass shallow checks remain exploitable (arXiv:2502.11844), and a **January 2026 industry benchmark (Tenzai)** reports **100% SSRF** coverage in evaluated AI-generated apps but **0% CSRF**—static assurance is uneven by vulnerability class. Separately, an **Invicti (2025) industry empirical study** observed **1,182** live applications using the literal string `supersecretkey`, showing how models stamp predictable placeholder secrets into production.

**VibeScan** is an npm-oriented security scanner aimed at LLM-generated JavaScript with four parallel contributions: **(1)** spec-free AST extraction of HTTP endpoints and Express mount chains without OpenAPI; **(2)** persistent `.test.js` security file generation for CI instead of one-off chat patches; **(3)** an LLM-default secret dictionary to catch literals and unsafe environment fallbacks; and **(4)** a registry-backed **slopsquatting detector** that verifies each declared dependency against npm before deploy. On **DVNA**, VibeScan detected **eight** first-party true positives across Injection, Broken Authentication, Sensitive Data, and Logging themes versus **one** for eslint-plugin-security (manually adjudicated); comparison to **Bearer** is left open pending the same environment run—full methodology and raw logs are in our repository’s `results/` directory.

The lesson for builders is architectural: **downstream scanning in the pipeline—not heavier prompt engineering—should be the primary safety layer** for vibe-coded systems. Four concise lessons—**peer-reviewed and arXiv preprints plus industry reports where noted**—are summarized on the poster.

---

### Citations checklist (for Person B)

- Spracklen et al., USENIX Security 2025 — 19.7% hallucinated npm suggestions  
- SusVibes — arXiv:2512.03262 — 10.5% SecPass  
- BaxBench — arXiv:2502.11844 — ~50% exploitable passing backends  
- Tenzai — Jan 2026 — 100% SSRF / 0% CSRF (**industry benchmark**, not peer-reviewed proceedings)  
- Invicti — 2025 — 1,182 apps, `supersecretkey` (**industry empirical study** / vendor research)
