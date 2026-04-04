# Combined research-strengthening docs

This file is an auto-combined view of all Markdown files in `docs/research-strengthening/`.

## Table of contents

- [README.md](#readmemd)
- [abstract-revision-notes.md](#abstract-revision-notesmd)
- [benchmarking-runbook.md](#benchmarking-runbookmd)
- [contribution-audit.md](#contribution-auditmd)
- [eval-output-and-cli-support.md](#eval-output-and-cli-supportmd)
- [evaluation-plan.md](#evaluation-planmd)
- [jober-newlayout-merge-strategy.md](#jober-newlayout-merge-strategymd)
- [methodology.md](#methodologymd)
- [metrics-templates.md](#metrics-templatesmd)
- [research-question.md](#research-questionmd)
- [results-index.md](#results-indexmd)
- [seeded-benchmark-plan.md](#seeded-benchmark-planmd)

---

## README.md

Source: `docs/research-strengthening/README.md`

# Research strengthening — academic track (VibeScan)

This folder is the **paper/poster spine**: research question, methodology, evaluation, seeded benchmarks, metrics, and contribution boundaries. It deliberately **does not** own product positioning for **secure-arch** (see [Product vs research](#product-vs-research-secure-arch) below).

**Related materials**

| Audience | Location |
|----------|----------|
| Judges, poster tone | [`../vibescan/judging-pack.md`](../vibescan/judging-pack.md) |
| Conference abstract (working draft) | [`../vibescan/abstract.md`](../vibescan/abstract.md) |
| Reproducibility + benchmarks | [`benchmarking-runbook.md`](./benchmarking-runbook.md), [`eval-output-and-cli-support.md`](./eval-output-and-cli-support.md) |
| Rule inventory vs tests | [`../vibescan/rule-coverage-audit.md`](../vibescan/rule-coverage-audit.md) |

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

## abstract-revision-notes.md

Source: `docs/research-strengthening/abstract-revision-notes.md`

# Abstract revision notes

Working draft: [`../vibescan/abstract.md`](../vibescan/abstract.md).  
Framing reference: [`../vibescan/judging-pack.md`](../vibescan/judging-pack.md).

## Cleanup checklist

- [ ] **Lead with RQ + evaluation** in the first sentence or two (form word limit may require shortening lit review).
- [ ] **Separate** motivation statistics (Spracklen, SusVibes, BaxBench, etc.) from **your** DVNA adjudicated numbers—one paragraph boundary minimum.
- [ ] **Bearer:** either same-environment result, explicit “not run,” or remove the row from any comparison table referenced in the abstract.
- [ ] **Cite tiers:** mark industry vs peer-reviewed consistently with [`../vibescan/judging-pack.md`](../vibescan/judging-pack.md).
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

## benchmarking-runbook.md

Source: `docs/research-strengthening/benchmarking-runbook.md`

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

## contribution-audit.md

Source: `docs/research-strengthening/contribution-audit.md`

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

## eval-output-and-cli-support.md

Source: `docs/research-strengthening/eval-output-and-cli-support.md`

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

## evaluation-plan.md

Source: `docs/research-strengthening/evaluation-plan.md`

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
- [ ] Label each row using [`../vibescan/adjudication-template.md`](../vibescan/adjudication-template.md).
- [ ] Summarize by **OWASP theme** or **CWE family** (match poster table).

## Phase 3 — Metrics

- [ ] Fill summary tables in [`metrics-templates.md`](./metrics-templates.md).
- [ ] Separate **motivation citations** (industry/preprint) from **your** adjudicated counts in prose (see [`../vibescan/judging-pack.md`](../vibescan/judging-pack.md)).

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
| Methodology prose | This file + [`methodology.md`](./methodology.md) |
| Rule ↔ evidence | [`../vibescan/rule-coverage-audit.md`](../vibescan/rule-coverage-audit.md) |
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

## jober-newlayout-merge-strategy.md

Source: `docs/research-strengthening/jober-newlayout-merge-strategy.md`

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

- Moving `vibescan` or changing workspace names **only after** benchmarks and [`benchmarking-runbook.md`](./benchmarking-runbook.md) are updated so **historical commands** still work or are clearly versioned in the manifest.

### Slice 4 — Root identity / monorepo branding

- `package.json` name, default scripts, CI—last, when evaluation is frozen or scripts are dual-documented (“before” vs “after”).

## What not to mix

| Do merge together | Do not merge together |
|-------------------|------------------------|
| Docs + small typo fixes in same PR | Docs + 500-file rename |
| secure-arch package + its docs | secure-arch + scanner detection changes |
| Scanner path move + updated README paths | Scanner path move + abstract rewrite |

## Git workflow sketch

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

---

## methodology.md

Source: `docs/research-strengthening/methodology.md`

# Methodology (draft)

## Study type

**Comparative static analysis** on a known vulnerable application (**DVNA**) and (planned) **seeded synthetic snippets**, with **manual adjudication** of tool outputs. This is an **artifact evaluation** of a research prototype, not a randomized controlled trial of developers.

## Research objective

Evaluate whether VibeScan’s implemented static-analysis pipeline (AST rules, taint checks, route/middleware audits, and optional registry checks) provides useful first-party vulnerability detection on Node/Express code relative to baseline tools, using conservative and reproducible measurement.

## Materials

| Corpus | Role | Ground truth |
|--------|------|--------------|
| **DVNA** | Realistic Node/Express attack surface | Theme- or finding-level labels from adjudication ([`../vibescan/adjudication-template.md`](../vibescan/adjudication-template.md)); align narrative with [`results/dvna-evaluation.md`](../../results/dvna-evaluation.md) |
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
2. Run tools per [`benchmarking-runbook.md`](./benchmarking-runbook.md); save outputs under `benchmarks/results/…` or legacy [`results/`](../../results/) with a completed manifest ([`../vibescan/benchmark-manifest-template.json`](../vibescan/benchmark-manifest-template.json)).
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

## metrics-templates.md

Source: `docs/research-strengthening/metrics-templates.md`

# Metrics templates

Copy sections into spreadsheets or the paper appendix. Definitions should match the adjudication rubric ([`../vibescan/adjudication-template.md`](../vibescan/adjudication-template.md)).

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

## research-question.md

Source: `docs/research-strengthening/research-question.md`

# Research questions and hypotheses

Canonical academic framing for VibeScan. Judge-facing phrasing and novelty one-liners also live in [`../vibescan/judging-pack.md`](../vibescan/judging-pack.md).

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

## results-index.md

Source: `docs/research-strengthening/results-index.md`

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

## seeded-benchmark-plan.md

Source: `docs/research-strengthening/seeded-benchmark-plan.md`

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

Start by **promoting** high-value cases from [`tests/fixtures/`](../../tests/fixtures/) and inline strings in `tests/unit/*.test.mjs`, then deduplicate.

## Ground-truth table (required)

In `benchmarks/seeded/README.md`, maintain a matrix:

| Relative path | Expect rule IDs (substring or exact) | Expect zero high-severity? | Notes |
|---------------|----------------------------------------|----------------------------|-------|

Use the same `ruleId` strings VibeScan emits (see [`../vibescan/rule-coverage-audit.md`](../vibescan/rule-coverage-audit.md)).

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

