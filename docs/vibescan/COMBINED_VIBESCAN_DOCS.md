# VibeScan docs (combined)

This file is a **consolidated snapshot** of Markdown docs related to VibeScan (conference materials + research/evaluation notes).

Note: some “Source:” paths referenced in this document may not exist as standalone files in the current working tree (because content has been consolidated), but the **content is preserved here**.

## Table of contents

- [docs/PLANS.md](#docsplansmd)
- [docs/REPO-HANDOFF.md](#docsrepohandoffmd)
- [docs/research-strengthening/README.md](#docsresearch-strengtheningreadmemd)
- [docs/research-strengthening/research-question.md](#docsresearch-strengtheningresearch-questionmd)
- [docs/research-strengthening/methodology.md](#docsresearch-strengtheningmethodologymd)
- [docs/research-strengthening/evaluation-plan.md](#docsresearch-strengtheningevaluation-planmd)
- [docs/research-strengthening/seeded-benchmark-plan.md](#docsresearch-strengtheningseeded-benchmark-planmd)
- [docs/research-strengthening/benchmarking-runbook.md](#docsresearch-strengtheningbenchmarking-runbookmd)
- [docs/research-strengthening/eval-output-and-cli-support.md](#docsresearch-strengtheningeval-output-and-cli-supportmd)
- [docs/research-strengthening/metrics-templates.md](#docsresearch-strengtheningmetrics-templatesmd)
- [docs/research-strengthening/contribution-audit.md](#docsresearch-strengtheningcontribution-auditmd)
- [docs/research-strengthening/results-index.md](#docsresearch-strengtheningresults-indexmd)
- [docs/research-strengthening/abstract-revision-notes.md](#docsresearch-strengtheningabstract-revision-notesmd)
- [docs/research-strengthening/jober-newlayout-merge-strategy.md](#docsresearch-strengtheningjober-newlayout-merge-strategymd)
- [docs/vibescan/README.md](#docsvibescanreadmemd)
- [docs/vibescan/abstract.md](#docsvibescanabstractmd)
- [docs/vibescan/pitch-60s.md](#docsvibescanpitch-60smd)
- [docs/vibescan/SUBMISSION-CHECKLIST.md](#docsvibescansubmission-checklistmd)
- [docs/vibescan/project-tracking.md](#docsvibescanproject-trackingmd)
- [docs/vibescan/judging-pack.md](#docsvibescanjudging-packmd)
- [docs/vibescan/demo-plan.md](#docsvibescandemo-planmd)
- [docs/vibescan/rule-coverage-audit.md](#docsvibescanrule-coverage-auditmd)
- [docs/vibescan/adjudication-template.md](#docsvibescanadjudication-templatemd)
- [docs/vibescan/final-paper-outline.md](#docsvibescanfinal-paper-outlinemd)
- [docs/vibescan/research-scope-v2.md](#docsvibescanresearch-scope-v2md)
- [docs/vibescan/surface-and-boundaries.md](#docsvibescansurface-and-boundariesmd)
- [docs/vibescan/baselines-and-positioning.md](#docsvibescanbaselines-and-positioningmd)
- [docs/vibescan/platform-and-api-benchmark-plan.md](#docsvibescanplatform-and-api-benchmark-planmd)
- [docs/vibescan/context-aware-prioritization-plan.md](#docsvibescancontext-aware-prioritization-planmd)
- [docs/vibescan/webhook-verification-rule-proposal.md](#docsvibescanwebhook-verification-rule-proposalmd)
- [docs/vibescan/secure-arch-policy-bridge.md](#docsvibescansecure-arch-policy-bridgemd)

---

## docs/vibescan/README.md

<!-- Source: docs/vibescan/README.md -->

# VibeScan conference materials

Assets for poster, abstract, pitch, handout, and QR code. Open HTML files in a browser; print to PDF when ready.

For product/CLI usage, use the canonical docs in [`../../README.md`](../../README.md) and [`../../vibescan/README.md`](../../vibescan/README.md).

| File | Purpose |
|------|---------|
| [`docs/REPO-HANDOFF.md`](#docsrepohandoffmd) | **Codebase / architecture summary** for collaborators or LLMs (pipeline, paths, what’s implemented). |
| [`docs/research-strengthening/README.md`](#docsresearch-strengtheningreadmemd) | **Academic spine:** RQ, methodology, evaluation, seeded plan, and metrics. |
| [`vibescan-research-poster.html`](./vibescan-research-poster.html) | Main research poster (dark theme, cards, DVNA table per `results/dvna-evaluation.md`). |
| [`qr-github.svg`](./qr-github.svg) | 120×120-style QR (white modules on `#0a0a0f`) for `https://github.com/Joshober/cybersecurity-scanner`. |
| [`abstract.md`](./abstract.md) | Paste-up abstract + citation checklist. |
| [`pitch-60s.md`](./pitch-60s.md) | 60s script + six judge cue cards. |
| [`handout.html`](./handout.html) | A5 handout; print in grayscale to verify contrast. |
| [`SUBMISSION-CHECKLIST.md`](./SUBMISSION-CHECKLIST.md) | Logistics (form, chair, deadlines). |
| [`project-tracking.md`](./project-tracking.md) | Consolidated checklists + roadmap + repo health tracker (includes rubric status). |
| [`judging-pack.md`](./judging-pack.md) | Judge prep: research framing + source tiers + rigor talking points. |
| [`demo-plan.md`](./demo-plan.md) | Consolidated conference demo plan (examples, seeded app designs, folder layout). |
| [`rule-coverage-audit.md`](./rule-coverage-audit.md) | Rules × unit tests, fixtures, README, benchmark relevance. |
| [`../research-strengthening/benchmarking-runbook.md`](../research-strengthening/benchmarking-runbook.md) | Benchmark folder layout + reproducible runbook (canonical). |
| [`benchmark-manifest-template.json`](./benchmark-manifest-template.json) | Run metadata template (copy per experiment). |
| [`adjudication-template.md`](./adjudication-template.md) | Per-finding ground-truth labeling table. |
| [`../research-strengthening/eval-output-and-cli-support.md`](../research-strengthening/eval-output-and-cli-support.md) | Formatter/CLI support notes for evaluation (canonical). |
| [`vibescan-benchmark-output.schema.json`](./vibescan-benchmark-output.schema.json) | JSON Schema for project scan output (incl. `--benchmark-metadata`). |
| [`baselines-and-positioning.md`](./baselines-and-positioning.md) | Consolidated positioning + baseline comparison plans (Snyk/DAST/etc.). |
| [`research-scope-v2.md`](./research-scope-v2.md) | Updated RQ, hypotheses (conservative). |
| [`surface-and-boundaries.md`](./surface-and-boundaries.md) | Trust boundaries, endpoint discovery, and authz/surface gap analysis (consolidated). |
| [`platform-and-api-benchmark-plan.md`](./platform-and-api-benchmark-plan.md) | Seeded benchmark case IDs (qualitative baselines). |
| [`context-aware-prioritization-plan.md`](./context-aware-prioritization-plan.md) | Future prioritization design. |
| [`webhook-verification-rule-proposal.md`](./webhook-verification-rule-proposal.md) | Webhook signature rule (future extensions; aligns with `WEBHOOK-001`). |

## Regenerate the QR (if the public URL changes)

Poster, handout, and `qr-github.svg` currently target **`https://github.com/Joshober/cybersecurity-scanner`**.

**PowerShell (downloads SVG from a public API):**

```powershell
$url = "https://github.com/Joshober/cybersecurity-scanner"  # change if the repo moves
$enc = [uri]::EscapeDataString($url)
Invoke-WebRequest -Uri "https://api.qrserver.com/v1/create-qr-code/?size=116x116&data=$enc&format=svg" -OutFile qr-raw.svg
```

Then edit `qr-raw.svg`: set background rect to `fill:#0a0a0f` and module path to `fill:#ffffff`, matching the current `qr-github.svg` styling—or keep high-contrast black-on-white for print if your chair prefers it.

**With Node (if installed):**

```bash
npx qrcode -t svg -o qr-github.svg "https://github.com/Joshober/cybersecurity-scanner"
```

Adjust colors in the SVG to match the poster if needed.

## Final PDF

1. Open `vibescan-research-poster.html` in Chrome/Edge.
2. Print → **Save as PDF** → filename **`vibescan-poster-FINAL.pdf`**.
3. Zoom to ~25–50% to sanity-check legibility before sending to the poster chair.

## Notes to keep current

- Keep the DVNA comparison table aligned with `results/dvna-evaluation.md` and the latest run artifacts in `benchmarks/results/`.
- Update poster rule-count callouts if the scanner rule inventory changes.

---

## docs/PLANS.md

<!-- Source: docs/PLANS.md -->

# Plans index (canonical)

This file centralizes **all plan/proposal/runbook/tracking** documents in the repository.

If you’re looking for “what should we do next?” start here, then follow the links to the canonical plan docs.

For non-planning docs (installation, CLI, package usage), use [`../README.md`](../README.md) and [`../vibescan/README.md`](../vibescan/README.md).

For finalized benchmark outcomes and adjudication, use [`../results/dvna-evaluation.md`](../results/dvna-evaluation.md) and [`../results/dvna-adjudication.md`](../results/dvna-adjudication.md).

## Conference + demo plans

- `docs/vibescan/demo-plan.md`: conference demo set, seeded demo app designs, and suggested demo folder layout.
- `docs/vibescan/SUBMISSION-CHECKLIST.md`: submission and logistics checklist (human tasks).

## Research + evaluation plans (canonical)

- `docs/research-strengthening/evaluation-plan.md`: DVNA + seeded evaluation phases, baselines, metrics, and interpretation guardrails.
- `docs/research-strengthening/seeded-benchmark-plan.md`: seeded case catalog + ground-truth expectations + execution notes.
- `docs/research-strengthening/benchmarking-runbook.md`: canonical benchmark folder layout + reproducible run commands + manifest expectations.
- `docs/research-strengthening/eval-output-and-cli-support.md`: formatter/CLI additions for evaluation (summary blocks, deterministic ordering, scope flags).
- `docs/research-strengthening/results-index.md`: canonical index for DVNA narrative (`results/`) + standardized run artifacts (`benchmarks/results/`).

## Product positioning + comparison plans

- `docs/vibescan/baselines-and-positioning.md`: positioning and baseline comparisons (Snyk/DAST/etc.) and scope-alignment guidance.

## Surface / trust-boundary / endpoint plans

- `docs/vibescan/surface-and-boundaries.md`: trust boundary model + endpoint discovery plan + authz/surface gap analysis (consolidated).

## Roadmap + checklists + repo health tracking

- `docs/vibescan/project-tracking.md`: consolidated tracking doc (research gap checklist, repo health, roadmap, release checklist, future work).

## Specialized proposals / PoCs

- `docs/vibescan/webhook-verification-rule-proposal.md`: `WEBHOOK-001` follow-up notes (verification markers, FP control ideas).
- `docs/vibescan/secure-arch-policy-bridge.md`: PoC policy bridge notes for `secure-arch` + VibeScan outputs.

## Other planning-style docs (still standalone)

- `docs/vibescan/context-aware-prioritization-plan.md`: prioritization scoring sketch (future work).
- `docs/vibescan/platform-and-api-benchmark-plan.md`: qualitative seeded cases for API/platform surfaces.

---

## docs/REPO-HANDOFF.md

<!-- Source: docs/REPO-HANDOFF.md -->

(Included verbatim; some links may refer to paths that no longer exist as standalone files after consolidation.)

# VibeScan repository handoff (for collaborators / LLMs)

This document summarizes **what the repo is**, **how the scanner works**, **what is implemented**, and **where files live**. Paste or attach it when onboarding a new assistant.

**Related:** [README.md](../README.md) (install, CLI, rule×CWE table) · [docs/research-strengthening/](research-strengthening/) (RQ, methodology, evaluation plan, metrics) · [vibescan/README.md](../../vibescan/README.md) (`secure-arch` CLI) · [docs/vibescan/](vibescan/) (consolidated notes) · [results/](../results/) (DVNA benchmark narrative + adjudication).

---

## Product identity

| Item | Value |
|------|--------|
| **Product name** | VibeScan |
| **npm package** | `@jobersteadt/vibescan` (published from [`vibescan/`](../vibescan/); scanner sources live under `vibescan/src/`) |
| **CLI binaries** | `vibescan`, `secure` (same `vibescan/dist/system/cli/index.js`) |
| **Language / runtime** | TypeScript → JavaScript, **Node 18+** |
| **Repo** | [github.com/Joshober/cybersecurity-scanner](https://github.com/Joshober/cybersecurity-scanner) |
| **Workspaces** | Root scanner + [`vibescan/packages/secure-arch-*`](../vibescan/packages/) (`npm` workspaces; see root `package.json`) |

---

## Repository roles

- **Evaluated artifact (paper):** VibeScan (`vibescan`) — the scanner in `vibescan/src/` runs via `vibescan`/`secure`, with evidence in `benchmarks/results/`.
- **Supporting product layer:** `secure-arch` (YAML policy + `secure-arch check`) under `vibescan/packages/secure-arch-*` (optional generated exports under `docs/secure-arch/`) — use for policy/evidence, but treat as out-of-scope for benchmark numbers unless explicitly evaluated.
- **Related tooling:** secure-arch workspaces under `vibescan/packages/secure-arch-*` — policy/schema/checking and adapter generation integrated with the scanner package.

## Maturity legend (how to avoid “scope mixing”)

- **Implemented:** shipped in the default CLI/scanner path.
- **Documented:** described in README/handoff materials.
- **Evaluated:** covered by manifest + adjudication + frozen benchmark outputs.
- **Future:** explicitly planned, not part of current evidence.

---

## What it does

Static analysis for **JavaScript/TypeScript** focused on:

- **Cryptographic failures** (OWASP **A02:2021**-style patterns)
- **Injection** and related issues (**A03:2021**-style patterns)

Mechanisms:

1. **AST pattern rules** — Acorn → ESTree; rules subscribe to `nodeTypes` and run in [`ruleEngine`](../vibescan/src/system/engine/ruleEngine.ts).
2. **Taint engine** — Tracks untrusted sources (e.g. `req.body`) to sinks (SQL, `exec`, paths, XSS, logs, SSRF-ish HTTP, …) in [`taintEngine.ts`](../vibescan/src/system/engine/taintEngine.ts).
3. **Express route graph** — [`routeGraph.ts`](../vibescan/src/system/parser/routeGraph.ts) for middleware audit.
4. **Optional** — `--check-registry` → **SLOP-001** ([`slopsquat.ts`](../vibescan/src/system/ai/slopsquat.ts)); `--generate-tests` → [`testWriter.ts`](../vibescan/src/system/engine/testWriter.ts); `--mode ai` → [`ai-analyzer.ts`](../vibescan/src/system/ai/ai-analyzer.ts).

**Path note:** Some task specs refer to `src/rules/system/ai/`. In this repo, that logic lives under **`vibescan/src/system/ai/`**; pattern rules live under **`vibescan/src/attacks/`**.

### Universal secure-architecture layer

- **Settings in YAML** under [`vibescan/architecture/secure-rules/`](../../vibescan/architecture/secure-rules/) (AI tools fill templates; they do not “validate” security by themselves).
- **Static checker** — [`@secure-arch/core`](../vibescan/packages/secure-arch-core/) loads YAML, runs **ARCH-*** rules, and optionally correlates **JS/TS** evidence via **`vibescan`** (`ARCH-E*`) plus **Python/Java** heuristics (`ARCH-H*`).
- **CLI** — [`secure-arch`](../vibescan/packages/secure-arch-cli/src/cli.ts): `install`, `init --tool cursor|amazonq`, `check`.
- **Docs** — [vibescan/README.md](../../vibescan/README.md) (secure-arch section).

---

## End-to-end pipeline

```
CLI (cli/index.ts)
  → glob **/*.{js,ts,mjs,cjs}
  → scanProjectAsync(scanner.ts)
       → per file: parseFile → runRuleEngine → runTaintEngine → routeGraph → appLevelAudit
       → merge routes → runMiddlewareAudit
       → [optional] checkDependencies (SLOP-001)
       → [optional] generateTests
  → format (human | compact | json)
```

Exit **non-zero** if any finding has severity **critical** or **error** (see [`cli/index.ts`](../vibescan/src/system/cli/index.ts)).

**Parent pointers:** [`buildParentMap`](../vibescan/src/system/walker.ts) is built once per file AST and passed into `RuleContext.getParent` for rules that need ancestors (e.g. **SSRF-003**). The ESLint wrapper builds the same map from `context.getSourceCode().ast` ([`eslint-plugin.ts`](../vibescan/src/system/eslint-plugin.ts)).

---

## Implemented features (checklist alignment)

| Feature | Location |
|---------|----------|
| Crypto rules (hash, cipher, IV, random, secrets, JWT, TLS) | [`vibescan/src/attacks/crypto/`](../vibescan/src/attacks/crypto/) |
| Injection rules (SQL, command, path, XSS, NoSQL, XPath, log, eval) | [`vibescan/src/attacks/injection/`](../vibescan/src/attacks/injection/), [`vibescan/src/attacks/browser/`](../vibescan/src/attacks/browser/), [`vibescan/src/attacks/file/`](../vibescan/src/attacks/file/) |
| **SEC-004** — weak `process.env \|\| 'weakLiteral'` | [`default-secret-fallback.ts`](../vibescan/src/attacks/crypto/default-secret-fallback.ts) + [`secretDict.ts`](../vibescan/src/attacks/crypto/secretDict.ts) |
| Tiered weak secrets + `isLikelyRealSecret` (entropy + provider regexes) | [`secretDict.ts`](../vibescan/src/attacks/crypto/secretDict.ts) re-exports from [`entropy.ts`](../vibescan/src/attacks/crypto/entropy.ts) |
| **SLOP-001** — npm HEAD, max 5 concurrent, workspaces by package name, `.npmrc` non-npmjs skip | [`slopsquat.ts`](../vibescan/src/system/ai/slopsquat.ts) |
| **SSRF-003** — `ip.isPublic`/`isPrivate` when gating `fetch`/HTTP client on same URL id | [`ipGuard.ts`](../vibescan/src/system/ai/ipGuard.ts) |
| **RULE-SSRF-002** — axios baseURL + user URL | [`axiosBypass.ts`](../vibescan/src/system/ai/axiosBypass.ts) |
| `envFallback` shim (re-export) | [`envFallback.ts`](../vibescan/src/system/ai/envFallback.ts) |
| Rule registry | [`attacks/index.ts`](../vibescan/src/attacks/index.ts) — `cryptoRules` (9), `injectionRules` (11) |

## Experimental / not in default scan

- `prototypePollution.ts`: present in tree but not exported from `vibescan/src/attacks/index.ts` (not part of the default scan rule list)
- `jwt-weak-test.ts`: built to `dist/` but not registered in the active rule list
- `entropy.ts`: helper for secret detection; not a standalone rule

**Finding extras:** `packageName`, `cveRef`, `findingKind`, `remediation` on [`Finding`](../vibescan/src/system/types.ts) where relevant.

---

## File structure

```text
CyberSecurity/
├── docs/
│   ├── REPO-HANDOFF.md          ← this file
│   ├── secure-arch/             ← secure-arch usage + AI prompts
│   ├── research-strengthening/  ← paper/poster methodology hub
│   └── vibescan/                ← poster HTML, abstract, pitch, QR, checklist
├── architecture/secure-rules/   ← under vibescan/; YAML settings (after secure-arch install)
├── benchmarks/                  ← DVNA README + seeded corpora + scripts + dated run outputs
├── results/                     ← DVNA benchmark outputs + evaluation markdown (legacy; see benchmarks/results/archive)
├── vibescan/
│   ├── src/
│   │   ├── attacks/
│   │   │   ├── index.ts             # cryptoRules[], injectionRules[]
│   │   │   ├── crypto/              # SEC-004, JWT, secretDict, entropy, ciphers, …
│   │   │   ├── injection/           # SQL, command, proto payloads, …
│   │   │   ├── browser/             # XSS
│   │   │   └── file/                # Path traversal
│   │   └── system/
│   │       ├── scanner.ts           # scan, scanProject, scanProjectAsync
│   │       ├── cli/index.ts
│   │       ├── types.ts
│   │       ├── format.ts
│   │       ├── walker.ts            # walk, buildParentMap
│   │       ├── parser/              # parseFile.ts, routeGraph.ts
│   │       ├── engine/              # ruleEngine, taintEngine, audits, testWriter
│   │       ├── sources/             # taint sources
│   │       ├── sinks/               # taint sinks
│   │       ├── sanitizers/
│   │       ├── utils/               # rule-types, helpers, …
│   │       ├── ai/                  # slopsquat, ipGuard, axiosBypass, envFallback, ai-analyzer
│   │       ├── proof/               # local proof-oriented test generators
│   │       ├── eslint-plugin.ts
│   │       └── index.ts
│   ├── tests/
│   │   ├── helpers.mjs
│   │   ├── fixtures/
│   │   └── unit/*.test.mjs          # node:test
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── package.json
└── .gitignore                   # includes dvna/, dist/, node_modules/
```

**Build:** `npm run build -w vibescan` → **`vibescan/dist/`** (often gitignored; publish uses `files: ["dist", "README.md"]` inside `vibescan/`).

**Local DVNA:** Clone to `./dvna` for benchmarks; folder is **gitignored** by default.

---

## Commands

```bash
npm install
npm run build                         # builds @jobersteadt/vibescan
npm run build:arch                    # builds secure-arch workspaces
npm run test -w @jobersteadt/vibescan # build + node --test vibescan/tests/unit/
npm run test:arch                     # secure-arch-core tests

# Scan application code only (avoid node_modules):
npx vibescan scan ./vibescan/src --format compact

# Local proof-oriented tests from static findings:
npx vibescan prove ./vibescan/src --output ./vibescan-generated-tests

# Optional architecture rulepack + checks:
npx secure-arch install --root .
npx secure-arch check --root . --code-evidence js-ts
```

---

## Research artifacts

| Path | Purpose |
|------|---------|
| [`results/dvna-evaluation.md`](../results/dvna-evaluation.md) | Current DVNA snapshot narrative, frozen versions, and provisional precision/recall |
| [`results/dvna-adjudication.md`](../results/dvna-adjudication.md) | Canonical per-finding TP/FP/FN adjudication sheet and FN policy |
| [`benchmarks/results/README.md`](../benchmarks/results/README.md) | Canonical location and naming policy for frozen run artifacts |
| `benchmarks/results/2026-03-25_222913_dvna_vibescan_v1.0.0+aa49247/` | Frozen VibeScan DVNA run (manifest + JSON output) |
| `benchmarks/results/2026-03-25_223217_dvna_bearer/` | Frozen Bearer DVNA run (manifest + JSON output) |
| `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/` | Frozen Snyk Code DVNA run + sensitivity notes |

---

## Maintenance

- **Rule IDs / CWE table:** Keep [`README.md`](../README.md) in sync when adding rules.
- **New AST rule:** Add `Rule` in `vibescan/src/attacks/...`, export from [`attacks/index.ts`](../vibescan/src/attacks/index.ts), add `tests/unit/*.test.mjs` using [`tests/helpers.mjs`](../vibescan/tests/helpers.mjs).

---

*Last updated to match current monorepo layout and published CLI surface.*

---

## docs/research-strengthening/README.md

<!-- Source: docs/research-strengthening/README.md -->

# Research strengthening — academic track (VibeScan)

This folder is the **paper/poster spine**: research question, methodology, evaluation, seeded benchmarks, metrics, and contribution boundaries. It deliberately **does not** own product positioning for **secure-arch** (see [Product vs research](#product-vs-research-secure-arch) below).

**Related materials**

| Audience | Location |
|----------|----------|
| Judges, poster tone | `docs/vibescan/judging-pack.md` |
| Conference abstract (working draft) | `docs/vibescan/abstract.md` |
| Reproducibility + benchmarks | `benchmarking-runbook.md`, `eval-output-and-cli-support.md` |
| Rule inventory vs tests | `docs/vibescan/rule-coverage-audit.md` |

## Documents in this folder

| File | Purpose |
|------|---------|
| [`research-question.md`](./research-question.md) | RQ, secondary questions, hypotheses, scope guardrails |
| [`methodology.md`](./methodology.md) | Study design, datasets, adjudication, threats to validity |
| [`evaluation-plan.md`](./evaluation-plan.md) | DVNA protocol, baselines, what gets scored |
| [`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md) | Synthetic corpus design tied to rule IDs |
| [`contribution-audit.md`](./contribution-audit.md) | What the paper claims vs what the repo proves |
| [`metrics-templates.md`](./metrics-templates.md) | Tables and definitions for TP/FP/FN and summaries |
| [`abstract-revision-notes.md`](./abstract-revision-notes.md) | Cleanup checklist for `docs/vibescan/abstract.md` |
| [`jober-newlayout-merge-strategy.md`](./jober-newlayout-merge-strategy.md) | Historical note on branch-splitting strategy (reference only) |

## Three tracks (keep mentally separate)

### 1. Research track (this folder + `docs/vibescan/`)

Ship on **`master`** via branch `docs/research-strengthening` (or equivalent): strengthen RQ, methodology, evaluation, seeded plan, metrics, abstract. **No dependency** on a monorepo rename landing first.

### 2. Product track (secure-arch)

**Worth keeping**, vendor-agnostic adapters and YAML settings are a **credible product extension**. For the **academic artifact**, treat secure-arch as **future work built on top of VibeScan**, not the evaluated core contribution—so the paper stays about the scanner + benchmark, not the architecture CLI.

### 3. Architecture / refactor track (historical)

Merge refactors only after build, tests, `vibescan`, and docs commands are verified—and prefer small PRs over large monolithic changes. Historical branch notes remain in [`jober-newlayout-merge-strategy.md`](./jober-newlayout-merge-strategy.md).

## Merge order (recommended)

1. **Merge research docs into `master`** (evaluation + methodology + abstract cleanup). Keeps the academic story stable while benchmarks are finalized.
2. **Keep product/refactor work decoupled** from research-doc merges.
3. **Carve refactors into mergeable pieces** after `npm install && npm run build && npm test` and `npx secure-arch check` / `npx vibescan scan …` are confirmed.

## Product vs research (secure-arch)

| Topic | Research paper | Product roadmap |
|-------|----------------|-----------------|
| VibeScan scanner + DVNA / seeded eval | **Primary** | Ships as npm / CLI |
| secure-arch, adapters, YAML rulepack | **Optional “future work”** or appendix | **Primary** for that product line |

This separation avoids reviewer confusion: one contribution story per submission.

---

## docs/research-strengthening/research-question.md

<!-- Source: docs/research-strengthening/research-question.md -->

# Research questions and hypotheses

Canonical academic framing for VibeScan. Judge-facing phrasing and novelty one-liners also live in `docs/vibescan/judging-pack.md`.

## Primary research question

Can **VibeScan**, a static scanner tailored to AI-assisted JavaScript/Node.js development, detect relevant security issues in benchmark applications more effectively than baseline tools while remaining academically honest about scope and limitations?

## Alternative primary research question (API surface / trust boundaries)

How effectively can a static analyzer tailored to LLM-generated JavaScript/TypeScript backends (**VibeScan**) detect **trust-boundary and API-surface** issues—not only injection payloads—alongside crypto and configuration failures, compared with commonly used SAST baselines, under a transparent manual adjudication protocol?

## Secondary research questions

1. Which vulnerability categories already implemented in VibeScan show the clearest detection advantage over baseline tools such as `eslint-plugin-security` and `npm audit`?
2. Do VibeScan’s AI-oriented checks, such as **SLOP-001** for suspicious npm dependencies and weak-secret / environment-fallback rules, add signal that general-purpose baselines do not emphasize?
3. Which VibeScan components contribute most to useful signal in practice: AST pattern rules, taint-flow checks, **Express route graph + middleware heuristics**, **OpenAPI-vs-code drift (API inventory)**, and optional project-level registry checks?
4. On benchmarked Node/Express applications, how does VibeScan’s coverage of **OWASP API Security (2023)**-relevant themes (e.g. inventory, missing auth on object-scoped routes, spec drift) compare to baselines such as **eslint-plugin-security** and **Snyk Code** that do not perform OpenAPI reconciliation?
5. How does category-level coverage (crypto, injection, middleware, **api_inventory**) compare to baseline tools with different scope assumptions?

## Hypotheses

### H1

On benchmark applications containing known first-party security issues, VibeScan will identify more manually adjudicated true positives than `eslint-plugin-security`.

### H2

For categories already implemented in the repository, especially weak secrets, environment fallbacks, injection patterns, and suspicious dependency checks, VibeScan will provide category coverage not fully matched by dependency-only tooling such as `npm audit`.

### H3

A reproducible benchmark protocol with frozen versions, clear inclusion/exclusion criteria, and manual adjudication will show that VibeScan is a credible **prototype research artifact**, even if the evaluation remains limited in sample size and external validity.

### H4

On seeded apps with an OpenAPI file paired with Express routes (`tests/fixtures/openapi-drift/`), VibeScan will emit **API-INV-001** / **API-INV-002** findings that **eslint-plugin-security** and baseline tools that do not reconcile OpenAPI-to-code will not produce in the same form, because those tools do not statically diff **documented vs implemented** HTTP operations by default.

## Scope guardrails

These questions are intentionally narrower than broad claims such as “VibeScan proves AI-generated code is insecure” or “VibeScan outperforms all security tools.” The current repository supports a **prototype scanner** and an **early-stage benchmark**, not universal claims.

## Claim boundaries

- These hypotheses concern **detection behavior**, not exploitability proof. **BOLA/IDOR** claims remain **heuristic**: static rules flag missing auth plumbing and inventory gaps; cross-user object access requires tests or runtime evidence.
- Baseline comparisons remain **incomplete** until all chosen tools are run under the same environment and inclusion/exclusion criteria.
- Registry-check hypotheses apply only when `--check-registry` is enabled and network conditions permit npm registry resolution.
- OpenAPI drift analysis applies when a valid **OpenAPI 3.x** or **Swagger 2.0** spec is supplied or discovered; Express route extraction remains **framework-limited** for the code side of the diff.

## Non-goals (explicit)

- Proving security of real production systems at scale.
- Replacing manual code review or dynamic testing.
- Claiming secure-arch or IDE adapter tooling as the evaluated scientific contribution unless a separate evaluation is added.

## OWASP mapping (reference)

- **OWASP Top 10 (2021):** crypto (`A02`), injection (`A03`), access control (`A01`) — via middleware/auth heuristics, not full authorization proofs.
- **OWASP API Security Top 10 (2023):** **API3** Broken Object Property Level Authorization (heuristic prep: `AUTH-005`, `API-POSTURE-001`), **API5** Broken Function Level Authorization (partial overlap with missing auth on routes), **API9** Improper Inventory Management (`API-INV-*`, `routeInventory`).

---

## docs/research-strengthening/methodology.md

<!-- Source: docs/research-strengthening/methodology.md -->

(Included verbatim below; some links were originally to `docs/vibescan/*.md` which are now sections in this combined file.)

# Methodology (draft)

## Study type

**Comparative static analysis** on a known vulnerable application (**DVNA**) and (planned) **seeded synthetic snippets**, with **manual adjudication** of tool outputs. This is an **artifact evaluation** of a research prototype, not a randomized controlled trial of developers.

## Research objective

Evaluate whether VibeScan’s implemented static-analysis pipeline (AST rules, taint checks, route/middleware audits, and optional registry checks) provides useful first-party vulnerability detection on Node/Express code relative to baseline tools, using conservative and reproducible measurement.

## Materials

| Corpus | Role | Ground truth |
|--------|------|--------------|
| **DVNA** | Realistic Node/Express attack surface | Theme- or finding-level labels from adjudication (see `docs/vibescan/adjudication-template.md` section above); align narrative with [`results/dvna-evaluation.md`](../../results/dvna-evaluation.md) |
| **Seeded benchmark** (planned) | Per-rule positives/negatives | Expected rule IDs documented per file ([`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md)) |

## Benchmark targets

1. **Primary benchmark (current):** DVNA (`appsecco/dvna`) using the protocol documented in `results/dvna-evaluation.md`.
2. **Secondary benchmark (planned):** seeded Node/Express micro-cases (see [`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md)).

## Tools under comparison

| Tool | What it measures | Notes |
|------|------------------|-------|
| **VibeScan** (`vibescan` / `secure`) | Custom OWASP/CWE-oriented rules, taint, Express route graph, optional registry check | Primary artifact |
| **eslint-plugin-security** | Generic JS security lint rules | Strong baseline for overlap analysis |
| **npm audit** | Known vulnerable dependencies | Complementary; not substitute for first-party bug finding |
| **Bearer** (optional) | SAST on repository | Same-environment run or omit row on poster |

## Version control / reproducibility requirements

- Record exact commit SHA for this repository.
- Record benchmark revision:
  - DVNA repository URL and commit/branch used.
- Freeze and record runtime/tool versions:
  - Node version
  - npm version
  - VibeScan version/commit
  - eslint version
  - eslint-plugin-security version
  - Bearer version (when run)
- Store exact command lines and raw outputs under `results/` or `benchmarks/results/`.
- Store adjudication sheet (CSV/Markdown) linking each counted TP/FP/FN to source evidence.

## Procedure (reproducible)

1. Pin **Node** version and **scanner** package version; record **DVNA commit** (or submodule hash).
2. Run tools per [`benchmarking-runbook.md`](./benchmarking-runbook.md); save outputs under `benchmarks/results/…` or legacy [`results/`](../../results/) with a completed manifest (see the `benchmark-manifest-template.json` noted in the `docs/vibescan/README.md` section).
3. **Adjudicate** a stratified sample (or full set if small) of findings into TP / FP / PP / dupe / out-of-scope.
4. Aggregate metrics per [`metrics-templates.md`](./metrics-templates.md).

## Inclusion and exclusion criteria

### Inclusion

- First-party benchmark source files intended for app logic (`.js/.ts/.mjs/.cjs`) in agreed benchmark scope.
- Findings attributable to a specific rule and file location.

### Exclusion

- Third-party/vendor/minified assets unless explicitly evaluated as a separate condition.
- Generated output folders (`dist`, build artifacts) unless benchmark objective explicitly includes generated code.
- Findings lacking enough context to adjudicate (mark as unresolved, do not force into TP/FP counts).

## Definition of true positive, false positive, false negative

- **True positive (TP):** Tool finding correctly identifies a seeded or benchmark-documented vulnerability-relevant condition within in-scope code under the selected protocol.
- **False positive (FP):** Tool finding classified as security-relevant by the tool but judged non-vulnerable/non-relevant for the benchmark objective after manual review.
- **False negative (FN):** A benchmark-documented or seeded vulnerability condition present in in-scope code that the tool fails to report.

Notes:

- For dependency scanners (`npm audit`), TP/FP/FN should be tracked in a **separate dependency-advisory table** to avoid false equivalence with line-level static findings.
- Some findings may be tagged as **Partial coverage** when the signal is related but does not directly satisfy the target benchmark condition.

## Manual adjudication process

1. Export findings for each tool with stable identifiers (`ruleId`, file, line, message).
2. Build a merged adjudication table with one row per benchmark condition and per-tool outcome.
3. Require two-pass review:
   - Pass A: initial label by reviewer 1.
   - Pass B: independent verification by reviewer 2 (or delayed second pass by same reviewer with blinded prior labels if team size constrained).
4. Resolve disagreements with written rationale and final consensus label.
5. Keep unresolved items separate from headline TP/FP/FN counts.
6. Archive adjudication artifacts in `results/` for traceability.

## Metrics to report

### Core metrics

- TP, FP, FN by tool.
- Precision = TP / (TP + FP).
- Recall = TP / (TP + FN).
- Category-level coverage (crypto vs injection vs project-level dependency signals).

### Supporting metrics

- Findings per KLOC (optional, for noise discussion).
- First-party vs vendor finding split.
- Rule-level contribution counts for VibeScan (which rules drove TPs).

## Threats to validity

| Threat | Mitigation (report in limitations) |
|--------|-------------------------------------|
| Single real-world app (*n*=1) | Add seeded corpus; state external validity limits |
| Manual labels subjective | Two readers on a subset; document rubric |
| Static analysis only | State no runtime exploit confirmation required for TP in your rubric—or require it and shrink TP set |
| Rule churn | Freeze commit + manifest for paper camera-ready |
| Baseline config sensitivity | Check in ESLint config used for DVNA ([`results/eslint-dvna.eslintrc.cjs`](../../results/eslint-dvna.eslintrc.cjs)) |

Additional threats to track explicitly:

1. **Benchmark representativeness:** DVNA is intentionally vulnerable and may not reflect production code distributions.
2. **Scope mismatch across tools:** `npm audit` and static linters operate on different abstraction levels; direct score comparisons can be misleading.
3. **Vendor noise sensitivity:** Inclusion of third-party/minified files can inflate findings and distort comparative signal.
4. **Manual adjudication bias:** Reviewer judgment can vary; disagreement protocol and written rationales are required.
5. **Environment drift:** Tool versions, network conditions (for registry checks), and benchmark revisions can change outcomes.
6. **Incomplete baseline execution:** Missing Bearer runs means current comparisons are preliminary and not yet complete.

## Ethics and safety

DVNA is intentionally vulnerable—run only in isolated environments. Do not point tools at unrelated third-party repos without permission.

---

## docs/research-strengthening/evaluation-plan.md

<!-- Source: docs/research-strengthening/evaluation-plan.md -->

(Included verbatim below; some links were originally to `docs/vibescan/*.md` which are now sections in this combined file.)

# Evaluation plan (draft)

## Objectives

1. Demonstrate that VibeScan produces **actionable, reviewable findings** on a standard vulnerable Node app (**DVNA**).
2. Compare **adjudicated** detection counts (and optionally precision/recall on seeded sets) against **eslint-plugin-security** and complementary **npm audit**.
3. Keep claims **bounded** to pinned versions, explicit file scope, and documented adjudication.

This plan extends the current preliminary DVNA work into a cleaner, academically defensible evaluation package without inventing data.

## Phase 1 — Freeze the protocol (before writing final numbers)

- [ ] Record DVNA **URL + commit** in manifest.
- [ ] Record **scanner repo commit** and `vibescan` version.
- [ ] Define **in-scope paths** (e.g. exclude `node_modules/`, tests if agreed).
- [ ] Save raw outputs: VibeScan JSON, ESLint JSON, `npm audit --json`, optional Bearer.

Commands and folder layout: [`benchmarking-runbook.md`](./benchmarking-runbook.md).

## DVNA benchmark cleanup (concrete checklist)

1. Freeze DVNA revision (record commit SHA) and rerun all tools against the same snapshot.
2. Enforce an explicit first-party scope:
   - Exclude vendor/minified assets in the primary table.
   - Optionally report vendor-inclusive sensitivity in appendix.
3. Keep the current adjudication logic from `results/dvna-evaluation.md`, but formalize it into a reproducible adjudication sheet.
4. Re-run baselines in a compatible environment when scope policy changes, and store raw logs/artifacts in `benchmarks/results/`.
5. Regenerate summary table with no “implied completeness” wording.

## Phase 2 — Adjudication

- [ ] Import findings into a spreadsheet from machine-readable outputs.
- [ ] Label each row using the `docs/vibescan/adjudication-template.md` section above.
- [ ] Summarize by **OWASP theme** or **CWE family** (match poster table).

## Phase 3 — Metrics

- [ ] Fill summary tables in [`metrics-templates.md`](./metrics-templates.md).
- [ ] Separate **motivation citations** (industry/preprint) from **your** adjudicated counts in prose (see the `docs/vibescan/judging-pack.md` section above).

## Phase 4 — Seeded benchmark (recommended extension)

- [ ] Implement minimal `benchmarks/seeded/` per [`seeded-benchmark-plan.md`](./seeded-benchmark-plan.md).
- [ ] Report per-rule **detection rate** on positives and **false alarm rate** on negatives (where labels are unambiguous).

## Baseline tools to compare against

- **VibeScan** (primary system under test).
- **eslint-plugin-security** (syntax/rule baseline).
- **Bearer** (SAST baseline).
- **Snyk Code** (SAST baseline; keep sensitivity analysis separate when scope differs).
- **npm audit** (dependency advisory baseline; report in separate dependency-focused table).

## Baseline fairness checklist

- ESLint: same Node project, documented config, same paths as VibeScan where possible.
- npm audit: run from app root; clarify it does **not** target the same defect classes as static first-party rules.
- Bearer/Snyk Code: run with documented versions; if scope differs, separate primary table vs sensitivity appendix.

## Exact metrics

For line-level/static findings (VibeScan, eslint, Bearer):

- TP, FP, FN (per benchmark and overall).
- Precision, recall.
- Per-category coverage:
  - crypto-related,
  - injection-related,
  - middleware/config-related,
  - project-level dependency checks (reported separately where appropriate).

Supporting metrics:

- First-party-only vs vendor-inclusive finding counts.
- Rule-level contribution counts (which VibeScan rules generate TPs).
- Runtime cost per tool (optional but useful for practical discussion).

For `npm audit`:

- Advisory counts and severity distribution (do not directly merge into line-level TP/FP/FN unless mapping protocol is explicitly defined).

## Deliverables for the paper/poster

| Deliverable | Location |
|-------------|----------|
| Raw logs | `results/` or `benchmarks/results/<run-id>/` |
| Methodology prose | This file + `docs/research-strengthening/methodology.md` section above |
| Rule ↔ evidence | the `docs/vibescan/rule-coverage-audit.md` section above |
| Contribution boundaries | [`contribution-audit.md`](./contribution-audit.md) |

## Expected poster/paper outputs (optional structure)

### Table_A_BenchmarkSetup

- Dataset, commit SHA, file-scope policy, tool versions, command lines.

### Table_B_MainDetectionMetrics_FirstPartyOnly

- Tool vs TP/FP/FN/Precision/Recall.

### Table_C_PerCategoryCoverage

- Category rows; tools as columns.

### Table_D_DependencyLevelFindings_Separate

- `npm audit` and optional VibeScan project-level checks (`SLOP-001`) where applicable.

### Figure_1_PipelineDiagram

- VibeScan architecture (AST rules + taint + route graph + optional registry checks).

### Figure_2_ErrorProfile

- Stacked bars for FP vs TP by category across tools.

## Conservative interpretation policy

- Treat current DVNA results as a **scope-limited snapshot** until multi-target replication is complete.
- Avoid claims of “best overall” without cross-benchmark parity and fixed scope policy.
- Keep a dedicated limitations paragraph tied to benchmark representativeness and adjudication subjectivity.

---

## docs/research-strengthening/seeded-benchmark-plan.md

<!-- Source: docs/research-strengthening/seeded-benchmark-plan.md -->

# Seeded benchmark plan (design)

## Purpose

DVNA gives **realism** but a small *n* and noisy labels. A **seeded** corpus gives:

- Per-rule **positive** and **negative** examples with **expected** rule IDs (or expected silence).
- Regression support when output format or ordering changes.
- Clearer **precision/recall** stories for specific CWE families.

## Case catalog (initial set)

Goal: define small, auditable benchmark cases mapped to **implemented** VibeScan rules.

| Case ID | Vulnerability type | Short app scenario | Vulnerable pattern to seed | Expected VibeScan rule(s) | Baseline may miss? |
|---|---|---|---|---|---|
| SB-01 | Hardcoded secret | Express app signs session/JWT with literal secret | `const SECRET = "supersecretkey"` | `crypto.secrets.hardcoded` | Yes, some generic linters do not focus on weak-secret literals with this specificity |
| SB-02 | Weak env fallback secret | Service reads `process.env.JWT_SECRET || "changeme"` | Literal fallback for missing env | `SEC-004` | Yes, fallback-specific detection is often absent |
| SB-03 | Weak JWT signing key | Login route uses predictable JWT secret | `jwt.sign(payload, "secret123")` | `crypto.jwt.weak-secret-literal` | Possible |
| SB-04 | SQL injection (concat) | `/user?id=...` query endpoint | `db.query("SELECT ... " + req.query.id)` | `injection.sql.string-concat`, possible taint finding (`injection.sql.tainted-flow`) | Less likely for syntax-only tools if pattern differs |
| SB-05 | Command injection | File utility endpoint shells out with user arg | `exec("ls " + req.query.path)` | `injection.command`, taint command-flow finding | Usually detectable, but taint quality varies |
| SB-06 | Path traversal | Download endpoint joins user path directly | `fs.readFile("./files/" + req.params.name)` | `injection.path-traversal` | Possible |
| SB-07 | Log injection | Auth endpoint logs raw username/password line | `logger.info("user=" + req.body.user)` | `injection.log` | Often missed by generic security sets |
| SB-08 | XSS sink | Template endpoint writes user input into HTML sink | `res.send("<div>" + req.query.q + "</div>")` with `innerHTML`-like sink in frontend helper | `injection.xss` | Possible |
| SB-09 | SSRF guard anti-pattern | Outbound fetch guarded only by `ip.isPublic` | URL fetch after weak IP-based gate | `SSRF-003` | Yes, this is specialized |
| SB-10 | axios baseURL bypass pattern | API proxy uses `axios({ baseURL, url: req.query.next })` | User-controlled URL combined with baseURL assumptions | `RULE-SSRF-002` | Yes, this is specialized |
| SB-11 | Slopsquat dependency reference | `package.json` contains non-existent dependency name | e.g. `"expresss": "^4.0.0"` and run with `--check-registry` | `SLOP-001` project-level finding | Yes, source linters generally do not do registry HEAD checks |
| SB-12 | Prototype pollution path/key pattern | Merge/set endpoint accepts attacker-controlled path keys | e.g. `_.set(obj, req.body.path, req.body.value)` with `constructor.prototype` path | taint/prototype findings (e.g. `injection.prototype-pollution.tainted-flow`, `PROTOTYPE_POLLUTION` kind) if triggered by implementation | Often missed or inconsistently flagged |
| SB-13 | OpenAPI drift / API inventory | Express app with routes both inside and outside published OpenAPI | Pair `app.js` + `openapi.yaml` with mismatched paths | `API-INV-001`, `API-INV-002`; optional `API-POSTURE-001`, `AUTH-005` | Yes — typical baselines do not reconcile code routes to a spec |

SB-13 reference implementation: [`tests/fixtures/openapi-drift/`](../../tests/fixtures/openapi-drift/) and [`tests/unit/openapi-drift.test.mjs`](../../tests/unit/openapi-drift.test.mjs).

## Physical layout (repo)

Align with [`benchmarking-runbook.md`](./benchmarking-runbook.md):

```text
benchmarks/seeded/
├── README.md              # Ground-truth table: path → expected rule IDs / none
├── crypto/
├── injection/
├── middleware/            # Express-only cases for AUTH/MW-* if desired
└── mixed/
```

Start by **promoting** high-value cases from `tests/fixtures/` and inline strings in `tests/unit/*.test.mjs`, then deduplicate.

## Ground-truth table (required)

In `benchmarks/seeded/README.md`, maintain a matrix:

| Relative path | Expect rule IDs (substring or exact) | Expect zero high-severity? | Notes |
|---------------|----------------------------------------|----------------------------|-------|

Use the same `ruleId` strings VibeScan emits (see the `docs/vibescan/rule-coverage-audit.md` section above).

## Coverage priorities (from current test gaps)

Prioritize seeds for rules that lack dedicated unit tests today, e.g.:

- `crypto.jwt.weak-secret-literal`
- `mw.cookie.missing-flags`
- `RULE-SSRF-002`
- Engine IDs `MW-002`, `MW-003`, `MW-004` (if in scope for the paper)

## Benchmark execution notes

1. Keep each case minimal and isolated to one primary vulnerability pattern.
2. Define one expected vulnerable location per case to simplify adjudication.
3. Run each tool with clearly documented commands and fixed versions.
4. For project-level slopsquat case (SB-11), evaluate separately from line-level static findings.
5. Store all seeded apps and labels in a dedicated benchmark folder (future implementation item).

## Running the seeded suite

Use the same command as DVNA, pointed at `benchmarks/seeded/`:

```bash
npx vibescan scan benchmarks/seeded --format json --project-root benchmarks/seeded > benchmarks/results/<run-id>/vibescan-seeded.json
```

Automated checking can be a **small script** (future work) that parses JSON and compares to the README table—keep it out of the core scanner if you want zero detection churn.

## Adjudication guidance

- A case counts as TP for a tool when at least one finding correctly maps to the seeded vulnerable location and intended vulnerability type.
- Report partial matches separately (e.g., related warning but not exact seeded mechanism).
- For prototype pollution and SSRF-specialized checks, include reviewer notes because semantic interpretation can vary by tool.

## Relationship to academic claims

- **DVNA** supports external validity (“real app”).
- **Seeded** supports internal validity (“rule does what we say on controlled samples”).
- The paper should state which metrics come from which corpus.

---

## docs/research-strengthening/benchmarking-runbook.md

<!-- Source: docs/research-strengthening/benchmarking-runbook.md -->

# Benchmarking runbook (reproducible runs + folder layout)

This document consolidates:

- the proposed `benchmarks/` directory layout, and
- the step-by-step runbook for reproducible DVNA/seeded executions (VibeScan + baselines).

It is intended to be the canonical reference for **how to run** and **where to store** benchmark artifacts.

## Goals

- **Reproducibility**: pin commits, tool versions, scan scope, and exact commands per run.
- **Comparability**: document scope policy so different tools are run on comparable file sets where feasible.
- **Evidence quality**: keep raw logs + machine-readable JSON for adjudication and appendices.

## Canonical benchmark directory layout

```text
benchmarks/
├── dvna/                    # DVNA checkout strategy + pinned revision notes
│   └── README.md
├── seeded/                  # Synthetic / minimal corpora (safe to commit)
│   ├── README.md
│   ├── crypto/
│   ├── injection/
│   ├── middleware/
│   └── mixed/
├── scripts/                 # Repro runners (bash/PowerShell) + helpers
│   └── README.md
└── results/                 # Append-only run outputs + manifests
    ├── README.md
    └── YYYY-MM-DD_<benchmark>_<tool>_v<versionOrGitShort>/
        ├── manifest.json
        ├── vibescan-project.json
        ├── vibescan-human.txt
        ├── eslint-security.json
        ├── npm-audit.json
        ├── bearer.json
        └── notes.md
```

Notes:

- Prefer DVNA as a submodule or a documented clone+checkout; avoid committing huge clones directly.
- `benchmarks/seeded/` is intended to be committed (small, auditable).
- `benchmarks/results/` is append-only evidence; decide whether to keep large outputs in-repo vs attached artifacts/releases.

## Prerequisites

- **Node.js 18+**
- Dependencies installed at repo root: `npm install`
- **VibeScan built**: `npm run build -w vibescan` (or `npm run build` if defined)
- Optional baselines:
  - **Bearer** CLI available on `PATH`
  - **eslint-plugin-security** config for the target project (DVNA may need a local config)

## Run metadata (minimum required)

For each run, record:

- scanner repo commit SHA
- benchmark repo/dataset revision (DVNA commit, or seeded revision)
- Node/npm versions
- tool versions (VibeScan/eslint/npm audit/Bearer)
- scope policy (included/excluded paths/globs)
- exact command lines

Use the manifest template:

- `docs/vibescan/benchmark-manifest-template.json`

## Build the scanner

POSIX:

```bash
npm install
npm run build -w vibescan
npx vibescan scan vibescan/src --format compact
```

PowerShell:

```powershell
npm install
npm run build -w vibescan
npx vibescan scan vibescan/src --format compact | Select-Object -First 5
```

## Run VibeScan (static)

Pseudocode:

```text
TARGET = benchmarks/dvna/<app-root>   # or benchmarks/seeded/
OUT    = benchmarks/results/<run-id>/

npx vibescan scan TARGET --format json --project-root TARGET > OUT/vibescan-project.json
npx vibescan scan TARGET --format human               > OUT/vibescan-human.txt

# Optional registry signal:
npx vibescan scan TARGET --check-registry --project-root TARGET --format json > OUT/vibescan-with-registry.json
```

## Run eslint-plugin-security (baseline)

DVNA may not ship ESLint security rules; reuse/adapt `results/eslint-dvna.eslintrc.cjs` if needed.

```bash
cd "$TARGET"
npx eslint . --ext .js,.cjs,.mjs -f json -o "$OLDPWD/$OUT/eslint-security.json" || true
```

## Run npm audit (baseline)

```bash
cd "$TARGET"
npm audit --json > "$OLDPWD/$OUT/npm-audit.json" || true
```

Important: `npm audit` is dependency advisory scope; do not directly mix it into line-level TP/FP/FN without an explicit mapping protocol.

## Run Bearer (optional baseline)

```bash
cd "$TARGET"
bearer scan . --format json --output-path "$OLDPWD/$OUT/bearer.json"
```

If Bearer is unavailable, record the skip explicitly in the run notes/manifest.

## Finalize the run output folder

1. Copy `docs/vibescan/benchmark-manifest-template.json` to `OUT/manifest.json`
2. Fill the required fields (commits, versions, scope policy, commands, notes)
3. Keep `notes.md` for environment quirks (offline registry, ESLint parse failures, etc.)

## Integrity checklist (for reviewers)

- Manifest references the exact benchmark revision.
- Scanner build matches the documented repo commit.
- Outputs are untouched after run (optional: hash artifacts).

---

## docs/research-strengthening/eval-output-and-cli-support.md

<!-- Source: docs/research-strengthening/eval-output-and-cli-support.md -->

# Evaluation output + CLI support (formatter-only improvements)

This document consolidates the evaluation-oriented notes about **machine-readable summaries**, **benchmark metadata**, and **scope control** without changing detection logic.

## Goal

Enable clean, repeatable evaluation artifacts (JSON schema stability, deterministic ordering, summaries) with changes limited to:

- formatting layer (`formatProjectJson`)
- CLI plumbing (flags, file selection)
- documentation/schema/tests

## Current state (high-level)

- JSON project output is produced by `formatProjectJson` in `src/system/format.ts`.
- CLI `--format json` routes through `src/system/cli/index.ts`.
- Types live in `src/system/types.ts` (e.g., `Finding`, `ProjectScanResult`).

## Recommended extension points (safe order)

### 1) Add a `summary` block in `formatProjectJson` (lowest risk)

Add computed fields alongside existing keys (no detection changes):

- `summary.ruleCounts: Record<string, number>`
- `summary.severityCounts`
- `summary.categoryCounts`
- `summary.findingsPerFile`

### 2) Gate benchmark-only fields behind a flag/env

Keep default output stable; enable evaluation fields only when:

- `--benchmark-metadata` is set, or
- env `VIBESCAN_BENCHMARK=1` is present

### 3) Add `--ignore-glob` / benchmark exclude defaults

Allow repeatable scope control (vendor/minified/dist) without touching engines; implement only in CLI file expansion.

### 4) Deterministic ordering for diffs

Sort findings only in the JSON formatter by a stable key (e.g., `(filePath, line, column, ruleId)`).

### 5) Canonical rule grouping (non-breaking)

If desired, add a derived field like `ruleFamily` (or `ruleIdCanonical`) without changing existing `ruleId` strings.

## What not to change in this track

- rule engines (AST rules, taint, middleware audits)
- rule registration/coverage (e.g., enabling prototype pollution experiments) unless the evaluation scope explicitly includes it

## Schema + tests

- Keep the JSON schema up to date:
  - `docs/vibescan/vibescan-benchmark-output.schema.json`
- Add a unit test under `tests/unit/` that asserts summary counts are correct for a minimal project scan.

---

## docs/research-strengthening/metrics-templates.md

<!-- Source: docs/research-strengthening/metrics-templates.md -->

# Metrics templates

Copy sections into spreadsheets or the paper appendix. Definitions should match the adjudication rubric (see the `docs/vibescan/adjudication-template.md` section above).

This file is the consolidated “ready to fill” template for DVNA + seeded reporting.

(Included verbatim below.)

# Metrics templates

Copy sections into spreadsheets or the paper appendix. Definitions should match the adjudication rubric (see the `docs/vibescan/adjudication-template.md` section above).

This file is the consolidated “ready to fill” template for DVNA + seeded reporting.

## 0. Definitions (for scoring)

### Scope terms

- **In-scope findings (first-party static):** findings whose file paths are within the benchmark scope after applying the run’s include/exclude policy.
- **Ground truth population:** the set of expected vulnerabilities for scoring. For seeded runs, this is the expected rule IDs listed in `benchmarks/seeded/README.md`.
- **Out-of-scope findings:** real signals that are intentionally excluded from the scoring population for the run (report separately; exclude from precision/recall denominators).

### Adjudication labels

- `tp`: true positive
- `fp`: false positive
- `pp`: partial / context-dependent
- `dupe`: duplicate of another finding
- `out_of_scope`: excluded by scope policy or outside the defined scoring population

### Computing TP/FP/FN

- **TP/FP** are derived from adjudicated, in-scope reported findings.
- **FN** must be derived from absence against an explicit ground-truth expectation list (e.g., “expected-but-not-found” section in an adjudication sheet).

### Precision/Recall variants

- **Standard (with PP)**: precision \(=\frac{TP+PP}{TP+PP+FP}\), recall \(=\frac{TP+PP}{TP+PP+FN}\)
- **Conservative**: precision \(=\frac{TP}{TP+FP}\), recall \(=\frac{TP}{TP+FN}\)

## 1. Run metadata (required)

| Field | Value |
|-------|-------|
| Run ID | |
| Date (UTC) | |
| Scanner repo commit | |
| Benchmark app + commit | |
| Node version | |
| `vibescan` version | |
| ESLint version | |
| eslint-plugin-security version | |
| npm audit (npm CLI) version | |
| Bearer version (or N/A) | |

## 2. Counts by tool (raw)

| Tool | Total findings | Files with ≥1 finding |
|------|----------------|------------------------|
| VibeScan | | |
| eslint-plugin-security | | |
| npm audit (vulnerabilities) | | |
| Bearer | | |

## 2b. Per-tool TP / FP / FN (first-party code scope)

| Tool | TP | FP | FN | Notes |
|---|---:|---:|---:|---|
| VibeScan | TODO | TODO | TODO | |
| eslint-plugin-security | TODO | TODO | TODO | |
| Bearer | TODO | TODO | TODO | Pending if not run |

## 2c. Dependency/project-level findings (separate scope)

| Tool | Matched vulnerable dependency/project condition (count) | Unmatched alerts (count) | Notes |
|---|---:|---:|---|
| npm audit | TODO | TODO | Advisory-level, not line-level |
| VibeScan (`--check-registry`) | TODO | TODO | `SLOP-001` project-level findings |

## 3. Adjudicated VibeScan (DVNA)

| Label | Count | % of VibeScan findings |
|-------|-------|-------------------------|
| TP | | |
| FP | | |
| PP (context-dependent) | | |
| Dupe | | |
| Out of scope | | |

## 4. Adjudicated baseline (eslint-plugin-security) — same rubric

| Label | Count |
|-------|-------|
| TP | |
| FP | |
| PP | |
| Dupe | |
| Out of scope | |

## 4b. Precision / Recall (scope-aligned only)

For each tool (where TP/FP/FN are defined in the same scope):

- Precision = TP / (TP + FP)
- Recall = TP / (TP + FN)

| Tool | Precision | Recall | F1 (optional) | Scope |
|---|---:|---:|---:|---|
| VibeScan | TODO | TODO | TODO | first-party static |
| eslint-plugin-security | TODO | TODO | TODO | first-party static |
| Bearer | TODO | TODO | TODO | first-party static |

## 5. Theme alignment (optional, for poster)

Map each **TP** to a column (Injection, Auth, Sensitive Data, Logging, etc.); keep mapping rules explicit in a footnote.

| Theme | VibeScan TP | Baseline TP |
|-------|-------------|-------------|
| | | |

## 5b. Per-category coverage (optional)

| Category | Benchmark positives | VibeScan TP | eslint TP | Bearer TP | Notes |
|---|---:|---:|---:|---:|---|
| Injection | TODO | TODO | TODO | TODO | |
| Crypto / secrets | TODO | TODO | TODO | TODO | |
| SSRF-related checks | TODO | TODO | TODO | TODO | |
| Prototype pollution | TODO | TODO | TODO | TODO | |
| Middleware / config signals | TODO | TODO | TODO | TODO | |
| Project-level dependency checks | TODO | TODO | TODO | TODO | separate-scope caveat |

## 6. Seeded benchmark (when available)

| Rule ID (or family) | Positives in corpus | True detections | False negatives | Negatives in corpus | False positives |
|---------------------|---------------------|-----------------|---------------|---------------------|-----------------|
| | | | | | |

## 6b. Benchmark summary

| Benchmark | Repo / dataset revision | File scope policy | Tools run | Completion status |
|---|---|---|---|---|
| DVNA | TODO SHA | TODO | VibeScan, eslint, npm audit, Bearer | TODO |
| Seeded suite | TODO revision | TODO | VibeScan, eslint, Bearer | TODO |

## 6c. Qualitative lessons learned

| Theme | Evidence | Confidence (low/med/high) | Action |
|---|---|---|---|
| Tool-scope mismatch affects comparability | TODO | TODO | Keep separate tables by scope |
| Vendor/minified code inflates noise | TODO | TODO | Enforce first-party policy |
| Specialized rules provide unique signals | TODO | TODO | Report rule-level contribution counts |
| Baseline incompleteness limits claims | TODO | TODO | Mark as preliminary until completed |

## 6d. Reproducibility log snippet

| Item | Value |
|---|---|
| VibeScan repo commit | TODO |
| Node version | TODO |
| npm version | TODO |
| eslint version | TODO |
| eslint-plugin-security version | TODO |
| Bearer version | TODO |
| Benchmark revision(s) | TODO |
| Command log path(s) | TODO |

## 7. Reporting guardrails

- Report **adjudicated** counts for headline comparisons, not raw tool output counts.
- State whether **PP** counts are grouped with TP or FP for the headline metric.
- If Bearer or any baseline is missing, write **N/A** and do not leave blank cells on the poster.

---

## docs/research-strengthening/contribution-audit.md

<!-- Source: docs/research-strengthening/contribution-audit.md -->

# Contribution audit — claims vs repository

Use this table to keep the **paper/poster** aligned with what is **actually evaluated** and shipped in the repo.

(Included verbatim below.)

# Contribution audit — claims vs repository

Use this table to keep the **paper/poster** aligned with what is **actually evaluated** and shipped in the repo.

## Contribution evidence matrix (detailed)

Evidence basis:

- `README.md`
- `docs/REPO-HANDOFF.md`
- `docs/vibescan/abstract.md`
- `results/dvna-evaluation.md`

| Claimed contribution | Where implemented in repo | Where demonstrated | Where evaluated | Status |
|---|---|---|---|---|
| Spec-free AST endpoint extraction and route graphing for Express-style backends | `vibescan/src/system/parser/routeGraph.ts`, `vibescan/src/system/scanner.ts`, documented in `docs/REPO-HANDOFF.md` | CLI pipeline docs in `README.md` and `docs/REPO-HANDOFF.md`; available in code path during `scanProjectAsync` | No dedicated quantitative ablation isolating route-graph contribution in `results/dvna-evaluation.md` | **Partially supported** |
| Persistent generated security test files (`--generate-tests`) | `vibescan/src/system/engine/testWriter.ts`, CLI flags in `vibescan/src/system/cli/index.ts` | Feature documented in `README.md`; callable via CLI | No benchmark section measuring generated-test quality or impact | **Partially supported** |
| LLM default secret dictionary and weak fallback detection | `vibescan/src/attacks/crypto/secretDict.ts`, `vibescan/src/attacks/crypto/default-secret-fallback.ts`, `vibescan/src/attacks/crypto/jwt-weak-sign.ts` | Rule list in `README.md`; implementation details in `docs/REPO-HANDOFF.md` | DVNA notes include crypto/secret-related signals, but no isolated dictionary ablation yet | **Partially supported** |
| Slopsquatting detector via npm registry checks (`SLOP-001`) | `vibescan/src/system/ai/slopsquat.ts`, wired in `vibescan/src/system/scanner.ts` and CLI `--check-registry` | Documented usage in `README.md` and architecture in `docs/REPO-HANDOFF.md` | Not separately quantified in current DVNA comparison tables | **Partially supported** |
| Taint-style source-to-sink detection for injection classes | `vibescan/src/system/engine/taintEngine.ts` and sinks/sources modules under `vibescan/src/system/sinks` and `vibescan/src/system/sources` | Described in `docs/REPO-HANDOFF.md`; surfaced in findings (e.g., SQL tainted flow) | Preliminary DVNA table reports injection-related TPs | **Partially supported** |
| Comparative advantage over eslint-plugin-security on DVNA first-party code | Implemented via tool runs and manual adjudication artifacts in `results/` | Summarized in `results/dvna-evaluation.md` | Reported as preliminary: VibeScan vs eslint on first-party adjudicated TPs | **Partially supported** |
| Complete multi-baseline comparison including Bearer and Snyk Code | Baseline artifacts in `benchmarks/results/` and narrative in `results/dvna-evaluation.md` | Captured run manifests and outputs for VibeScan, eslint-plugin-security, Bearer, and Snyk Code | Available as DVNA snapshot; cross-benchmark replication still future work | **Partially supported** |

## Tier A — Safe to claim as primary contributions (if evaluation supports)

| Claim | Evidence in repo | Risk if overstated |
|-------|------------------|--------------------|
| Static rule set for crypto + injection-oriented JS/TS patterns | `vibescan/src/attacks/`, root README rule table | “Catches all bugs” |
| Express route extraction + middleware-style audits | `routeGraph`, `middlewareAudit`, `appLevelAudit` | Only fires on patterns the graph recognizes |
| Optional npm registry check (slopsquat signal) | `SLOP-001`, `--check-registry` | Network-dependent; define “skip” handling |
| Open prototype + reproducible CLI | `vibescan` / `secure`, build scripts | Maturity not same as commercial SAST |
| Comparative evaluation vs baseline(s) on DVNA | `results/dvna-evaluation.md` + adjudication | *n*, label subjectivity |

## Tier B — Mention as engineering features; evaluation optional

| Claim | Evidence | Note |
|-------|----------|------|
| Generated security test stubs | `--generate-tests`, `testWriter` | Separate user study needed to claim impact |
| AI scan mode | `--mode ai` | Disclosure: model-dependent; not default static eval |
| ESLint plugin surface | `eslint-plugin` export | Good for adoption; not required for DVNA story |

## Tier C — Product / architecture extension (not the core paper contribution unless separately evaluated)

| Topic | Location | Paper treatment |
|-------|----------|-----------------|
| secure-arch CLI, YAML settings, evidence checks | `vibescan/packages/secure-arch-*`, `docs/secure-arch/` | **Future work** or one sentence “orthogonal tooling” |
| Cursor / Amazon Q adapters | `vibescan/packages/secure-arch-adapters` | Same |

## Tier D — Not currently part of the default scanner

| Artifact | Status |
|----------|--------|
| `prototypePollution.ts` | Present; **not** registered in `attacks/index.ts` |
| `jwt-weak-test.ts` | Built; **not** in active rule list |

Do not claim these as evaluated rules unless you wire + test + benchmark them.

## Abstract claim-strength check (guardrails)

The current abstract is directionally aligned but has several claims that should remain carefully bounded:

1. **Claim:** DVNA comparison is presented with cross-tool numeric contrast.\n   **Evidence status:** Supported as a **scope-limited snapshot/manual adjudication** in `results/dvna-evaluation.md`.\n   **Risk:** Can be read as a universal ranking if caveats are not explicit.\n   **Recommendation:** Keep wording as “snapshot” and pair all numbers with scope limitations.
2. **Claim:** Several contributions are framed as established project advances.\n   **Evidence status:** Implemented in code and docs; quantitative validation is incomplete for some.\n   **Risk:** Readers may infer all contributions are empirically validated.\n   **Recommendation:** Separate “implemented contributions” from “measured findings” in abstract structure.
3. **Claim:** Architectural lesson (downstream scanning > prompt engineering) is presented strongly.\n   **Evidence status:** Motivated by literature and project experience, but not fully causal-tested within this repo.\n   **Risk:** Overinterpretation as a causal conclusion from current experiments alone.\n   **Recommendation:** Attribute as a design position informed by literature plus preliminary benchmark evidence.

## Overclaim guardrails for poster/paper

- Do not describe DVNA snapshot results as universal across apps or frameworks.
- Do not present seeded-benchmark outcomes until cases are implemented and adjudicated.
- Distinguish **implemented** features from **evaluated** features in all tables.

## secure-arch vs VibeScan (one sentence for abstract)

> **VibeScan** is the evaluated static scanner; **secure-arch** is a separate, portable architecture-and-settings layer that can sit beside it in a product stack but is **out of scope** for the current benchmark numbers.

Adjust if you later run an evaluation that includes secure-arch checks.

---

## docs/research-strengthening/results-index.md

<!-- Source: docs/research-strengthening/results-index.md -->

# Results index (DVNA + benchmark runs)

This is the canonical index for evaluation evidence in the repo.

## 1) DVNA narrative + preliminary tables (legacy location)

- `results/dvna-evaluation.md`: current DVNA comparison writeup (frozen runs + adjudicated status snapshot).
- `results/dvna-adjudication.md`: canonical per-finding TP/FP/FN adjudication sheet and FN policy.
- Legacy raw logs (DVNA run captures):
  - `results/vibescan-dvna.txt`
  - `results/eslint-dvna.txt`
  - `results/npm-audit-dvna.txt`
  - `results/bearer-dvna.txt`

These legacy captures pre-date the standardized `benchmarks/results/` run-folder layout.

## 2) Standardized benchmark run outputs (canonical artifact tree)

Run folders live under:

- `benchmarks/results/`

Each run folder should contain:

- `manifest.json` (copied from `docs/vibescan/benchmark-manifest-template.json`)
- tool artifacts (JSON/logs)
- optional `notes.md`
- optional adjudication exports (e.g., `adjudication.md`, `findings.csv`)

See:

- `benchmarks/results/README.md` for naming and folder expectations
- `benchmarks/results/archive/README.md` for the pointer back to legacy `results/`

## 3) Scripts that generate benchmark runs

- `benchmarks/scripts/README.md` for the runner scripts and environment variables.

## 4) How to “graduate” a legacy DVNA capture into a paper-grade run

1. Re-run tools on a pinned DVNA commit with an explicit scope policy.
2. Create a dated run folder under `benchmarks/results/<run-id>/`.
3. Copy in tool outputs and fill `manifest.json`.
4. Link the run folder from `results/dvna-evaluation.md` (or a successor writeup if you move that narrative later).

---

## docs/research-strengthening/abstract-revision-notes.md

<!-- Source: docs/research-strengthening/abstract-revision-notes.md -->

# Abstract revision notes

Working draft: `docs/vibescan/abstract.md`.  
Framing reference: `docs/vibescan/judging-pack.md`.

## Cleanup checklist

- [ ] **Lead with RQ + evaluation** in the first sentence or two (form word limit may require shortening lit review).
- [ ] **Separate** motivation statistics (Spracklen, SusVibes, BaxBench, etc.) from **your** DVNA adjudicated numbers—one paragraph boundary minimum.
- [ ] **Bearer:** either same-environment result, explicit “not run,” or remove the row from any comparison table referenced in the abstract.
- [ ] **Cite tiers:** mark industry vs peer-reviewed consistently with `docs/vibescan/judging-pack.md`.
- [ ] **Contribution list:** align bullet wording with [`contribution-audit.md`](./contribution-audit.md)—drop or soften features not in Tier A unless you evaluate them.
- [ ] **secure-arch / adapters:** omit from abstract unless the submission is explicitly about that product; if mentioned, one clause as **future / orthogonal** tooling.
- [ ] **Reproducibility:** one clause pointing to `results/` or `benchmarks/results/` + manifest (after you migrate).
- [ ] **Limitations:** one sentence (static, heuristic, Node-focused, small *n*).

## Suggested paragraph order (research-led)

1. **RQ** + one-line method (static scanner for AI-assisted Node stacks).
2. **Evaluation** — DVNA + adjudication + baseline tool(s); where raw artifacts live.
3. **Headline result** — adjudicated TP comparison (if frozen).
4. **Motivation** — 1–2 citations, properly tiered.
5. **Takeaway** — pipeline / shift-left lesson without overclaiming.

## Word-count discipline

After edits, re-count against the web form limit. Prefer cutting duplicate adjectives and secondary citations over dropping evaluation or reproducibility clauses.

---

## docs/research-strengthening/jober-newlayout-merge-strategy.md

<!-- Source: docs/research-strengthening/jober-newlayout-merge-strategy.md -->

# Carving `Jober/NewLayout` into mergeable pieces

**Intent:** Keep **research merges** independent of **layout/refactor** work. Academic work should land on `master` from `docs/research-strengthening` (or similar) without waiting for a megamerge.

**Hybrid layout (this repo’s `main`):** The scanner lives under **`vibescan/`**. **secure-arch** is under `vibescan/packages/secure-arch-*`, `vibescan/architecture/secure-rules/`, and `docs/secure-arch/`—NewLayout features without relocating VibeScan into a nested scanner package.

## What to verify on `Jober/NewLayout` first

Run from repo root on that branch:

```bash
npm install
npm run build -w vibescan
npm test -w vibescan
npx vibescan scan ./vibescan/src --format compact
npx secure-arch check --root . --code-evidence js-ts
```

Document results in the PR that proposes merging layout changes. If any command fails, **do not** merge to `master` until fixed or the PR is split.

## Suggested slice order (smallest risk first)

### Slice 1 — Documentation only

- Research docs under `docs/research-strengthening/` and updates under `docs/vibescan/`.
- **Target branch:** `master` (or merge `origin/docs/research-strengthening` and reconcile with local files).

**No** package moves required.

### Slice 2 — secure-arch as self-contained packages

- Anything under `vibescan/packages/secure-arch-*`, `docs/secure-arch/`, templates—**if** paths in READMEs and CLI still resolve from root after merge.
- Avoid renaming the root package or scanner package in the same PR.

### Slice 3 — Scanner package path / workspace layout

- Moving `vibescan` or changing workspace names **only after** benchmarks and `benchmarking-runbook.md` are updated so **historical commands** still work or are clearly versioned in the manifest.

### Slice 4 — Root identity / monorepo branding

- `package.json` name, default scripts, CI—last, when evaluation is frozen or scripts are dual-documented (“before” vs “after”).

## What not to mix

| Do merge together | Do not merge together |
|-------------------|------------------------|
| Docs + small typo fixes in same PR | Docs + 500-file rename |
| secure-arch package + its docs | secure-arch + scanner detection changes |
| Scanner path move + updated README paths | Scanner path move + abstract rewrite |

## Git workflow (example)

```text
master  ◀── merge docs/research-strengthening (academic only)

Jober/NewLayout ──(cherry-pick or PR1)──▶ master   # docs OK
Jober/NewLayout ──(PR2 secure-arch only)──▶ master   # after tests
Jober/NewLayout ──(PR3 layout)───────────▶ master   # after benchmark script update
```

## Academic “clean decision” summary

- **For poster/paper:** merge **research** into `master`; keep the evaluated artifact story on VibeScan + benchmarks.
- **For product:** iterate on `Jober/NewLayout` (or a branch from it), split PRs, then merge when green.
- **For reviewers:** state explicitly that secure-arch is **product extension**, not the evaluated contribution, unless you add a separate study.

## Remote branches (this repo snapshot)

- `origin/master` — integration target for research.
- `origin/docs/research-strengthening` — may contain overlapping files (e.g. older duplicate topic docs under `docs/vibescan/`); reconcile by keeping the consolidated canonical set in `docs/research-strengthening/`.

## docs/vibescan/abstract.md

<!-- Source: docs/vibescan/abstract.md -->

# VibeScan - revised abstract (current evidence)

## Motivation

Recent work on AI-assisted software development shows that functionally correct code can still ship with exploitable security weaknesses. SusVibes and BaxBench report low security pass rates and residual exploitability in generated backend stacks, while other studies and industry datasets highlight weak default secrets and hallucinated package names. These trends motivate a practical, downstream scanner layer rather than relying on prompt hardening alone.

## System contribution

VibeScan is a static JavaScript/TypeScript scanner for Node/Express-style projects. The current implementation combines AST pattern rules (crypto and injection families), taint-style source-to-sink checks, route and middleware heuristics, optional registry verification for slopsquat-style package signals (`SLOP-001`), and optional proof-oriented test scaffolding. Findings map to OWASP/CWE-aligned categories and can be exported in benchmark-friendly JSON/SARIF formats.

## Current measured evidence

Our DVNA snapshot now includes captured and adjudicated outputs for VibeScan, eslint-plugin-security, Bearer, and Snyk Code, with frozen run artifacts under `benchmarks/results/` and narrative/adjudication under `results/`. Under the current first-party adjudication protocol (`results/dvna-adjudication.md`), provisional recall is: VibeScan `4/11` (`36.4%`), Bearer `8/11` (`72.7%`), Snyk Code `7/11` (`63.6%`), and eslint-plugin-security `1/11` (`9.1%`). Provisional precision currently reported is VibeScan `80.0%` and Bearer `90.0%` (out-of-scope excluded).

## Interpretation and next steps

These results are still scope-limited and should not be treated as universal scanner rankings. Tool coverage differs (line-level app findings vs dependency or broader policy checks), and additional seeded and multi-target evaluations remain necessary. The practical claim is conservative: downstream static analysis provides measurable safety signal for AI-assisted workflows, but publication-grade comparative conclusions require continued scope normalization and replication.

---

### Citation anchors

- Spracklen et al., USENIX Security 2025 (hallucinated npm package suggestions)
- SusVibes, arXiv:2512.03262
- BaxBench, arXiv:2502.11844
- Invicti, 2025 (`supersecretkey` prevalence)

---

## docs/vibescan/pitch-60s.md

<!-- Source: docs/vibescan/pitch-60s.md -->

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

---

## docs/vibescan/SUBMISSION-CHECKLIST.md

<!-- Source: docs/vibescan/SUBMISSION-CHECKLIST.md -->

# Person B — submission & logistics checklist

Complete these steps on your machine; they cannot be automated in-repo.

## Deadlines

- [ ] **March 27, 2026** — Abstract + metadata submitted via conference web form.
- [ ] **March 26, 2026** — Email **`vibescan-poster-FINAL.pdf`** to poster chair (1 day before conference).
- [ ] **March 25, 2026** (or earlier) — GitHub repo **public** so QR codes resolve.
- [ ] Before conference day — Pitch memorized; optional mock judging session.

## Conference form (B3)

- [ ] Copy **web form URL** from the official poster competition page into your bookmarks.
- [ ] Decide **corresponding author** (prize contact).
- [ ] Collect **full name + email** for every team member.
- [ ] Collect **faculty mentor** name + email.
- [ ] Paste final abstract from [`abstract.md`](./abstract.md) (already aligned to current DVNA snapshot wording).
- [ ] Submit form; **screenshot the confirmation page** and save the image.
- [ ] Note **poster chair email** for PDF submission.
- [ ] Add **calendar reminder**: “Send poster PDF to chair — Mar 26”.

## Print & QA

- [ ] **Print test** (or large monitor zoom) for 6-foot legibility—especially hook, stats, contribution **01–04**.
- [ ] Export poster PDF as **`vibescan-poster-FINAL.pdf`**.
- [ ] Print **15–20** copies of [`handout.html`](./handout.html) (optional); confirm **grayscale** readability.
- [ ] **Phone-scan** [`qr-github.svg`](./qr-github.svg) after URL is final.

## Pitch materials

- [ ] Time [`pitch-60s.md`](./pitch-60s.md) script at **55–65 seconds**; adjust wording as needed.
- [ ] **Print** Q&A cue cards (or flashcards app).
- [ ] Practice pitch **≥10 times** out loud.

## Final consistency pass before submit

- [ ] Replace all **TBD** cells in the poster DVNA table.
- [ ] Confirm poster table uses the same metrics as `results/dvna-evaluation.md` and `results/dvna-adjudication.md`.
- [ ] Confirm the spoken script in [`pitch-60s.md`](./pitch-60s.md) matches abstract metrics wording.
- [ ] Update **GitHub URL** in poster, handout, and regenerate **QR** if URL changed.

---

## docs/vibescan/project-tracking.md

<!-- Source: docs/vibescan/project-tracking.md -->

# Project tracking (checklists, roadmap, repo health)

This document consolidates the “tracker” markdown files for VibeScan’s research/demo packaging and repo stabilization.

## Research gap checklist (master)

Use this as the master completion tracker for poster/paper-quality academic packaging.

### Already completed

- [x] Preliminary DVNA benchmark artifacts exist in `results/`.
- [x] Architecture and implementation handoff document exists (`docs/REPO-HANDOFF.md`).
- [x] Conservative research questions/hypotheses documented (`docs/research-strengthening/research-question.md`).
- [x] Methodology framework documented (`docs/research-strengthening/methodology.md`).
- [x] Contribution evidence audit completed (`docs/research-strengthening/contribution-audit.md`).
- [x] Final evaluation and seeded benchmark plans documented (`docs/research-strengthening/evaluation-plan.md`, `docs/research-strengthening/seeded-benchmark-plan.md`).
- [x] Fillable metrics template created (`docs/research-strengthening/metrics-templates.md`).
- [x] `results/dvna-evaluation.md` revised to emphasize preliminary/incomplete status.
- [x] Abstract revised with explicit separation of motivation/implementation/measured findings/future work.
- [x] Final paper outline prepared (`docs/vibescan/final-paper-outline.md`).

### Needs evidence

- [x] Bearer baseline run under same DVNA revision/scope as other tools.
- [x] Frozen version table (Node/npm/tool versions) included in evaluation docs.
- [x] Adjudication sheet with explicit TP/FP/FN rationale linked to each counted item.
- [x] Scope-normalized precision/recall calculations for current static baselines in the DVNA snapshot.
- [x] Rule-level ablation or contribution breakdown showing which VibeScan modules drive observed gains.
- [x] Vendor-inclusive sensitivity analysis (separate from first-party primary table; vendor runs may require authentication/licensing).

Evidence (seeded canonical run):

- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/manifest.json` (versions + scope)
- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/adjudication.md` (human log)
- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/adjudication/adjudication.csv` (machine labels; includes FN row)
- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/reports/metrics.md` (precision/recall)
- `benchmarks/results/2026-03-23_seeded_vibescan_v1.0.0+04e93ca/reports/ablation.md` (rule-level breakdown)

Evidence (DVNA Bearer parity):

- `benchmarks/dvna/dvna` (DVNA clone; frozen at commit `9ba473add536f66ac9007966acb2a775dd31277a`)
- `benchmarks/results/2026-03-25_223217_dvna_bearer/manifest.json` (Bearer image digest + DVNA SHA)
- `benchmarks/results/2026-03-25_223217_dvna_bearer/bearer.json` (raw Bearer output)

Evidence (vendor sensitivity scaffolding):

- `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/snyk-code.json` (captured run artifact)
- `benchmarks/results/2026-03-25_223440_dvna_snykcode_v1.1303.2+aa49247/reports/sensitivity.md` (separate sensitivity analysis notes)

### Needs implementation

- [x] Seeded benchmark suite implementation (designed cases) in runnable repository form.
- [x] Benchmark harness scripts to run all tools with consistent input and output formatting.
- [x] Automated report generation from raw logs into metrics tables.
- [x] Reproducibility package (commands + environment manifest + benchmark revisions).

### Future work

- [ ] Extend beyond DVNA/seeded sets to additional Node/Express benchmarks.
- [ ] Evaluate generated-test feature quality and practical utility in CI pipelines.
- [ ] Add broader framework support and evaluate transferability.
- [ ] Conduct inter-rater reliability measurement for adjudication process.
- [ ] Publish benchmark and labels for external replication.
- [ ] Re-run all baselines under one finalized primary scope policy for publication table lock.

### Claim discipline reminders

- [x] Do not present baseline comparison as universal; current evidence is DVNA snapshot only.
- [x] Do not present implemented features as empirically validated unless they are measured.
- [x] Keep dependency-level findings (`npm audit`, slopsquat) separate from line-level static detection metrics.

## Repo audit (red / yellow / green)

Use this as the short operational checklist for stabilizing the repo before adding more major features.

### Green — acceptable / keep as-is

- [x] Root README reflects the current repo identity: root scanner + `secure-arch` workspaces
- [x] DVNA benchmark file explicitly labels incomplete baselines as incomplete
- [x] Benchmark/adjudication export commands are documented
- [x] `secure-arch` is documented as a separate optional layer, not the scanner itself
- [x] Rule catalog in README matches the intended active scan scope

### Yellow — working, but needs tightening soon

- [x] Handoff, audit, and benchmark docs all use the same file paths and package layout
- [x] Every README-claimed rule has dedicated tests or is clearly labeled heuristic / limited
- [x] High-value fixtures are wired into CI or copied into `benchmarks/seeded/`
- [x] Public-facing docs clearly separate implemented features, evaluated features, and future work
- [x] `secure-arch` is scoped consistently across README, poster docs, and research docs
- [x] JSON/SARIF/export docs match the actual scanner output format
- [x] One benchmark run folder exists with manifest + outputs + notes as the canonical example

### Red — fix before claiming the project is academically finished

- [x] DVNA commit SHA and tool versions are recorded for the benchmark used in reporting
- [x] A completed adjudication artifact exists for at least one benchmark run
- [x] Baseline claims are aligned with actual runs (Snyk/Bearer only if actually executed and captured)
- [x] One frozen benchmark result set exists under `benchmarks/results/<run-id>/`

## Rule roadmap (by effort)

Rules grouped by effort. “Exists” marks current implementation status.

### Easy

| Rule / capability | Notes |
|-------------------|--------|
| Missing auth on admin/mod routes (`AUTH-004`) | Exists — middleware audit + admin path heuristics |
| Missing rate limit on sensitive routes (`MW-002`) | Exists — extend patterns/names cautiously |
| Insecure CORS defaults | Partially overlaps app-level patterns; dedicated rule TBD |
| Endpoint inventory export | Exists — `routeInventory` in project JSON + `--export-routes` |

### Medium

| Rule / capability | Notes |
|-------------------|--------|
| Narrow `AUTH-003` to sensitive surfaces | Done — reduces noise |
| Missing audit logging on sensitive actions | New heuristic; needs FP budget |
| Unsafe webhook verification (`WEBHOOK-001`) | Exists — see webhook proposal doc for future extensions |
| Route sensitivity classification | Exists as tags on inventory; refine lists over time |

### Hard

| Rule / capability | Notes |
|-------------------|--------|
| Spec drift detection | OpenAPI parse + diff vs `routeInventory` |
| Authz abuse test generation | Requires flow or policy model; research-heavy |
| Context-aware prioritization | Deployment/build correlation (see below) |
| Full mount-prefix resolution across files | CFG/symbol work |

### Suggested next implementations

1. CORS-specific rule with conservative triggers.
2. Audit-log presence heuristic on sensitive mutations + tag.
3. OpenAPI diff prototype on a small spec.

## Release checklist (npm publish safety)

Goal: publish only the reusable scanner package (workspace `vibescan`) and avoid shipping demo/research content.

### Build + test

```bash
npm test -w vibescan
```

### Sanity-check the npm tarball contents (required)

```bash
npm run release:check -w vibescan
```

Verify the `npm pack --dry-run` file list contains only:

- `package.json`
- `README.md`
- `dist/**`

And does **not** include:

- `docs/`, `benchmarks/`, `results/`, `tests/`, or `demo*`

### Publish

```bash
npm publish -w vibescan
```

### Quick install verification

```bash
npx --yes vibescan scan ./vibescan/src --format json > vibescan.json
npx --yes vibescan scan ./vibescan/src --format sarif > vibescan.sarif
```

## Runtime and deployment context (future work)

VibeScan today analyzes source (and optionally `package.json` for registry checks). Future versions might correlate findings with runtime/deployment artifacts.

### Possible correlation targets

| Artifact | Hypothetical use |
|----------|------------------|
| Deployment manifests (K8s, Terraform snippets) | map services to routes/env vars mentioned in code |
| Build outputs (bundle graphs) | down-rank code not shipped to production |
| Container images (SBOM, image metadata) | confirm dependency versions actually deployed |
| Active services (service registry, gateway OpenAPI) | compare live surface to static `routeInventory` |
| Production dependency paths | `npm ls --production` vs lockfile vs image SBOM |

### Research value

If correlation improves adjudicated precision of “actionable” findings, publish with ablation (static-only vs static+correlation).

---

## docs/vibescan/judging-pack.md

<!-- Source: docs/vibescan/judging-pack.md -->

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
3. Evaluation: labeled DVNA comparison with frozen artifacts in `benchmarks/results/` and adjudication logs in `results/`.
4. Finding: current first-party recall snapshot is VibeScan `4/11`, Bearer `8/11`, Snyk Code `7/11`, eslint-plugin-security `1/11` (scope-limited; not universal ranking).

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

Estimated ~84/100 on a typical CS poster rubric with main risks: citation tier mixing, scope-overclaiming, and any broken repo link/QR undermining credibility.

With a tight limitations statement, clean citation tier wording, and one focused rehearsal (timing + Q&A), a realistic band is ~90/100.

What to add:

1. One rehearsal with a skeptical listener—drill Tier A vs Tier B wording (five seconds each).
2. Optional research closure: add a second benchmark target beyond DVNA to test transferability.
3. Repo visibility: QR must resolve to a public repo and point to current docs/results pages.

## If a judge pushes on rigor (talking points)

- Literature vs you: prior work motivates the problem; your contribution is the scanner + evaluation against labeled findings/baselines on the same benchmark.
- Sample size: emphasize reproducibility and category coverage; avoid universal prevalence claims.
- arXiv/vendor: label preprints and industry reports explicitly; USENIX Security is peer-reviewed.

---

## docs/vibescan/demo-plan.md

<!-- Source: docs/vibescan/demo-plan.md -->

# VibeScan demo plan (conference-ready)

This document consolidates the conference demo planning docs into one place: **what to demo**, **why**, **how to keep it reproducible**, and **what tiny apps to build**.

## Objectives

Choose a small set of “conference-ready” examples that:

- Show coverage across multiple rule families (crypto/injection/authz/webhook).
- Have deterministic, rule-aligned ground truth for automated scan assertions.
- Fit in a short live demo window without complex setup.

## Recommended demo set (5 examples)

1. **DVNA (primary benchmark)**: credibility anchor (“real code, real findings”).
2. **Seeded SQL injection**: `injection.sql.string-concat` (before/after parameterization).
3. **Seeded path traversal**: `injection.path-traversal` (before/after safe path handling).
4. **Seeded missing auth on admin route**: `AUTH-004` (before/after middleware chain).
5. **Seeded webhook signature verification omission**: `WEBHOOK-001` (before/after inline verification markers).

Why not a secondary external vulnerable repo in the main conference set:

- It tends to add build/setup uncertainty, scope ambiguity, and longer scan runtime.
- Treat it as an appendix/extended benchmark option instead of the live-stage core.

## Why mix DVNA + seeded local apps

- **External validity**: DVNA provides a shared reference point for claims and comparisons.
- **Determinism**: seeded apps give a clean “one finding → one line → one fix” story.
- **Rule alignment**: you can engineer the app so the vulnerable mechanism is visible to the scanner in the handler source (important for heuristics like `WEBHOOK-001`).

## Demo suite folder layout (proposed)

```text
demo-apps/
  sql-injection-seeded/
    README.md
    package.json
    src/
    test/
    expected-vibescan-findings.json
  path-traversal-seeded/
    ...
  missing-auth-admin-seeded/
    ...
  webhook-signature-seeded/
    ...

demo-tests/
  README.md
  run-demo-suite.ps1
  run-demo-suite.sh
  expectations/
    global-expected-rules.json
  lib/
    scan-and-assert.ts

demo-results/
  README.md
  YYYY-MM-DD_demo-suite_v1/
    manifest.json
    vibescan/
      sql-injection-seeded.json
      path-traversal-seeded.json
      missing-auth-admin-seeded.json
      webhook-signature-seeded.json
    notes/
      adjudication-notes.md
```

### `demo-apps/`

Each app should be:

- Minimal: just enough routes/handlers to trigger the intended rule(s).
- Deterministic: no network calls, no random secrets, no time-dependent logic.
- Safe: no real command execution, no real DB harm, no arbitrary filesystem reads.

Each app includes:

- `expected-vibescan-findings.json`: “ground truth” expected rule IDs for vulnerable route(s) (and optionally expected silence for fixed route(s)).
- A `README.md` describing:
  - vulnerable vs fixed behavior,
  - how to run locally,
  - the exact scan command used for the demo.

### `demo-tests/`

The suite runner:

- runs `npm test` for each app,
- runs VibeScan with a consistent scope policy,
- asserts vulnerable routes trigger expected rule IDs and fixed routes do not (or only trigger documented adjacent rules).

### `demo-results/`

Treat as append-only:

- every run produces a dated folder with a manifest, tool outputs, and any adjudication notes.

## Seeded demo app designs (tiny, rule-aligned)

Design principles:

- Every app includes a vulnerable route and a fixed route with the same functional goal.
- VibeScan should flag only the vulnerable route(s) (and ideally not the fixed route).

### 1) Seeded SQL injection (string concat)

- **App slug**: `sql-injection-seeded`
- **Vulnerable route**: `GET /vuln/sql?user=...`
- **Pattern**: build SQL via string concatenation in-handler; use a stubbed query runner for safety.
- **Fixed route**: `GET /fixed/sql?user=...` with parameterized query.
- **Expected finding**: `injection.sql.string-concat`

### 2) Seeded path traversal

- **App slug**: `path-traversal-seeded`
- **Vulnerable route**: `GET /vuln/file?name=...`
- **Pattern**: user-influenced path concatenation to a file read sink; use an in-memory file store.
- **Fixed route**: `GET /fixed/file?name=...` with normalization + allowlist/prefix enforcement.
- **Expected finding**: `injection.path-traversal`

### 3) Seeded missing auth on admin route

- **App slug**: `missing-auth-admin-seeded`
- **Vulnerable route**: `POST /admin/rotate-keys` without recognizable auth middleware.
- **Fixed route**: same sensitive behavior but with explicit `requireAuth` middleware in the route chain.
- **Expected finding**: `AUTH-004`

### 4) Seeded webhook signature verification omission

- **App slug**: `webhook-signature-seeded`
- **Vulnerable route**: `POST /webhook/stripe` that uses `req.body` without inline signature verification markers.
- **Fixed route**: a variant that verifies a signature header (timing-safe compare) before trusting the body.
- **Expected finding**: `WEBHOOK-001`

## Candidate matrix (quick reference)

| source type | scenario | likely VibeScan rules | demo value | benchmark value | setup difficulty |
|---|---|---|---|---|---|
| DVNA | Broad Node/Express vulnerable corpus | injection, crypto, route/mw heuristics | High | High | Medium |
| seeded SQLi | Minimal SQLi sink | `injection.sql.string-concat` | High | High | Low |
| seeded traversal | Minimal file path sink | `injection.path-traversal` | High | High | Low |
| seeded missing auth | Admin-like route without auth | `AUTH-004` | High | Medium-High | Low |
| seeded webhook | Webhook-like route missing verification | `WEBHOOK-001` | High | Medium-High | Low-Medium |

## Conference demo scripting suggestion

- Show `/vuln/...` behavior briefly.
- Show VibeScan finding(s) for the vulnerable route(s).
- Show `/fixed/...` behavior.
- Re-run scan or show fixed route is not flagged.

---

## docs/vibescan/rule-coverage-audit.md

<!-- Source: docs/vibescan/rule-coverage-audit.md -->

(See `docs/vibescan/rule-coverage-audit.md` in the repo for the full table; included verbatim below.)

# VibeScan — rule coverage audit (tests, fixtures, docs, benchmarks)

**Scope:** Rules and project-level checks that **actually run** in static mode, as wired in [`vibescan/src/attacks/index.ts`](../../vibescan/src/attacks/index.ts), [`vibescan/src/system/scanner.ts`](../../vibescan/src/system/scanner.ts), and engine audits under [`vibescan/src/system/engine/`](../../vibescan/src/system/engine/).
**Date:** 2025-03-20 (repo snapshot).

## Legend

| Column | Meaning |
|--------|---------|
| **Unit tests** | `tests/unit/*.test.mjs` exercises the rule (substring match on `ruleId` and/or dedicated file). |
| **Fixture in repo** | File exists under `tests/fixtures/**` that appears intended for the rule. |
| **Fixture in CI** | A test calls `scanFixture(...)` on that path (today only SQL + generic safe). |
| **README** | Documented in root [README.md](../../README.md) rule table (catalog-level, not per-rule prose). |
| **Benchmark relevance** | Expected signal on **DVNA**-class Node/Express apps, **seeded** synthetic snippets, or **dependency/registry** benchmarks. |

## Registered pattern rules (`attacks/index.ts`)

| Rule ID | Unit tests | Fixture file(s) | Fixture in CI | README table | Benchmark notes |
|---------|------------|-------------------|---------------|--------------|-----------------|
| `crypto.hash.weak` | Yes (`weak-hashing.test.mjs`) | `weak-hashing/vulnerable.js` | No | Yes | Seeded crypto corpus; occasional real-app use |
| `crypto.cipher.weak` | Yes (`weak-ciphers.test.mjs`) | — | No | Yes | Seeded / rare in typical web apps |
| `crypto.cipher.deprecated` | Yes (`deprecated-ciphers.test.mjs`) | — | No | Yes | Seeded / legacy codebases |
| `crypto.cipher.fixed-iv` | Yes (`fixed-iv.test.mjs`) | — | No | Yes | Seeded |
| `crypto.random.insecure` | Yes (`insecure-randomness.test.mjs`) | — | No | Yes | Seeded; DVNA may vary |
| `crypto.secrets.hardcoded` | Yes (`hardcoded-secrets.test.mjs`) | — | No | Yes | **High** on DVNA-style demos |
| `SEC-004` | Yes (`default-secret-fallback.test.mjs`) | `env-fallback/vulnerable.js` | No | Yes | **High** on misconfigured apps |
| `crypto.jwt.weak-secret-literal` | Yes (`jwt-weak-secret.test.mjs`) | — | No | Yes | **High** on JWT tutorials / DVNA |
| `crypto.tls.reject-unauthorized` | Yes (`disabled-tls.test.mjs`) | `disabled-tls/vulnerable.js` | No | Yes | Seeded; some integration tests |
| `injection.eval` | Yes (`code-injection.test.mjs`) | — | No | Yes | DVNA / dynamic code patterns |
| `injection.sql.string-concat` (+ taint IDs) | Yes (`sql-injection.test.mjs`) | `sql-injection/vulnerable.js`, `safe.js` | **Yes** | Yes | **High** on DVNA |
| `injection.command` | Yes (`command-injection.test.mjs`) | — | No | Yes | **Medium** on DVNA |
| `injection.path-traversal` | Yes (`path-traversal.test.mjs`) | `path-traversal/vulnerable.js`, `vulnerable-path.mjs`, `safe.js` | No | Yes | **Medium** on file-handling routes |
| `injection.xss` | Yes (`xss.test.mjs`) | — | No | Yes | **Medium** (client/server templates) |
| `injection.noql` | Yes (`nosql-injection.test.mjs`) | — | No | Yes | **Medium** if Mongo-style APIs present |
| `injection.xpath` | Yes (`xpath-injection.test.mjs`) | — | No | Yes | Low unless XPath APIs used |
| `injection.log` | Yes (`log-injection.test.mjs`) | — | No | Yes | Low–medium |
| `mw.cookie.missing-flags` | Yes (`mw-cookie-missing-flags.test.mjs`) | — | No | Yes | **Medium** on Express session apps |
| `SSRF-003` | Yes (`ip-guard-ssrf.test.mjs`) | — | No | Yes | Low unless `ip` + `fetch`/`axios` idiom |
| `RULE-SSRF-002` | Yes (`rule-ssrf-002.test.mjs`) | — | No | Yes | Low–medium; specific axios config shape |

## Project-level and engine findings

| Rule ID | Source | Unit tests | Fixture | README | Benchmark notes |
|---------|--------|------------|---------|--------|-----------------|
| `AUTH-003` | `middlewareAudit.ts` | Partial (`route-graph.test.mjs` expects AUTH/MW) | — | Indirect (middleware story in handoff) | **High** on Express route graphs |
| `AUTH-005` | `middlewareAudit.ts` | **No** dedicated | — | Yes | Object-scoped GET/HEAD without auth (BOLA/IDOR prep) |
| `MW-001` | `middlewareAudit.ts` | Partial (same) | — | Indirect | **High** |
| `MW-002` | `middlewareAudit.ts` | **No** dedicated | — | Indirect | Sensitive-path dependent |
| `MW-003` | `appLevelAudit.ts` | Yes (`mw-003-missing-helmet.test.mjs`) | — | Indirect | **Medium** (helmet absent) |
| `MW-004` | `appLevelAudit.ts` | **No** dedicated | — | Indirect | **Medium** (`cors({ origin: '*' })`) |
| `SLOP-001` | `slopsquat.ts` (needs `--check-registry`) | Yes (`slopsquat.test.mjs`) | — | Yes | **Registry benchmark**; not DVNA code |

## API inventory and trust-boundary rules (project scan + OpenAPI)

| Rule ID | Source | Unit tests | Fixture | README | Benchmark notes |
|---------|--------|------------|---------|--------|-----------------|
| `API-INV-001` | `openapiDrift.ts` (spec vs code) | Yes (`openapi-drift.test.mjs`) | `tests/fixtures/openapi-drift/` | Yes | Seeded drift: undocumented Express route |
| `API-INV-002` | `openapiDrift.ts` | Yes (same) | same | Yes | Seeded drift: ghost OpenAPI operation |
| `API-POSTURE-001` | `routeInventory.ts` | Via project scan in `openapi-drift.test.mjs` | same | Yes | Informational aggregate when object-scoped routes lack auth |

**Structured output:** project JSON includes `routeInventory` (per-route `sensitivePath`, `adminPath`, `objectScoped`, `hasAuthMiddleware`). SARIF run `properties` may include `vibescanRouteInventory`, `vibescanOpenApiSpecsUsed`, `vibescanBuildId` when present.

## Optional / non-registered source (not in active rule list)

| Artifact | Status |
|----------|--------|
| [`prototypePollution.ts`](../../vibescan/src/attacks/injection/prototypePollution.ts) | Present in tree; **not** exported from `attacks/index.ts` — not part of default scan. |
| [`jwt-weak-test.ts`](../../vibescan/src/attacks/crypto/jwt-weak-test.ts) | Built to `dist/`; **not** registered in `attacks/index.ts`. |
| [`entropy.ts`](../../vibescan/src/attacks/crypto/entropy.ts) | Helper for secret detection; **not** a standalone rule. |

## README documentation summary

- **Package README** ([`README.md`](../../README.md)): minimal — points to root README and build/scan commands.
- **Per-rule markdown:** none in-repo.
- **Catalog:** root [README.md](../../README.md) includes rule IDs, CWEs, CLI, tests — sufficient for paper supplement references.

## Fixture folder utilization

Committed fixtures under `tests/fixtures/` include `crypto-safe/`, `disabled-tls/`, `env-fallback/`, `openapi-drift/`, `path-traversal/`, `sql-injection/`, `unsafe/`, `weak-hashing/`, `safe/`. **Most are not referenced** by `scanFixture` in CI today; rules are primarily validated with **inline `scanSource`** strings. Consider wiring high-value fixtures into tests or into `benchmarks/seeded/` for evaluation stability.

## Benchmark relevance summary

| Benchmark type | Strongest VibeScan signal |
|----------------|---------------------------|
| **DVNA** (Express, injection-heavy) | SQL/command/path, many crypto/injection pattern rules, middleware audits (`AUTH-003`, `AUTH-005`, `MW-*`); OpenAPI drift if spec provided |
| **Seeded minimal snippets** | Every rule with a unit test; extend with golden files per rule ID |
| **npm/registry** | `SLOP-001` with `--check-registry` |
| **Compare to eslint-plugin-security / Bearer** | Overlap on injection, unsafe regex (eslint-plugin), and some crypto — map in adjudication template |

---

## Implementation checklist (gaps to close for evaluation rigor)

1. Add **unit tests** for: `crypto.jwt.weak-secret-literal`, `mw.cookie.missing-flags`, `RULE-SSRF-002`, and **middleware** `MW-002` / app-level `MW-003`–`MW-004` if those IDs are in the paper’s scope.
2. Reference or copy **fixtures** from `tests/fixtures/` into `benchmarks/seeded/` with manifests (see [`../research-strengthening/benchmarking-runbook.md`](../research-strengthening/benchmarking-runbook.md)).
3. Standardize **outputs** using [`../research-strengthening/benchmarking-runbook.md`](../research-strengthening/benchmarking-runbook.md) and [`benchmark-manifest-template.json`](./benchmark-manifest-template.json).
4. Track **ground truth** with [`adjudication-template.md`](./adjudication-template.md).
5. Optionally implement **JSON summary** hooks described in [`../research-strengthening/eval-output-and-cli-support.md`](../research-strengthening/eval-output-and-cli-support.md).
6. Add **Snyk Code** (`snyk code test`) as a documented SAST baseline alongside eslint; see [`results/dvna-evaluation.md`](../../results/dvna-evaluation.md).
7. Add dedicated **unit tests** for `AUTH-005` if it becomes in-scope for the paper’s access-control claims.

---

## docs/vibescan/adjudication-template.md

<!-- Source: docs/vibescan/adjudication-template.md -->

# Ground-truth adjudication template (VibeScan evaluation)

**Purpose:** Manually label tool findings for precision/recall, confusion analysis, and qualitative discussion. One row = one reported finding (or one merged location if tools duplicate).

**Study / run ID:** _________________________  
**Benchmark:** _________________________  
**Corpus commit:** _________________________  
**Adjudication date:** _________________________  

## Instructions

1. Import findings from machine-readable outputs (VibeScan JSON, ESLint JSON, Bearer JSON, etc.).
2. Normalize **file paths** relative to the benchmark root.
3. If multiple tools report the same underlying issue, you may keep separate rows (per tool) or add a `cluster_id` column in a spreadsheet copy of this table.

---

## Per-finding adjudication log

| tool | file | line | rule | claimed vulnerability | adjudicated label | rationale | reviewer initials |
|------|------|-----|------|------------------------|-------------------|-----------|---------------------|
| | | | | | | | |

### Suggested `adjudicated_label` values

Use a small closed set for scoring:

- **`tp`** — True positive: real vulnerability or dangerous practice in context.
- **`fp`** — False positive: safe in context, dead code, test-only, or pattern misread.
- **`pp`** — Partial / context-dependent: needs human review; document why.
- **`dupe`** — Duplicate of another finding (reference row or cluster).
- **`out_of_scope`** — Outside benchmark agreement (generated code, excluded path).

### Optional columns (spreadsheet)

| cluster_id | CWE (if known) | OWASP | snippet hash | fix difficulty |
|------------|----------------|-------|--------------|----------------|
| | | | | |

---

## Summary block (after adjudication)

| Metric | Value |
|--------|-------|
| Tool | |
| Total findings adjudicated | |
| TP / FP / PP / Dupe / Out of scope | |
| Notes on systematic FP patterns | |

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Primary reviewer | | |
| Second reader (optional) | | |

---

## docs/vibescan/final-paper-outline.md

<!-- Source: docs/vibescan/final-paper-outline.md -->

# VibeScan Final Paper Outline

## 1. Introduction

- Problem context: LLM-assisted backend development accelerates delivery but introduces recurring security failure modes.
- Motivation signal: literature on low SecPass / residual exploitability / hallucinated dependencies.
- Project framing: VibeScan as a static-analysis layer for JS/TS Node/Express workflows.
- Contributions summary (implementation-grounded, not overclaimed).
- High-level result statement: preliminary DVNA evidence, with explicit incompleteness.

## 2. Background and Related Work

- AI-generated code security studies (SusVibes, BaxBench, related post-2024 studies).
- Traditional static analysis and linter baselines for JavaScript security.
- Dependency/advisory tooling (npm audit) and differences in scope.
- Prior slopsquatting/hallucinated package literature and supply-chain relevance.
- Positioning VibeScan relative to baseline tools and known gaps.

## 3. System Design

- Architecture overview from `docs/REPO-HANDOFF.md`:
  - AST rule engine
  - taint engine (sources/sinks/sanitizers)
  - route graph + middleware audit
  - optional registry check (`SLOP-001`)
  - optional generated test stubs
- Rule taxonomy and representative implemented rule IDs.
- CLI and integration pathways (CLI and ESLint plugin).
- Intended use boundaries and non-goals.

## 4. Methodology

- Research questions and hypotheses (from `../research-strengthening/research-question.md`).
- Benchmark selection and scope policy:
  - DVNA first-party focus
  - seeded benchmark suite design
- Baseline selection rationale.
- Reproducibility protocol:
  - versions, commits, commands, artifact storage.
- Manual adjudication procedure and definitions:
  - TP, FP, FN, unresolved.

## 5. Evaluation

- DVNA preliminary results:
  - current measured values
  - caveats (scope mismatch, snapshot limitations).
- Seeded benchmark results (when completed):
  - per-case table
  - per-rule/category coverage.
- Comparative metrics:
  - TP/FP/FN, precision, recall (scope-aligned only).
- Qualitative observations:
  - where VibeScan produced unique signals.

## 6. Limitations

- Single-benchmark concentration (DVNA-first snapshot).
- Benchmark representativeness limitations (intentional vulnerabilities vs production).
- Manual adjudication subjectivity and reviewer variance.
- Scope mismatch across tools (line-level vs dependency advisory).
- Potential network/environment variance for registry checks.

## 7. Future Work

- Complete baseline parity and automation in CI.
- Expand seeded benchmark suite and public benchmark packaging.
- Improve reporting granularity and false-positive analysis.
- Broaden framework coverage beyond Express-centric patterns.
- Evaluate generated-test utility empirically.

## 8. Conclusion

- Restate conservative contribution: implemented scanner with preliminary comparative evidence.
- Emphasize practical value of downstream scanning with explicit evidence boundaries.
- Close with what is already validated vs what remains to be validated.

---

## docs/vibescan/research-scope-v2.md

<!-- Source: docs/vibescan/research-scope-v2.md -->

# Research scope v2 (VibeScan)

This document updates the research framing for a direction that **retains** AI- and Node-oriented static rules while **expanding** questions around trust boundaries, route surfaces, and prioritization. Claims stay **conservative**: hypotheses concern observable scanner outputs under defined protocols, not universal security guarantees.

## Primary research question (updated)

How effectively can VibeScan—static analysis with AI-oriented rules, Express route extraction, and conservative middleware/surface heuristics—identify **classes of security-relevant issues** in JavaScript/TypeScript backends **compared with baselines of different scope** (e.g., dependency scanning, generic SAST, optional dynamic tools), under **transparent inclusion criteria and manual adjudication**?

## Secondary questions (updated)

1. Which **components** (pattern rules, taint-style flows, registry/slopsquat checks, route graph, middleware audits) contribute most to **adjudicated** true positives on seeded and real-style benchmarks?
2. To what extent do **route- and middleware-based heuristics** (e.g., missing recognizable auth on admin-like paths, missing rate-limit hints on sensitive paths) add **incremental** signal beyond payload-only rules, and at what **false-positive cost**?
3. How should **future context-aware prioritization** (build path, dependency class, route sensitivity) be evaluated so results remain **reproducible** and **honestly bounded**?

## Testable hypotheses (academically conservative)

### H1 — AI-specific rule coverage

On benchmark suites that include LLM-typical anti-patterns (weak secrets, env fallbacks, slopsquat-style package references), VibeScan’s **documented** AI-oriented and crypto/injection rules will surface a **non-empty** set of adjudicated true positives that **source-only** generic linters may miss, under matched file scope and configuration.

*Boundary:* This is about **relative detection on seeded cases**, not completeness or exploitability.

### H2 — Endpoint and trust-boundary-oriented static signal

On Express-style applications where routes are **statically extractable** (literal paths, identifiable middleware identifiers), project-level middleware audits (e.g., admin-path auth, sensitive-path rate-limit hints, webhook verification heuristics) will produce findings that are **measurable** in precision/recall **only after** adjudication; we hypothesize **useful recall on seeded gaps** with **non-zero** false positives requiring reporting.

*Boundary:* Static analysis **cannot** prove authentication or authorization at runtime; hypotheses refer to **heuristic agreement** with benchmark ground truth.

### H3 — Context-aware prioritization (evaluation target)

If prioritization features are added (e.g., weighting by route sensitivity or production dependency paths), **ranked** finding lists will better align with adjudicator severity ratings than **unweighted** lists on the same benchmark, under a defined ranking metric (e.g., NDCG or simple top-k utility)—or the hypothesis may be **falsified** on those benchmarks.

*Boundary:* Until implemented, this remains a **planned** evaluation; no current claim of improved ranking.

## Claim boundaries

- Hypotheses concern **detection and ranking behavior on defined benchmarks**, not legal or compliance outcomes.
- Comparisons to Burp, ZAP, nuclei, sqlmap, or Snyk require **explicit scope alignment**; many categories are **not directly comparable** without hybrid protocols (see `baselines-and-positioning.md`).
- Registry-dependent hypotheses require network and configuration conditions documented in the run manifest.

---

## docs/vibescan/surface-and-boundaries.md

<!-- Source: docs/vibescan/surface-and-boundaries.md -->

# Surface, trust boundaries, and authorization gaps (Node/Express)

This document consolidates three related notes into one: the trust-boundary model, endpoint discovery plan, and an honest authz/surface gap analysis. It supports design and evaluation of VibeScan; it is not a formal verification framework.

## Trust boundary model (Node / Express)

### Unauthenticated users (public internet)

- **Risks**: injection, abuse of signup/login/reset, scraping, webhook spoofing if verification is weak.
- **VibeScan can detect (heuristic)**: injection/crypto patterns in handlers; missing recognizable rate limits on sensitive path patterns; webhook-like routes lacking signature-related hints in the same handler source; missing CSRF hints on state-changing routes (high false-positive risk for API-only apps).
- **Limits**: cannot know whether TLS/WAF/edge auth protects the route.

### Authenticated users (session/token holders)

- **Risks**: IDOR/BOLA, broken function-level authorization, excessive data exposure.
- **VibeScan can detect (heuristic)**: absence of recognizable auth middleware in the extracted chain (`middlewareAudit`); cannot verify object-level checks (`userId` vs `req.user.id`).
- **Limits**: auth may live in parent mounts or frameworks not modeled; role checks may be invisible to identifier matching.

### Admins / moderators

- **Risks**: privilege escalation, destructive actions without audit trails.
- **VibeScan can detect (heuristic)**: `AUTH-004`-class findings for admin/moderation-like path patterns without recognizable auth middleware.
- **Limits**: admin APIs under generic paths are not covered by path heuristics alone.

### Internal services (service-to-service)

- **Risks**: implicit network trust; SSRF to internal URLs.
- **VibeScan can detect**: SSRF-sink-oriented rules where implemented; not a full network trust model.
- **Limits**: no visibility into network/mTLS/VPC configuration.

### Third-party APIs (outbound)

- **Risks**: SSRF, secret leakage, insecure TLS options.
- **VibeScan can detect**: patterns in code where rules exist (e.g., disabled TLS, weak crypto).
- **Limits**: runtime redirect behavior and gateway policies are out of scope.

### Webhooks / payments callbacks

- **Risks**: forged events, replay, tampering if verification is skipped.
- **VibeScan can detect (heuristic)**: `WEBHOOK-001` when path and body use suggest a webhook but common verification markers are absent in handler text.
- **Limits**: verification delegated to imports reduces recall.

### File uploads

- **Risks**: unrestricted type/size, path traversal, malware hosting.
- **VibeScan can detect**: path/upload-related rules where applicable; sensitive path tagging for rate-limit heuristics.
- **Limits**: content validation/storage isolation are not proven statically.

### Environment / configuration

- **Risks**: secret defaults, debug flags in production, permissive CORS.
- **VibeScan can detect**: hardcoded secrets, weak JWT secrets, env fallbacks, some app-level patterns (`appLevelAudit`).
- **Limits**: actual deployment env values are not read at scan time unless explicitly integrated.

## Endpoint discovery plan (Express / Node)

### Goals

- Route inventory: list methods/paths reachable from static analysis.
- Middleware chain discovery: identifiers passed before the final handler (when present as direct arguments).
- Sensitive route tagging: admin/auth/upload/webhook/etc. based on conservative heuristics.
- Auth/rate-limit middleware detection: match middleware identifiers against conservative allowlists.

### Current implementation (baseline)

- `src/system/parser/routeGraph.ts` extracts routes from a single file’s AST when Express `app`/`Router` is recognized, verbs are called with inferable literal paths, and middleware identifiers appear as direct arguments.
- `scanProject` in `src/system/scanner.ts` merges per-file routes for project-level audits.

### Gaps and limitations

| Topic | Limitation |
|-------|------------|
| Dynamic paths | template strings/variables/computed paths are not resolved |
| Mount prefixes | router mount closure is incomplete across files in many cases |
| Frameworks | non-Express frameworks are not modeled |
| Auth in wrappers | custom wrappers may be missed without recognizable identifiers |
| Split handlers | verification logic in imported modules is invisible to heuristics that only inspect handler source |

### Planned enhancements (incremental)

1. Route inventory export: structured JSON with `method`, `fullPath`, `file`, `line`, `middlewares`, and tags.
2. Mount resolution: same-file `app.use(prefix, router)` first; multi-file later (harder).
3. Spec drift: OpenAPI/Swagger ingest and diff (code vs spec).
4. Sensitivity heuristics: expand conservatively (prefer precision over recall).

### Non-goals (near term)

- Full call-graph / points-to analysis.
- Automatic proof of authentication/authorization or role enforcement.

## Authorization and attack surface gaps (detects vs misses)

### IDOR / BOLA (broken object-level authorization)

- **Detects well**: not at the object level; VibeScan does not compare resource IDs to user identity.
- **Misses**: nearly all true IDOR/BOLA without additional modeling.
- **Partial proxy**: `AUTH-003` suggests missing route-level auth middleware on certain sensitive paths (not the same failure mode).

### Broken function-level authorization

- **Detects (heuristic)**: missing recognizable auth middleware on sensitive state-changing routes (`AUTH-003`, `AUTH-004`).
- **Misses**: authorization inside handler bodies, role checks in separate files.

### Undocumented endpoints / spec drift

- **Detects**: statically extracted Express routes appear in JSON output (`routes` / `routeInventory`).
- **Misses**: dynamic registration, non-Express frameworks, gateway-defined routes.
- **Spec drift**: requires spec ingest and diff; treat as its own evaluated slice.

### Missing rate limits

- **Detects (heuristic)**: `MW-002` on sensitive path patterns without recognizable rate-limit middleware on state-changing methods.
- **Misses**: rate limiting enforced at reverse proxy/edge, or custom limiter names.

### Webhook verification

- **Detects (heuristic)**: `WEBHOOK-001` for webhook-like paths and body use without common verification hints in handler source.
- **Misses**: delegated verification, non-POST patterns, non-matching paths.

### CSRF

- **Detects (heuristic)**: `MW-001` flags missing CSRF hints on state-changing routes; may false-positive on token-only APIs.

### Summary table

| Area | Rule(s) / feature | Strength | Weakness |
|------|---------------------|----------|----------|
| Route surface | `routes`, route inventory | literal Express routes | dynamic paths, mounts |
| Admin auth gap | `AUTH-004` | path + middleware chain | generic paths, global auth |
| Sensitive auth gap | `AUTH-003` | same | narrowed to reduce noise |
| Rate limit gap | `MW-002` | sensitive paths | edge limiters, unknown names |
| Webhook verification | `WEBHOOK-001` | obvious omissions in handler | split modules |
| IDOR / BOLA | — | — | not modeled |
| Audit logging | — | — | not implemented |

---

## docs/vibescan/baselines-and-positioning.md

<!-- Source: docs/vibescan/baselines-and-positioning.md -->

# Baselines, comparisons, and positioning (VibeScan)

This document consolidates baseline/comparison notes into one place. VibeScan is **static, first-party-code–centric** analysis for Node/JavaScript/TypeScript with optional project checks. It complements (not replaces) dependency intelligence, DAST, or exploit frameworks.

## Positioning vs related tool categories

| Tool / category | What it is good at | What it is not designed for | Where VibeScan complements it |
|-----------------|-------------------|------------------------------|-------------------------------|
| **SAST / VibeScan** | Fast feedback on source before deploy; AI-typical weak patterns; optional route/middleware heuristics in Express | Proving runtime behavior, session logic, or business authz; full multi-language app models | Adds **local** Express route/middleware hints and LLM-oriented rules alongside generic SAST use |
| **Dependency scanning** (e.g., Snyk SCA, npm audit) | Known CVEs, outdated packages, license/policy | First-party logic errors, missing rate limits on your routes, custom webhook verification | VibeScan focuses on **your code** and **how** dependencies are used; use both for different evidence |
| **DAST / traffic tools** (Burp, ZAP) | Live endpoints, auth flows, session handling, misconfig seen over HTTP | Deep reasoning over unexposed code paths without traffic | Static inventory and heuristics **before** runtime testing; DAST **confirms** exposure and behavior |
| **Targeted exploit tools** (nuclei, sqlmap) | High-volume or deep tests against URLs/parameters | Understanding undeployed code or supply chain in the repo | Use static results to narrow what to probe dynamically; keep findings separated by evidence type |
| **Pipeline/runtime correlation platforms** | Unifying signals across build/deploy/runtime | Replacing language-specific AST analysis in the IDE | VibeScan can emit SARIF/JSON for correlation; it is a **source** signal, not a full platform |

Evaluation discipline: comparable slices (e.g., injection-related) may be scored jointly; non-overlapping slices should be reported **separately** rather than forced into a single leaderboard.

## Direction note: why trust boundaries and inventory matter

Payload-only scanning is not enough: authorization mistakes, missing protections on sensitive surfaces (rate limits, webhook verification), and reachability/context often dominate impact. Static payload checks remain valuable, but they do not by themselves describe **who can reach** a handler or whether the deployment context makes a finding actionable.

Static analysis cannot prove runtime authz, but it can flag **inconsistencies and high-risk absences** (e.g., sensitive paths with no recognizable auth middleware in the extracted chain) when scope and limitations are documented.

## Snyk baseline plan (comparison, not competition)

### Role of Snyk in evaluation

Snyk (SCA, and optionally Snyk Code) is a credible baseline for dependency intelligence and some first-party issues when configured. VibeScan should appear **alongside** Snyk, not as a drop-in replacement.

### Comparable categories (with caveats)

| Category | Comparison notes |
|----------|------------------|
| Known vulnerable dependencies | Snyk excels; VibeScan’s `SLOP-001` / registry check targets **non-published** package names—different signal. |
| First-party injection/crypto patterns | May overlap Snyk Code or ESLint-based tools; align file scope and rule mapping before claiming superiority. |
| License/policy | Snyk feature; VibeScan does not target this. |

### Not directly comparable

| Category | Why |
|----------|-----|
| Live exploitability | Snyk does not replace DAST; VibeScan is static. |
| Express middleware gaps | VibeScan-specific heuristics unless Snyk Code has equivalent queries. |
| Webhook signature verification | Heuristic in VibeScan; rarely a direct Snyk category. |

### Honest reporting checklist

1. State configuration for each tool (Snyk: scope, dev vs prod deps, policy).
2. Keep separate tables for dependency findings vs first-party static findings.
3. Avoid merging incompatible counts into a single “total vulnerabilities.”
4. Adjudicate a sampled subset if full manual review is infeasible; disclose the sample design.

## DAST comparison plan (Burp, ZAP, nuclei, sqlmap)

### What each tool tests (summary)

| Tool | Primary lens |
|------|--------------|
| **Burp Suite** | Manual/semi-automated HTTP testing, session handling, extensions |
| **OWASP ZAP** | Automated spider/scan, passive/active rules against running apps |
| **nuclei** | Template-based scanning against known URLs/hostnames |
| **sqlmap** | SQL injection exploitation against parameters/endpoints |

### What VibeScan tests

- Static JS/TS (and optional npm registry) without requiring a running server.
- Express route and middleware-chain heuristics; injection/crypto rules.

### Hybrid evaluation (recommended)

1. Static pass: VibeScan on repository (benchmark scope excludes vendor/minified).
2. Inventory handoff: use `routeInventory` / JSON routes to seed dynamic crawl lists (acknowledging static vs runtime mismatch).
3. Dynamic pass: Burp/ZAP/nuclei against a staged deployment of the same commit.
4. Adjudication: label findings by root cause (config vs code vs dependency) before comparing tools.

### Why DAST is future work, not main scope

- VibeScan’s core contribution is early, local, static signal and research on LLM-generated backends.
- Reproducible DAST environments (auth, data, CI) are high effort; treat as a milestone, not default scope.
- Many static findings (e.g., hardcoded secrets) do not require HTTP traffic to validate existence; others do—report that split clearly.

### sqlmap specifically

Use only on isolated lab targets with permission. Useful to validate specific SQLi hypotheses; not a substitute for static taint reporting or for measuring total project security.

---

## docs/vibescan/platform-and-api-benchmark-plan.md

<!-- Source: docs/vibescan/platform-and-api-benchmark-plan.md -->

# Platform and API benchmark plan (seeded cases)

Seeded benchmarks support **adjudicated** evaluation. **Expected baseline coverage** is described **qualitatively** (e.g., “dependency scanners typically ignore first-party route middleware”)—no fabricated percentages.

| Case ID | Scenario | Seeded vulnerability | Expected VibeScan rule(s) | Expected baseline coverage (qualitative) |
|---------|----------|----------------------|---------------------------|------------------------------------------|
| B-UE-01 | Express app with extra `app.post` not listed in any spec | Undocumented endpoint in operations | Route appears in `routes` / `routeInventory`; no drift rule yet | DAST may find only if reachable; SCA silent |
| B-AUTH-01 | `POST /login` with no limiter middleware in chain | Credential stuffing friendly | `MW-002` (sensitive path, no rate limit) | DAST may infer indirectly; SAST varies |
| B-AUTH-02 | `POST /admin/users` no auth middleware | Broken access control at route level | `AUTH-004` | DAST needs credentials; SCA silent |
| B-AUTH-03 | `POST /reports/flag` no auth | Moderation abuse | `AUTH-004` | Similar to B-AUTH-02 |
| B-RL-01 | `POST /register` without `rateLimit` in chain | Abuse-prone signup | `MW-002` | Same family as B-AUTH-01 |
| B-ADM-01 | `DELETE /delete-user/:id` without role middleware | Weak admin protection | `AUTH-004` | SCA silent |
| B-UPL-01 | `POST /upload` with path concatenation sink | Unsafe file handling | Injection/path rules + `MW-002` for limiter | DAST may need file upload harness |
| B-WH-01 | `POST /webhook/stripe` reads `req.body`, no signature hints | Missing verification | `WEBHOOK-001` | DAST rarely validates signature logic |
| B-SSRF-01 | URL preview `fetch(userUrl)` to SSRF sink | SSRF | Existing SSRF/taint rules where seeded | DAST may catch if endpoint exposed |
| B-DEP-01 | `package.json` references non-existent typo-squat name | Supply-chain style risk | `SLOP-001` (with registry check) | Snyk/npm audit differ in mechanism |

## Protocol notes

- Run VibeScan with the same `--exclude-vendor` (or file list) policy as other tools when comparing first-party code.
- Record Node version, config path, and rule toggles in the run manifest.
- Adjudicate each finding: TP / FP / unknown vs benchmark intent.

---

## docs/vibescan/context-aware-prioritization-plan.md

<!-- Source: docs/vibescan/context-aware-prioritization-plan.md -->

# Context-aware prioritization (design, future work)

## Motivation

Flat severity labels do not capture **deployability** or **exposure**. A finding in an unused experimental route is less urgent than the same pattern on a production login path. This document sketches a **future** prioritization layer without claiming current implementation.

## Signals (inputs)

| Signal | Intended meaning | Feasibility |
|--------|------------------|-------------|
| Route exposed | Appears in route inventory and is not marked internal-only (heuristic) | Static path extraction; gateway config not modeled |
| Code in deployed build path | File is reachable from entrypoint/bundle graph | Requires build graph or tsconfig `include` heuristics |
| Production dependency | Package in `dependencies` vs `devDependencies` | Parse `package.json` near `projectRoot` |
| Route sensitivity | Tags: admin, auth, upload, webhook, messaging | Regex + inventory tags |
| Missing auth / rate limit | Existing `AUTH-*`, `MW-002` | Already partially available |

## Scoring sketch (example only)

A **priority score** could combine weighted factors, e.g.:

- Base: severity ordinal from finding.
- Boost: sensitive tag + production path.
- Reduce: file under `test/`, `__fixtures__`, or `*.test.js` patterns (configurable).

Weights must be **tuned on adjudicated benchmarks**; defaults should be conservative.

## Output

- Add `priority` or `priorityRank` to JSON (optional flag `--prioritize` in future).
- Keep raw `severity` for compatibility.

## Limitations (explicit)

- No runtime traffic, so “exposed” remains **approximate**.
- Monorepos and dynamic imports complicate build-path analysis.
- Overfitting to one benchmark must be avoided; report score calibration honestly.

## Evaluation

When implemented, compare ranked lists to adjudicator **severity × validity** using a simple metric (e.g., precision@k on “actionable” findings) and publish methodology alongside results.

---

## docs/vibescan/webhook-verification-rule-proposal.md

<!-- Source: docs/vibescan/webhook-verification-rule-proposal.md -->

# Webhook signature verification — rule proposal

## Current implementation

`WEBHOOK-001` in [`src/system/engine/webhookAudit.ts`](../../vibescan/src/system/engine/webhookAudit.ts) flags **POST/PUT** routes whose path matches shared webhook hints ([`webhookPathHints.ts`](../../vibescan/src/system/utils/webhookPathHints.ts)), whose handler references `req.body`, and whose **inline** handler source lacks common verification tokens (Stripe `constructEvent`, `timingSafeEqual`, signature headers, etc.).

**Limits:** Verification in imported modules is invisible; raw-body requirement is not modeled; false negatives when logic is delegated.

## Stripe-style safe patterns (examples)

- Use the provider SDK with the **raw** request body and secret (e.g. `stripe.webhooks.constructEvent(buf, sig, secret)`).
- Reject on missing or malformed signature headers before parsing JSON for side effects.
- Prefer **timing-safe** comparison for HMAC or signature bytes.

## Generic safe patterns

- Central `verifyWebhook(req)` that reads a dedicated header, recomputes HMAC over raw body, compares with `crypto.timingSafeEqual`.
- Middleware applied **before** business logic that trusts `req.body`.

## Risky patterns

- `JSON.parse(req.body)` or direct use of `req.body` for payment state updates with no signature check in the same compilation unit.
- Trusting `x-forwarded-*` or client-supplied IDs without provider verification.

## Keeping false positives low (future extensions)

1. **Require** webhook path hint **and** body use (already done).
2. **Allowlist** more provider tokens as they are identified; document in rule metadata.
3. **Optional:** resolve simple re-exports (`import { verify } from './webhook-verify'`) in the same package—high effort, use sparingly.
4. **Severity:** keep **warning** unless multiple signals (e.g., payment keywords + no `rawBody` middleware name in chain).

## Relation to research / product

Treat webhook rules as **assistive** for code review and benchmark seeding, not as proof that production webhooks are secure.

---

## docs/vibescan/secure-arch-policy-bridge.md

<!-- Source: docs/vibescan/secure-arch-policy-bridge.md -->

# VibeScan ↔ secure-arch policy bridge (design)

This document proposes a small **policy file** that states architectural security expectations, and maps them to **VibeScan rule IDs** so CI can fail when code violates declared policy.

## Policy schema (JSON or YAML)

```json
{
  "schemaVersion": "1",
  "authRequiredOnAdminRoutes": true,
  "rateLimitRequiredOnSensitiveRoutes": true,
  "webhookSignatureVerificationRequired": true,
  "publicDatabaseDisallowed": true,
  "strongSecretsRequired": true,
  "loggingRequiredOnSensitiveActions": false,
  "corsWildcardDisallowed": true
}
```

Boolean `true` means: **violations of this expectation fail the policy check** (see evaluation below).

## Mapping: policy flag → VibeScan rules

| Policy flag | Rule IDs | Notes |
|-------------|----------|--------|
| `authRequiredOnAdminRoutes` | `AUTH-004` | Admin/mod-style paths without auth middleware |
| `rateLimitRequiredOnSensitiveRoutes` | `MW-002` | Login, webhooks, upload, auth-like paths |
| `webhookSignatureVerificationRequired` | `WEBHOOK-001` | Heuristic; false negatives if verification lives in another module |
| `publicDatabaseDisallowed` | *(gap)* | Add future rule for public Mongo/Redis URLs |
| `strongSecretsRequired` | `SEC-004`, `crypto.secrets.hardcoded`, `crypto.jwt.weak-secret-literal`, … | Several crypto rules |
| `loggingRequiredOnSensitiveActions` | *(gap)* | Needs taint/route bridge |
| `corsWildcardDisallowed` | `MW-004` | `cors({ origin: '*' })` |

## Evaluation algorithm

1. Run `vibescan scan` with `--format json` (or consume `findings[]` from project JSON).
2. Load policy document.
3. For each policy key that is `true`, collect mapped rule IDs. Any finding whose `ruleId` is in that set is a **policy violation**.
4. Exit non-zero if any violation exists (or emit SARIF / adjudication CSV for review).

## Relation to secure-arch YAML

[`vibescan/packages/secure-arch-core`](../../vibescan/packages/secure-arch-core/) loads `vibescan/architecture/secure-rules/*.yaml` (by default, relative to repo root) into **ArchitectureFacts**. A future step is to **generate** the JSON policy above from those facts (or merge both in one CI job). This repo keeps the PoC as **standalone JSON** so it runs without building secure-arch.

## Limitations

- Static route analysis cannot see auth applied in wrappers outside the extracted middleware chain.
- Webhook verification may be delegated; `WEBHOOK-001` is intentionally conservative and documented as such.

