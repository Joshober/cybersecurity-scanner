# VibeScan — Project overview

This document summarizes what the project is, the research behind it, major features, how the scanner works in practice, and how it compares to other security tools commonly used in CI/CD.

**Published product:** npm package [`@jobersteadt/vibescan`](https://www.npmjs.com/package/@jobersteadt/vibescan) (MIT, no API keys required for static scanning).

---

## What this project is

**VibeScan** is a developer-first static security scanner for **JavaScript and TypeScript** application code. It targets common vulnerability classes (cryptography misuse, injection, SSRF patterns, auth and middleware gaps on HTTP routes, and more) with **OWASP- and CWE-oriented** rule metadata, human-readable remediation, and outputs designed for **CI pipelines** (JSON, SARIF, HTML reports).

The repository is a **monorepo**: the scanner lives under `vibescan/`, with nested **secure-arch** packages for portable YAML security settings, architecture validation, and IDE adapter generation (Cursor, Amazon Q).

---

## Research and evaluation

The project includes a **benchmark-oriented evaluation** using **[DVNA](https://github.com/appsecco/dvna)** (Damn Vulnerable Node Application), a deliberately vulnerable Node app aligned with classic OWASP themes. Runs are frozen with manifests (tool versions, scope, commit SHAs) under `benchmarks/results/`, with narrative and adjudication in:

- `results/dvna-evaluation.md` — methodology snapshot and comparison framing  
- `results/dvna-adjudication.md` — true positive / false positive / false negative rationale  

Comparisons in that work include **VibeScan**, **eslint-plugin-security**, **Snyk Code**, **Bearer**, **Semgrep**, **CodeQL**, and **npm audit**, with the explicit caveat that numbers are **preliminary** and scopes differ (static app code vs dependency advisories vs commercial SAST). Frozen Semgrep and CodeQL DVNA artifacts live under `benchmarks/results/` (see `results/dvna-evaluation.md`). A planned **second corpus** (OWASP NodeGoat) follows the same protocol in [`docs/vibescan/BENCHMARK-SECOND-CORPUS.md`](docs/vibescan/BENCHMARK-SECOND-CORPUS.md). The evaluation highlights where **line-level static rules** complement **transitive dependency scanning**, and where **Express-centric** route and OpenAPI rules add signal that generic tools may not label the same way.

For reproducibility and claims in papers or posters, cite the frozen artifacts and manifests referenced from `results/dvna-evaluation.md` rather than ad hoc local runs.

---

## Major features

| Area | What you get |
|------|----------------|
| **Static rules** | Crypto, injection (SQL, command, path, XSS, NoSQL, XPath, log), secrets, JWT weak literals, TLS misconfig, SSRF-style patterns, and more — many rules carry **CWE** identifiers. |
| **Graph-assisted findings** | **Taint-style** flows and **Express** route / middleware awareness for auth, CSRF, rate limit, CORS, Helmet, webhook signature heuristics, etc. |
| **API inventory vs docs** | Optional **OpenAPI/Swagger** comparison: routes missing from the spec, or documented operations not matched to static routes (`API-INV-*`). |
| **CI outputs** | **JSON** (structured summary + per-file results), **SARIF 2.1** (e.g. GitHub Advanced Security–style uploads), optional **static HTML** report, run **manifest** and **adjudication** exports for benchmarking. |
| **CI adoption** | **Baseline** files so pipelines can fail only on **new** findings during rollout; suppressions with optional audit **reasons**. |
| **Optional signals** | **`--check-registry`** (slopsquat-style: dependency names that do not resolve on the public npm registry, `SLOP-001`). |
| **Proof-oriented tests** | `vibescan prove` / `--generate-tests`: deterministic **`node:test`** files for supported rule families (no live API, no remote LLM). |
| **Governance / IDE** | **`vibescan export-ai-rules`**: project-aware exports (e.g. Cursor rules, Amazon Q prompt, markdown, JSON policy digest) from config + secure-arch paths — **governance artifacts**, not a cloud scanning API. |
| **Architecture layer** | **`vibescan secure-arch`** (install, check): YAML settings + optional code evidence checks, bundled in the same install. |
| **ESLint** | Rules can run as an **ESLint plugin** with IDs aligned to the CLI rule catalog. |

---

## How it works (high level)

1. **Input** — You point the CLI at a project tree (with optional `--project-root`, `--exclude-vendor`, ignore globs, and `vibescan.config.json`).

2. **Analysis** — The engine parses JS/TS, runs pattern and dataflow-oriented checks, and (for Express-style apps) builds a **static picture of routes and middleware** to support auth, CSRF, and related heuristics. If you provide OpenAPI files (or enable discovery), it compares **documented API surface** to **statically inferred routes**.

3. **Output** — Findings include severity, location, confidence, remediation text, and references. Exit code goes non-zero when severity meets your threshold (e.g. critical/error), optionally compared to a **baseline** so legacy noise does not block merges.

4. **CI** — A typical GitHub Actions job runs `npx @jobersteadt/vibescan scan . --exclude-vendor` with no secrets; optional SARIF upload or JSON artifacts for dashboards.

5. **Optional paths** — Registry HEAD checks, HTML report generation, `prove` for local test stubs, and `export-ai-rules` for team policy in editors — all without requiring VibeScan-hosted cloud services for the core scan.

For command details and config schema, see the root [`README.md`](README.md) and [`vibescan/README.md`](vibescan/README.md).

---

## How VibeScan differs from other security CI/CD tools

Comparisons are necessarily coarse because products differ in languages, deployment, and pricing. The points below describe **design choices** of this project, not universal rankings.

### vs dependency scanners (e.g. `npm audit`, Dependabot, OSV)

- **Dependency tools** focus on **known CVEs** in packages and lockfiles.  
- **VibeScan** focuses on **your application source**: unsafe patterns, weak crypto, injection sinks, and route-level posture.  
- **Together:** dependency scanning finds vulnerable **libraries**; VibeScan finds dangerous **usage** and misconfiguration in code paths.

### vs broad multi-language SAST (e.g. commercial cloud suites, some Semgrep deployments)

- Many enterprise products require **accounts**, **org policies**, and often **uploading** code or connecting repos to a vendor.  
- **VibeScan** runs **locally** or in your CI with the **public npm package** and **no VibeScan API key** for static analysis.  
- **Scope:** VibeScan is **JS/TS–centric** with deep **Node/Express** heuristics and OpenAPI pairing; it is not trying to be a polyglot analyzer for every language in one box.

### vs other JS-focused analyzers (e.g. eslint-plugin-security, Bearer)

- **ESLint plugins** integrate with your lint pipeline rule-by-rule; VibeScan provides a **unified CLI**, **SARIF/JSON** for gates, **route graph** and **OpenAPI drift** rules, and **benchmark-oriented** exports.  
- **Other static scanners** may emphasize different rule sets or workflows; VibeScan combines **CWE-tagged** rules, **middleware/route** context, optional **registry** signal, **secure-arch** policy checks, and **AI governance exports** in one **MIT** package.  
- **Research artifacts** under `results/` document head-to-head methodology vs selected tools on DVNA; use those for evidence-based claims rather than generic marketing comparisons.

### Summary positioning

**VibeScan** is positioned as a **shift-left, CI-friendly** static layer for **JavaScript/TypeScript** teams that want **actionable, documented findings**, **Express/API awareness**, optional **architecture policy** checks, and **no mandatory cloud scanner API** — complementary to dependency scanning and human review, not a replacement for dynamic testing or formal verification.

---

## Where to go next

| Need | Location |
|------|----------|
| Install & CI snippet | [`README.md`](README.md), [`vibescan/templates/github-actions.yml`](vibescan/templates/github-actions.yml) |
| Full CLI & features | [`vibescan/README.md`](vibescan/README.md) |
| DVNA evaluation & adjudication | [`results/dvna-evaluation.md`](results/dvna-evaluation.md), [`results/dvna-adjudication.md`](results/dvna-adjudication.md) |
| Interactive demo (clone + scan UI) | [`demo/README.md`](demo/README.md) |
| CCSC poster — research strategy & metrics plan | [`docs/vibescan/CCSC-POSTER-RESEARCH-PLAN.md`](docs/vibescan/CCSC-POSTER-RESEARCH-PLAN.md) |
| CCSC — differentiation features & poster framing | [`docs/vibescan/WINNING-STRATEGY-DIFFERENTIATION.md`](docs/vibescan/WINNING-STRATEGY-DIFFERENTIATION.md) |

---

*Last updated to match repository layout and published package behavior as of the current codebase.*
