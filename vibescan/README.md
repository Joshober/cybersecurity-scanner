# VibeScan

**Public product:** the npm package **`@jobersteadt/vibescan`** only. Install it from [npm](https://www.npmjs.com/package/@jobersteadt/vibescan) (recommended) or [GitHub Packages](https://github.com/Joshober/cybersecurity-scanner/pkgs/npm/vibescan).

**Official CLI:** `vibescan`. The `secure` binary is the **same entrypoint**, kept only for backward compatibility—docs and scripts should call `vibescan`.

**VibeScan** is a developer-first security CLI: **static JS/TS scanning**, **AI-assistant rule export** (Cursor, Amazon Q, generic markdown, and a JSON policy artifact), **local proof-oriented test generation** for supported finding classes (deterministic `node:test` files—no live API, no base URL, no AI), optional **slopsquat-style registry signal** (SLOP-001), and **secure-arch** architecture checks in the **same** `npm` install—without shipping separate security products.

Human-readable findings use **severity, impact, location, confidence**, **remediation**, **safe examples**, and **reference links** (see [Rule reference](#rule-reference)).

**Free (MIT).** No VibeScan API keys. Optional [IDE assist](#ide-assist) is a markdown file you paste into Cursor / Claude Code / similar.

## Easiest: run once without installing

Uses the public npm package; `npx --yes` avoids install prompts (npm 9+):

```bash
npx --yes @jobersteadt/vibescan@latest scan . --exclude-vendor
```

Pin a version for reproducible CI: `npx --yes @jobersteadt/vibescan@1.1.0 scan . --exclude-vendor`

## Recommended: add to your repo

Install as a dev dependency so everyone shares the same version (via `package-lock.json`):

```bash
npm i -D @jobersteadt/vibescan
```

Then in **`package.json`**:

```json
{
  "scripts": {
    "security:scan": "vibescan scan . --exclude-vendor",
    "security:json": "vibescan scan . --exclude-vendor --format json"
  }
}
```

Run: `npm run security:scan`

## CI: GitHub Actions

Copy [`templates/github-actions.yml`](templates/github-actions.yml) to **`.github/workflows/vibescan.yml`** in your project, or paste its job into an existing workflow. It runs **`npx @jobersteadt/vibescan@latest`** on Ubuntu with no extra secrets.

If the app lives in a subdirectory, add `defaults.run.working-directory` or `cd subdir && npx ...`.

## Optional: config file

Copy **`vibescan.config.sample.json`** to **`vibescan.config.json`** at your project root (VibeScan discovers it upward from scan paths). After `npm i`, the sample also lives at **`node_modules/@jobersteadt/vibescan/vibescan.config.sample.json`**. Optional **`aiExport`** defaults for **`vibescan export-ai-rules`** (see below).

## Install (npm) — global or transitive

```bash
npm i @jobersteadt/vibescan
```

## Install (GitHub Packages)

1. Create a GitHub personal access token with **`read:packages`** (classic PAT) or fine-grained “read packages” for this repo / org.
2. In your project root, add a `.npmrc` (do not commit secrets — use CI secrets or a personal `~/.npmrc`):

```
@jobersteadt:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

Or set the environment variable **`NODE_AUTH_TOKEN`** to that token and keep only the `@jobersteadt:registry=…` line in `.npmrc`, as in [GitHub’s npm registry guide](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).

3. Install:

```bash
npm i @jobersteadt/vibescan
```

**CI (GitHub Actions): Set `permissions: packages: read`, run `actions/setup-node` with `registry-url: https://npm.pkg.github.com` and `scope: '@jobersteadt'`, then `npm ci` / `npm i` as usual so `GITHUB_TOKEN` supplies auth.

**Maintainers — publish from Actions:** Releases trigger [.github/workflows/publish-github-packages.yml](https://github.com/Joshober/cybersecurity-scanner/blob/main/.github/workflows/publish-github-packages.yml). If `GITHUB_TOKEN` returns **403** (scope owner mismatch with the logged-in repo), add a PAT from the GitHub account that owns the **`@jobersteadt`** package namespace as repository secret **`GH_PACKAGES_TOKEN`** with **`write:packages`**.

## GitHub CLI (`gh`) and the GitHub Packages page

Repo-linked package in the UI: [github.com/Joshober/cybersecurity-scanner/pkgs/npm/vibescan](https://github.com/Joshober/cybersecurity-scanner/pkgs/npm/vibescan).

**Inspect** (log in with `gh auth login`; token needs at least **`read:packages`** for metadata):

```bash
gh api /user/packages/npm/vibescan
gh api /user/packages/npm/vibescan --jq '{name, visibility, version_count, html_url}'
```

**List** npm packages for your account:

```bash
gh api "/user/packages?package_type=npm" --jq '.[] | {name, visibility, version_count}'
```

**Public vs private:** GitHub’s [Packages REST API](https://docs.github.com/en/rest/packages/packages) supports get/delete/restore for npm packages, but **not** changing visibility via `gh api`. To **make the package public** (or adjust access), open the package in the browser → **Package settings** → **Change package visibility**. Quick links (same package, different URLs):

- [Package from this repo](https://github.com/Joshober/cybersecurity-scanner/pkgs/npm/vibescan)
- [Package under your user namespace](https://github.com/users/Joshober/packages/npm/package/vibescan) (from `gh api /user/packages/npm/vibescan --jq .html_url`)

PowerShell: `Start-Process 'https://github.com/Joshober/cybersecurity-scanner/pkgs/npm/vibescan'`

**Ship a new version to GitHub Packages** from your machine: bump `version` in `vibescan/package.json`, commit, then either create a **GitHub Release** or run:

```bash
gh workflow run publish-github-packages.yml --repo Joshober/cybersecurity-scanner
```

(Ensure `main` includes the workflow and the new version; the workflow runs `npm publish` from `vibescan/` using `prepublishOnly`.)

## Quick start (after local `npm i`)

```bash
vibescan scan .
```

Same binary as legacy `secure` (not recommended for new docs):

```bash
secure scan .
```

## Command surface (published CLI)

These subcommands are served by **`vibescan`** (and `secure`):

| Command | Purpose |
|--------|---------|
| `vibescan scan …` | Static analysis (default pipeline). |
| `vibescan reproduce <findingId> --from <project.json>` | Run the **generated proof test** for one finding (from JSON: `findingId`, `proofGeneration.generatedPath`). Requires a prior `prove` / `--generate-tests` run. |
| `vibescan prove --run --from <project.json> [--output proof-run-log.json]` | Run **`node --test`** on every generated proof in a saved project JSON; writes **`proof-run-log.json`** (pass/fail, duration). Non-zero exit if any proof **fails**. |
| `vibescan import-sarif <file.sarif> [--output out.json]` | Normalize external SARIF results into VibeScan-shaped JSON (**detection-only** proofs). |
| `vibescan comparison-report --vibescan <project.json> [--proof-log …] [--labels …]` | Markdown summary for benchmarks (proof stats + optional labels). |
| `vibescan report <results.json>` | Build a **static HTML** report from a prior `--format json` file (no rescan). |
| `vibescan secure-arch install …` | Install secure-arch YAML templates + schema under your project. |
| `vibescan secure-arch init --tool cursor` (or `amazonq`) | Low-level: adapter files only. |
| `vibescan secure-arch check …` | Validate architecture YAML + optional code evidence. |
| **`vibescan export-ai-rules …`** | **Governance export:** reads **`vibescan.config.json`** + secure-arch settings path; by default writes **Cursor** rules, **Amazon Q** prompt, **`vibescan-ai-governance.md`**, and **`vibescan.policy.json`**, each bannered as *generated from your project’s security policy*. |
| `vibescan init …` | Creates **`vibescan.config.json`** (from sample) and **`.github/workflows/vibescan.yml`** when missing, then runs **`secure-arch init`** with the same arguments. |

### `export-ai-rules` (project-aware)

```bash
vibescan export-ai-rules --root .
# Optional: --emit all|cursor,amazonq,markdown,policy   (default: all)
# --settings <rel> overrides secure-arch folder (else aiExport.settings or architecture/secure-rules)
```

Uses vendored **`@secure-arch/adapters`**, optional **`vibescan.config.json`**, and emits a **JSON policy** digest for downstream tooling. When config exists and Cursor output is included, also writes **`.cursor/rules/vibescan-static-scan.mdc`**.

### secure-arch

```bash
vibescan secure-arch install --root .
vibescan secure-arch check --root . --code-evidence off --format human
```

### Legacy `secure` alias

`npx secure …` and `secure …` invoke the same dispatcher as `vibescan` (backward compatibility).

## React, Angular, and npm-audit CVEs

VibeScan flags **insecure usage in source**: for example React **`dangerouslySetInnerHTML`** / **`__html`** when the HTML is not a static literal, and Angular **`DomSanitizer`** **`bypassSecurityTrust*`** methods when the argument is not a static literal. Scans include **`.js`**, **`.ts`**, **`.jsx`**, and **`.tsx`** (JSX is parsed with Acorn plus **acorn-jsx**). Files that mix **TypeScript-only** syntax with JSX may fail to parse; patterns that appear in plain **`.ts`** without JSX (for example `React.createElement` with an options object) are still analyzed.

**Package-level CVEs** in `react`, `react-dom`, `@angular/core`, and other dependencies are out of scope for this static pass—use **`npm audit`**, your registry or Snyk/GitHub Dependabot workflow, or similar **lockfile advisory** tooling alongside VibeScan.

## JSON: proof coverage and evidence fields

Project JSON (`vibescan scan … --format json`) includes:

- **`summary.proofCoverage`** — counts by proof tier, `proof_coverage_percent`, **`deterministic_proof_percent`** (among generated proofs), and `proof_pipeline_not_run` when no proof pipeline attached findings.
- Per finding (when using project JSON): **`findingId`**, **`confidenceScore`**, **`confidenceReasons`**, **`rootCause`** / **`causalGraph`** (versioned graph), **`proofTier`** (1–4), **`proofTierLabel`**, **`deterministic`**, **`requiresNetwork`**, **`requiresSecrets`**, **`proofReason`**, optional **`fixPreview`**, and **`proofGeneration.failureReason` / `failureCode`** when proof is partial or unsupported.

## CI-friendly output

Write machine-readable output to a file:

```bash
npx vibescan scan . --format json  > vibescan.json
npx vibescan scan . --format sarif > vibescan.sarif
```

Exit code is **non-zero** if any finding has severity `critical` or `error` (after [baseline](#baseline-for-ci-rollout), only **new** issues count).

## HTML report (optional, static file)

For demos and non-technical review, add a **single self-contained HTML file** (no server, no frontend stack). Default output path is **`./vibescan-report.html`**.

```bash
# After a normal scan (terminal output unchanged), also write the HTML report:
vibescan scan . --exclude-vendor --html
vibescan scan . --format json --html --html-out ./reports/scan.html

# From a saved JSON artifact (same shape as --format json):
vibescan report vibescan.json
vibescan report vibescan.json --html-out ./reports/review.html
```

The page includes severity summary cards, a filterable findings list (severity, rule, file, free-text search), and expandable rows with location, CWE/OWASP, remediation, safe examples, references, and proof-generation status when present.

## Baseline for CI rollout

Adopt VibeScan without blocking on every historical finding:

1. **Capture** a baseline (after suppressions):  
   `vibescan scan . --exclude-vendor --write-baseline .vibescan/baseline.json`
2. **Commit** the baseline and add to **`vibescan.config.json`**: `"baseline": ".vibescan/baseline.json"` or pass **`--baseline .vibescan/baseline.json`** in CI.
3. CI **fails only on regressions** (findings not in the baseline). Use **`--baseline-include-known`** to print deferred findings too.

**Suppressions** in config support an optional **`reason`** string for audit trails.

## Local proof-oriented test generation (`vibescan prove` / `--generate-tests`)

For **supported** rule families, VibeScan emits **deterministic Node test files** (`node:test`) that illustrate the risky behavior using **static scan metadata** (routes, taint labels, weak JWT literals). **No running API, no base URL, no remote AI.** This is **not** universal exploit confirmation—unsupported rules get `proofGeneration.status: unsupported` in JSON without a file.

**Preferred command:**

```bash
npx vibescan prove . --output ./vibescan-generated-tests
```

**Backward-compatible** (same behavior; stderr notes that `prove` is preferred in docs):

```bash
npx vibescan scan . --generate-tests ./vibescan-generated-tests
```

Run generated tests:

```bash
node --test ./vibescan-generated-tests/
# Or run all proofs from a saved scan JSON (writes proof-run-log.json):
vibescan prove --run --from ./vibescan.json
```

Or: `node scripts/run-generated-proofs.mjs ./vibescan-generated-tests` from a checkout that includes the helper under `vibescan/scripts/`. Compare before/after scans with `vibescan/scripts/fix-impact-preview.mjs`.

**CI and JSON flags:** See [`docs/vibescan/CI-PROVE.md`](../docs/vibescan/CI-PROVE.md) (determinism fields: `requiresNetwork`, `requiresSecrets`, `requiresEnv`).

**Proof statuses** (per finding, in JSON / SARIF `vibescanProofGeneration`): `provable_locally`, `needs_manual_completion`, `unsupported`. Examples: JWT proofs use **HS256 forge + verify** with the weak literal from the scanner; **SSRF** proofs use a **mock sink** to show taint → request API (not live SSRF); **missing-auth** route findings encode **structural** route/middleware facts from the graph, not a live HTTP stack.

### Known boundaries in the current implementation

- **JWT:** Verification proof is limited to same-file `jwt.verify` discovery and does not yet perform cross-file sign/verify linkage.
- **BOLA / IDOR:** Coverage generates route-aware tests with mocked identities, but does not yet validate real authorization behavior end to end.
- **SSRF:** Coverage proves tainted input reaches a request sink, but does not yet demonstrate actual outbound network egress.
- **Regression of generators:** Validation currently relies on behavioral and unit tests rather than checked-in golden generated test fixtures.
- **Test scripts:** The default `npm test` path covers unit tests only; smoke tests exist separately (under `tests/smoke/`).

## IDE assist

`--mode ai` runs the **same static rule engine** as the default. It also writes **`vibescan-ai-assist.md`** under your project root (override with **`--ai-assist-out <path>`**). That file is meant to be **pasted into Cursor, Claude Code, or another editor assistant** so *their* built-in model reviews the listed findings—VibeScan does **not** call a remote LLM or ask for API keys.

For long-lived editor rules, prefer **`vibescan export-ai-rules`** (reads project config). You can still run **`vibescan secure-arch init`** for adapter-only output.

## Options (high level)

- `--rules crypto,injection`
- `--severity critical|error|warning|info`
- `--exclude-vendor`
- `--check-registry` (optional SLOP-001 signal)
- `vibescan prove [paths...] [--output dir]` — local proof-oriented tests (same as `--generate-tests`)
- `--generate-tests [dir]` — alias for proof generation; default `./vibescan-generated-tests`
- `--mode ai` — static scan + `vibescan-ai-assist.md` for Cursor / Claude Code (see [IDE assist](#ide-assist) above)
- `--ai-assist-out <path>` — markdown output path when using `--mode ai`
- `--baseline <file>` — defer known findings for exit code / human output (see [Baseline](#baseline-for-ci-rollout))
- `--write-baseline <file>` — write current findings JSON and exit (bootstrap baseline)
- `--baseline-include-known` — with `--baseline`, list deferred findings in addition to new ones
- `--format human` — detailed finding report (confidence, impact, examples, references)

## Rule reference

VibeScan maps each rule id to documentation: **what pattern matched**, **why it is risky**, **common false positives**, **how to fix**, **safe example**, and **links** (OWASP/CWE/README). The CLI **`--format human`** and **JSON** output surface **`confidence`** and **`ruleDocumentation`** for consumers.

This section is the anchor for links emitted in-tool; the catalog ships in the package (`ruleCatalog`).

## Rule SDK (proof-backed generators)

To add a proof-capable family, copy [`src/system/proof/generators/_template.ts`](src/system/proof/generators/_template.ts), implement `supports` / `emit`, register in [`src/system/proof/registry.ts`](src/system/proof/registry.ts), and add tests. Use **`failureCode`** values from [`src/system/proof/taxonomy.ts`](src/system/proof/taxonomy.ts) when proof is incomplete.

## Publish verification
From the `vibescan/` directory, run:
```bash
npm pack --dry-run
```
Then confirm the tarball includes:
- `vibescan.config.sample.json`, `templates/github-actions.yml`
- vendored secure-arch runtime assets under:
  - `dist/node_modules/@secure-arch/core/templates/*`
  - `dist/node_modules/@secure-arch/core/schema/*`
  - `dist/node_modules/@secure-arch/core/dist/*`
  - `dist/node_modules/@secure-arch/adapters/dist/*`
  - `dist/node_modules/@secure-arch/cli/dist/*`

