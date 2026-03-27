# VibeScan

VibeScan is a static security scanner for **JavaScript/TypeScript**: it flags common **cryptographic failures** (OWASP A02:2021) and **injection** issues (A03:2021), with optional npm **registry checks** (SLOP-001) and optional **generated tests**.

**Free to use (MIT).** The scanner does **not** require API keys or paid services. Optional IDE assist uses **your** editor (Cursor, Claude Code, etc.); see [IDE assist](#ide-assist).

Published as **`@jobersteadt/vibescan`** on [npm](https://www.npmjs.com/package/@jobersteadt/vibescan) and [GitHub Packages](https://github.com/Joshober/cybersecurity-scanner/pkgs/npm/vibescan) (same version; **simplest install: use npm**).  
CLI binaries: `vibescan` and `secure` (alias; same dispatcher)

## Easiest: run once without installing

Uses the public npm package; `npx --yes` avoids install prompts (npm 9+):

```bash
npx --yes @jobersteadt/vibescan@latest scan . --exclude-vendor
```

Pin a version for reproducible CI: `npx --yes @jobersteadt/vibescan@1.0.1 scan . --exclude-vendor`

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

Copy **`vibescan.config.sample.json`** to **`vibescan.config.json`** at your project root (VibeScan discovers it upward from scan paths). After `npm i`, the sample also lives at **`node_modules/@jobersteadt/vibescan/vibescan.config.sample.json`**.

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
npx vibescan scan .
npx secure scan .
```

Equivalent one-off (explicit package name):

```bash
npx --yes @jobersteadt/vibescan@latest scan .
```

## secure-arch (portable architecture checks + AI instruction helpers)
This repo also ships `secure-arch` as a portable rule-pack. It is vendored into the published `@jobersteadt/vibescan` package, so consumers get these commands from the same npm install.

Install the YAML rule pack into your project:
```bash
npx vibescan secure-arch install --root .
```

Generate AI tool instruction files (Cursor/Amazon Q):
```bash
npx vibescan secure-arch init --tool cursor
npx vibescan secure-arch init --tool amazonq
```

Alias for the init flow:
```bash
npx vibescan export-ai-rules --tool cursor
```

Optional alias (same as `secure-arch init`):
```bash
npx vibescan init --tool cursor
```

Run the static secure-architecture checks against your project’s YAML settings:
```bash
npx vibescan secure-arch check --root . --code-evidence off --format human
```

All of the above also works with the `secure` alias, e.g. `npx secure secure-arch check ...`.

## CI-friendly output

Write machine-readable output to a file:

```bash
npx vibescan scan . --format json  > vibescan.json
npx vibescan scan . --format sarif > vibescan.sarif
```

Exit code is **non-zero** if any finding has severity `critical` or `error`.

## Generated tests (`--generate-tests`)

Emit **runnable** Node test files (`node:test`) for each finding:

```bash
npx vibescan scan . --generate-tests ./vibescan-generated-tests
# omit the directory to use ./vibescan-generated-tests
```

Run them in CI or locally:

```bash
node --test ./vibescan-generated-tests/
```

The JWT template always runs a small **HS256 forge check** (no network). Optional **integration** tests use a **`CONFIG` object** at the top of each generated file (empty strings skip those tests): set URLs, tokens, or paths there—**no environment variables required**.

## IDE assist

`--mode ai` runs the **same static rule engine** as the default. It also writes **`vibescan-ai-assist.md`** under your project root (override with **`--ai-assist-out <path>`**). That file is meant to be **pasted into Cursor, Claude Code, or another editor assistant** so *their* built-in model reviews the listed findings—VibeScan does **not** call a remote LLM or ask for API keys.

For long-lived editor rules, use:

```bash
npx vibescan export-ai-rules --tool cursor
npx vibescan secure-arch init --tool cursor
```

## Options (high level)

- `--rules crypto,injection`
- `--severity critical|error|warning|info`
- `--exclude-vendor`
- `--check-registry` (optional SLOP-001 signal)
- `--generate-tests [dir]` (templates under `./vibescan-generated-tests` by default)
- `--mode ai` — static scan + `vibescan-ai-assist.md` for Cursor / Claude Code (see [IDE assist](#ide-assist) above)
- `--ai-assist-out <path>` — markdown output path when using `--mode ai`

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

